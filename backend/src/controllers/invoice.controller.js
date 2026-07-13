const { poolPromise, sql } = require('../config/db');

/**
 * 1. TẠO HÓA ĐƠN MỚI
 * Workflow: Lấy giá phòng (Contract) + Điện Nước (Utility) + Dịch vụ chọn thêm (Services)
 * Body: { contract_id, month, year, selected_services: [id1, id2...] }
 */
const generateInvoice = async (req, res) => {
    let transaction; // Khai báo ngoài để catch có thể rollback
    try {
        const { contract_id, month, year, selected_services } = req.body;
        const managerId = req.user.user_id;
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);

        await transaction.begin();

        // A. Lấy giá phòng và chỉ số điện nước kèm giá (ĐÃ SỬA LỖI SUBQUERY)
        const baseResult = await transaction.request()
            .input('cId', sql.Int, contract_id)
            .input('m', sql.Int, month)
            .input('y', sql.Int, year)
            .input('mId', sql.Int, managerId) // Thêm ID chủ trọ để lọc giá
            .query(`
                SELECT 
                    c.price_room, r.room_id, r.room_code,
                    u.electric_old, u.electric_new, u.water_old, u.water_new,
                    (SELECT TOP 1 price FROM SERVICE WHERE service_name LIKE N'%điện%' AND manager_id = @mId) as e_unit,
                    (SELECT TOP 1 price FROM SERVICE WHERE service_name LIKE N'%nước%' AND manager_id = @mId) as w_unit
                FROM CONTRACT c
                JOIN ROOM r ON c.room_id = r.room_id
                JOIN UTILITY_READING u ON r.room_id = u.room_id
                WHERE c.contract_id = @cId AND u.month = @m AND u.year = @y AND r.manager_id = @mId
            `);

        const base = baseResult.recordset[0];
        if (!base) {
            throw new Error(`Chưa có chỉ số điện nước hoặc hợp đồng không hợp lệ cho kỳ ${month}/${year}!`);
        }

        // B. Tính toán tiền (Có giá mặc định an toàn)
        const eUsage = base.electric_new - base.electric_old;
        const wUsage = base.water_new - base.water_old;
        const electricTotal = eUsage * (base.e_unit || 3500); 
        const waterTotal = wUsage * (base.w_unit || 15000);

        // C. Tính dịch vụ thêm (Gia cố logic)
        let serviceTotal = 0;
        let serviceList = [];
        if (selected_services && Array.isArray(selected_services) && selected_services.length > 0) {
            // Chỉ lấy các dịch vụ thuộc quyền quản lý của chủ trọ này
            const serviceRes = await transaction.request()
                .input('mId', sql.Int, managerId)
                .query(`SELECT service_name, price FROM SERVICE 
                        WHERE manager_id = @mId 
                        AND service_id IN (${selected_services.map(id => parseInt(id)).join(',')})`);
            serviceList = serviceRes.recordset;
            serviceList.forEach(s => serviceTotal += s.price);
        }

        const grandTotal = base.price_room + electricTotal + waterTotal + serviceTotal;

        // D. Insert INVOICE (OUTPUT để lấy ID)
        const invoiceInsert = await transaction.request()
            .input('cId', sql.Int, contract_id)
            .input('m', sql.Int, month)
            .input('y', sql.Int, year)
            .input('total', sql.Decimal(18,2), grandTotal)
            .input('desc', sql.NVarChar, `Hóa đơn tháng ${month}/${year} - Phòng ${base.room_code}`)
            .query(`
                INSERT INTO INVOICE (contract_id, invoice_type, month, year, total, status_invoice, description_invoice)
                OUTPUT INSERTED.invoice_id
                VALUES (@cId, 'monthly', @m, @y, @total, 'unpaid', @desc)
            `);

        const invId = invoiceInsert.recordset[0].invoice_id;

        // E. Insert chi tiết
        await transaction.request()
            .input('invId', sql.Int, invId)
            .input('roomPrice', sql.Decimal(18,2), base.price_room)
            .input('ePrice', sql.Decimal(18,2), electricTotal)
            .input('wPrice', sql.Decimal(18,2), waterTotal)
            .input('eText', sql.NVarChar, `Tiền điện (${eUsage} số)`)
            .input('wText', sql.NVarChar, `Tiền nước (${wUsage} khối)`)
            .query(`
                INSERT INTO INVOICE_ITEM (invoice_id, description_invoice, amount, item_type) VALUES 
                (@invId, N'Tiền thuê phòng', @roomPrice, 'room'),
                (@invId, @eText, @ePrice, 'electric'),
                (@invId, @wText, @wPrice, 'water')
            `);

        for (let s of serviceList) {
            await transaction.request()
                .input('invId', sql.Int, invId)
                .input('name', sql.NVarChar, s.service_name)
                .input('price', sql.Decimal(18,2), s.price)
                .query("INSERT INTO INVOICE_ITEM (invoice_id, description_invoice, amount, item_type) VALUES (@invId, @name, @price, 'service')");
        }

        await transaction.commit();
        res.status(201).json({ success: true, message: "Xuất hóa đơn thành công!", invoice_id: invId });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Lỗi Xuất hóa đơn:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};
/**
 * 2. LẤY DANH SÁCH HÓA ĐƠN (Lọc linh hoạt theo Tháng, Năm, Trạng thái)
 */
const getInvoices = async (req, res) => {
    try {
        const { status, month, year } = req.query;
        const managerId = req.user.user_id;
        const pool = await poolPromise;

        let query = `
            SELECT i.*, r.room_code, t.full_name
            FROM INVOICE i
            JOIN CONTRACT c ON i.contract_id = c.contract_id
            JOIN ROOM r ON c.room_id = r.room_id
            JOIN CONTRACT_TENANT ct ON c.contract_id = ct.contract_id
            JOIN TENANT t ON ct.tenant_id = t.tenant_id
            WHERE r.manager_id = @mId AND ct.is_primary = 1
        `;

        const request = pool.request().input('mId', sql.Int, managerId);

        // Xử lý lọc linh hoạt (Nếu truyền 'all' hoặc '0' thì bỏ qua)
        if (status && status !== 'all') {
            query += " AND i.status_invoice = @status";
            request.input('status', sql.NVarChar, status);
        }
        if (month && month !== '0' && month !== 'all') {
            query += " AND i.month = @month";
            request.input('month', sql.Int, month);
        }
        if (year && year !== '0' && year !== 'all') {
            query += " AND i.year = @year";
            request.input('year', sql.Int, year);
        }

        query += " ORDER BY i.year DESC, i.month DESC, i.created_at DESC";

        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 3. LẤY CHI TIẾT HÓA ĐƠN (Bấm vào dòng để xem bảng kê)
 */
const getInvoiceItems = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('invId', sql.Int, id)
            .query("SELECT * FROM INVOICE_ITEM WHERE invoice_id = @invId");
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 4. CẬP NHẬT TRẠNG THÁI THANH TOÁN
 */
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('invId', sql.Int, id)
            .query("UPDATE INVOICE SET status_invoice = 'paid' WHERE invoice_id = @invId");
        
        res.json({ success: true, message: "Đã xác nhận thanh toán thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { 
    generateInvoice, 
    getInvoices, 
    getInvoiceItems, 
    updatePaymentStatus 
};