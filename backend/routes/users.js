const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

router.get("/me", async (req, res) => {
  if (!req.session.google_id) return res.json(null);
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("google_id", sql.VarChar, req.session.google_id)
      .query("SELECT * FROM users WHERE google_id = @google_id");
    if (result.recordset.length === 0) return res.json(null);
    const u = result.recordset[0];
    res.json({
      google_id: u.google_id,
      name: u.name,
      email: u.email,
      picture: u.custom_picture || u.picture,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    } else {
      await pool.request()
        .input("google_id", sql.VarChar, google_id)
        .input("email", sql.VarChar, email)
        .input("picture", sql.VarChar, picture)
        .query(`UPDATE users SET email = @email, picture = @picture
                WHERE google_id = @google_id`);
    }

    const user = await pool.request()
      .input("google_id", sql.VarChar, google_id)
      .query("SELECT * FROM users WHERE google_id = @google_id");
    const u = user.recordset[0];

    req.session.google_id = u.google_id; // salva na sessão direto

    res.json({
      google_id: u.google_id,
      name: u.name,
      email: u.email,
      picture: u.custom_picture || u.picture,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
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

router.put("/update-picture", async (req, res) => {
  const { google_id, custom_picture } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("google_id", sql.VarChar, google_id)
      .input("custom_picture", sql.VarChar(sql.MAX), custom_picture)
      .query("UPDATE users SET custom_picture = @custom_picture WHERE google_id = @google_id");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;