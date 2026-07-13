const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { poolPromise, sql } = require('../config/db'); // Đường dẫn tới file db của bạn

// 1. Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/'); 
    },
    filename: (req, file, cb) => {
        // Tạo 1 biến timestamp duy nhất để dùng cho cả file và database
        const uniqueSuffix = Date.now();
        cb(null, `landlord-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// 2. Định nghĩa Route cập nhật profile
router.post('/update-profile', upload.single('avatar'), async (req, res) => {
    try {
        const { landlord_id } = req.body;
        
        // Đây là đường dẫn sẽ lưu vào Database
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const pool = await poolPromise;
        await pool.request()
            .input('avatar_url', sql.NVarChar, avatarUrl)
            .input('id', sql.Int, landlord_id)
            .query('UPDATE Landlords SET avatar_url = @avatar_url WHERE landlord_id = @id');

        // Trả về URL chính xác cho Frontend hiển thị
        res.json({ success: true, avatar_url: avatarUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;