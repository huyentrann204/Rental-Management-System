import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    loadContracts();
    loadSelectData();
});

// 1. Load danh sách hợp đồng
async function loadContracts() {
    try {
        const response = await apiRequest('/contract/list', 'GET');
        const tbody = document.getElementById('contractTableBody');
        
        if (!response.success) return;

        tbody.innerHTML = response.data.map(c => `
            <tr onclick="showContractDetail(${c.contract_id})" class="border-b border-gray-50 dark:border-zinc-800 hover:bg-green-50/50 dark:hover:bg-zinc-800/50 cursor-pointer transition-all">
                <td class="py-4 font-bold text-green-600">#${c.room_code}</td>
                <td class="py-4">${c.full_name}</td>
                <td class="py-4 text-center">${new Date(c.start_date).toLocaleDateString('vi-VN')}</td>
                <td class="py-4 text-center">${new Date(c.end_date).toLocaleDateString('vi-VN')}</td>
                <td class="py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Đang hoạt động
                    </span>
                </td>
                <td class="py-4 text-right">
                    <button onclick="event.stopPropagation(); deleteContract(${c.contract_id})" class="text-red-400 hover:text-red-600 p-2 transition">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Lỗi tải hợp đồng:", err);
    }
}

// 2. Load dữ liệu cho các ô Select trong Modal
async function loadSelectData() {
    try {
        const roomsRes = await apiRequest('/contract/available-rooms', 'GET');
        const tenantsRes = await apiRequest('/contract/tenants', 'GET');

        if (roomsRes.success) {
            document.getElementById('roomSelect').innerHTML = '<option value="">-- Chọn phòng trống --</option>' + 
                roomsRes.data.map(r => `<option value="${r.room_id}">${r.room_code}</option>`).join('');
        }

        if (tenantsRes.success) {
            document.getElementById('tenantSelect').innerHTML = '<option value="">-- Chọn khách thuê --</option>' + 
                tenantsRes.data.map(t => `<option value="${t.tenant_id}">${t.full_name} (${t.cccd})</option>`).join('');
        }
    } catch (err) {
        console.error("Lỗi tải dữ liệu select:", err);
    }
}

// 3. Xử lý Tạo hợp đồng mới (Luồng rút gọn)
document.getElementById('addContractForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const body = {
        room_id: formData.get('room_id'),
        tenant_id: formData.get('tenant_id'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'), // Thêm ngày kết thúc
        deposit_amount: formData.get('deposit_amount'),
        price_room: formData.get('price_room') // Lấy giá phòng
    };

    try {
        const result = await apiRequest('/contract/create', 'POST', body);
        if (result.success) {
            alert("Tạo hợp đồng thành công! Phòng đã được chuyển sang trạng thái Đã thuê.");
            closeModal('modalContract');
            loadContracts();
        } else {
            alert("Lỗi: " + result.error);
        }
    } catch (err) {
        alert("Có lỗi xảy ra khi kết nối server.");
    }
});

// 4. Xem chi tiết khi bấm vào dòng
window.showContractDetail = async (id) => {
    try {
        const res = await apiRequest(`/contract/detail/${id}`, 'GET');
        if (res.success) {
            const c = res.data;
            document.getElementById('detailContent').innerHTML = `
                <div class="space-y-3">
                    <div class="flex justify-between border-b pb-2"><span>Mã phòng:</span><span class="font-black text-green-600">${c.room_code}</span></div>
                    <div class="flex justify-between border-b pb-2"><span>Khách thuê:</span><span class="font-bold">${c.full_name}</span></div>
                    <div class="flex justify-between border-b pb-2"><span>Số điện thoại:</span><span>${c.phone || 'Chưa có'}</span></div>
                    <div class="flex justify-between border-b pb-2"><span>CCCD:</span><span>${c.cccd}</span></div>
                    <div class="flex justify-between border-b pb-2"><span>Giá thuê:</span><span class="font-bold text-blue-600">${Number(c.price_room).toLocaleString()}đ</span></div>
                    <div class="flex justify-between"><span>Tiền cọc:</span><span class="font-bold text-orange-600">${Number(c.deposit_amount).toLocaleString()}đ</span></div>
                </div>
            `;
            openModal('modalDetail');
        }
    } catch (err) {
        console.error("Lỗi lấy chi tiết:", err);
    }
};

// 5. Kết thúc hợp đồng (Xóa)
window.deleteContract = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn kết thúc hợp đồng này? Phòng sẽ được giải phóng về trạng thái trống.")) return;
    try {
        const res = await apiRequest(`/contract/${id}`, 'DELETE');
        if (res.success) {
            loadContracts();
        }
    } catch (err) {
        alert("Lỗi khi xóa hợp đồng.");
    }
};

// Helper Modals
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => {
    document.getElementById(id).classList.add('hidden');
    if (id === 'modalContract') document.getElementById('addContractForm').reset();
};