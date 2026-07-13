import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Tải danh sách dịch vụ khi vừa vào trang
    await fetchServices();

    // 2. Lắng nghe sự kiện bấm nút Lưu trên Modal
    const saveServiceBtn = document.getElementById('saveServiceBtn');
    if (saveServiceBtn) {
        saveServiceBtn.addEventListener('click', handleSaveService);
    }
});

// --- HÀM HIỂN THỊ DANH SÁCH DỊCH VỤ ---
async function fetchServices() {
    try {
        // Đổi thành /services/list để khớp với Route Backend
        const res = await apiRequest('/services/list'); 
        const body = document.getElementById('serviceDataBody');
        const placeholder = document.getElementById('noDataPlaceholder');
        
        // Lấy thông tin user để phân quyền
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = user.role === 'admin';

        // SỬA LỖI: Kiểm tra res.success và trích xuất res.data
        if (res.success && res.data && res.data.length > 0) {
            const services = res.data;
            if (placeholder) placeholder.classList.add('hidden');
            
            body.innerHTML = services.map(s => `
                <tr class="border-b border-gray-50 dark:border-zinc-800 transition hover:bg-gray-50 dark:hover:bg-zinc-900 text-sm">
                    <td class="py-4 font-black text-gray-800 dark:text-zinc-100">${s.service_name}</td>
                    <td class="py-4 text-[10px] font-bold uppercase text-gray-400">
                        ${s.service_type === 'metered' ? 'Số điện/nước' : 'Cố định'}
                    </td>
                    <td class="py-4 font-bold text-blue-500">${translateUnit(s.unit_type)}</td>
                    <td class="py-4 text-right font-black text-gray-700 dark:text-zinc-300">
                        ${parseFloat(s.price).toLocaleString()}đ
                    </td>
                    <td class="py-4 text-center font-medium text-gray-500">
                        ${s.cycle_days || 30} ngày
                    </td>
                    <td class="py-4 text-right">
                        ${isAdmin ? `
                            <button onclick="editService(${s.service_id})" class="text-gray-300 hover:text-blue-500 transition ml-4">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteService(${s.service_id})" class="text-gray-300 hover:text-red-500 transition ml-4">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : '<span class="text-xs italic text-gray-400">Chỉ xem</span>'}
                    </td>
                </tr>
            `).join('');
        } else {
            if (placeholder) placeholder.classList.remove('hidden');
            body.innerHTML = '';
        }
    } catch (err) {
        console.error("Lỗi tải dịch vụ:", err);
    }
}

// --- HÀM LƯU / CẬP NHẬT DỊCH VỤ ---
async function handleSaveService() {
    const saveBtn = document.getElementById('saveServiceBtn');
    const mode = saveBtn.dataset.mode || 'create';
    const serviceId = saveBtn.dataset.id;

    const data = {
        service_name: document.getElementById('svName').value.trim(),
        service_type: document.getElementById('svType').value,
        unit_type: document.getElementById('svUnitType').value,
        price: parseFloat(document.getElementById('svPrice').value),
        cycle_days: parseInt(document.getElementById('svCycle').value) || 30
    };

    if (!data.service_name || isNaN(data.price)) {
        return alert("Vui lòng nhập đầy đủ tên và giá dịch vụ!");
    }

    try {
        let result;
        if (mode === 'edit') {
            result = await apiRequest(`/services/${serviceId}`, 'PUT', data);
        } else {
            result = await apiRequest('/services', 'POST', data);
        }

        if (result.success) {
            alert(mode === 'edit' ? "Cập nhật thành công!" : "Thêm dịch vụ thành công!");
            closeModal('modalService');
            // Reset modal state
            saveBtn.dataset.mode = 'create';
            saveBtn.innerText = "Lưu dịch vụ";
            await fetchServices();
        }
    } catch (err) {
        alert("Lỗi: " + err.message);
    }
}

// --- HÀM XÓA DỊCH VỤ ---
window.deleteService = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa dịch vụ này không?")) return;
    try {
        const result = await apiRequest(`/services/${id}`, 'DELETE');
        if (result.success) {
            alert("Đã xóa xong!");
            await fetchServices();
        }
    } catch (err) {
        alert("Lỗi khi xóa: " + err.message);
    }
};

// --- HÀM SỬA ---
window.editService = async (id) => {
    try {
        const res = await apiRequest('/services/list');
        const s = res.data.find(item => item.service_id === id);
        
        if (s) {
            document.getElementById('svName').value = s.service_name;
            document.getElementById('svType').value = s.service_type;
            document.getElementById('svUnitType').value = s.unit_type;
            document.getElementById('svPrice').value = s.price;
            document.getElementById('svCycle').value = s.cycle_days;

            const saveBtn = document.getElementById('saveServiceBtn');
            saveBtn.innerText = "Cập nhật dịch vụ";
            saveBtn.dataset.mode = "edit";
            saveBtn.dataset.id = id;

            openModal('modalService');
        }
    } catch (err) {
        alert("Không thể lấy thông tin dịch vụ!");
    }
};

function translateUnit(unit) {
    const map = { 
        'kwh': 'kWh (Điện)', 
        'm3': 'Khối (Nước)', 
        'per_room': 'Theo Phòng', 
        'per_person': 'Theo Người' 
    };
    return map[unit] || unit;
}