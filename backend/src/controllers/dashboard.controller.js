const { poolPromise, sql } = require('../config/db');

const getDashboardData = async (req, res) => {
    try {
        const pool = await poolPromise;
        const managerId = req.user.user_id; // Lấy ID người dùng từ Token xác thực

        // Thực hiện truy vấn đồng thời nhiều thông số để tối ưu hiệu suất
        const result = await pool.request()
            .input('mId', sql.Int, managerId)
            .query(`
                -- 1. Thống kê trạng thái phòng 
                -- Đảm bảo luôn trả về 0 nếu không có dữ liệu để tránh lỗi Chart trên Frontend
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as rented,
                    SUM(CASE WHEN status != 'occupied' THEN 1 ELSE 0 END) as empty
                FROM ROOM 
                WHERE manager_id = @mId;

                -- 2. Doanh thu tháng hiện tại (Chỉ các hóa đơn đã thanh toán 'paid')
                SELECT SUM(i.total) as currentMonthRevenue 
                FROM INVOICE i
                JOIN CONTRACT c ON i.contract_id = c.contract_id
                JOIN ROOM r ON c.room_id = r.room_id
                WHERE i.month = MONTH(GETDATE()) 
                  AND i.year = YEAR(GETDATE()) 
                  AND i.status_invoice = 'paid' 
                  AND r.manager_id = @mId;

                -- 3. Tổng số khách hàng hiện tại của chủ trọ
                SELECT COUNT(*) as totalTenants 
                FROM TENANT 
                WHERE landlord_id = @mId;

                -- 4. Tổng công nợ chưa thu (Hóa đơn 'unpaid')
                SELECT SUM(i.total) as totalUnpaid 
                FROM INVOICE i
                JOIN CONTRACT c ON i.contract_id = c.contract_id
                JOIN ROOM r ON c.room_id = r.room_id
                WHERE i.status_invoice = 'unpaid' 
                  AND r.manager_id = @mId;

                -- 5. Lấy Banner ảnh mới nhất
                SELECT TOP 1 image_url 
                FROM DASHBOARD_BANNERS 
                WHERE manager_id = @mId 
                ORDER BY created_at DESC;
            `);

        // Xử lý dữ liệu trả về để Frontend sử dụng trực tiếp
        const roomStats = result.recordsets[0][0];
        const revenueData = result.recordsets[1][0];
        const tenantData = result.recordsets[2][0];
        const debtData = result.recordsets[3][0];
        const bannerData = result.recordsets[4][0];

        res.json({
            success: true,
            data: {
                roomStatus: {
                    total: roomStats?.total || 0,
                    rented: roomStats?.rented || 0,
                    empty: roomStats?.empty || 0
                },
                revenue: revenueData?.currentMonthRevenue || 0,
                tenants: tenantData?.totalTenants || 0,
                debt: debtData?.totalUnpaid || 0,
                banner: bannerData?.image_url || '/uploads/banners/co_gac.jpg' 
            }
        });

    } catch (err) {
        console.error("Lỗi Dashboard Controller: ", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Không thể tải dữ liệu Dashboard", 
            error: err.message 
        });
    }
};

const uploadBanner = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Chưa chọn file ảnh!" });
        
        const imageUrl = `/uploads/banners/${req.file.filename}`;
        const managerId = req.user.user_id;
        
        const pool = await poolPromise;
        await pool.request()
            .input('url', sql.NVarChar, imageUrl)
            .input('mId', sql.Int, managerId)
            .query("INSERT INTO DASHBOARD_BANNERS (image_url, manager_id) VALUES (@url, @mId)");
            
        res.json({ success: true, message: "Up ảnh thành công!", url: imageUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


module.exports = { 
    getDashboardData, 
    uploadBanner 
};
