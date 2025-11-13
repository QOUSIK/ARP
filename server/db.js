const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error("❌ SQLite error:", err.message);
  console.log("✅ Connected to SQLite:", dbPath);
});

module.exports = db;
