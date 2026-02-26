const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Conectado ao SQL Server");
    return pool;
  })
  .catch((err) => console.error("Erro na conexão:", err));

module.exports = { sql, poolPromise };