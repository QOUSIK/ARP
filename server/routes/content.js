const express = require("express");
const router = express.Router();
const db = require("../db");
const requireAuth = require("../middleware/auth");

router.get("/:key", (req, res) => {
  db.get("SELECT key, value FROM content WHERE key = ?", [req.params.key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({ key: req.params.key, value: null });
    res.json(row);
  });
});

router.put("/:key", requireAuth, (req, res) => {
  const { value } = req.body || {};
  db.run(
    `INSERT INTO content (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [req.params.key, value || ""],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT key, value FROM content WHERE key = ?", [req.params.key], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json(row);
      });
    }
  );
});

module.exports = router;
