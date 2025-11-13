const db = require("../db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    title TEXT,
    description TEXT,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  const defaults = [
    { slug: "economy", title: "Economy Room", description: "Basic comfort.", image: "" },
    { slug: "standart", title: "Standard Room", description: "Cozy and elegant.", image: "" },
    { slug: "comfort", title: "Comfort Room", description: "More space, more comfort.", image: "" },
    { slug: "queen", title: "Queen Suite", description: "Spacious suite.", image: "" },
    { slug: "king", title: "King Suite", description: "Top-tier luxury.", image: "" }
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO rooms (slug, title, description, image) VALUES (?, ?, ?, ?)`);
  defaults.forEach(r => stmt.run([r.slug, r.title, r.description, r.image]));
  stmt.finalize();

  console.log("✅ Tables migrated & defaults seeded.");
});


/* Translations table for multilingual CMS */
db.run(`CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  lang TEXT NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'text',
  UNIQUE(key, lang)
)`);
