const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");
const requireAuth = require("../middleware/auth");

const I18N_DIR = path.join(__dirname, "..", "..", "assets", "i18n");

const MAIN_KEYS = [
  "hero.greeting","hero.name","hero.age",
  "hotel.welcome.title","hotel.welcome.p1","hotel.discover",
  "comfort.title","comfort.p","explore.rooms",
  "taste.title","taste.p","view.amenities",
  "apartments.title",
  "hero.image1","hero.image2","hero.image3","hero.image4","hero.image5",
  "welcome.image","comfort.image","taste.image"
];

function getLang(req) {
  const lang = (req.params.lang || "").toLowerCase();
  return ["en","ru","tr","de"].includes(lang) ? lang : "en";
}

// 🔹 Получение переводов для главной страницы
router.get("/main/:lang", (req, res) => {
  const lang = getLang(req);
  const placeholders = MAIN_KEYS.map(_ => "?").join(",");
  db.all(
    `SELECT key, value, type FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...MAIN_KEYS],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const out = {};
      rows.forEach(r => { out[r.key] = r.value; });
      res.json(out);
    }
  );
});

// 🔹 Сохранение переводов (c фильтрацией пустых)
router.patch("/main/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const body = req.body || {};
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);

  db.serialize(() => {
    for (const k of Object.keys(body)) {
      if (!MAIN_KEYS.includes(k)) continue;
      const val = String(body[k] ?? "");
      // Пропускаем пустые или пробельные значения
      if (!val || val.trim() === "") continue;
      stmt.run([k, lang, val, k, lang]);
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    });
  });
});

// 🔹 Экспорт переводов (GET) — безопасный
router.get("/export/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const jsonPath = path.join(I18N_DIR, `${lang}.json`);
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(jsonPath, "utf-8")); } catch(e) {}

  db.all(`SELECT key, value FROM translations WHERE lang=?`, [lang], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(r => {
      if (r.value && r.value.trim() !== "") {
        existing[r.key] = r.value;
      }
    });
    fs.mkdirSync(I18N_DIR, { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), "utf-8");
    res.json({ ok: true, path: `/assets/i18n/${lang}.json`, keys: rows.length });
  });
});

// 🔹 Экспорт переводов (POST) — безопасный, принимает отфильтрованные данные
router.post("/export/:lang", requireAuth, (req, res) => {
  try {
    const lang = getLang(req);
    const data = req.body || {};
    const safe = {};

    // фильтруем пустые поля перед записью
    Object.entries(data).forEach(([k, v]) => {
      if (v && String(v).trim() !== "") safe[k] = v;
    });

    fs.mkdirSync(I18N_DIR, { recursive: true });
    const jsonPath = path.join(I18N_DIR, `${lang}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(safe, null, 2), "utf-8");

    res.json({ ok: true, path: `/assets/i18n/${lang}.json` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

module.exports = router;
