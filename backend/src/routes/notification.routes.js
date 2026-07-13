const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Endpoint: GET /api/notifications/my-notifications
router.get('/my-notifications', verifyToken, notificationController.getMyNotifications);

// Endpoint: PUT /api/notifications/read/:id
router.put('/read/:id', verifyToken, notificationController.markAsRead);

module.exports = router;