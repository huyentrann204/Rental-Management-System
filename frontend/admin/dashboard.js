import { apiRequest } from './api.js'; // Đảm bảo đã export apiRequest từ file api.js

let pieChart;

// 1. Kiểm tra Token và khởi chạy khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Chuyển hướng nếu chưa đăng nhập
        window.location.href = '../auth/login.html';
        return;
    }
    fetchDashboardData();
    initSearchLogic(); // Kích hoạt tính năng tìm kiếm nhanh
});

// 2. Hàm lấy dữ liệu từ Backend
async function fetchDashboardData() {
    try {
        // Gọi API đúng Route đã thiết lập ở Backend
        const response = await apiRequest('/dashboard/summary', 'GET');
        
        if (response && response.success) {
            const stats = response.data; // Lấy dữ liệu từ payload 'data'
            updateUI(stats);
            renderChart(stats.roomStatus.empty, stats.roomStatus.rented);
        }
    } catch (err) {
        console.error("Lỗi lấy dữ liệu Dashboard:", err);
        // Tự động đá về login nếu token lỗi (401)
        if (err.message.includes('401')) {
            window.location.href = '../auth/login.html';
        }
    }
}

// 3. Hàm cập nhật các con số lên màn hình
function updateUI(stats) {
    // Cập nhật 3 Card thống kê dưới cùng
    document.getElementById('statRevenue').innerText = (stats.revenue || 0).toLocaleString() + 'đ';
    document.getElementById('statTenants').innerText = stats.tenants || 0;
    document.getElementById('statDebt').innerText = (stats.debt || 0).toLocaleString() + 'đ';

    // Cập nhật số liệu Tình trạng phòng
    document.getElementById('totalRoomsLabel').innerText = stats.roomStatus.total || 0;
    document.getElementById('emptyCount').innerText = stats.roomStatus.empty || 0;
    document.getElementById('rentedCount').innerText = stats.roomStatus.rented || 0;

    // Cập nhật Banner nếu có ảnh từ Database
    const bannerImg = document.getElementById('dashboard-banner');
    if (bannerImg && stats.banner) {
        bannerImg.src = `http://localhost:3000${stats.banner}`;
    }
}

// 4. Logic vẽ biểu đồ (Chart.js) cho 2 trạng thái
function renderChart(empty, rented) {
    const ctx = document.getElementById('roomPieChart');
    if (!ctx) return;

    if (pieChart) pieChart.destroy(); // Xóa chart cũ nếu có

    const isDark = document.body.classList.contains('dark');

    pieChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Trống', 'Đã thuê'],
            datasets: [{
                data: [empty, rented],
                backgroundColor: ['#10b981', '#ef4444'], // Xanh lá cho Trống, Đỏ cho Thuê
                hoverOffset: 15,
                borderColor: isDark ? '#1e293b' : '#ffffff',
                borderWidth: 6
            }]
        },
        options: {
            cutout: '85%',
            plugins: { legend: { display: false } },
            animation: { duration: 1500, easing: 'easeOutExpo' }
        }
    });
}

// 5. Logic tìm kiếm tính năng (Live Search)
function initSearchLogic() {
    const systemFeatures = [
        { name: 'Tổng Quan', link: 'dashboard.html', icon: 'fa-chart-line' },
        { name: 'Hóa Đơn', link: 'hoa-don.html', icon: 'fa-file-invoice-dollar' },
        { name: 'Phòng', link: 'phong.html', icon: 'fa-door-open' },
        { name: 'Dịch Vụ', link: 'dich-vu.html', icon: 'fa-wifi' },
        { name: 'Điện Nước', link: 'dien-nuoc.html', icon: 'fa-bolt' },
        { name: 'Khách Hàng', link: 'khach-hang.html', icon: 'fa-user-group' },
        { name: 'Hợp Đồng', link: 'hop-dong.html', icon: 'fa-file-contract' },
        { name: 'Cài Đặt Chung', link: 'cai-dat.html', icon: 'fa-gear' }
    ];

    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) { searchResults.classList.add('hidden'); return; }

            const filtered = systemFeatures.filter(f => f.name.toLowerCase().includes(term));
            searchResults.classList.remove('hidden');

            if (filtered.length > 0) {
                searchResults.innerHTML = filtered.map(item => `
                    <a href="${item.link}" class="flex items-center gap-3 p-4 hover:bg-green-50 dark:hover:bg-zinc-800 transition-colors border-b border-gray-50 dark:border-zinc-900 last:border-0">
                        <i class="fa-solid ${item.icon} text-green-600 w-5 text-center"></i>
                        <span class="text-sm font-semibold text-gray-700 dark:text-zinc-200">${item.name}</span>
                    </a>
                `).join('');
            } else {
                searchResults.innerHTML = `<p class="p-4 text-xs text-gray-400 italic text-center">Không tìm thấy tính năng</p>`;
            }
        });
    }

    // Đóng kết quả khi bấm ra ngoài
    document.addEventListener('click', (e) => {
        if (searchResults && !e.target.closest('#global-search')) {
            searchResults.classList.add('hidden');
        }
    });
}