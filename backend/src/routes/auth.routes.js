const express = require('express');
const router = express.Router();
// Thêm forgotPassword vào đây
const { register, login, forgotPassword } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
// Xóa chữ "authController." đi, chỉ để forgotPassword thôi
router.post('/forgot-password', forgotPassword);

module.exports = router;