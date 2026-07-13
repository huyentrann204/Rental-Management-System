const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middlewares/auth.middleware');

// Tự động kiểm tra và tạo thư mục nếu chưa có để tránh crash server
const uploadDir = 'public/uploads/avatars/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu ảnh Avatar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // req.user đã tồn tại nhờ verifyToken chạy trước ở phía dưới
        const userId = req.user ? req.user.user_id : 'unknown';
        cb(null, `landlord-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Chỉ hỗ trợ file ảnh (jpg, jpeg, png)!"));
    }
});

// THỨ TỰ CỰC KỲ QUAN TRỌNG: verifyToken phải đứng trước upload.single
router.get('/settings', verifyToken, settingController.getSettings);

router.post('/settings', 
    verifyToken, 
    upload.single('avatar'), 
    settingController.updateSettings
);

module.exports = router;