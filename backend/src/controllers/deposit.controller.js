const { poolPromise, sql } = require('../config/db');

const createDeposit = async (req, res) => {
    const transaction = new sql.Transaction(await poolPromise);
    try {
        const { room_id, tenant_id, amount, expired_at } = req.body;
        await transaction.begin();

        // 1. Tạo bản ghi đặt cọc
        await transaction.request()
            .input('rId', sql.Int, room_id)
            .input('tId', sql.Int, tenant_id)
            .input('amt', sql.Decimal, amount)
            .input('exp', sql.Date, expired_at)
            .query(`INSERT INTO DEPOSIT (room_id, tenant_id, amount, status, expired_at) 
                    VALUES (@rId, @tId, @amt, 'pending', @exp)`);

        // 2. Chuyển trạng thái phòng sang 'reserved' (Đã cọc)
        await transaction.request()
            .input('rId', sql.Int, room_id)
            .query("UPDATE ROOM SET status = 'reserved' WHERE room_id = @rId");

        await transaction.commit();
        res.status(201).json({ message: "Đặt cọc giữ phòng thành công!" });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createDeposit };