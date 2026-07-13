import { apiRequest } from './api.js';

window.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    if (forgotPasswordForm) {
        forgotPasswordForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();

            if (!window.Validator.isEmail(email)) {
                window.Notification.error('Email không đúng định dạng!');
                return;
            }

            const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang xử lý...';

            try {
                await apiRequest('/auth/forgot-password', 'POST', { email });
                window.Notification.success('Mã xác thực đã được gửi vào Email của bạn!');
                sessionStorage.setItem('reset_email', email);
                
                setTimeout(() => {
                    window.location.href = 'verify-otp.html';
                }, 2000);
            } catch (error) {
                window.Notification.error(error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Gửi mã xác thực';
            }
        };
    }
});