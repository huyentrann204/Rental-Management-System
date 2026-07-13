import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    window.loadInvoices(); // Gọi hàm load ban đầu
    loadActiveContracts(); // Tải danh sách hợp đồng cho Modal
});

// --- 1. TẢI DANH SÁCH HÓA ĐƠN LÊN BẢNG ---
window.loadInvoices = async () => {
    try {
        // Sử dụng apiRequest để tự động xử lý Token và Prefix /api
        const res = await apiRequest('/invoice/list');
        const tbody = document.getElementById('invoiceTableBody');

        if (res.success && res.data) {
            tbody.innerHTML = res.data.map(inv => `
                <tr class="hover:bg-gray-50 transition-all cursor-pointer" onclick="window.viewDetail(${inv.invoice_id})">
                    <td class="font-bold text-green-700">#${inv.room_code}</td>
                    <td>${inv.full_name}</td>
                    <td>Tháng ${inv.month}/${inv.year}</td>
                    <td class="text-red-600 font-bold">${Number(inv.total).toLocaleString()}đ</td>
                    <td>
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase 
                            ${inv.status_invoice === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${inv.status_invoice === 'paid' ? 'Đã thu tiền' : 'Chưa thanh toán'}
                        </span>
                    </td>
                    <td class="text-right">
                        ${inv.status_invoice === 'unpaid' ? 
                            `<button onclick="event.stopPropagation(); window.confirmPayment(${inv.invoice_id})" class="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-sm hover:bg-blue-700">
                                Thu tiền
                            </button>` : 
                            `<i class="fa-solid fa-circle-check text-green-500 text-lg"></i>`
                        }
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error("Lỗi tải hóa đơn:", err.message);
    }
}

// --- 2. TẢI DANH SÁCH HỢP ĐỒNG ĐANG HOẠT ĐỘNG ---
async function loadActiveContracts() {
    try {
        const res = await apiRequest('/contract/list');
        const select = document.getElementById('selectContract');
        
        if (res.success && res.data) {
            // Chỉ hiện các hợp đồng đang 'active'
            const activeOnly = res.data.filter(c => c.status === 'active' || c.status === 'pending');
            select.innerHTML = '<option value="">-- Chọn hợp đồng (Phòng) --</option>' + 
                activeOnly.map(c => `<option value="${c.contract_id}">Phòng ${c.room_code} - ${c.full_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Lỗi tải hợp đồng:", err);
    }
}

// --- 3. XỬ LÝ XUẤT HÓA ĐƠN MỚI ---
document.getElementById('generateInvoiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bodyData = Object.fromEntries(formData.entries());

    try {
        // Gửi yêu cầu generate hóa đơn
        const res = await apiRequest('/invoice/generate', 'POST', bodyData);

        if (res.success) {
            alert("Xuất hóa đơn thành công!");
            closeModal('modalGenerateInvoice');
            window.loadInvoices();
        } else {
            alert("Lỗi: " + res.error);
        }
    } catch (err) {
        alert("Lỗi hệ thống khi tạo hóa đơn!");
    }
});

// --- 4. XÁC NHẬN THANH TOÁN (Gắn vào window để HTML gọi được) ---
window.confirmPayment = async (id) => {
    if (!confirm("Xác nhận khách đã thanh toán hóa đơn này?")) return;
    
    try {
        const res = await apiRequest(`/invoice/pay/${id}`, 'PUT');
        if (res.success) {
            window.loadInvoices();
        }
    } catch (err) {
        alert("Lỗi khi cập nhật thanh toán!");
    }
}

// --- 5. XEM CHI TIẾT (Gắn vào window) ---
window.viewDetail = async (id) => {
    try {
        const res = await apiRequest(`/invoice/detail/${id}`);
        if (res.success) {
            // Logic hiển thị Modal chi tiết của mày ở đây
            console.log("Chi tiết hóa đơn:", res.data);
            // openModal('modalDetail'); ...
        }
    } catch (err) {
        console.error("Không thể lấy chi tiết hóa đơn");
    }
}