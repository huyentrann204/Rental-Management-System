const { poolPromise, sql } = require('../config/db');

const createRequest = async (req, res) => {
    try {
        const { contract_id, tenant_id, description, image_url } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('cId', sql.Int, contract_id)
            .input('tId', sql.Int, tenant_id)
            .input('desc', sql.NVarChar, description)
            .input('img', sql.VarChar, image_url)
            .query(`INSERT INTO MAINTENANCE_REQUEST (contract_id, tenant_id, description_maintance, image_url, status_maintance)
                    VALUES (@cId, @tId, @desc, @img, 'pending')`);
        res.status(201).json({ message: "Đã gửi yêu cầu sửa chữa!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createRequest };