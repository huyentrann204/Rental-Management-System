import { apiRequest } from '../assets/js/api.js';

window.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const alertBox = document.getElementById('alertBox');
    const submitBtn = registerForm?.querySelector('button[type="submit"]');

    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();

            // 1. Lấy dữ liệu từ các trường nhập liệu
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // 2. Validation cơ bản tại Client
            if (password !== confirmPassword) {
                return showAlert('error', 'Mật khẩu xác nhận không khớp!');
            }

            if (password.length < 6) {
                return showAlert('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
            }

            // 3. Trạng thái đang xử lý
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang khởi tạo tài khoản...';
            submitBtn.disabled = true;
            alertBox.classList.remove('show');

            try {
                // 4. Gọi API Register
                // Role mặc định là 'tenant' (người thuê), admin sẽ được cấp riêng trong DB
                const res = await apiRequest('/auth/register', 'POST', {
                    fullName,
                    email,
                    phone,
                    password,
                    role: 'admin' 
                });

                // 5. Xử lý kết quả thành công
                showAlert('success', 'Đăng ký thành công! Đang chuyển hướng sang Đăng nhập...');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (error) {
                // 6. Xử lý lỗi từ Backend (Ví dụ: Email đã tồn tại)
                showAlert('error', error.message || 'Đăng ký thất bại, vui lòng thử lại.');
                
                // Khôi phục nút bấm
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        };
    }

    // Hàm hiển thị thông báo dùng chung cho trang Register
    function showAlert(type, message) {
        alertBox.className = `auth-alert auth-alert-${type} show`;
        alertBox.textContent = message;
        
        // Nếu là lỗi thì tự ẩn sau 5 giây, thành công thì để nguyên để user thấy chuyển hướng
        if (type === 'error') {
            setTimeout(() => {
                alertBox.classList.remove('show');
            }, 5000);
        }
    }
});