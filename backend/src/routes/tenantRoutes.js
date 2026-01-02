const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, tenantController.listTenants);
router.get('/:tenantId', authenticateToken, tenantController.getTenant);
router.put('/:tenantId', authenticateToken, tenantController.updateTenant);

// User management endpoints are under tenants mostly in the spec
// "API 8: Add User to Tenant" -> POST /api/tenants/:tenantId/users
// "API 9: List Tenant Users" -> GET /api/tenants/:tenantId/users
// I will attach user controller there too or route specifically.
// Better to delegate to userController from here or just import handling.
// I'll create a userController and route it here.

const userController = require('../controllers/userController');
router.post('/:tenantId/users', authenticateToken, userController.addUserToTenant);
router.get('/:tenantId/users', authenticateToken, userController.listTenantUsers);

module.exports = router;
