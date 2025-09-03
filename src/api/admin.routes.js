/**
 * Admin Routes
 * 
 * Protected endpoints for admin functionality including user management,
 * system metrics, and administrative controls. This file delegates to
 * specialized controllers for better code organization and maintainability.
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Import controllers
const usersController = require('../controllers/admin/adminUsers.controller');
const statsController = require('../controllers/admin/adminStats.controller');
const systemController = require('../controllers/admin/adminSystem.controller');

/**
 * Statistics and Analytics Routes
 */
router.get('/stats', isAuthenticated, requireAdmin, statsController.getStats);
router.get('/analytics', isAuthenticated, requireAdmin, statsController.getAnalytics);
router.get('/activity', isAuthenticated, requireAdmin, statsController.getActivity);

/**
 * User Management Routes
 */
router.get('/users', isAuthenticated, requireAdmin, usersController.getUsers);
router.get('/users/:userId', isAuthenticated, requireAdmin, usersController.getUserById);
router.put('/users/:userId', isAuthenticated, requireAdmin, usersController.updateUser);
router.delete('/users/:userId', isAuthenticated, requireAdmin, usersController.deleteUser);
router.post('/users/:userId/suspend', isAuthenticated, requireAdmin, usersController.suspendUser);

/**
 * System Operations Routes
 */
router.post('/system/cache/clear', isAuthenticated, requireAdmin, systemController.clearCache);
router.get('/logs', isAuthenticated, requireAdmin, systemController.getLogs);
router.get('/security/suspicious', isAuthenticated, requireAdmin, systemController.getSuspiciousActivity);

module.exports = router;