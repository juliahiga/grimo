const express = require("express");
const cors = require("cors");
require("dotenv").config();

const usersRouter = require("./routes/users");
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());
app.use("/api/users", usersRouter);

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});