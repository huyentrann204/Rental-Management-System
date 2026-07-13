const { sql, poolPromise } = require('../config/db');

// 1. Lấy thông tin cài đặt
exports.getSettings = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const pool = await poolPromise; // Đợi kết nối từ pool
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM LANDLORD_INFO WHERE landlord_id = @userId');
        
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.json({ message: "Chưa có thông tin", theme_mode: 'light' });
        }
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
};

// 2. Cập nhật thông tin cài đặt
exports.updateSettings = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { full_name, phone, address, cccd, cccd_date, theme_mode } = req.body;
        let avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : null;

        const pool = await poolPromise;

        // Kiểm tra xem chủ trọ đã có bản ghi chưa
        const check = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT landlord_id FROM LANDLORD_INFO WHERE landlord_id = @id');

        const request = pool.request();
        // Cấu hình tham số chung
        request.input('name', sql.NVarChar, full_name)
               .input('phone', sql.VarChar, phone)
               .input('addr', sql.NVarChar, address)
               .input('cccd', sql.VarChar, cccd)
               .input('date', sql.Date, cccd_date || null)
               .input('theme', sql.VarChar, theme_mode)
               .input('id', sql.Int, userId);

        if (check.recordset.length > 0) {
            // Lệnh UPDATE
            let query = `UPDATE LANDLORD_INFO SET 
                         full_name = @name, phone = @phone, address = @addr, 
                         cccd = @cccd, cccd_date = @date, theme_mode = @theme`;
            
            if (avatar_url) {
                query += `, avatar_url = @avatar`;
                request.input('avatar', sql.NVarChar, avatar_url);
            }
            query += ` WHERE landlord_id = @id`;
            await request.query(query);
        } else {
            // Lệnh INSERT
            request.input('avatar', sql.NVarChar, avatar_url);
            await request.query(`INSERT INTO LANDLORD_INFO (landlord_id, full_name, phone, address, cccd, cccd_date, avatar_url, theme_mode)
                                 VALUES (@id, @name, @phone, @addr, @cccd, @date, @avatar, @theme)`);
        }

        res.json({ 
            success: true, 
            message: "Cập nhật hồ sơ thành công!", 
            avatar_url: avatar_url 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Không thể lưu thông tin: " + err.message });
    }
};