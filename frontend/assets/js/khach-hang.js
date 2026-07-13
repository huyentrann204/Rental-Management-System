// URL API của bạn (thay đổi theo cổng thực tế của server, ví dụ http://localhost:5000)
const API_URL = '/api/tenants'; 

// Hàm lấy Token để xác thực chủ trọ
const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// 1. Hàm tải danh sách khách hàng từ Backend
async function fetchTenants() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Không thể tải dữ liệu khách hàng');

        const tenants = await response.json();
        renderTenants(tenants);
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Phiên đăng nhập hết hạn hoặc lỗi kết nối!');
    }
}

// 2. Hàm đổ dữ liệu vào bảng HTML
function renderTenants(tenants) {
    const body = document.getElementById('tenantDataBody');
    body.innerHTML = ''; // Xóa trắng trước khi render

    tenants.forEach(t => {
        // Lưu ý: Cột mã hợp đồng cần backend trả về hoặc xử lý join sau này
        // Hiện tại ta hiển thị dựa trên dữ liệu từ bảng TENANT
        const row = document.createElement('tr');
        row.className = "border-b border-gray-50 hover:bg-gray-50/50 transition-colors";
        row.innerHTML = `
            <td class="py-4 font-bold text-gray-700 uppercase">${t.full_name}</td>
            <td class="py-4 text-gray-600">${t.gender || '---'}</td>
            <td class="py-4 text-gray-600">${t.phone || '---'}</td>
            <td class="py-4 text-gray-600">${t.address || '---'}</td>
            <td class="py-4 font-bold ${t.contract_code ? 'text-blue-600 italic underline' : 'text-gray-400 font-medium'}">
                ${t.contract_code || 'Chưa có'}
            </td>
            <td class="py-4 text-right">
                <button onclick="editTenant(${t.tenant_id})" class="p-2 text-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="deleteTenant(${t.tenant_id})" class="p-2 text-gray-300 hover:bg-gray-50 rounded-lg transition-colors ml-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}

// 3. Xử lý gửi Form thêm mới
document.getElementById('tenantForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tenantData = {
        full_name: document.getElementById('fullName').value,
        gender: document.getElementById('gender').value,
        phone: document.getElementById('phone').value,
        cccd: document.getElementById('cccd').value,
        address: document.getElementById('address').value,
        email: document.getElementById('email').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(tenantData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            closeModal('modalTenant');
            document.getElementById('tenantForm').reset();
            fetchTenants(); // Tải lại danh sách sau khi thêm
        } else {
            alert('Lỗi: ' + result.error);
        }
    } catch (error) {
        console.error('Lỗi khi lưu:', error);
        alert('Không thể kết nối với máy chủ!');
    }
});

// Load dữ liệu khi vào trang
window.onload = fetchTenants;