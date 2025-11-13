require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const contentRoutes = require("./routes/content");
const uploadRoutes = require("./routes/upload");       // ✅ правильный путь
const translationsRoutes = require("./routes/translations");
const seoRoutes = require("./routes/seo");

const app = express();
const basicAuth = require("express-basic-auth");

// Protect ONLY the public website, NOT the API
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (req.path.startsWith("/admin")) return next(); // admin panel — open
  return basicAuth({
    users: { 
      [process.env.SITE_USER || "admin"]: process.env.SITE_PASS || "demo"
    },
    challenge: true,
    realm: "ARP Private Access"
  })(req, res, next);
});
// Behind reverse-proxy (Nginx), trust first proxy for secure cookies and IPs
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
// Security hardening
app.disable("x-powered-by");
if (!process.env.JWT_SECRET) {
  console.warn("[security] JWT_SECRET is missing. Generating ephemeral secret (dev only).");
  process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
}

// 🛡 Безопасность
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);


// 🌍 CORS
const defaultOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://arp-hotel.onrender.com"
];
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true
}));

// 🧱 Body парсер
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Tightened rate limiter specifically for login endpoint
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth/login", loginLimiter);

// ⏱ Лимитер на авторизацию / загрузку
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50
});
app.use("/api/auth", authLimiter);
app.use("/upload", authLimiter);

// 🔐 Основные API
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/translations", translationsRoutes);
// SEO endpoints (sitemap.xml, robots.txt)
app.use("/", seoRoutes);

// Hardened static serving for uploads
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
app.use("/uploads", express.static(uploadsDir, {
  dotfiles: "deny",
  index: false,
  setHeaders(res, filePath) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (/\.(?:jpe?g|png|webp|gif|avif)$/i.test(filePath || "")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "no-store");
    }
  }
}));

// 🖼️ --- Загрузка изображений ---
app.use("/upload", uploadRoutes);       // основной путь
app.use("/api/upload", uploadRoutes);   // алиас (чтобы старые запросы не ломались)

// 📁 --- Раздача загруженных файлов ---
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads"))); // чтобы картинки открывались по URL /uploads/hero/...

// 🌍 --- Статика сайта ---
// Admin CSP for /admin (report-only while stabilizing UI)
app.use("/admin", helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"]
  },
  reportOnly: true
}));
app.use("/", express.static(path.join(__dirname, "..", "public")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));
app.use("/admin", express.static(path.join(__dirname, "..", "admin"), { dotfiles: "deny" }));

// 🩺 Health-check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
