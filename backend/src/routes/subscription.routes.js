const express = require('express');
const router = express.Router();
const { requestService, approveService } = require('../controllers/subscription.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Khách hoặc Admin đều gọi được (Khách đăng ký)
router.post('/request', verifyToken, requestService);

// Chỉ Admin mới được duyệt
router.put('/approve/:subscription_id', verifyToken, isAdmin, approveService);

module.exports = router;