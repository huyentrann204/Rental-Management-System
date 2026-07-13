// auth/login.js
import { apiRequest } from '../assets/js/api.js';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // Sử dụng alertBox để khớp với ID trong file HTML đẹp của bạn
    const alertBox = document.getElementById('alertBox');
    const btnSubmit = document.querySelector('button[type="submit"]');

    try {
        // Trạng thái chờ
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Đang đăng nhập...';
        if (alertBox) alertBox.style.display = 'none';

        // Gửi yêu cầu đăng nhập thực tế đến Backend
        const response = await apiRequest('/auth/login', 'POST', { 
            email: email, 
            password: password 
        });

        // Kiểm tra phản hồi từ Backend (Token và thông tin User)
        if (response && response.token) {
            // Lưu dữ liệu thật vào localStorage
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);

            if (alertBox) {
                alertBox.className = 'alert alert-success';
                alertBox.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
                alertBox.style.display = 'block';
            }

            // CHUYỂN HƯỚNG DỰA TRÊN ROLE (QUAN TRỌNG)
            setTimeout(() => {
                if (response.user.role === 'admin') {
                    window.location.href = '../admin/dashboard.html';
                } else {
                    window.location.href = '../tenant/portal/tong-quan.html';
                }
            }, 1000);
        } else {
            throw new Error('Đăng nhập thất bại, không nhận được token');
        }
    } catch (error) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.className = 'alert alert-error';
            // Hiển thị lỗi cụ thể từ server hoặc lỗi mặc định
            alertBox.textContent = error.message || 'Email hoặc mật khẩu không chính xác!';
        }
        console.error("Lỗi đăng nhập:", error);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Đăng nhập';
    }
});