const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Import middlewares xác thực
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware'); 
const upload = require('../middlewares/upload.middleware'); 

/**
 * @route   GET /api/dashboard/summary
 * @desc    Lấy toàn bộ số liệu thống kê cho Dashboard Admin (Trống, Thuê, Doanh thu, Công nợ)
 * @access  Private (Chỉ Admin/Chủ trọ)
 */
router.get('/summary', verifyToken, isAdmin, dashboardController.getDashboardData);

/**
 * @route   POST /api/dashboard/banner/upload
 * @desc    Upload ảnh banner mới cho Dashboard
 * @access  Private (Chỉ Admin/Chủ trọ)
 */
router.post('/banner/upload', verifyToken, isAdmin, upload.single('image'), dashboardController.uploadBanner);


module.exports = router;