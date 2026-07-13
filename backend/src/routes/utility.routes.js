const express = require('express');
const router = express.Router();
const { 
    recordReading, 
    getReadings, 
    updateReading, 
    deleteReading, 
    getLastReading 
} = require('../controllers/utility.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// 1. Ghi chỉ số mới (Khớp với Frontend gọi /utility/create)
router.post('/create', verifyToken, isAdmin, recordReading);
router.post('/', verifyToken, isAdmin, recordReading); // Dự phòng

// 2. Lấy danh sách chỉ số (Khớp với Frontend gọi /utility/list)
router.get('/list', verifyToken, getReadings);
router.get('/', verifyToken, getReadings); // Dự phòng

// 3. Lấy chỉ số cuối cùng (Đã khớp: /utility/last/:roomId)
router.get('/last/:roomId', verifyToken, getLastReading);

// 4. Cập nhật chỉ số (Khớp với /utility/:id)
router.put('/:id', verifyToken, isAdmin, updateReading);

// 5. Xóa chỉ số (Khớp với /utility/:id)
router.delete('/:id', verifyToken, isAdmin, deleteReading);

module.exports = router;