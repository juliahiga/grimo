const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");

router.get("/me", async (req, res) => {
  if (!req.session.google_id) return res.json(null);
  try {
    const pool = await poolPromise;
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE google_id = ?",
      [req.session.google_id]
    );
    if (rows.length === 0) return res.json(null);
    const u = rows[0];
    res.json({
      id: u.id,
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
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE google_id = ?",
      [google_id]
    );

    if (rows.length === 0) {
      await pool.execute(
        "INSERT INTO users (google_id, name, email, picture) VALUES (?, ?, ?, ?)",
        [google_id, name, email, picture]
      );
    } else {
      await pool.execute(
        "UPDATE users SET email = ?, picture = ? WHERE google_id = ?",
        [email, picture, google_id]
      );
    }

    const [user] = await pool.execute(
      "SELECT * FROM users WHERE google_id = ?",
      [google_id]
    );
    const u = user[0];
    req.session.google_id = u.google_id;

    res.json({
      id: u.id,
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
    await pool.execute(
      "UPDATE users SET name = ? WHERE google_id = ?",
      [name, google_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/update-picture", async (req, res) => {
  const { google_id, custom_picture } = req.body;
  try {
    const pool = await poolPromise;
    await pool.execute(
      "UPDATE users SET custom_picture = ? WHERE google_id = ?",
      [custom_picture, google_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;