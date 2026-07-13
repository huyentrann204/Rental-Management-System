import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Tải dữ liệu ban đầu
    await loadInitialData();

    // 2. Nút "Lưu lại" của Modal Loại Phòng
    document.getElementById('saveTypeBtn')?.addEventListener('click', handleSaveRoomType);

    // 3. Nút "Tạo phòng/Cập nhật" của Modal Phòng Chi Tiết
    document.getElementById('saveRoomBtn')?.addEventListener('click', handleSaveRoom);
});

async function loadInitialData() {
    await Promise.all([fetchRoomTypes(), fetchRooms()]);
}

// --- QUẢN LÝ LOẠI PHÒNG ---
async function handleSaveRoomType() {
    const type_name = document.getElementById('typeName').value.trim();
    const price = document.getElementById('typePrice').value.trim();

    if (!type_name || !price) return alert("Nhập thiếu tên hoặc giá loại phòng!");

    try {
        const result = await apiRequest('/room-types', 'POST', { 
            type_name, 
            price: parseFloat(price) 
        });

        if (result.success) {
            alert("Đã lưu loại phòng thành công!");
            document.getElementById('typeName').value = '';
            document.getElementById('typePrice').value = '';
            closeModal('modalRoomType');
            await fetchRoomTypes();
        }
    } catch (err) { alert("Lỗi Backend: " + err.message); }
}

async function fetchRoomTypes() {
    try {
        const types = await apiRequest('/room-types');
        const select = document.getElementById('selectType');
        if (types && select) {
            select.innerHTML = '<option value="">-- Danh sách loại phòng --</option>' + 
                types.map(t => `<option value="${t.room_type_id}">${t.type_name} - ${parseFloat(t.price).toLocaleString()}đ</option>`).join('');
        }
    } catch (err) { console.error("Lỗi tải loại phòng:", err); }
}

// --- QUẢN LÝ PHÒNG (TẠO & SỬA) ---
async function handleSaveRoom() {
    const saveBtn = document.getElementById('saveRoomBtn');
    const mode = saveBtn.dataset.mode || 'create';
    const roomId = saveBtn.dataset.id;

    const room_code = document.getElementById('roomNum').value.trim();
    const room_type_id = document.getElementById('selectType').value;
    const status = document.getElementById('roomStatus')?.value || 'available';

    if (!room_code || !room_type_id) return alert("Vui lòng nhập số phòng và chọn loại phòng!");

    try {
        let result;
        if (mode === 'edit') {
            // Gửi lệnh PUT để cập nhật
            result = await apiRequest(`/rooms/${roomId}`, 'PUT', { room_code, room_type_id, status });
        } else {
            // Gửi lệnh POST để tạo mới
            result = await apiRequest('/rooms', 'POST', { room_code, room_type_id, status });
        }

        if (result.success) {
            alert(mode === 'edit' ? "Cập nhật thành công!" : "Tạo phòng thành công!");
            resetRoomModal(); 
            closeModal('modalRoom');
            await fetchRooms();
        }
    } catch (err) { alert("Lỗi: " + err.message); }
}

async function fetchRooms() {
    try {
        const rooms = await apiRequest('/rooms');
        const body = document.getElementById('roomDataBody');
        const placeholder = document.getElementById('noDataPlaceholder');

        if (rooms && rooms.length > 0) {
            if (placeholder) placeholder.classList.add('hidden');
            body.innerHTML = rooms.map(r => `
                <tr class="border-b border-gray-50 dark:border-zinc-800 transition hover:bg-gray-50 dark:hover:bg-zinc-900 text-sm">
                    <td class="py-4 font-black text-lg text-gray-800 dark:text-zinc-100">${r.room_code}</td>
                    <td class="py-4 font-bold text-gray-400 uppercase text-[10px]">${r.type_name || 'N/A'}</td>
                    <td class="py-4 text-center">
                        <span class="px-3 py-1 rounded-full text-[9px] font-bold uppercase bg-green-100 text-green-600">
                            Đang hoạt động
                        </span>
                    </td>
                    <td class="py-4 text-center">
                        <span class="px-3 py-1 rounded-full text-[9px] font-bold uppercase ${getStatusClass(r.status)}">
                            ${translateStatus(r.status)}
                        </span>
                    </td>
                    <td class="py-4 text-right font-black text-blue-500">
                        ${r.price ? parseFloat(r.price).toLocaleString() : '0'}đ
                    </td>
                    <td class="py-4 text-right">
                        <button onclick="editRoom(${r.room_id})" class="text-gray-300 hover:text-blue-500 transition ml-4">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteRoom(${r.room_id})" class="text-gray-300 hover:text-red-500 transition ml-4">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

// --- HÀNH ĐỘNG (SỬA & XÓA) ---
window.editRoom = async (id) => {
    try {
        const room = await apiRequest(`/rooms/${id}`);
        
        // Đổ dữ liệu vào Modal
        document.getElementById('roomNum').value = room.room_code;
        document.getElementById('selectType').value = room.room_type_id;
        document.getElementById('roomStatus').value = room.status;
        
        // Chuyển Modal sang chế độ cập nhật
        const saveBtn = document.getElementById('saveRoomBtn');
        const modalTitle = document.querySelector('#modalRoom h3');
        
        modalTitle.innerText = "Cập nhật thông tin phòng";
        saveBtn.innerText = "Cập nhật";
        saveBtn.dataset.mode = "edit";
        saveBtn.dataset.id = id;

        openModal('modalRoom');
    } catch (err) { alert("Lỗi khi lấy dữ liệu phòng!"); }
};

window.deleteRoom = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa phòng này không??")) return;
    try {
        const result = await apiRequest(`/rooms/${id}`, 'DELETE');
        if (result.success) {
            alert("Xóa xong!");
            await fetchRooms();
        }
    } catch (err) { alert("Lỗi xóa: " + err.message); }
};

// Hàm Reset để dùng khi bấm nút "Tạo phòng mới" ở Header
window.resetRoomModal = () => {
    const saveBtn = document.getElementById('saveRoomBtn');
    const modalTitle = document.querySelector('#modalRoom h3');
    
    document.getElementById('roomNum').value = '';
    document.getElementById('selectType').value = '';
    document.getElementById('roomStatus').value = 'available';
    
    modalTitle.innerText = "Tạo phòng chi tiết";
    saveBtn.innerText = "Tạo phòng";
    saveBtn.dataset.mode = "create";
    delete saveBtn.dataset.id;
};

// --- HỖ TRỢ HIỂN THỊ ---
function getStatusClass(status) {
    const map = { 'available': 'bg-green-100 text-green-600', 'occupied': 'bg-red-100 text-red-600', 'maintenance': 'bg-orange-100 text-orange-600', 'reserved': 'bg-blue-100 text-blue-600' };
    return map[status] || 'bg-gray-100 text-gray-600';
}

function translateStatus(status) {
    const map = { 'available': 'Phòng trống', 'occupied': 'Đã thuê', 'maintenance': 'Bảo trì', 'active': 'Sẵn sàng', 'reserved': 'giữ phòng'};
    return map[status] || status;
}