const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Lấy token từ Header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: "Bạn cần đăng nhập để thực hiện thao tác này!" });
    }

    try {
        // 2. Kiểm tra JWT_SECRET (Phòng trường hợp quên cấu hình .env)
        const secret = process.env.JWT_SECRET || 'SECRET_MAC_DINH_CUA_TAO';
        
        // 3. Giải mã
        const decoded = jwt.verify(token, secret);
        
        // 4. Gán thông tin vào req.user để Controller sử dụng (req.user.user_id)
        req.user = decoded; 
        next(); 
    } catch (err) {
        console.error("JWT Verify Error:", err.message);
        return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!" });
    }
};

const isAdmin = (req, res, next) => {
    // Kiểm tra quyền (Đảm bảo payload lúc login có field 'role')
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Quyền truy cập bị từ chối! Chỉ dành cho Chủ trọ." });
    }
    next();
};

module.exports = { verifyToken, isAdmin };