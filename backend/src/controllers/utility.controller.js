const { poolPromise, sql } = require('../config/db');

// 1. LẤY DANH SÁCH CHỈ SỐ (Sửa lỗi hiển thị)
const getReadings = async (req, res) => {
    try {
        // Ép kiểu để chắc chắn SQL nhận đúng số nguyên
        const month = parseInt(req.query.month);
        const year = parseInt(req.query.year);
        const manager_id = req.user.user_id; 
        
        const pool = await poolPromise;
        const result = await pool.request()
            .input('m', sql.Int, month)
            .input('y', sql.Int, year)
            .input('mid', sql.Int, manager_id)
            .query(`
                SELECT u.*, r.room_code 
                FROM UTILITY_READING u
                JOIN ROOM r ON u.room_id = r.room_id
                WHERE u.month = @m AND u.year = @y AND r.manager_id = @mid
            `);

        // Luôn trả về success: true, nếu rỗng thì data là []
        res.json({
            success: true,
            data: result.recordset || [] 
        });
    } catch (err) { 
        res.status(500).json({ success: false, data: [], error: err.message });
    }
};

// 2. LẤY CHỈ SỐ CUỐI CÙNG (Làm số cũ cho tháng mới)
const getLastReading = async (req, res) => {
    try {
        const { roomId } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('rid', sql.Int, roomId)
            .query(`
                SELECT TOP 1 electric_new, water_new 
                FROM UTILITY_READING 
                WHERE room_id = @rid 
                ORDER BY year DESC, month DESC
            `);

        if (result.recordset.length > 0) {
            res.json({
                success: true,
                data: {
                    electric_new: result.recordset[0].electric_new,
                    water_new: result.recordset[0].water_new,
                    is_first_time: false
                }
            });
        } else {
            res.json({
                success: true,
                data: { electric_new: 0, water_new: 0, is_first_time: true }
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. GHI CHỈ SỐ MỚI
const recordReading = async (req, res) => {
    try {
        const { room_id, month, year, electric_old, electric_new, water_old, water_new } = req.body;
        const pool = await poolPromise;

        if (electric_new < electric_old || water_new < water_old) {
            return res.status(400).json({ success: false, message: "Số mới không được nhỏ hơn số cũ!" });
        }

        await pool.request()
            .input('roomId', sql.Int, room_id)
            .input('m', sql.Int, month)
            .input('y', sql.Int, year)
            .input('eOld', sql.Int, electric_old)
            .input('eNew', sql.Int, electric_new)
            .input('wOld', sql.Int, water_old)
            .input('wNew', sql.Int, water_new)
            .query(`
                INSERT INTO UTILITY_READING (room_id, month, year, electric_old, electric_new, water_old, water_new)
                VALUES (@roomId, @m, @y, @eOld, @eNew, @wOld, @wNew)
            `);

        res.status(201).json({ success: true, message: "Lưu chỉ số thành công!" });
    } catch (err) {
        if (err.number === 2627) return res.status(400).json({ success: false, message: "Phòng này đã chốt số rồi!" });
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. CẬP NHẬT CHỈ SỐ (HÀM THIẾU DẪN ĐẾN LỖI)
const updateReading = async (req, res) => {
    try {
        const { id } = req.params;
        const { electric_old, electric_new, water_old, water_new } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('en', sql.Int, electric_new)
            .input('wn', sql.Int, water_new)
            .query(`
                UPDATE UTILITY_READING 
                SET electric_new = @en, water_new = @wn 
                WHERE reading_id = @id
            `);

        res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 5. XÓA CHỈ SỐ (HÀM THIẾU DẪN ĐẾN LỖI)
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM UTILITY_READING WHERE reading_id = @id");
        res.json({ success: true, message: "Đã xóa chỉ số!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { 
    recordReading, 
    getReadings, 
    deleteReading, 
    updateReading, 
    getLastReading 
};