const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

const VALID_PROJECT_STATUSES = ['active', 'archived', 'completed'];

exports.createProject = async (req, res) => {
    const { name, description, status = 'active' } = req.body;
    const tenantId = req.user.tenantId;

    if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!VALID_PROJECT_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    try {
        const client = await db.getClient();
        await client.query('BEGIN');

        // Check Limits
        const tenantRes = await client.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        const maxProjects = tenantRes.rows[0].max_projects;
        const currentRes = await client.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const current = parseInt(currentRes.rows[0].count);

        if (current >= maxProjects) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Subscription project limit reached' });
        }

        const insertRes = await client.query(
            `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [tenantId, name, description, status, req.user.userId]
        );

        await logAction(tenantId, req.user.userId, 'CREATE_PROJECT', 'project', insertRes.rows[0].id, req.ip);
        await client.query('COMMIT');
        client.release();

        res.status(201).json({ success: true, data: insertRes.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.listProjects = async (req, res) => {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const tenantId = req.user.tenantId;

    try {
        let where = ['p.tenant_id = $1'];
        let val = [tenantId];
        let idx = 2;

        if (status) { where.push(`p.status = $${idx++}`); val.push(status); }
        if (search) { where.push(`p.name ILIKE $${idx++}`); val.push(`%${search}%`); }

        // Join with creator
        const query = `
      SELECT p.*,
        u.full_name as creator_name,
        u.id as creator_id,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t2 WHERE t2.project_id = p.id AND t2.status = 'completed') as completed_task_count
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
        val.push(limit, offset);

        const countRes = await db.query(`SELECT COUNT(*) FROM projects p WHERE ${where.join(' AND ')}`, val.slice(0, idx - 3));
        const total = parseInt(countRes.rows[0].count);

        const result = await db.query(query, val);

        res.json({
            success: true,
            data: {
                projects: result.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    status: row.status,
                    createdAt: row.created_at,
                    createdBy: { id: row.creator_id, fullName: row.creator_name },
                    taskCount: parseInt(row.task_count),
                    completedTaskCount: parseInt(row.completed_task_count)
                })),
                total,
                pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), limit: parseInt(limit) }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getProject = async (req, res) => {
    const { projectId } = req.params;
    try {
        const resDb = await db.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, req.user.tenantId]);
        if (resDb.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
        res.json({ success: true, data: resDb.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
}

exports.updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    try {
        const resCheck = await db.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, req.user.tenantId]);
        if (resCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
        const project = resCheck.rows[0];

        if (req.user.role !== 'tenant_admin' && req.user.userId !== project.created_by) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const fields = [];
        const val = [];
        let idx = 1;
        if (name) { fields.push(`name = $${idx++}`); val.push(name); }
        if (description) { fields.push(`description = $${idx++}`); val.push(description); }
        if (status) {
            if (!VALID_PROJECT_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
            fields.push(`status = $${idx++}`); val.push(status);
        }

        fields.push(`updated_at = NOW()`);
        val.push(projectId);

        if (fields.length === 1) return res.json({ success: true });

        const updateQ = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await db.query(updateQ, val);

        await logAction(req.user.tenantId, req.user.userId, 'UPDATE_PROJECT', 'project', projectId, req.ip);

        res.json({ success: true, message: 'Project updated', data: result.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    try {
        const resCheck = await db.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, req.user.tenantId]);
        if (resCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
        const project = resCheck.rows[0];

        if (req.user.role !== 'tenant_admin' && req.user.userId !== project.created_by) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
        await logAction(req.user.tenantId, req.user.userId, 'DELETE_PROJECT', 'project', projectId, req.ip);

        res.json({ success: true, message: 'Project deleted' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
