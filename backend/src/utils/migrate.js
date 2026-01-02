const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
    const client = await db.getClient();
    try {
        console.log('Running migrations...');
        const migrationsDir = path.join(__dirname, '../../migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                console.log(`Executing ${file}...`);
                await client.query(sql);
            }
        }
        console.log('Migrations complete.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

module.exports = runMigrations;
