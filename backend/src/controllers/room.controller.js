const { poolPromise, sql } = require('../config/db');

// 1. Tạo phòng mới
const createRoom = async (req, res) => {
    try {
        const { room_code, room_type_id, status } = req.body;
        // LẤY ID TỪ TOKEN (Bắt buộc phải qua middleware verifyToken)
        const manager_id = req.user.user_id; 
        const pool = await poolPromise;

        await pool.request()
            .input('code', sql.NVarChar, room_code)
            .input('typeId', sql.Int, room_type_id)
            .input('status', sql.NVarChar, status || 'active')
            .input('mid', sql.Int, manager_id) // GÁN ID CHỦ TRỌ VÀO ĐÂY
            .query(`
                INSERT INTO ROOM (room_code, room_type_id, status, manager_id) 
                VALUES (@code, @typeId, @status, @mid)
            `);

        res.status(201).json({ success: true, message: "Tạo phòng mới thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. Lấy danh sách phòng (Lọc theo chủ trọ)
const getRooms = async (req, res) => {
    try {
        const pool = await poolPromise;
        const manager_id = req.user.user_id; 

        const result = await pool.request()
            .input('mid', sql.Int, manager_id)
            .query(`
                SELECT r.room_id, r.room_code, r.status, rt.type_name, rt.price 
                FROM ROOM r 
                JOIN ROOM_TYPE rt ON r.room_type_id = rt.room_type_id
                WHERE r.manager_id = @mid
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Lấy 1 phòng để sửa
const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM ROOM WHERE room_id = @id');
        res.json(result.recordset[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 4. CẬP NHẬT PHÒNG (BỔ SUNG)
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { room_code, room_type_id, status } = req.body;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('code', sql.NVarChar, room_code)
            .input('typeId', sql.Int, room_type_id)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE ROOM SET room_code = @code, room_type_id = @typeId, status = @status 
                WHERE room_id = @id
            `);
        res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Xóa phòng
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const manager_id = req.user.user_id;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('mid', sql.Int, manager_id)
            .query('DELETE FROM ROOM WHERE room_id = @id AND manager_id = @mid');

        res.json({ success: true, message: "Xóa thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const getOccupiedRooms = async (req, res) => {
    try {
        const pool = await poolPromise;
        const managerId = req.user.user_id;

        const result = await pool.request()
            .input('mId', sql.Int, managerId)
            .query(`
                SELECT room_id, room_code 
                FROM ROOM 
                WHERE manager_id = @mId 
                AND status = 'occupied' -- Lấy tất cả phòng đang ở
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// XUẤT HÀM (EXPORT) CHUẨN ĐỂ ROUTES KHÔNG BỊ LỖI HANDLER
module.exports = { 
    createRoom, 
    getRooms, 
    getRoomById, 
    updateRoom, 
    deleteRoom,
    getOccupiedRooms
};