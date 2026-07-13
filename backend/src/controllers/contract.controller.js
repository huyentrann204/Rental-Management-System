const { poolPromise, sql } = require('../config/db');

/**
 * CHỦ TRỌ TẠO HỢP ĐỒNG (Mặc định: Active)
 * Luồng: Tạo Contract (Active) -> Gán Tenant -> Update Room (Occupied)
 */
const createContract = async (req, res) => {
    const transaction = new sql.Transaction(await poolPromise);
    try {
        const { room_id, tenant_id, start_date, end_date, deposit_amount, price_room } = req.body;
        const managerId = req.user.user_id; // Lấy ID chủ trọ từ Token

        await transaction.begin();

        // BƯỚC 1: Tạo Hợp đồng ở trạng thái 'active' luôn
        const contractRes = await transaction.request()
            .input('roomId', sql.Int, room_id)
            .input('mId', sql.Int, managerId)
            .input('startDate', sql.Date, start_date)
            .input('endDate', sql.Date, end_date) // Thêm ngày kết thúc
            .input('deposit', sql.Decimal(18, 2), deposit_amount)
            .input('price', sql.Decimal(18, 2), price_room)
            .query(`
                INSERT INTO CONTRACT (room_id, manager_id, start_date, end_date, deposit_amount, price_room, status) 
                VALUES (@roomId, @mId, @startDate, @endDate, @deposit, @price, 'active'); 
                SELECT SCOPE_IDENTITY() AS id;
            `);
        const contractId = contractRes.recordset[0].id;

        // BƯỚC 2: Gán khách thuê vào hợp đồng
        await transaction.request()
            .input('contractId', sql.Int, contractId)
            .input('tenantId', sql.Int, tenant_id)
            .query("INSERT INTO CONTRACT_TENANT (contract_id, tenant_id, is_primary) VALUES (@contractId, @tenantId, 1)");

        // BƯỚC 3: Chuyển thẳng phòng sang 'occupied' (Đã cho thuê)
        await transaction.request()
            .input('roomId', sql.Int, room_id)
            .query("UPDATE ROOM SET status = 'occupied' WHERE room_id = @roomId");

        await transaction.commit();
        res.status(201).json({ success: true, message: "Tạo hợp đồng thành công!" });

    } catch (err) {
        await transaction.rollback();
        console.error("Lỗi tạo hợp đồng:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * LẤY CHI TIẾT HỢP ĐỒNG
 * Dùng để hiện Modal khi bấm vào một dòng trên bảng
 */
const getContractDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('cId', sql.Int, id)
            .query(`
                SELECT c.*, r.room_code, t.full_name, t.phone, t.cccd
                FROM CONTRACT c
                JOIN ROOM r ON c.room_id = r.room_id
                JOIN CONTRACT_TENANT ct ON c.contract_id = ct.contract_id
                JOIN TENANT t ON ct.tenant_id = t.tenant_id
                WHERE c.contract_id = @cId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng" });
        }

        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * XÓA HỢP ĐỒNG (Khi hết hạn)
 * Xóa hợp đồng và trả trạng thái phòng về 'available'
 */
const deleteContract = async (req, res) => {
    const transaction = new sql.Transaction(await poolPromise);
    try {
        const { id } = req.params;
        await transaction.begin();

        // Lấy room_id trước khi xóa để trả trạng thái phòng
        const contractInfo = await transaction.request()
            .input('cId', sql.Int, id)
            .query("SELECT room_id FROM CONTRACT WHERE contract_id = @cId");

        if (contractInfo.recordset.length > 0) {
            const roomId = contractInfo.recordset[0].room_id;

            // 1. Xóa trong bảng trung gian CONTRACT_TENANT
            await transaction.request().input('cId', sql.Int, id).query("DELETE FROM CONTRACT_TENANT WHERE contract_id = @cId");
            
            // 2. Xóa hợp đồng
            await transaction.request().input('cId', sql.Int, id).query("DELETE FROM CONTRACT WHERE contract_id = @cId");

            // 3. Trả trạng thái phòng về 'available'
            await transaction.request().input('rId', sql.Int, roomId).query("UPDATE ROOM SET status = 'available' WHERE room_id = @rId");
        }

        await transaction.commit();
        res.json({ success: true, message: "Đã xóa hợp đồng và giải phóng phòng!" });
    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { createContract, getContractDetail, deleteContract };