const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const pool = await poolPromise;

        // 1. Kiểm tra xem email đã tồn tại chưa
        const userExist = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM USERS WHERE email = @email');

        if (userExist.recordset.length > 0) {
            return res.status(400).json({ message: "Email này đã được đăng ký rồi!" });
        }

        // 2. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Lưu vào bảng USERS
        await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('role', sql.NVarChar, role || 'admin') // Mặc định là khách thuê
            .query('INSERT INTO USERS (email, password, role) VALUES (@email, @password, @role)');

        res.status(201).json({ message: "Đăng ký tài khoản thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = await poolPromise;

        // 1. Tìm xem email có tồn tại không
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM USERS WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng!" });
        }

        // 2. Kiểm tra mật khẩu (So sánh mật khẩu nhập vào với mật khẩu đã mã hóa trong DB)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng!" });
        }

        // 3. Nếu đúng hết thì tạo Token
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role }, // Thông tin đính kèm vào token
            process.env.JWT_SECRET,                      // Chìa khóa bí mật
            { expiresIn: '24h' }                         // Token có hiệu lực trong 24 giờ
        );

        // 4. Trả về token cho người dùng
        res.json({
            message: "Đăng nhập thành công!",
            token: token,
            user: {
                id: user.user_id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const pool = await poolPromise;

        // 1. Kiểm tra email tồn tại
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM USERS WHERE email = @email');

        const user = result.recordset[0];
        if (!user) {
            return res.status(404).json({ success: false, message: "Email này không tồn tại trong hệ thống!" });
        }

        // 2. Tạo mật khẩu ngẫu nhiên mới (8 ký tự)
        const newPassword = Math.random().toString(36).slice(-8); 
        
        // 3. Mã hóa mật khẩu mới trước khi lưu vào DB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Cập nhật mật khẩu mới vào Database
        await pool.request()
            .input('email', sql.VarChar, email)
            .input('pass', sql.VarChar, hashedPassword)
            .query('UPDATE USERS SET password = @pass WHERE email = @email');

        // 5. Cấu hình gửi Mail (Sử dụng biến môi trường từ .env)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: '"MotelMS Support" <no-reply@motelms.com>',
            to: email,
            subject: 'Khôi phục mật khẩu - Mật khẩu mới của bạn',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #77C47C; border-radius: 10px;">
                    <h2 style="color: #77C47C;">Mật khẩu mới MotelMS</h2>
                    <p>Chào bạn, chúng tôi đã đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Mật khẩu đăng nhập mới là:</p>
                    <div style="font-size: 24px; font-weight: bold; color: #333; text-align: center; padding: 15px; background: #f4f4f4; border-radius: 8px;">
                        ${newPassword}
                    </div>
                    <p style="margin-top: 15px; color: red;"><b>Lưu ý:</b> Hãy đăng nhập và đổi lại mật khẩu ngay để bảo mật tài khoản!</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Mật khẩu mới đã được gửi về email của mày!" });

    } catch (err) {
        console.error("Lỗi quên mật khẩu:", err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống, không thể gửi mail!" });
    }
};

module.exports = { register, login, forgotPassword };

