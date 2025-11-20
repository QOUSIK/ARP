const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const requireAuth = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Cloudinary uses CLOUDINARY_URL automatically
cloudinary.config({ secure: true });

// Store incoming files in RAM
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Allowed category folders
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
    if (!req.file) return res.status(400).json({ ok: false, error: "No file" });

    const slot = sanitizeSlot(req.query.slot);
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `arp-hotel/${slot}`,
      resource_type: "image"
    });

    res.json({ ok: true, url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ ok: false, error: "Upload failed" });
  }
});

// ========================= DELETE =========================
router.delete("/", requireAuth, express.json(), async (req, res) => {
  try {
    const rawUrl = (req.query.url || req.body?.url || "").toString();
    if (!rawUrl) return res.status(400).json({ ok: false, error: "Missing URL" });
    const url = rawUrl.split("?")[0]; // strip cache-bust/query

    // Local backward compatibility
    if (url.startsWith("/uploads/")) {
      const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");
      const abs = path.join(UPLOAD_DIR, url.replace("/uploads/", ""));
      try { fs.unlinkSync(abs); } catch {}
      return res.json({ ok: true, deleted: url, local: true });
    }

    // Cloudinary public_id
    let publicId;
    const parts = url.split("/");
    const start = parts.indexOf("arp-hotel");
    if (start !== -1) {
      const filename = parts.at(-1).split(".")[0];
      const folder = parts.slice(start, -1).join("/");
      publicId = `${folder}/${filename}`;
    }

    if (!publicId) return res.status(400).json({ ok: false, error: "Invalid Cloudinary URL" });

    await cloudinary.uploader.destroy(publicId);

    res.json({ ok: true, deleted: url, public_id: publicId });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
