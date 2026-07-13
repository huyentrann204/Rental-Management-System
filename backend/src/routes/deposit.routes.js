const express = require('express');
const router = express.Router();
const { createDeposit } = require('../controllers/deposit.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Chỉ Admin mới được tạo phiếu đặt cọc cho khách
router.post('/', verifyToken, isAdmin, createDeposit);

module.exports = router;