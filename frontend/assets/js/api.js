// Địa chỉ "tổng đài" Backend. 
// Lưu ý: Kiểm tra số 3000 có khớp với PORT trong server.js của ông không.
const BASE_URL = "http://localhost:3000/api"; 

/**
 * Hàm dùng chung để gọi API từ Frontend sang Backend
 * @param {string} path - Đường dẫn (ví dụ: '/auth/login', '/rooms')
 * @param {string} method - Phương thức (GET, POST, PUT, DELETE)
 * @param {object} body - Dữ liệu gửi đi (nếu có)
 */
export async function apiRequest(path, method = "GET", body = null) {
    // 1. Lấy "vé thông hành" (Token) từ ví (localStorage)
    const token = localStorage.getItem('token');

    // 2. Cấu hình yêu cầu
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    // 3. Nếu đã đăng nhập và có token, tự động gắn vào Header để Backend xác thực
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    // 4. Nếu có gửi dữ liệu (POST/PUT), chuyển nó sang dạng chuỗi JSON
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        // 5. Bắt đầu gửi yêu cầu đi
        const response = await fetch(`${BASE_URL}${path}`, options);
        
        // 6. Chuyển kết quả trả về thành Object JavaScript
        const result = await response.json();

        // 7. Nếu lỗi (400, 401, 500...), quăng lỗi ra để phía HTML xử lý
        if (!response.ok) {
            throw new Error(result.message || "Đã xảy ra lỗi hệ thống!");
        }

        return result;
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
        throw error;
    }
}