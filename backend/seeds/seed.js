const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'database',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'saas_db',
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding database...');
        await client.query('BEGIN');

        const adminHash = await bcrypt.hash('Admin@123', 10);
        const demoPassHash = await bcrypt.hash('Demo@123', 10);
        const userPassHash = await bcrypt.hash('User@123', 10);

        // 1. Super Admin
        const superAdminCheck = await client.query(`SELECT id FROM users WHERE email = 'superadmin@system.com'`);
        if (superAdminCheck.rows.length === 0) {
            await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, tenant_id)
        VALUES ($1, $2, 'System Admin', 'super_admin', NULL)
      `, ['superadmin@system.com', adminHash]);
            console.log('Super Admin created');
        }

        // 2. Demo Tenant
        const tenantCheck = await client.query(`SELECT id FROM tenants WHERE subdomain = 'demo'`);
        let tenantId;
        if (tenantCheck.rows.length === 0) {
            const tenantRes = await client.query(`
        INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
        VALUES ('Demo Company', 'demo', 'active', 'pro', 25, 15)
        RETURNING id
      `);
            tenantId = tenantRes.rows[0].id;
            console.log('Demo Tenant created');
        } else {
            tenantId = tenantCheck.rows[0].id;
        }

        // 3. Tenant Admin
        const tenantAdminCheck = await client.query(`SELECT id FROM users WHERE email = 'admin@demo.com'`);
        if (tenantAdminCheck.rows.length === 0) {
            await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, 'Demo Admin', 'tenant_admin')
      `, [tenantId, 'admin@demo.com', demoPassHash]);
            console.log('Tenant Admin created');
        }

        // 4. Users
        const user1Check = await client.query(`SELECT id FROM users WHERE email = 'user1@demo.com'`);
        let user1Id;
        if (user1Check.rows.length === 0) {
            const u1 = await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, 'User One', 'user') RETURNING id
      `, [tenantId, 'user1@demo.com', userPassHash]);
            user1Id = u1.rows[0].id;
        } else {
            user1Id = user1Check.rows[0].id;
        }

        const user2Check = await client.query(`SELECT id FROM users WHERE email = 'user2@demo.com'`);
        if (user2Check.rows.length === 0) {
            await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, 'User Two', 'user')
      `, [tenantId, 'user2@demo.com', userPassHash]);
        }

        // 5. Projects
        const projCheck = await client.query(`SELECT id FROM projects WHERE tenant_id = $1 AND name = 'Project Alpha'`, [tenantId]);
        let projId;
        if (projCheck.rows.length === 0) {
            const p = await client.query(`
        INSERT INTO projects (tenant_id, name, description, status, created_by)
        VALUES ($1, 'Project Alpha', 'First demo project', 'active', $2) RETURNING id
      `, [tenantId, user1Id]); // Created by User 1
            projId = p.rows[0].id;
            console.log('Project Alpha created');
        } else {
            projId = projCheck.rows[0].id;
        }

        // 6. Tasks
        const taskCheck = await client.query(`SELECT id FROM tasks WHERE project_id = $1`, [projId]);
        if (taskCheck.rows.length === 0) {
            await client.query(`
        INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to)
        VALUES ($1, $2, 'Initial Task', 'Get started with the system', 'todo', 'high', $3)
      `, [projId, tenantId, user1Id]);
            console.log('Task created');
        }

        await client.query('COMMIT');
        console.log('Seeding complete');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', err);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

if (require.main === module) {
    seed();
}

module.exports = seed;

