const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, projectController.createProject);
router.get('/', authenticateToken, projectController.listProjects);
router.get('/:projectId', authenticateToken, projectController.getProject);
router.put('/:projectId', authenticateToken, projectController.updateProject);
router.delete('/:projectId', authenticateToken, projectController.deleteProject);

// Task routes under project
router.post('/:projectId/tasks', authenticateToken, taskController.createTask);
router.get('/:projectId/tasks', authenticateToken, taskController.listTasks);

module.exports = router;
