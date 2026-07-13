require('dotenv').config();
console.log("--- DEBUG .ENV ---");
console.log("Đường dẫn thực thi:", process.cwd());
console.log("Biến EMAIL_USER:", process.env.EMAIL_USER || "CHƯA NHẬN ĐƯỢC");
console.log("------------------");

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();



// --- IMPORT ROUTES ---
const roomTypeRoutes = require('./routes/roomType.routes');
const roomRoutes = require('./routes/room.routes');
const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const serviceRoutes = require('./routes/service.routes');
const contractRoutes = require('./routes/contract.routes');
const utilityRoutes = require('./routes/utility.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const depositRoutes = require('./routes/deposit.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');



// Route mới cho phần Cài đặt (Settings)
const settingRoutes = require('./routes/setting.routes'); 

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH STATIC FOLDER ---
// Cho phép truy cập ảnh từ trình duyệt qua đường dẫn /uploads/...
// Ví dụ: http://localhost:3000/uploads/avatars/image.jpg
//app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


// --- ĐĂNG KÝ CÁC ROUTES API ---
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/utility', utilityRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Sử dụng route thông báo
app.use('/api/notifications', notificationRoutes);

// Đăng ký route Setting (Cài đặt chung)
// Các endpoint bên trong sẽ là: GET /api/settings và POST /api/settings
app.use('/api', settingRoutes);

// --- TEST CONNECTION ---
app.get('/', (req, res) => {
    res.send("Backend MotelMS is running perfectly!");
});

// Xử lý lỗi 404 cho các route không tồn tại
app.use((req, res) => {
    res.status(404).json({ message: "API endpoint not found!" });
});

module.exports = app;