const mysql = require("mysql2/promise");
require("dotenv").config();

const poolPromise = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

poolPromise.getConnection()
  .then(conn => { console.log("Conectado ao MySQL"); conn.release(); })
  .catch(err => console.error("Erro na conexão:", err));

module.exports = { poolPromise };