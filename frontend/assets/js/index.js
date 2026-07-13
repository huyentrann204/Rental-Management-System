// Nếu sau này bạn cần gọi API lấy số lượng phòng trọ, hãy import apiRequest ở đây
// import { apiRequest } from './api.js';

window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // Tìm các container nút bấm trên trang chủ
    const heroButtons = document.querySelectorAll('.hero-buttons');
    const navLoginLink = document.querySelector('a[href="auth/login.html"]');

    if (token && userData) {
        try {
            const user = JSON.parse(userData);

            // 1. Đổi câu chào ở Hero
            const heroSubtitle = document.querySelector('.hero-subtitle');
            if (heroSubtitle) {
                heroSubtitle.innerHTML = `Chào mừng <strong>${user.fullName}</strong> quay trở lại!`;
            }

            // 2. Cập nhật các nút bấm sang Dashboard/Logout
            const dashboardLink = user.role === 'admin' 
                ? 'admin/dashboard.html' 
                : 'tenant/portal/tong-quan.html';

            heroButtons.forEach(div => {
                div.innerHTML = `
                    <a href="${dashboardLink}" class="hero-button hero-button-primary">Vào trang quản lý</a>
                    <a href="#" id="logoutBtn" class="hero-button hero-button-secondary">Đăng xuất</a>
                `;
            });

            // 3. Đổi nút Đăng nhập trên Menu thành Dashboard
            if (navLoginLink) {
                navLoginLink.textContent = 'Trang của tôi';
                navLoginLink.href = dashboardLink;
            }

            // 4. Xử lý Đăng xuất
            document.addEventListener('click', (e) => {
                if (e.target.id === 'logoutBtn') {
                    e.preventDefault();
                    if(confirm('Bạn có chắc muốn đăng xuất?')) {
                        localStorage.clear(); // Xóa sạch token và user
                        window.location.reload();
                    }
                }
            });

        } catch (e) {
            console.error("Dữ liệu user lỗi:", e);
            localStorage.clear();
        }
    }
});