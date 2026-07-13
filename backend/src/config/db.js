require('dotenv').config();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Tạo một pool kết nối duy nhất cho toàn bộ app
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log(" Đã kết nối SQL Server (Pool) thành công");
        return pool;
    })
    .catch(err => {
        console.error(" Kết nối thất bại:", err.message);
        process.exit(1); // Dừng app nếu không kết nối được DB
    });

module.exports = {
    sql,
    poolPromise
};