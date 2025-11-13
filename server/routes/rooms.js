const express = require("express");
const router = express.Router();
const db = require("../db");
const requireAuth = require("../middleware/auth");

router.get("/", (req, res) => {
  db.all("SELECT * FROM rooms ORDER BY id ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/:slug", (req, res) => {
  db.get("SELECT * FROM rooms WHERE slug = ?", [req.params.slug], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

router.put("/:slug", requireAuth, (req, res) => {
  const { title, description, image } = req.body || {};
  const slug = req.params.slug;
  db.run(
    `INSERT INTO rooms (slug, title, description, image) VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET title=excluded.title, description=excluded.description, image=excluded.image`,
    [slug, title || "", description || "", image || ""],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT * FROM rooms WHERE slug = ?", [slug], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json(row);
      });
    }
  );
});

module.exports = router;
