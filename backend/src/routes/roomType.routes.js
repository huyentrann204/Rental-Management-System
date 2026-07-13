const express = require('express');
const router = express.Router();

// Controller
const {
    getAllRoomTypes,
    createRoomType,
    deleteRoomType
} = require('../controllers/roomType.controller');

// IMPORT ĐÚNG middleware
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * ROUTES: /api/room-types
 */

// Lấy danh sách loại phòng (của chủ trọ đang đăng nhập)
router.get('/', verifyToken, getAllRoomTypes);

// Tạo loại phòng mới
router.post('/', verifyToken, createRoomType);

// Xóa loại phòng
router.delete('/:id', verifyToken, deleteRoomType);

module.exports = router;
