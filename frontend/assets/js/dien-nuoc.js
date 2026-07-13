import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo kỳ hóa đơn mặc định là tháng hiện tại (Ví dụ: 2026-02)
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filterPeriod = document.getElementById('filterPeriod');
    if (filterPeriod) filterPeriod.value = currentPeriod;

    // 2. Tải dữ liệu ban đầu
    await window.fetchReadings();
    await loadOccupiedRooms();

    // 3. Đăng ký các sự kiện lắng nghe (Event Listeners)
    if (filterPeriod) filterPeriod.addEventListener('change', window.fetchReadings);
    
    const searchInput = document.getElementById('searchReading');
    if (searchInput) searchInput.addEventListener('input', window.fetchReadings);

    const selectRoom = document.getElementById('selectRoom');
    if (selectRoom) selectRoom.addEventListener('change', handleRoomSelection);

    const saveBtn = document.getElementById('saveUtilityBtn');
    if (saveBtn) saveBtn.addEventListener('click', handleSaveUtility);
});

// --- 1. TẢI DANH SÁCH PHÒNG ĐANG THUÊ ---
// Lưu ý: Nếu không hiện phòng, mày cần kiểm tra xem phòng đó đã có hợp đồng 'active' chưa
async function loadOccupiedRooms() {
    try {
        const res = await apiRequest('/rooms/occupied');
        const select = document.getElementById('selectRoom');
        
        if (res.success && select) {
            const rooms = res.data || [];
            if (rooms.length === 0) {
                select.innerHTML = '<option value="">(Không có phòng nào đang thuê)</option>';
            } else {
                select.innerHTML = '<option value="">-- Chọn phòng để ghi số --</option>' + 
                    rooms.map(r => `<option value="${r.room_id}">${r.room_code}</option>`).join('');
            }
        }
    } catch (err) {
        console.error("Lỗi tải danh sách phòng:", err);
    }
}

// --- 2. TỰ ĐIỀN CHỈ SỐ CŨ KHI CHỌN PHÒNG ---
async function handleRoomSelection(e) {
    const roomId = e.target.value;
    const elecOld = document.getElementById('elecOld');
    const waterOld = document.getElementById('waterOld');

    if (!roomId) {
        elecOld.value = ""; waterOld.value = "";
        return;
    }

    try {
        const res = await apiRequest(`/utility/last/${roomId}`);
        // res.data trả về: { electric_old, water_old, is_first_time }
        if (res.success && res.data) {
            const data = res.data;
            
            // Sửa lỗi: Lấy đúng tên biến electric_old/water_old từ Backend
            elecOld.value = data.electric_old || 0; 
            waterOld.value = data.water_old || 0;

            // Nếu là lần đầu (is_first_time = true), cho phép sửa số cũ. Ngược lại thì khóa.
            const isFirst = data.is_first_time;
            elecOld.readOnly = !isFirst;
            waterOld.readOnly = !isFirst;
            
            if (!isFirst) {
                elecOld.classList.add('bg-gray-100', 'text-gray-400');
                waterOld.classList.add('bg-gray-100', 'text-gray-400');
            } else {
                elecOld.classList.remove('bg-gray-100', 'text-gray-400');
                waterOld.classList.remove('bg-gray-100', 'text-gray-400');
            }
        }
    } catch (err) {
        console.error("Lỗi lấy chỉ số cũ:", err);
    }
}

// --- 3. HIỂN THỊ DANH SÁCH BẢNG CHỈ SỐ ---
window.fetchReadings = async () => {
    const periodInput = document.getElementById('filterPeriod');
    const body = document.getElementById('utilityDataBody');
    
    if (!periodInput?.value || !body) return;

    const [year, month] = periodInput.value.split('-');
    const m = parseInt(month);
    const y = parseInt(year);
    const search = document.getElementById('searchReading')?.value.toLowerCase() || "";

    try {
        body.innerHTML = '<tr><td colspan="8" class="py-10 text-center text-gray-400 italic">Đang tải dữ liệu...</td></tr>';

        const res = await apiRequest(`/utility/list?month=${m}&year=${y}`);
        const readings = (res && res.success && Array.isArray(res.data)) ? res.data : [];

        if (readings.length > 0) {
            const filtered = readings.filter(r => r.room_code.toLowerCase().includes(search));
            
            if (filtered.length === 0) {
                body.innerHTML = '<tr><td colspan="8" class="py-10 text-center text-gray-400 italic">Không tìm thấy phòng phù hợp.</td></tr>';
                return;
            }

            body.innerHTML = filtered.map(r => `
                <tr class="border-b border-gray-50 hover:bg-gray-50 transition text-xs">
                    <td class="py-4 font-black text-sm text-gray-800">${r.room_code}</td>
                    <td class="py-4 text-gray-400 font-bold uppercase">Kỳ ${r.month}/${r.year}</td>
                    <td class="py-4 text-center bg-yellow-50/20 font-medium">${r.electric_old}</td>
                    <td class="py-4 text-center bg-yellow-50/40 font-black text-yellow-700">${r.electric_new}</td>
                    <td class="py-4 text-center bg-blue-50/20 font-medium">${r.water_old}</td>
                    <td class="py-4 text-center bg-blue-50/40 font-black text-blue-700">${r.water_new}</td>
                    <td class="py-4 text-right font-bold text-gray-600">
                        ⚡${r.electric_new - r.electric_old} | 💧${r.water_new - r.water_old}
                    </td>
                    <td class="py-4 text-right">
                        <button onclick='window.editReading(${JSON.stringify(r)})' class="text-gray-300 hover:text-blue-500 ml-3 transition">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.deleteReading(${r.reading_id})" class="text-gray-300 hover:text-red-500 ml-3 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`).join('');
        } else {
            body.innerHTML = `
                <tr>
                    <td colspan="8" class="py-20 text-center">
                        <div class="flex flex-col items-center justify-center text-gray-400">
                            <i class="fa-solid fa-folder-open text-4xl mb-3 opacity-20"></i>
                            <p class="italic font-medium">Chưa có dữ liệu chốt số tháng ${m}/${y}</p>
                            <p class="text-[10px]">Chọn phòng phía trên để bắt đầu ghi số.</p>
                        </div>
                    </td>
                </tr>`;
        }
    } catch (err) { 
        console.error("Lỗi:", err);
        body.innerHTML = `<tr><td colspan="8" class="py-10 text-center text-red-400 font-bold">Lỗi kết nối API!</td></tr>`;
    }
};

// --- 4. LƯU HOẶC CẬP NHẬT CHỈ SỐ ---
async function handleSaveUtility() {
    const saveBtn = document.getElementById('saveUtilityBtn');
    const mode = saveBtn.dataset.mode || 'create';
    const id = saveBtn.dataset.id;
    const period = document.getElementById('filterPeriod').value;
    const [year, month] = period.split('-');

    const data = {
        room_id: document.getElementById('selectRoom').value,
        month: parseInt(month),
        year: parseInt(year),
        electric_old: parseInt(document.getElementById('elecOld').value) || 0,
        electric_new: parseInt(document.getElementById('elecNew').value) || 0,
        water_old: parseInt(document.getElementById('waterOld').value) || 0,
        water_new: parseInt(document.getElementById('waterNew').value) || 0
    };

    if (!data.room_id) return alert("Vui lòng chọn phòng!");
    if (data.electric_new < data.electric_old || data.water_new < data.water_old) {
        return alert("Số mới không được nhỏ hơn số cũ!");
    }

    try {
        const endpoint = mode === 'edit' ? `/utility/${id}` : '/utility/create';
        const method = mode === 'edit' ? 'PUT' : 'POST';
        const res = await apiRequest(endpoint, method, data);

        if (res.success) {
            alert(mode === 'edit' ? "Cập nhật thành công!" : "Đã chốt số thành công!");
            if (typeof closeModal === 'function') closeModal('modalUtility');
            window.resetUtilityForm();
            await window.fetchReadings();
        }
    } catch (err) { alert(err.message); }
}

// --- 5. HÀNH ĐỘNG SỬA/XÓA ---
window.deleteReading = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
    try {
        const res = await apiRequest(`/utility/${id}`, 'DELETE');
        if (res.success) await window.fetchReadings();
    } catch (err) { alert(err.message); }
};

window.editReading = (data) => {
    const selectRoom = document.getElementById('selectRoom');
    const saveBtn = document.getElementById('saveUtilityBtn');
    
    if (typeof openModal === 'function') openModal('modalUtility');

    selectRoom.value = data.room_id;
    selectRoom.disabled = true; // Khóa phòng khi đang sửa

    document.getElementById('elecOld').value = data.electric_old;
    document.getElementById('elecNew').value = data.electric_new;
    document.getElementById('waterOld').value = data.water_old;
    document.getElementById('waterNew').value = data.water_new;

    // Cho phép sửa cả số cũ khi ở chế độ Edit
    document.getElementById('elecOld').readOnly = false;
    document.getElementById('waterOld').readOnly = false;
    document.getElementById('elecOld').classList.remove('bg-gray-100', 'text-gray-400');
    document.getElementById('waterOld').classList.remove('bg-gray-100', 'text-gray-400');

    saveBtn.innerText = "Cập nhật chỉ số";
    saveBtn.dataset.mode = "edit";
    saveBtn.dataset.id = data.reading_id;
};

// --- HELPER: RESET FORM ---
window.resetUtilityForm = () => {
    const selectRoom = document.getElementById('selectRoom');
    const saveBtn = document.getElementById('saveUtilityBtn');
    if (selectRoom) {
        selectRoom.disabled = false;
        selectRoom.value = "";
    }
    document.getElementById('elecOld').value = "";
    document.getElementById('elecNew').value = "";
    document.getElementById('waterOld').value = "";
    document.getElementById('waterNew').value = "";
    
    // Reset readonly mặc định
    document.getElementById('elecOld').readOnly = true;
    document.getElementById('waterOld').readOnly = true;
    document.getElementById('elecOld').classList.add('bg-gray-100', 'text-gray-400');
    document.getElementById('waterOld').classList.add('bg-gray-100', 'text-gray-400');

    saveBtn.innerText = "Lưu chỉ số";
    saveBtn.dataset.mode = "create";
    if (saveBtn.dataset.id) delete saveBtn.dataset.id;
};