const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// 1. Lấy danh sách dịch vụ (Đồng bộ với Frontend gọi /list)
// Endpoint: GET /api/services/list
router.get('/list', verifyToken, serviceController.getServices);

// 2. Lấy danh sách (Dự phòng cho route gốc)
// Endpoint: GET /api/services
router.get('/', verifyToken, serviceController.getServices);

// 3. Tạo dịch vụ
// Endpoint: POST /api/services
router.post('/', verifyToken, isAdmin, serviceController.createService);

// 4. Cập nhật và Xóa
// Endpoint: PUT/DELETE /api/services/:id
router.put('/:id', verifyToken, isAdmin, serviceController.updateService);
router.delete('/:id', verifyToken, isAdmin, serviceController.deleteService);

module.exports = router;