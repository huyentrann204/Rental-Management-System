require("dotenv").config();
const app = require('./app');
//  gọi poolPromise
const { poolPromise } = require('./config/db');

const PORT = 3000;


poolPromise.then(() => {
    console.log("--- Sẵn sàng nhận yêu cầu từ Client ---");
}).catch(err => {
    console.error("Lỗi khởi động DB:", err);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});