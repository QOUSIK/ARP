const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const requireAuth = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Cloudinary reads CLOUDINARY_URL automatically; enforce https URLs
cloudinary.config({ secure: true });

// Store incoming files in RAM — perfect for Render serverless FS
const storage = multer.memoryStorage();

// Multer for uploads
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Allowed logical folders for uploads
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

    const result = await cloudinary.uploader.upload(base64, {
      folder: `arp-hotel/${slot}`,
      resource_type: "image",

      // Correct canonical order!
      // Cloudinary requires transformation params sorted alphabetically
      transformation: "q_auto,f_auto"
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
    const url = (req.query.url || (req.body && req.body.url) || "").toString();

    if (!url) {
      return res.status(400).json({ ok: false, error: "Missing URL" });
    }

    // 1) Legacy local delete support (/uploads/)
    if (url.startsWith("/uploads/")) {
      try {
        const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");
        const abs = path.join(UPLOAD_DIR, url.replace("/uploads/", ""));
        if (abs.startsWith(UPLOAD_DIR)) {
          try { fs.unlinkSync(abs); } catch (e) { if (e.code !== "ENOENT") throw e; }
        }
      } catch (e) {
        console.warn("Local delete warning:", e.message);
      }

      return res.json({ ok: true, deleted: url, local: true });
    }

    // 2) Cloudinary URL delete
    let publicId;
    try {
      const parts = url.split("/");
      const start = parts.indexOf("arp-hotel"); // our folder prefix

      if (start !== -1) {
        // Direct folder match: ... /arp-hotel/gallery/filename.jpg
        const filename = (parts[parts.length - 1] || "").split(".")[0];
        const folder = parts.slice(start, parts.length - 1).join("/");
        publicId = `${folder}/${filename}`;
      } else {
        // Generic Cloudinary URL parsing (fallback)
        const afterUpload = (url.split("/upload/")[1] || "").split("?")[0];
        const segs = afterUpload.split("/");
        let i = 0;
        while (i < segs.length && !/^v\d+$/i.test(segs[i]) && segs[i].indexOf(".") === -1) i++;
        if (/^v\d+$/i.test(segs[i])) i++;
        const rest = segs.slice(i).join("/");
        publicId = rest.replace(/\.[a-z0-9]+$/i, "");
      }
    } catch (e) {
      console.warn("Failed to parse public_id:", url, e.message);
    }

    if (!publicId) return res.status(400).json({ ok: false, error: "Invalid Cloudinary URL" });

    await cloudinary.uploader.destroy(publicId);

    return res.json({ ok: true, deleted: url, public_id: publicId });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
