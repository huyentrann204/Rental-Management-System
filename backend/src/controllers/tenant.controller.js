const { poolPromise, sql } = require('../config/db');

const createTenant = async (req, res) => {
    try {
        // 1. Nhận đầy đủ các trường từ Frontend gửi lên
        const { full_name, phone, cccd, email, gender, address } = req.body;
        const landlordId = req.user.user_id; 

        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.NVarChar, full_name)
            .input('phone', sql.VarChar, phone)
            .input('cccd', sql.VarChar, cccd)
            .input('email', sql.VarChar, email)
            .input('gender', sql.NVarChar, gender) // THÊM DÒNG NÀY
            .input('address', sql.NVarChar, address) // THÊM DÒNG NÀY
            .input('landlordId', sql.Int, landlordId)
            .query(`
                INSERT INTO TENANT (full_name, phone, cccd, email, gender, address, landlord_id) 
                VALUES (@name, @phone, @cccd, @email, @gender, @address, @landlordId)
            `);

        res.status(201).json({ message: "Thêm khách thuê thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getTenants = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // 2. LỌC: CHỈ LẤY KHÁCH CỦA CHỦ TRỌ ĐANG ĐĂNG NHẬP
        const landlordId = req.user.user_id; 

        const result = await pool.request()
            .input('landlordId', sql.Int, landlordId)
            .query('SELECT * FROM TENANT WHERE landlord_id = @landlordId');

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const landlordId = req.user.user_id;

        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('landlordId', sql.Int, landlordId)
            .query('DELETE FROM TENANT WHERE tenant_id = @id AND landlord_id = @landlordId');

        res.json({ message: "Xóa thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, cccd, email, gender, address } = req.body;
        const landlordId = req.user.user_id;

        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, full_name)
            .input('phone', sql.VarChar, phone)
            .input('cccd', sql.VarChar, cccd)
            .input('email', sql.VarChar, email)
            .input('gender', sql.NVarChar, gender)
            .input('address', sql.NVarChar, address)
            .input('landlordId', sql.Int, landlordId)
            .query(`
                UPDATE TENANT 
                SET full_name = @name, phone = @phone, cccd = @cccd, 
                    email = @email, gender = @gender, address = @address
                WHERE tenant_id = @id AND landlord_id = @landlordId
            `);

        res.json({ message: "Cập nhật khách thuê thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = { createTenant, getTenants, deleteTenant, updateTenant };

