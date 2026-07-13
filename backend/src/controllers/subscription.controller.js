const { poolPromise, sql } = require('../config/db');

// 1. Khách gửi yêu cầu đăng ký (Tự động tìm chủ trọ để báo)
const requestService = async (req, res) => {
    try {
        const { service_id, contract_id, tenant_id } = req.body;
        const pool = await poolPromise;

        // BƯỚC A: Tìm ID của chủ trọ/người quản lý phòng này
        const ownerData = await pool.request()
            .input('cId', sql.Int, contract_id)
            .query(`
                SELECT r.manager_id 
                FROM CONTRACT c
                JOIN ROOM r ON c.room_id = r.room_id
                WHERE c.contract_id = @cId
            `);

        // Nếu DB chưa có cột manager_id, tạm thời lấy admin có ID thấp nhất hoặc 1
        const adminId = ownerData.recordset[0]?.manager_id || 1;

        // BƯỚC B: Lưu yêu cầu vào bảng SERVICE_SUBSCRIPTION
        const subResult = await pool.request()
            .input('sId', sql.Int, service_id)
            .input('cId', sql.Int, contract_id)
            .input('tId', sql.Int, tenant_id)
            .query(`
                INSERT INTO SERVICE_SUBSCRIPTION (service_id, contract_id, tenant_id, startDate, status_service)
                OUTPUT INSERTED.subscription_id
                VALUES (@sId, @cId, @tId, GETDATE(), 'pending')
            `);

        const newSubId = subResult.recordset[0].subscription_id;

        // BƯỚC C: BẮN THÔNG BÁO CHO ĐÚNG CHỦ TRỌ CỦA PHÒNG ĐÓ
        await pool.request()
            .input('adminId', sql.Int, adminId) 
            .input('refId', sql.Int, newSubId)
            .query(`
                INSERT INTO NOTIFICATIONS (user_id, title, content, type, related_id) 
                VALUES (@adminId, N'Đăng ký dịch vụ', N'Có yêu cầu đăng ký dịch vụ mới từ phòng của bạn cần duyệt.', 'SERVICE_REG', @refId)
            `);

        res.status(201).json({ message: "Đã gửi yêu cầu đến chủ trọ thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. Chủ trọ Duyệt yêu cầu (Lấy ID Admin từ Token)
const approveService = async (req, res) => {
    try {
        const { subscription_id } = req.params;
        const pool = await poolPromise;

        // Lấy cycle_days từ cấu hình dịch vụ và tenant_id để báo ngược lại cho khách
        const serviceData = await pool.request()
            .input('subId', sql.Int, subscription_id)
            .query(`
                SELECT s.cycle_days, s.service_name, ss.tenant_id 
                FROM SERVICE_SUBSCRIPTION ss
                JOIN SERVICE s ON ss.service_id = s.service_id
                WHERE ss.subscription_id = @subId
            `);
        
        if (serviceData.recordset.length === 0) return res.status(404).json({ message: "Không tìm thấy yêu cầu!" });
        
        const { cycle_days, service_name, tenant_id } = serviceData.recordset[0];
        const days = cycle_days || 30;

        // Kích hoạt dịch vụ: Tính startDate từ lúc bấm nút duyệt
        const result = await pool.request()
            .input('subId', sql.Int, subscription_id)
            .input('days', sql.Int, days)
            .query(`
                UPDATE SERVICE_SUBSCRIPTION 
                SET status_service = 'active', 
                    startDate = GETDATE(), 
                    end_date = DATEADD(day, @days, GETDATE()) 
                WHERE subscription_id = @subId AND status_service = 'pending'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ message: "Yêu cầu đã được duyệt hoặc không tồn tại!" });
        }

        // BẮN THÔNG BÁO CHO KHÁCH (Báo dịch vụ đã được dùng)
        if (tenant_id) {
            await pool.request()
                .input('tId', sql.Int, tenant_id)
                .input('msg', sql.NVarChar, `Dịch vụ ${service_name} của bạn đã được duyệt. Hạn dùng đến ngày ${new Date(Date.now() + days*24*60*60*1000).toLocaleDateString('vi-VN')}`)
                .query(`
                    INSERT INTO NOTIFICATIONS (user_id, title, content, type, related_id) 
                    VALUES (@tId, N'Duyệt dịch vụ', @msg, 'SERVICE_APP', @subId)
                `);
        }

        res.json({ message: `Đã kích hoạt dịch vụ ${service_name} trong ${days} ngày.` });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { requestService, approveService };