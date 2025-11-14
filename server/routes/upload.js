const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Cloudinary config (берётся из ENV Render)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Принимаем файл в RAM (Render не хранит диск → всё равно стирается)
const storage = multer.memoryStorage();

// Ограничения файла
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Разрешённые "slots"
const ALLOWED_SLOTS = new Set([
  "hero", "welcome", "comfort", "taste", "apartments",
  "gallery", "rooms", "rest", "about", "contact",
  "roomslist", "roomdetail", "misc"
]);

function sanitizeSlot(raw) {
  const s = String(raw || "misc").replace(/[^a-z0-9_-]/gi, "").toLowerCase();
  return ALLOWED_SLOTS.has(s) ? s : "misc";
}

// ========================= UPLOAD =========================
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }

    const slot = sanitizeSlot(req.query.slot);
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Загружаем в Cloudinary → в папку сайта
    const result = await cloudinary.uploader.upload(base64, {
      folder: `arp-hotel/${slot}`,
      resource_type: "image",
      transformation: [
        { quality: "auto", fetch_format: "auto" } // Оптимизация
      ]
    });

    res.json({
      ok: true,
      url: result.secure_url  // ← CDN URL
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ ok: false, error: "Upload failed" });
  }
});

// ========================= DELETE =========================
router.delete("/", requireAuth, express.json(), async (req, res) => {
  try {
    const url = req.query.url || req.body.url;

    if (!url) {
      return res.status(400).json({ ok: false, error: "Missing URL" });
    }

    // Извлекаем public_id из Cloudinary URL
    // Пример:
    // https://res.cloudinary.com/.../arp-hotel/gallery/filename_xxx.jpg
    const parts = url.split("/");
    const filename = parts.pop().split(".")[0]; // без расширения
    const folder = parts.slice(parts.indexOf("arp-hotel")).join("/");

    const publicId = `${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);

    return res.json({ ok: true, deleted: url });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
