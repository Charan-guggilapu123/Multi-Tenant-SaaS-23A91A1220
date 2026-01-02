const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

exports.registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Check subdomain uniqueness
        const subCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        if (subCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Subdomain already exists' });
        }

        // Create Tenant
        const tenantRes = await client.query(
            `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, 'active', 'free', 5, 3) RETURNING id`,
            [tenantName, subdomain]
        );
        const tenantId = tenantRes.rows[0].id;

        // Check email uniqueness within tenant (conceptually it's the first user so it is unique for this new tenant, but we should clear global super admin checks if any)

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create Admin User
        const userRes = await client.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, 'tenant_admin', true) RETURNING id, email, full_name, role`,
            [tenantId, adminEmail, hashedPassword, adminFullName]
        );
        const user = userRes.rows[0];

        await logAction(tenantId, user.id, 'REGISTER_TENANT', 'tenant', tenantId, req.ip);
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenantId,
                subdomain,
                adminUser: user
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        if (error.constraint === 'users_email_tenant_id_key' || error.constraint === 'unique_tenant_email') {
            return res.status(409).json({ success: false, message: 'Email already exists in this context' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
};

exports.login = async (req, res) => {
    const { email, password, tenantSubdomain, tenantId } = req.body;

    try {
        let tId = tenantId;
        let tName = '';

        if (tenantSubdomain) {
            const tRes = await db.query('SELECT id, name, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
            if (tRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
            tId = tRes.rows[0].id;
            tName = tRes.rows[0].name;
            if (tRes.rows[0].status !== 'active') return res.status(403).json({ success: false, message: 'Tenant is not active' });
        }

        // If super admin trying to login, they might not provide subdomain?
        // The requirement says "Super Admin Exception: Super admin users have tenant_id as NULL".
        // And "Verify user belongs to that tenant".
        // If logging in as super admin, maybe they don't provide subdomain? The prompt says "tenantSubdomain (string, required) OR tenantId".
        // If I am super admin, I don't belong to a tenant.
        // Let's first check if the user is a super admin based on email? No, we check creds.

        // Query strategy:
        // If tId is provided/resolved: Find user with email AND (tenant_id = tId OR tenant_id IS NULL)
        // Actually, distinct users might share email across tenants.
        // So if tId is provided, we look for that specific user.
        // BUT Super Admin is special.

        let userQuery = `SELECT * FROM users WHERE email = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`;
        // If no tenant info provided, we can't really login unless we assume super admin context?
        // Prompt says "tenantSubdomain ... required". So we always have a context.

        // However, Super Admin has NULL tenant_id. They should probably be able to login to ANY tenant?
        // OR they have a specific "system" login?
        // The prompt says "access to all tenants".
        // If I login as super admin at "demo.app.com", do I auth?
        // Technically, `OR tenant_id IS NULL` handles this.

        const userRes = await db.query(userQuery, [email, tId]);

        if (userRes.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        // Check password
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        if (!user.is_active) return res.status(403).json({ success: false, message: 'Account is inactive' });

        // Generate Token
        // Payload: { userId, tenantId, role }
        // If user is super_admin and tenant_id is NULL, what tenantId do we put in token?
        // If they are logging into a specific tenant context, maybe we put that?
        // Or we put NULL and handle it in middleware?
        // "Tenant Isolation Middleware: Automatically filter queries by tenant_id from JWT (except for super_admin)"
        // So if I am super_admin, I can pass tenantId in token OR NULL.
        // If I pass NULL, middleware might not filter?
        // Let's use the `tId` resolved from subdomain as the context, even for super_admin, UNLESS they are doing system admin work?
        // Actually, usually Super Admin logs in to a system dashboard (no specific tenant).
        // But here, let's just stick to: user.tenant_id.

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Audit
        await logAction(tId || user.tenant_id, user.id, 'LOGIN', 'user', user.id, req.ip);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    tenantId: user.tenant_id
                },
                token,
                expiresIn: 86400
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        // req.user has decoded token
        const client = await db.getClient();
        // Join with tenant info
        // If super admin (tenant_id is null), join might fail if we use inner join.
        let query = `
      SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at,
             t.id as t_id, t.name as t_name, t.subdomain, t.subscription_plan, t.max_users, t.max_projects
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1
    `;
        const resDb = await client.query(query, [req.user.userId]);
        client.release();

        if (resDb.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const row = resDb.rows[0];
        const user = {
            id: row.id,
            email: row.email,
            fullName: row.full_name,
            role: row.role,
            isActive: row.is_active,
            tenant: row.t_id ? {
                id: row.t_id,
                name: row.t_name,
                subdomain: row.subdomain,
                subscriptionPlan: row.subscription_plan,
                maxUsers: row.max_users,
                maxProjects: row.max_projects
            } : null
        };

        res.json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    // Stateless JWT, just return success
    await logAction(req.user.tenantId, req.user.userId, 'LOGOUT', 'user', req.user.userId, req.ip);
    res.json({ success: true, message: 'Logged out successfully' });
};
