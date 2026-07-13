const express = require('express');
const router = express.Router();
const { 
    createContract, 
    getContractDetail, 
    deleteContract 
} = require('../controllers/contract.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');
const { poolPromise } = require('../config/db');

// ==========================================
// 1. NHÓM ROUTE LẤY DỮ LIỆU (GET)
// ==========================================

/**
 * @route   GET /api/contract/list
 * @desc    Lấy danh sách hợp đồng kèm thông tin phòng và khách
 */
router.get('/list', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('mId', req.user.user_id)
            .query(`
                SELECT 
                    c.contract_id, 
                    r.room_code, 
                    t.full_name, 
                    c.start_date, 
                    c.end_date, 
                    c.price_room,
                    c.status
                FROM CONTRACT c
                JOIN ROOM r ON c.room_id = r.room_id
                JOIN CONTRACT_TENANT ct ON c.contract_id = ct.contract_id
                JOIN TENANT t ON ct.tenant_id = t.tenant_id
                WHERE c.manager_id = @mId AND ct.is_primary = 1
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   GET /api/contract/tenants
 * @desc    Lấy danh sách khách thuê của chủ trọ để chọn trong Modal
 */
router.get('/tenants', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('mId', req.user.user_id)
            .query("SELECT tenant_id, full_name, email, cccd FROM TENANT WHERE landlord_id = @mId");
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   GET /api/contract/available-rooms
 * @desc    Lấy danh sách phòng trống của chủ trọ
 */
router.get('/available-rooms', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('mId', req.user.user_id)
            .query("SELECT room_id, room_code FROM ROOM WHERE status = 'available' AND manager_id = @mId");
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   GET /api/contract/detail/:id
 * @desc    Lấy chi tiết 1 hợp đồng (Gọi hàm từ Controller)
 */
router.get('/detail/:id', verifyToken, isAdmin, getContractDetail);

// ==========================================
// 2. NHÓM ROUTE THAO TÁC (POST/DELETE)
// ==========================================

/**
 * @route   POST /api/contract/create
 * @desc    Chủ trọ tạo hợp đồng (Gọi hàm từ Controller)
 */
router.post('/create', verifyToken, isAdmin, createContract);

/**
 * @route   DELETE /api/contract/:id
 * @desc    Xóa hợp đồng (Gọi hàm từ Controller)
 */
router.delete('/:id', verifyToken, isAdmin, deleteContract);

module.exports = router;