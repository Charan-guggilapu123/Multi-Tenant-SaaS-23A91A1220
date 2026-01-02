const db = require('../config/db');

const logAction = async (tenantId, userId, action, entityType, entityId, ipAddress = null) => {
    try {
        await db.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, userId, action, entityType, entityId, ipAddress]
        );
    } catch (error) {
        console.error('Audit Log Error:', error);
        // Don't crash the request if audit log fails, but should be noted.
    }
};

module.exports = { logAction };
