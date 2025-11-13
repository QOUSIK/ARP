const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// 📂 Каталог, куда будут сохраняться изображения
const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");

// Разрешённые слоты для загрузок (категории)
const ALLOWED_SLOTS = new Set([
  "hero","welcome","comfort","taste","apartments",
  "gallery","rooms","rest","about","contact",
  "roomslist","roomdetail","misc"
]);

function sanitizeSlot(raw) {
  const s = String(raw || "misc").replace(/[^a-z0-9_-]/gi, "").toLowerCase();
  return ALLOWED_SLOTS.has(s) ? s : "misc";
}

// Ограничения по типам и размеру
const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif"
};

function fileFilter(req, file, cb) {
  if (!EXT_BY_MIME[file.mimetype]) return cb(new Error("Only images are allowed"));
  cb(null, true);
}

// 💾 Настройка хранилища Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const slot = sanitizeSlot(req.query.slot);
    const dir = path.join(UPLOAD_DIR, slot);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const mappedExt = EXT_BY_MIME[file.mimetype];
    const fallbackExt = path.extname(file.originalname || "").toLowerCase();
    const ext = mappedExt || fallbackExt;
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter
});

// 🔒 Авторизация обязательна
router.post("/", requireAuth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "No file" });
    const slot = sanitizeSlot(req.query.slot);
    const relPath = `/uploads/${slot}/${req.file.filename}`;
    res.json({ ok: true, url: relPath });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 🗑️ Удаление загруженного файла по URL (/uploads/slot/filename)
router.delete("/", requireAuth, express.json(), (req, res) => {
  try {
    const url = (req.query.url || (req.body && req.body.url) || "").toString();
    if (!url || !url.startsWith("/uploads/")) {
      return res.status(400).json({ ok: false, error: "Invalid url" });
    }
    // Нормализуем и ограничиваем корнем загрузок
    const abs = path.join(UPLOAD_DIR, url.replace("/uploads/", ""));
    if (!abs.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ ok: false, error: "Path out of uploads" });
    }
    try {
      fs.unlinkSync(abs);
      return res.json({ ok: true, deleted: url });
    } catch (e) {
      if (e.code === 'ENOENT') return res.status(404).json({ ok: false, error: 'Not found' });
      throw e;
    }
  } catch (err) {
    console.error("Delete upload error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
  
