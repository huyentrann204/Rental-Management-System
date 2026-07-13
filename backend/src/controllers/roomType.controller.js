const { poolPromise, sql } = require('../config/db');

// 1. Hàm lấy loại phòng - CHỈ LẤY CỦA NGƯỜI ĐANG ĐĂNG NHẬP
const getAllRoomTypes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const manager_id = req.user.user_id; // Lấy ID từ token đã decode

        const result = await pool.request()
            .input('mid', sql.Int, manager_id)
            .query('SELECT * FROM ROOM_TYPE WHERE manager_id = @mid'); // Lọc theo chủ trọ
            
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Hàm thêm loại phòng - LƯU KÈM ID NGƯỜI TẠO
const createRoomType = async (req, res) => {
    try {
        const { type_name, price } = req.body;
        const manager_id = req.user.user_id; // Ai tạo thì lưu ID người đó
        const pool = await poolPromise;
        
        await pool.request()
            .input('name', sql.NVarChar, type_name)
            .input('price', sql.Decimal, price)
            .input('mid', sql.Int, manager_id)
            .query('INSERT INTO ROOM_TYPE (type_name, price, manager_id) VALUES (@name, @price, @mid)');

        res.status(201).json({ success: true, message: "Thêm loại phòng thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Hàm XÓA loại phòng (Để ông dọn dẹp đống dữ liệu lỡ tay tạo)
const deleteRoomType = async (req, res) => {
    try {
        const { id } = req.params;
        const manager_id = req.user.user_id;
        const pool = await poolPromise;

        // Chỉ cho phép xóa loại phòng do chính mình tạo
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('mid', sql.Int, manager_id)
            .query('DELETE FROM ROOM_TYPE WHERE room_type_id = @id AND manager_id = @mid');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy hoặc bạn không có quyền xóa!" });
        }

        res.json({ success: true, message: "Đã xóa loại phòng!" });
    } catch (err) {
        res.status(500).json({ error: "Không thể xóa vì loại phòng này đang được sử dụng ở bảng khác!" });
    }
};

module.exports = { getAllRoomTypes, createRoomType, deleteRoomType };