const { poolPromise, sql } = require('../config/db');

// Lấy thông báo cho người thuê/chủ trọ hiện tại
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy từ Middleware verifyToken
        const pool = await poolPromise;

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT TOP 10 
                    notification_id, title, content, type, is_read, created_at
                FROM NOTIFICATIONS
                WHERE user_id = @userId
                ORDER BY created_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy thông báo:", err);
        res.status(500).json({ error: "Không thể lấy danh sách thông báo" });
    }
};

// Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input('notifId', sql.Int, id)
            .input('userId', sql.Int, req.user.id)
            .query(`
                UPDATE NOTIFICATIONS 
                SET is_read = 1 
                WHERE notification_id = @notifId AND user_id = @userId
            `);

        res.json({ message: "Đã đọc thông báo" });
    } catch (err) {
        res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
    }
};