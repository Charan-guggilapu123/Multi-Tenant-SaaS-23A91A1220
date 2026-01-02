const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

// My tasks (assigned to current user across tenant)
router.get('/my', authenticateToken, taskController.listMyTasks);

router.put('/:taskId', authenticateToken, taskController.updateTask);
router.patch('/:taskId/status', authenticateToken, taskController.updateTaskStatus);
router.delete('/:taskId', authenticateToken, taskController.deleteTask);

module.exports = router;
