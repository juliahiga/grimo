const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

router.post("/login", async (req, res) => {
  const { google_id, name, email, picture } = req.body;
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("google_id", sql.VarChar, google_id)
      .query("SELECT * FROM users WHERE google_id = @google_id");

    if (result.recordset.length === 0) {
      await pool.request()
        .input("google_id", sql.VarChar, google_id)
        .input("name", sql.NVarChar, name)
        .input("email", sql.VarChar, email)
        .input("picture", sql.VarChar, picture)
        .query(`INSERT INTO users (google_id, name, email, picture) 
                VALUES (@google_id, @name, @email, @picture)`);

      const newUser = await pool.request()
        .input("google_id", sql.VarChar, google_id)
        .query("SELECT * FROM users WHERE google_id = @google_id");

      return res.json(newUser.recordset[0]);
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/update-name", async (req, res) => {
  const { google_id, name } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("google_id", sql.VarChar, google_id)
      .input("name", sql.NVarChar, name)
      .query("UPDATE users SET name = @name WHERE google_id = @google_id");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;