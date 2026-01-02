const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/auditLogger');

exports.addUserToTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { email, password, fullName, role } = req.body;

    // Auth: Tenant Admin only (super_admin allowed)
    if (req.user.role !== 'tenant_admin' || req.user.tenantId !== tenantId) {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
    }

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (!fullName) {
        return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    try {
        const client = await db.getClient();
        await client.query('BEGIN');

        // 1. Check Limits
        const tenantRes = await client.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        const maxUsers = tenantRes.rows[0].max_users;

        const countRes = await client.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const currentUsers = parseInt(countRes.rows[0].count);

        if (currentUsers >= maxUsers) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Subscription user limit reached' });
        }

        // 2. Check if email exists in tenant
        // (Constraint will handle it but good to check for clean error)
        const emailCheck = await client.query('SELECT id FROM users WHERE tenant_id = $1 AND email = $2', [tenantId, email]);
        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'tenant_admin' ? 'tenant_admin' : 'user';

        const insertRes = await client.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, tenant_id, is_active, created_at`,
            [tenantId, email, hashedPassword, fullName, userRole]
        );

        await logAction(tenantId, req.user.userId, 'CREATE_USER', 'user', insertRes.rows[0].id, req.ip);

        await client.query('COMMIT');
        client.release();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: insertRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.listTenantUsers = async (req, res) => {
    const { tenantId } = req.params;
    const { search, role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Authorization check
    if (req.user.tenantId !== tenantId && req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        let where = ['tenant_id = $1'];
        let val = [tenantId];
        let idx = 2;

        if (role) {
            where.push(`role = $${idx++}`);
            val.push(role);
        }
        if (search) {
            where.push(`(email ILIKE $${idx} OR full_name ILIKE $${idx})`);
            val.push(`%${search}%`);
            idx++;
        }

        const countQ = `SELECT COUNT(*) FROM users WHERE ${where.join(' AND ')}`;
        const countRes = await db.query(countQ, val);
        const total = parseInt(countRes.rows[0].count);

        const dataQ = `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
        val.push(limit, offset);

        const result = await db.query(dataQ, val);

        res.json({
            success: true,
            data: {
                users: result.rows,
                total,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;

    try {
        const checkRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (checkRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        const userToUpdate = checkRes.rows[0];

        // Auth logic
        // Tenant Admin can update users in their tenant
        // User can update THEIR own fullName (not role/isActive)

        const isSelf = req.user.userId === userId;
        const isAdmin = req.user.role === 'tenant_admin' && req.user.tenantId === userToUpdate.tenant_id;
        const isSuper = req.user.role === 'super_admin';

        if (!isSelf && !isAdmin && !isSuper) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Role/Active check
        if ((role || isActive !== undefined) && !isAdmin && !isSuper) {
            return res.status(403).json({ success: false, message: 'Only admins can update role or status' });
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (fullName) { fields.push(`full_name = $${idx++}`); values.push(fullName); }
        if (role) { fields.push(`role = $${idx++}`); values.push(role); }
        if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }

        fields.push(`updated_at = NOW()`);
        values.push(userId);

        if (fields.length === 1) return res.json({ success: true, message: 'No changes', data: checkRes.rows[0] });

        const updateQ = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, full_name, role, updated_at`;
        const result = await db.query(updateQ, values);

        await logAction(userToUpdate.tenant_id, req.user.userId, 'UPDATE_USER', 'user', userId, req.ip);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    // Auth: Tenant Admin only
    try {
        const checkRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (checkRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        const targetUser = checkRes.rows[0];

        if (req.user.userId === userId) {
            return res.status(403).json({ success: false, message: 'Cannot delete self' });
        }

        if (req.user.role === 'tenant_admin' && req.user.tenantId !== targetUser.tenant_id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (req.user.role === 'user') return res.status(403).json({ success: false, message: 'Unauthorized' });

        // Perform delete (CASCADE handles tasks if configured)
        // But wait, schema says:
        // users -> tasks (assigned_to): ON DELETE SET NULL
        // So tasks won't be deleted, just unassigned. That's fine.

        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        await logAction(targetUser.tenant_id, req.user.userId, 'DELETE_USER', 'user', userId, req.ip);

        res.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
