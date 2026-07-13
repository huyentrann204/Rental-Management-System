const { poolPromise } = require('../config/db');

// --- 1. LẤY DANH SÁCH DỊCH VỤ THEO CHỦ TRỌ ---
const getServices = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Lấy ID của chủ trọ từ Token (đã qua middleware verifyToken)
        const manager_id = req.user.user_id;

        const result = await pool.request()
            .input('mId', manager_id)
            .query(`
                SELECT service_id, service_name, price, service_type, unit_type, cycle_days 
                FROM SERVICE 
                WHERE manager_id = @mId
            `);

        // Phải trả về đúng cấu trúc này để Frontend không bị lỗi 'reading filter'
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error("Lỗi getServices:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 2. TẠO DỊCH VỤ MỚI ---
const createService = async (req, res) => {
    try {
        const { service_name, price, service_type, unit_type, cycle_days } = req.body;
        const manager_id = req.user.user_id;

        const pool = await poolPromise;
        await pool.request()
            .input('name', service_name)
            .input('type', service_type)
            .input('unit', unit_type)
            .input('price', price)
            .input('cycle', cycle_days || 30)
            .input('mId', manager_id)
            .query(`
                INSERT INTO SERVICE (service_name, service_type, unit_type, price, cycle_days, manager_id)
                VALUES (@name, @type, @unit, @price, @cycle, @mId)
            `);

        res.json({ success: true, message: "Tạo dịch vụ thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 3. CẬP NHẬT DỊCH VỤ ---
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service_name, price, service_type, unit_type, cycle_days } = req.body;
        const manager_id = req.user.user_id;

        const pool = await poolPromise;
        await pool.request()
            .input('id', id)
            .input('name', service_name)
            .input('type', service_type)
            .input('unit', unit_type)
            .input('price', price)
            .input('cycle', cycle_days)
            .input('mId', manager_id)
            .query(`
                UPDATE SERVICE 
                SET service_name = @name, 
                    service_type = @type, 
                    unit_type = @unit, 
                    price = @price, 
                    cycle_days = @cycle
                WHERE service_id = @id AND manager_id = @mId
            `);

        res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 4. XÓA DỊCH VỤ ---
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const manager_id = req.user.user_id;

        const pool = await poolPromise;
        await pool.request()
            .input('id', id)
            .input('mId', manager_id)
            .query("DELETE FROM SERVICE WHERE service_id = @id AND manager_id = @mId");

        res.json({ success: true, message: "Xóa dịch vụ thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    getServices,
    createService,
    updateService,
    deleteService
};