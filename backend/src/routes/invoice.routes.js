const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// 1. Lấy danh sách hóa đơn (Hỗ trợ lọc theo ?status=&month=&year=)
// Endpoint: GET /api/invoice/list
router.get('/list', verifyToken, isAdmin, invoiceController.getInvoices);

// 2. Lấy chi tiết các hạng mục trong một hóa đơn (Dùng cho Modal xem chi tiết)
// Endpoint: GET /api/invoice/detail/:id
router.get('/detail/:id', verifyToken, isAdmin, invoiceController.getInvoiceItems);

// 3. Xuất hóa đơn mới (Tính toán Phòng + Điện + Nước + Dịch vụ thêm)
// Endpoint: POST /api/invoice/generate
router.post('/generate', verifyToken, isAdmin, invoiceController.generateInvoice);

// 4. Xác nhận thanh toán hóa đơn
// Endpoint: PUT /api/invoice/pay/:id
router.put('/pay/:id', verifyToken, isAdmin, invoiceController.updatePaymentStatus);

module.exports = router;