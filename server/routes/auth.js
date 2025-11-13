const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const envEmail = process.env.ADMIN_EMAIL || "";
    const passHash = process.env.ADMIN_PASS_HASH || "";
    const passPlain = process.env.ADMIN_PASS || "";

    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
    if (email !== envEmail) return res.status(401).json({ error: "Invalid credentials" });

    let valid = false;
    if (passHash) {
      try { valid = await bcrypt.compare(password, passHash); } catch {}
    } else if (passPlain) {
      valid = (password === passPlain);
    }
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "Server misconfigured" });

    const token = jwt.sign({ email }, secret, { expiresIn: "1d" });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("arp_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/"
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Auth check
router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, email: req.user && req.user.email });
});

// Logout: clear cookie
router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("arp_token", { httpOnly: true, secure: isProd, sameSite: "strict", path: "/" });
  res.json({ ok: true });
});

module.exports = router;
