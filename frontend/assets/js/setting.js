// Cấu hình URL Backend
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/settings`;

/**
 * 1. Hàm tải dữ liệu khi vừa vào trang
 */
async function loadLandlordSettings() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("Không tìm thấy token đăng nhập.");
            return;
        }

        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data && !data.error) {
            const f = document.getElementById('profileForm');
            if (!f) return;
            
            // Đổ dữ liệu vào các ô Input
            f.full_name.value = data.full_name || '';
            f.phone.value = data.phone || '';
            f.cccd.value = data.cccd || '';
            f.owner_address.value = data.address || ''; 
            
            if (data.cccd_date) {
                f.cccd_date.value = data.cccd_date.split('T')[0];
            }

            // Hiển thị Avatar (Quan trọng: Nối với BASE_URL)
            if (data.avatar_url) {
                // Đảm bảo path có dấu / ở đầu
                const path = data.avatar_url.startsWith('/') ? data.avatar_url : `/${data.avatar_url}`;
                const fullUrl = `${BASE_URL}${path}`;
                
                // Cập nhật ảnh ở khu vực Profile
                const avatarPreview = document.getElementById('avatarPreview');
                if (avatarPreview) avatarPreview.src = fullUrl;
                
                // Cập nhật ảnh ở Header
                const imgHeader = document.getElementById('header-avatar-img');
                const iconHeader = document.getElementById('header-avatar-icon');
                if (imgHeader) {
                    imgHeader.src = fullUrl;
                    imgHeader.classList.remove('hidden');
                    if (iconHeader) iconHeader.classList.add('hidden');
                }

                // Cập nhật tên hiển thị
                const displayName = document.getElementById('display-name');
                if (displayName && data.full_name) displayName.innerText = data.full_name;
            }

            // Thiết lập Theme Sáng/Tối
            if (data.theme_mode === 'dark') {
                document.getElementById('darkModeToggle').checked = true;
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        }
    } catch (err) {
        console.error("Lỗi khi tải thông tin chủ trọ:", err);
    }
}

/**
 * 2. Hàm xử lý gửi Form (Nút Lưu)
 */
async function handleUpdateSettings(e) {
    e.preventDefault();
    
    const btn = document.getElementById('btnSave');
    const originalText = btn.innerText;
    btn.innerText = "Đang lưu...";
    btn.disabled = true;

    const formData = new FormData();
    const fileInput = document.getElementById('uploadAvatar');
    
    // Đính kèm ảnh nếu người dùng chọn file mới
    if (fileInput.files[0]) {
        formData.append('avatar', fileInput.files[0]);
    }

    const f = e.target;
    formData.append('full_name', f.full_name.value);
    formData.append('phone', f.phone.value);
    formData.append('address', f.owner_address.value); 
    formData.append('cccd', f.cccd.value);
    formData.append('cccd_date', f.cccd_date.value);
    formData.append('theme_mode', document.body.classList.contains('dark') ? 'dark' : 'light');

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
                // Không set Content-Type khi dùng FormData
            },
            body: formData
        });

        if (res.ok) {
            alert("Cập nhật thông tin chủ trọ thành công!");
            window.location.reload(); 
        } else {
            const errData = await res.json();
            alert("Lỗi: " + (errData.error || "Không thể lưu thông tin"));
        }
    } catch (err) {
        console.error("Lỗi kết nối server:", err);
        alert("Không thể kết nối tới máy chủ!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

/**
 * 3. Khởi chạy khi trang web sẵn sàng
 */
document.addEventListener('DOMContentLoaded', () => {
    // Tải dữ liệu cũ lên
    loadLandlordSettings();

    // Lắng nghe sự kiện Submit Form
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleUpdateSettings);
    }

    // Lắng nghe sự kiện chọn ảnh để xem trước (Preview)
    const fileInput = document.getElementById('uploadAvatar');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('avatarPreview');
                    if (preview) preview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});