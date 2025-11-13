const jwt = require("jsonwebtoken");

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  if (!raw) return null;
  const parts = raw.split(/;\s*/);
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = decodeURIComponent(p.slice(0, idx).trim());
    if (k === name) return decodeURIComponent(p.slice(idx + 1));
  }
  return null;
}

module.exports = function requireAuth(req, res, next) {
  // Prefer HttpOnly cookie, fallback to Bearer for compatibility
  const cookieToken = readCookie(req, "arp_token");
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const token = cookieToken || bearer;

  if (!token) return res.status(401).json({ error: "No token" });

  // Basic CSRF hardening for state-changing requests
  const method = req.method.toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const origin = req.get("origin");
    const host = req.get("host") || "";
    if (origin && !origin.endsWith(host)) {
      return res.status(403).json({ error: "Bad origin" });
    }
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "Server misconfigured" });
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
