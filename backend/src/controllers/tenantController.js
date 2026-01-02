const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

exports.getTenant = async (req, res) => {
    const { tenantId } = req.params;

    // Authorization: User must belong to this tenant OR be super_admin
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this tenant' });
    }

    try {
        const client = await db.getClient();
        const tenantRes = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);

        if (tenantRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        const tenant = tenantRes.rows[0];

        // Calculate stats
        const statsRes = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) as total_projects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1) as total_tasks
    `, [tenantId]);

        client.release();

        res.json({
            success: true,
            data: {
                ...tenant,
                stats: {
                    totalUsers: parseInt(statsRes.rows[0].total_users),
                    totalProjects: parseInt(statsRes.rows[0].total_projects),
                    totalTasks: parseInt(statsRes.rows[0].total_tasks)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // Auth: tenant_admin OR super_admin
    // tenant_admin can only update name
    if (req.user.role !== 'super_admin' && req.user.role !== 'tenant_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.role !== 'super_admin' && (status || subscriptionPlan || maxUsers || maxProjects)) {
        return res.status(403).json({ success: false, message: 'Only super_admin can update restricted fields' });
    }

    try {
        const fields = [];
        const values = [];
        let idx = 1;

        if (name) { fields.push(`name = $${idx++}`); values.push(name); }
        if (status) { fields.push(`status = $${idx++}`); values.push(status); }
        if (subscriptionPlan) { fields.push(`subscription_plan = $${idx++}`); values.push(subscriptionPlan); }
        if (maxUsers) { fields.push(`max_users = $${idx++}`); values.push(maxUsers); }
        if (maxProjects) { fields.push(`max_projects = $${idx++}`); values.push(maxProjects); }

        fields.push(`updated_at = NOW()`);

        if (fields.length === 1) { // only updated_at
            return res.json({ success: true, message: 'No changes provided' });
        }

        values.push(tenantId);
        const query = `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

        const result = await db.query(query, values);

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });

        await logAction(tenantId, req.user.userId, 'UPDATE_TENANT', 'tenant', tenantId, req.ip);

        res.json({
            success: true,
            message: 'Tenant updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.listTenants = async (req, res) => {
    // Super admin only
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
    const offset = (page - 1) * limit;

    try {
        let whereClauses = [];
        let values = [];
        let idx = 1;

        if (status) {
            whereClauses.push(`status = $${idx++}`);
            values.push(status);
        }
        if (subscriptionPlan) {
            whereClauses.push(`subscription_plan = $${idx++}`);
            values.push(subscriptionPlan);
        }

        const whereString = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Count total
        const countRes = await db.query(`SELECT COUNT(*) FROM tenants ${whereString}`, values);
        const total = parseInt(countRes.rows[0].count);

        // Fetch data with stats
        // Warning: Subqueries in SELECT list can be slow but fine for this scale
        const query = `
      SELECT t.*,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_users,
        (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) as total_projects
      FROM tenants t
      ${whereString}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
        values.push(limit, offset);

        const result = await db.query(query, values);

        res.json({
            success: true,
            data: {
                tenants: result.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    subdomain: row.subdomain,
                    status: row.status,
                    subscriptionPlan: row.subscription_plan,
                    totalUsers: parseInt(row.total_users),
                    totalProjects: parseInt(row.total_projects),
                    createdAt: row.created_at
                })),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalTenants: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
