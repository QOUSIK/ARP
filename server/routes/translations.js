const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");
const requireAuth = require("../middleware/auth");

const I18N_DIR = path.join(__dirname, "..", "..", "assets", "i18n");

const MAIN_KEYS = [
  // Text keys
  "hero.greeting","hero.name","hero.age",
  "hotel.welcome.title","hotel.welcome.p1","hotel.discover",
  "comfort.title","comfort.p","explore.rooms",
  "taste.title","taste.p","view.amenities",
  "apartments.title",
  // Image keys
  "hero.image1","hero.image2","hero.image3","hero.image4","hero.image5",
  "welcome.image","comfort.image","taste.image",
  // Visibility keys (added)
  "visible.hero","visible.welcome","visible.comfort","visible.taste","visible.apartments"
];

// Keys used on public/about.html (excluding header/footer)
const ABOUT_KEYS = [
  // hero
  "hero.title", "hero.subtitle",
  // story
  "story.title", "story.p1", "story.p2", "story.p3", "story.imageText",
  // features (1..6)
  "features.title",
  "features.1.title","features.1.text",
  "features.2.title","features.2.text",
  "features.3.title","features.3.text",
  "features.4.title","features.4.text",
  "features.5.title","features.5.text",
  "features.6.title","features.6.text",
  // numbers labels
  "numbers.1","numbers.2","numbers.3",
  // team
  "team.title",
  "team.1.name","team.1.position","team.1.description",
  "team.2.name","team.2.position","team.2.description",
  "team.3.name","team.3.position","team.3.description",
  "team.4.name","team.4.position","team.4.description",
  // cta
  "cta.title","cta.description","cta.button",
  // images for about sections
  "about.hero.image","about.story.image","about.numbers.image",
  // visibility toggles for about sections
  "visible.about.hero","visible.about.story","visible.about.features",
  "visible.about.numbers","visible.about.team","visible.about.cta"
];

// Keys for Rest-Bar page
const REST_KEYS = [
  // hero texts
  "rest.hero.title", "rest.hero.subtitle",
  // images
  "rest.hero.image", "rest.image.main", "rest.image.harem", "rest.image.agora", "rest.image.american", "rest.image.beach",
  // visibility toggles
  "visible.rest.hero","visible.rest.main","visible.rest.harem","visible.rest.agora","visible.rest.american","visible.rest.beach",
  // shared labels
  "restaurant.main.hours",
  // main restaurant
  "restaurant.main.title","restaurant.main.description","restaurant.main.breakfast","restaurant.main.lunch","restaurant.main.dinner",
  "restaurant.main.feature1","restaurant.main.feature2","restaurant.main.feature3",
  // harem
  "restaurant.harem.title","restaurant.harem.description","restaurant.harem.note",
  "restaurant.harem.feature1","restaurant.harem.feature2","restaurant.harem.feature3",
  // agora
  "restaurant.agora.title","restaurant.agora.description","restaurant.agora.drinkService","restaurant.agora.snacks",
  "restaurant.agora.feature1","restaurant.agora.feature2","restaurant.agora.feature3",
  // american
  "restaurant.american.title","restaurant.american.description","restaurant.american.note",
  "restaurant.american.feature1","restaurant.american.feature2","restaurant.american.feature3",
  // beach
  "restaurant.beach.title","restaurant.beach.description","restaurant.beach.open","restaurant.beach.note",
  "restaurant.beach.feature1","restaurant.beach.feature2","restaurant.beach.feature3"
];

// Keys for Gallery page
const GALLERY_KEYS = [
  // hero
  "gallery.hero.title", "gallery.hero.subtitle", "gallery.hero.image",
  // category labels
  "gallery.category.all","gallery.category.hotel","gallery.category.rooms",
  "gallery.category.restaurants","gallery.category.pool","gallery.category.spa","gallery.category.events",
  // images per category (JSON array string)
  "gallery.images.hotel","gallery.images.rooms","gallery.images.restaurants",
  "gallery.images.pool","gallery.images.spa","gallery.images.events",
  // visibility toggles
  "visible.gallery.hero","visible.gallery.hotel","visible.gallery.rooms",
  "visible.gallery.restaurants","visible.gallery.pool","visible.gallery.spa","visible.gallery.events"
];

// Keys for Rooms overview page (public/Room.html)
const ROOMS_LIST_KEYS = [
  // hero (texts reuse common keys to avoid breaking page)
  "hero.title", "hero.subtitle",
  // hero image
  "rooms.hero.image",
  // per-room texts and images
  "rooms.economy.badge","rooms.economy.title","rooms.economy.description","rooms.image.economy",
  "rooms.standard.badge","rooms.standard.title","rooms.standard.description","rooms.image.standard",
  "rooms.comfort.badge","rooms.comfort.title","rooms.comfort.description","rooms.image.comfort",
  "rooms.queen.badge","rooms.queen.title","rooms.queen.description","rooms.image.queen",
  "rooms.king.badge","rooms.king.title","rooms.king.description","rooms.image.king",
  // shared labels
  "rooms.buttons.book","rooms.buttons.details",
  "rooms.features.ac","rooms.features.minibar","rooms.features.safe","rooms.features.tv","rooms.features.phone","rooms.features.wifi","rooms.features.hairdryer","rooms.features.shower","rooms.features.jacuzzi","rooms.features.balcony",
  // visibility toggles
  "visible.rooms.hero","visible.rooms.economy","visible.rooms.standard","visible.rooms.comfort","visible.rooms.queen","visible.rooms.king"
];

// Keys for Contact-Us page
const CONTACT_KEYS = [
  // hero
  "contact.hero.title","contact.hero.subtitle","contact.hero.image",
  // info block
  "contact.info.title",
  "contact.info.phone.title","contact.info.phone.content",
  "contact.info.email.title","contact.info.email.content",
  "contact.info.address.title","contact.info.address.content",
  "contact.info.hours.title","contact.info.hours.content",
  // form block
  "contact.form.title",
  "contact.form.name.label","contact.form.name.placeholder",
  "contact.form.email.label","contact.form.email.placeholder",
  "contact.form.phone.label","contact.form.phone.placeholder",
  "contact.form.subject.label","contact.form.subject.default",
  "contact.form.subject.reservation","contact.form.subject.information","contact.form.subject.complaint","contact.form.subject.partnership","contact.form.subject.other",
  "contact.form.message.label","contact.form.message.placeholder",
  "contact.form.submit",
  // map
  "contact.map.title","contact.map.openInMaps","contact.map.getDirections",
  // visibility
  "visible.contact.hero","visible.contact.info","visible.contact.form","visible.contact.map"
];

// --- Room detail pages (Economy, Standart, Comfort, Queen, King) ---
const ROOM_DETAIL_SLUGS = ["economy","standart","comfort","queen","king"];
function getRoomSlug(req){
  const s = (req.params.slug || "").toLowerCase();
  return ROOM_DETAIL_SLUGS.includes(s) ? s : null;
}
function roomDetailKeys(slug){
  return [
    `room.${slug}.hero.image`,
    `room.${slug}.slides`, // JSON array of image URLs
    // info values
    `room.${slug}.area`,`room.${slug}.flooring`,`room.${slug}.view`,`room.${slug}.tv`,
    `room.${slug}.bedType`,`room.${slug}.capacity`,`room.${slug}.smoking`,`room.${slug}.balcony`,
    `room.${slug}.checkin`,`room.${slug}.checkout`,
    // visibility
    `visible.room.${slug}.hero`,`visible.room.${slug}.slider`,`visible.room.${slug}.info`,`visible.room.${slug}.features`
  ];
}
function roomDetailDefaults(slug){
  const base = {
    economy: {
      [`room.economy.hero.image`]: "/assets/imgs/Eco1.jpg",
      [`room.economy.slides`]: JSON.stringify(["/assets/imgs/Eco1.jpg","/assets/imgs/Eco2.jpg"]),
      [`room.economy.area`]: "22 m²",
      [`room.economy.flooring`]: "Carpet",
      [`room.economy.view`]: "City view",
      [`room.economy.tv`]: "Multi-language / Satellite TV",
      [`room.economy.bedType`]: "1 double bed",
      [`room.economy.capacity`]: "Maximum 2 people",
      [`room.economy.smoking`]: "Not allowed",
      [`room.economy.balcony`]: "No",
      [`room.economy.checkin`]: "14:00",
      [`room.economy.checkout`]: "12:00",
    },
    standart: {
      [`room.standart.hero.image`]: "/assets/imgs/oda5.webp",
      [`room.standart.slides`]: JSON.stringify(["/assets/imgs/oda5.webp"]),
      [`room.standart.area`]: "20-22 m²",
      [`room.standart.flooring`]: "Carpet",
      [`room.standart.view`]: "Sea or garden view",
      [`room.standart.tv`]: "Multi-language / Satellite TV",
      [`room.standart.bedType`]: "1 double and 1 single bed or 3 single beds",
      [`room.standart.capacity`]: "Maximum 3 people",
      [`room.standart.smoking`]: "Not allowed",
      [`room.standart.balcony`]: "Yes",
      [`room.standart.checkin`]: "14:00",
      [`room.standart.checkout`]: "12:00",
    },
    comfort: {
      [`room.comfort.hero.image`]: "/assets/imgs/oda11.webp",
      [`room.comfort.slides`]: JSON.stringify(["/assets/imgs/oda11.webp","/assets/imgs/oda9.webp","/assets/imgs/oda6.webp"]),
      [`room.comfort.area`]: "22 m²",
      [`room.comfort.flooring`]: "Carpet",
      [`room.comfort.view`]: "Sea or garden view",
      [`room.comfort.tv`]: "Multi-language / Satellite TV",
      [`room.comfort.bedType`]: "1 double and 1 single bed or 3 single beds",
      [`room.comfort.capacity`]: "Maximum 3 people",
      [`room.comfort.smoking`]: "Not allowed",
      [`room.comfort.balcony`]: "Yes",
      [`room.comfort.checkin`]: "14:00",
      [`room.comfort.checkout`]: "12:00",
    },
    queen: {
      [`room.queen.hero.image`]: "/assets/imgs/Q3.jpg",
      [`room.queen.slides`]: JSON.stringify(["/assets/imgs/Q1.jpg","/assets/imgs/Q2.jpg","/assets/imgs/Q3.jpg","/assets/imgs/Q4.jpg"]),
      [`room.queen.area`]: "40 m²",
      [`room.queen.flooring`]: "Carpet",
      [`room.queen.view`]: "Sea or garden view",
      [`room.queen.tv`]: "Multi-language / Satellite TV",
      [`room.queen.bedType`]: "1 double bed",
      [`room.queen.capacity`]: "Maximum 4 people",
      [`room.queen.smoking`]: "Not allowed",
      [`room.queen.balcony`]: "Yes",
      [`room.queen.checkin`]: "14:00",
      [`room.queen.checkout`]: "12:00",
    },
    king: {
      [`room.king.hero.image`]: "/assets/imgs/K1.jpg",
      [`room.king.slides`]: JSON.stringify(["/assets/imgs/k2.jpg","/assets/imgs/k3.jpg","/assets/imgs/k4.jpg","/assets/imgs/K1.jpg"]),
      [`room.king.area`]: "22 m²",
      [`room.king.flooring`]: "Carpet",
      [`room.king.view`]: "Sea or garden view",
      [`room.king.tv`]: "Multi-language / Satellite TV",
      [`room.king.bedType`]: "1 double and 1 single bed or 3 single beds",
      [`room.king.capacity`]: "Maximum 4 people",
      [`room.king.smoking`]: "Not allowed",
      [`room.king.balcony`]: "Yes",
      [`room.king.checkin`]: "14:00",
      [`room.king.checkout`]: "12:00",
    }
  };
  const d = base[slug] || {};
  // default visibility true
  ["hero","slider","info","features"].forEach(sec => { d[`visible.room.${slug}.${sec}`] = "true"; });
  return d;
}

// Read room detail translations (defaults + DB overlay)
router.get("/roomdetail/:slug/:lang", (req, res) => {
  const slug = getRoomSlug(req);
  if (!slug) return res.status(400).json({ error: "Invalid room slug" });
  const lang = getLang(req);
  const defaults = roomDetailDefaults(slug);
  const keys = roomDetailKeys(slug);
  const placeholders = keys.map(_ => "?").join(",");
  db.all(
    `SELECT key, value FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...keys],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const out = { ...defaults };
      rows.forEach(r => { if (r.value && r.value.trim() !== "") out[r.key] = r.value; });
      res.json(out);
    }
  );
});

// Save room detail translations
router.patch("/roomdetail/:slug/:lang", requireAuth, (req, res) => {
  const slug = getRoomSlug(req);
  if (!slug) return res.status(400).json({ error: "Invalid room slug" });
  const lang = getLang(req);
  const body = req.body || {};
  const keys = new Set(roomDetailKeys(slug));
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);
  db.serialize(() => {
    let saved=0, skipped=0;
    for (const k of Object.keys(body)){
      if (!keys.has(k)) continue;
      const val = String(body[k] ?? "").trim();
      if (!val) { skipped++; continue; }
      stmt.run([k, lang, val, k, lang]);
      saved++;
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok:true, saved, skipped });
    });
  });
});

function getLang(req) {
  const lang = (req.params.lang || "").toLowerCase();
  return ["en","ru","tr","de",].includes(lang) ? lang : "en";
}

// Get translations for main page
router.get("/main/:lang", (req, res) => {
  const lang = getLang(req);
  const defaults = DEFAULT_TEXTS[lang] || DEFAULT_TEXTS.en;

  const placeholders = MAIN_KEYS.map(_ => "?").join(",");
  db.all(
    `SELECT key, value FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...MAIN_KEYS],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // берём дефолты
      const out = { ...defaults };
      rows.forEach(r => {
        if (r.value && r.value.trim() !== "") {
          out[r.key] = r.value;
        }
      });

      res.json(out);
    }
  );
});



// Save translations (skip empty values)
router.patch("/main/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const body = req.body || {};
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);

  db.serialize(() => {
    let saved = 0, skipped = 0;
    for (const k of Object.keys(body)) {
      if (!MAIN_KEYS.includes(k)) continue;
      const val = String(body[k] ?? "").trim();
      if (!val) { skipped++; continue; } // skip empty/whitespace
      stmt.run([k, lang, val, k, lang]);
      saved++;
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      console.log(`[PATCH:${lang}] saved ${saved}, skipped ${skipped}`);
      res.json({ ok: true, saved, skipped });
    });
  });
});

// Get translations for about page (DB overlay only)
// Default values for about page (images + visibility)
const DEFAULTS_ABOUT = {
  en: {
    "about.hero.image": "/assets/img/3block.jpg",
    "about.story.image": "/assets/img/2block.jpg",
    "about.numbers.image": "/assets/img/1block.jpg",
    "visible.about.hero": "true",
    "visible.about.story": "true",
    "visible.about.features": "true",
    "visible.about.numbers": "true",
    "visible.about.team": "true",
    "visible.about.cta": "true"
  },
  ru: {}, tr: {}, de: {}
};
DEFAULTS_ABOUT.ru = { ...DEFAULTS_ABOUT.en };
DEFAULTS_ABOUT.tr = { ...DEFAULTS_ABOUT.en };
DEFAULTS_ABOUT.de = { ...DEFAULTS_ABOUT.en };

// Get translations for about page (defaults + DB overlay)
router.get("/about/:lang", (req, res) => {
  const lang = getLang(req);
  const defaults = DEFAULTS_ABOUT[lang] || DEFAULTS_ABOUT.en;
  const placeholders = ABOUT_KEYS.map(_ => "?").join(",");
  db.all(
    `SELECT key, value FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...ABOUT_KEYS],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const out = { ...defaults };
      rows.forEach(r => { if (r.value && r.value.trim() !== "") out[r.key] = r.value; });
      res.json(out);
    }
  );
});

// Save translations for about page
router.patch("/about/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const body = req.body || {};
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);

  db.serialize(() => {
    let saved = 0, skipped = 0;
    for (const k of Object.keys(body)) {
      if (!ABOUT_KEYS.includes(k)) continue;
      const val = String(body[k] ?? "").trim();
      if (!val) { skipped++; continue; }
      stmt.run([k, lang, val, k, lang]);
      saved++;
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      console.log(`[PATCH:about:${lang}] saved ${saved}, skipped ${skipped}`);
      res.json({ ok: true, saved, skipped });
    });
  });
});

// Defaults for Rest-Bar page
const DEFAULTS_REST = {
  en: {
    "rest.hero.title": "Restaurants & Bars",
    "rest.hero.subtitle": "Experience refined flavors where Roman elegance blends with Mediterranean charm",
    "rest.hero.image": "/assets/imgs/rest5.webp",
    "rest.image.main": "/assets/imgs/rest1.webp",
    "rest.image.harem": "/assets/imgs/rest2.webp",
    "rest.image.agora": "/assets/imgs/bar4.webp",
    "rest.image.american": "/assets/imgs/americanbar.jpg",
    "rest.image.beach": "/assets/imgs/beachbar.jpg",
    "visible.rest.hero": "true",
    "visible.rest.main": "true",
    "visible.rest.harem": "true",
    "visible.rest.agora": "true",
    "visible.rest.american": "true",
    "visible.rest.beach": "true"
  },
  ru: {}, tr: {}, de: {}
};
DEFAULTS_REST.ru = { ...DEFAULTS_REST.en };
DEFAULTS_REST.tr = { ...DEFAULTS_REST.en };
DEFAULTS_REST.de = { ...DEFAULTS_REST.en };

// Read Rest-Bar translations (defaults + DB overlay)
router.get("/rest/:lang", (req, res) => {
  const lang = getLang(req);
  const defaults = DEFAULTS_REST[lang] || DEFAULTS_REST.en;
  const placeholders = REST_KEYS.map(_ => "?").join(",");
  db.all(
    `SELECT key, value FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...REST_KEYS],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const out = { ...defaults };
      rows.forEach(r => { if (r.value && r.value.trim() !== "") out[r.key] = r.value; });
      res.json(out);
    }
  );
});

// Save Rest-Bar translations
router.patch("/rest/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const body = req.body || {};
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);

  db.serialize(() => {
    let saved = 0, skipped = 0;
    for (const k of Object.keys(body)) {
      if (!REST_KEYS.includes(k)) continue;
      const val = String(body[k] ?? "").trim();
      if (!val) { skipped++; continue; }
      stmt.run([k, lang, val, k, lang]);
      saved++;
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, saved, skipped });
    });
  });
});

// Defaults for Gallery page
const DEFAULTS_GALLERY = {
  en: {
    "gallery.hero.title": "Gallery",
    "gallery.hero.subtitle": "Where ancient Roman elegance meets modern luxury on the shore of the Mediterranean Sea",
    "gallery.hero.image": "/assets/img/4block.jpg",
    "visible.gallery.hero": "true",
    "visible.gallery.hotel": "true",
    "visible.gallery.rooms": "true",
    "visible.gallery.restaurants": "true",
    "visible.gallery.pool": "true",
    "visible.gallery.spa": "true",
    "visible.gallery.events": "true"
  },
  ru: {}, tr: {}, de: {}
};
DEFAULTS_GALLERY.ru = { ...DEFAULTS_GALLERY.en };
DEFAULTS_GALLERY.tr = { ...DEFAULTS_GALLERY.en };
DEFAULTS_GALLERY.de = { ...DEFAULTS_GALLERY.en };

// Read Gallery translations (defaults + DB overlay)
router.get("/gallery/:lang", (req, res) => {
  const lang = getLang(req);
  const defaults = DEFAULTS_GALLERY[lang] || DEFAULTS_GALLERY.en;
  const placeholders = GALLERY_KEYS.map(_ => "?").join(",");
  db.all(
    `SELECT key, value FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...GALLERY_KEYS],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const out = { ...defaults };
      rows.forEach(r => { if (r.value && r.value.trim() !== "") out[r.key] = r.value; });
      res.json(out);
    }
  );
});

// Save Gallery translations
router.patch("/gallery/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const body = req.body || {};
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);

  db.serialize(() => {
    let saved = 0, skipped = 0;
    for (const k of Object.keys(body)) {
      if (!GALLERY_KEYS.includes(k)) continue;
      const val = String(body[k] ?? "").trim();
      if (!val) { skipped++; continue; }
      stmt.run([k, lang, val, k, lang]);
      saved++;
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, saved, skipped });
    });
  });
});

// Defaults for Rooms overview page
const DEFAULTS_ROOMS_LIST = {
  en: {
    "hero.title": "Choose Your Stay",
    "hero.subtitle": "From refined simplicity to royal comfort — explore rooms designed for relaxation, elegance, and unforgettable moments.",
    "rooms.hero.image": "/assets/img/style.webp",
    "rooms.image.economy": "/assets/img/econom.avif",
    "rooms.image.standard": "/assets/img/Standart.avif",
    "rooms.image.comfort": "/assets/img/comfort.jpg",
    "rooms.image.queen": "/assets/img/Queen.avif",
    "rooms.image.king": "/assets/img/king.jpg",
    "visible.rooms.hero": "true",
    "visible.rooms.economy": "true",
    "visible.rooms.standard": "true",
    "visible.rooms.comfort": "true",
    "visible.rooms.queen": "true",
    "visible.rooms.king": "true"
  },
  ru: {}, tr: {}, de: {}
};
DEFAULTS_ROOMS_LIST.ru = { ...DEFAULTS_ROOMS_LIST.en };
DEFAULTS_ROOMS_LIST.tr = { ...DEFAULTS_ROOMS_LIST.en };
DEFAULTS_ROOMS_LIST.de = { ...DEFAULTS_ROOMS_LIST.en };

// Read Rooms overview translations (defaults + DB overlay)
router.get("/roomslist/:lang", (req, res) => {
  const lang = getLang(req);
  const defaults = DEFAULTS_ROOMS_LIST[lang] || DEFAULTS_ROOMS_LIST.en;
  const placeholders = ROOMS_LIST_KEYS.map(_ => "?").join(",");
  db.all(
    `SELECT key, value FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...ROOMS_LIST_KEYS],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const out = { ...defaults };
      rows.forEach(r => { if (r.value && r.value.trim() !== "") out[r.key] = r.value; });
      res.json(out);
    }
  );
});

// Save Rooms overview translations
router.patch("/roomslist/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const body = req.body || {};
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);

  db.serialize(() => {
    let saved = 0, skipped = 0;
    for (const k of Object.keys(body)) {
      if (!ROOMS_LIST_KEYS.includes(k)) continue;
      const val = String(body[k] ?? "").trim();
      if (!val) { skipped++; continue; }
      stmt.run([k, lang, val, k, lang]);
      saved++;
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, saved, skipped });
    });
  });
});

// Defaults for Contact page
const DEFAULTS_CONTACT = {
  en: {
    "contact.hero.title": "Contact Us",
    "contact.hero.subtitle": "Get in touch with Antique Roman Palace. We're here to make your stay unforgettable.",
    "contact.hero.image": "/assets/img/lobby.jpg",
    "contact.info.title": "Get In Touch",
    "contact.info.phone.title": "Phone",
    "contact.info.phone.content": "+90 (0242) 514 05 06\n+90 (0242) 514 05 07",
    "contact.info.email.title": "Email",
    "contact.info.email.content": "info@antiqueromanpalace.com\nreservations@antiqueromanpalace.com",
    "contact.info.address.title": "Address",
    "contact.info.address.content": "Oba, Atatürk Cd. No:31\n07460 Alanya/Antalya, Turkey",
    "contact.info.hours.title": "Reception Hours",
    "contact.info.hours.content": "24/7 Reception\nCheck-in: 2:00 PM\nCheck-out: 12:00 PM",
    "contact.form.title": "Send Message",
    "contact.form.name.label": "Full Name",
    "contact.form.name.placeholder": "Enter your full name",
    "contact.form.email.label": "Email Address",
    "contact.form.email.placeholder": "Enter your email",
    "contact.form.phone.label": "Phone Number",
    "contact.form.phone.placeholder": "Enter your phone number",
    "contact.form.subject.label": "Subject",
    "contact.form.subject.default": "Select a subject",
    "contact.form.subject.reservation": "Room Reservation",
    "contact.form.subject.information": "General Information",
    "contact.form.subject.complaint": "Complaint",
    "contact.form.subject.partnership": "Business Partnership",
    "contact.form.subject.other": "Other",
    "contact.form.message.label": "Message",
    "contact.form.message.placeholder": "Enter your message...",
    "contact.form.submit": "Send Message",
    "contact.map.title": "Find Us",
    "contact.map.openInMaps": "Open in Google Maps",
    "contact.map.getDirections": "Get Directions",
    "visible.contact.hero": "true",
    "visible.contact.info": "true",
    "visible.contact.form": "true",
    "visible.contact.map": "true"
  },
  ru: {}, tr: {}, de: {}
};
DEFAULTS_CONTACT.ru = { ...DEFAULTS_CONTACT.en };
DEFAULTS_CONTACT.tr = { ...DEFAULTS_CONTACT.en };
DEFAULTS_CONTACT.de = { ...DEFAULTS_CONTACT.en };

// Read Contact translations (defaults + DB overlay)
router.get("/contact/:lang", (req, res) => {
  const lang = getLang(req);
  const defaults = DEFAULTS_CONTACT[lang] || DEFAULTS_CONTACT.en;
  const placeholders = CONTACT_KEYS.map(_ => "?").join(",");
  db.all(
    `SELECT key, value FROM translations WHERE lang=? AND key IN (${placeholders})`,
    [lang, ...CONTACT_KEYS],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const out = { ...defaults };
      rows.forEach(r => { if (r.value && r.value.trim() !== "") out[r.key] = r.value; });
      res.json(out);
    }
  );
});

// Save Contact translations
router.patch("/contact/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const body = req.body || {};
  const stmt = db.prepare(`INSERT INTO translations (key, lang, value, type)
    VALUES (?, ?, ?, COALESCE((SELECT type FROM translations WHERE key=? AND lang=?),'text'))
    ON CONFLICT(key, lang) DO UPDATE SET value=excluded.value`);

  db.serialize(() => {
    let saved = 0, skipped = 0;
    for (const k of Object.keys(body)) {
      if (!CONTACT_KEYS.includes(k)) continue;
      const val = String(body[k] ?? "").trim();
      if (!val) { skipped++; continue; }
      stmt.run([k, lang, val, k, lang]);
      saved++;
    }
    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, saved, skipped });
    });
  });
});

// Export translations (GET) - merges DB into existing JSON, ignoring empty DB values
router.get("/export/:lang", requireAuth, (req, res) => {
  const lang = getLang(req);
  const jsonPath = path.join(I18N_DIR, `${lang}.json`);
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(jsonPath, "utf-8")); } catch(e) {}

  db.all(`SELECT key, value FROM translations WHERE lang=?`, [lang], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let applied = 0, ignored = 0;
    rows.forEach(r => {
      if (r.value && String(r.value).trim() !== "") {
        existing[r.key] = r.value;
        applied++;
      } else {
        ignored++;
      }
    });
    fs.mkdirSync(I18N_DIR, { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), "utf-8");
    console.log(`[EXPORT:GET:${lang}] applied ${applied}, ignored ${ignored}, file ${jsonPath}`);
    res.json({ ok: true, path: `/assets/i18n/${lang}.json`, applied, ignored });
  });
});

// Export translations (POST) - accept filtered data safely
// 🔹 Экспорт переводов (POST) — теперь с сохранением старых значений
router.post("/export/:lang", requireAuth, (req, res) => {
  try {
    const lang = getLang(req);
    const newData = req.body || {};

    fs.mkdirSync(I18N_DIR, { recursive: true });
    const jsonPath = path.join(I18N_DIR, `${lang}.json`);

    // Читаем старый JSON (если существует)
    let existing = {};
    try {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      existing = JSON.parse(raw);
    } catch {
      existing = {};
    }

    // Объединяем данные (старое + новое)
    const merged = { ...existing, ...newData };

    // Удаляем пустые строки
    Object.keys(merged).forEach(k => {
      const val = (merged[k] ?? "").toString().trim();
      if (!val) delete merged[k];
    });

    fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 2), "utf-8");

    res.json({ ok: true, path: `/assets/i18n/${lang}.json`, saved: Object.keys(newData).length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 🌍 Многоязычные тексты по умолчанию
const DEFAULT_TEXTS = {
  en: {
    "hero.greeting": "Welcome to",
    "hero.name": "Antique Roman Palace",
    "hero.age": "+16",

    "hotel.welcome.title": "Welcome to Antique Roman Palace",
    "hotel.welcome.p1": "Your paradise on the Mediterranean! Sun, sea, history, and romance are waiting for you. From our classic buildings, you will enjoy breathtaking views of the Alanya coastline. Just steps away you'll find ancient ruins, vibrant streets, and famous landmarks.",
    "hotel.discover": "Discover More",

    "comfort.title": "Comfort & Style",
    "comfort.p": "Rooms for Every Mood. Choose between standard or suite — all featuring balconies, air conditioning, and a minibar. Interiors in Roman, Ottoman, and classic styles create an atmosphere of history and art right inside your room.",
    "explore.rooms": "Explore Rooms",

    "taste.title": "Taste, Entertainment & Relaxation",
    "taste.p": "Ultra all-inclusive: Turkish and European cuisine, a sea-view restaurant, two pools, and a private beach. Daily shows, contests, Turkish night, live music. Plus a hammam, sauna, massage, and fitness facilities — for complete relaxation.",
    "view.amenities": "View Amenities",

    "apartments.title": "Our Apartments",

    "hero.image1": "/assets/img/first.jpg",
    "hero.image2": "/assets/img/second.jpg",
    "hero.image3": "/assets/img/third.jpg",
    "hero.image4": "/assets/imgs/10.webp",
    "hero.image5": "/assets/imgs/a.avif",

    "welcome.image": "/assets/img/kit.jpg",
    "comfort.image": "/assets/img/style.webp",
    "taste.image": "/assets/img/comfort.jpg",

    // Defaults for section visibility
    "visible.hero": "true",
    "visible.welcome": "true",
    "visible.comfort": "true",
    "visible.taste": "true",
    "visible.apartments": "true"
  },

  ru: {
    "hero.greeting": "Добро пожаловать в",
    "hero.name": "Antique Roman Palace",
    "hero.age": "+16",

    "hotel.welcome.title": "Добро пожаловать в Antique Roman Palace",
    "hotel.welcome.p1": "Ваш рай на Средиземном море! Солнце, море, история и романтика ждут вас. Из окон отеля открываются потрясающие виды на побережье Алании. Рядом находятся древние руины, оживлённые улицы и знаменитые достопримечательности.",
    "hotel.discover": "Подробнее",

    "comfort.title": "Комфорт и стиль",
    "comfort.p": "Номера на любой вкус. Стандартные и люксы с балконами, кондиционером и мини-баром. Интерьеры в римском, османском и классическом стилях создают атмосферу истории и искусства.",
    "explore.rooms": "Посмотреть номера",

    "taste.title": "Вкус, развлечения и отдых",
    "taste.p": "Система «ультра всё включено»: турецкая и европейская кухня, ресторан с видом на море, два бассейна и частный пляж. Ежедневные шоу, конкурсы, турецкая ночь, живая музыка, хамам и массаж.",
    "view.amenities": "Услуги отеля",

    "apartments.title": "Наши номера",

    "hero.image1": "/assets/img/first.jpg",
    "hero.image2": "/assets/img/second.jpg",
    "hero.image3": "/assets/img/third.jpg",
    "hero.image4": "/assets/imgs/10.webp",
    "hero.image5": "/assets/imgs/a.avif",

    "welcome.image": "/assets/img/kit.jpg",
    "comfort.image": "/assets/img/style.webp",
    "taste.image": "/assets/img/comfort.jpg",

    // Defaults for section visibility
    "visible.hero": "true",
    "visible.welcome": "true",
    "visible.comfort": "true",
    "visible.taste": "true",
    "visible.apartments": "true"
  },

  tr: {
    "hero.greeting": "Hoş geldiniz",
    "hero.name": "Antique Roman Palace",
    "hero.age": "+16",

    "hotel.welcome.title": "Antique Roman Palace’a hoş geldiniz",
    "hotel.welcome.p1": "Akdeniz’in cenneti! Güneş, deniz, tarih ve romantizm sizi bekliyor. Odalarımızdan Alanya sahilinin büyüleyici manzarasını izleyin. Tarihi kalıntılar, canlı sokaklar ve ünlü simge yapılar birkaç adım ötede.",
    "hotel.discover": "Daha fazla keşfet",

    "comfort.title": "Konfor ve Stil",
    "comfort.p": "Her ruh haline uygun odalar. Balkonlu, klimalı ve mini barlı standart veya suit seçenekleri. Roma, Osmanlı ve klasik tarzda tasarımlar size tarihi bir atmosfer sunar.",
    "explore.rooms": "Odaları keşfet",

    "taste.title": "Lezzet, Eğlence ve Rahatlama",
    "taste.p": "Ultra her şey dahil: Türk ve Avrupa mutfağı, deniz manzaralı restoran, iki havuz ve özel plaj. Günlük şovlar, yarışmalar, Türk gecesi, canlı müzik, hamam ve masaj hizmetleriyle tam bir rahatlama.",
    "view.amenities": "Olanakları Gör",

    "apartments.title": "Odalarımız",

    "hero.image1": "/assets/img/first.jpg",
    "hero.image2": "/assets/img/second.jpg",
    "hero.image3": "/assets/img/third.jpg",
    "hero.image4": "/assets/imgs/10.webp",
    "hero.image5": "/assets/imgs/a.avif",

    "welcome.image": "/assets/img/kit.jpg",
    "comfort.image": "/assets/img/style.webp",
    "taste.image": "/assets/img/comfort.jpg",

    // Defaults for section visibility
    "visible.hero": "true",
    "visible.welcome": "true",
    "visible.comfort": "true",
    "visible.taste": "true",
    "visible.apartments": "true"
  },

  de: {
    "hero.greeting": "Willkommen im",
    "hero.name": "Antique Roman Palace",
    "hero.age": "+16",

    "hotel.welcome.title": "Willkommen im Antique Roman Palace",
    "hotel.welcome.p1": "Ihr Paradies am Mittelmeer! Sonne, Meer, Geschichte und Romantik erwarten Sie. Von unseren klassischen Gebäuden aus genießen Sie atemberaubende Ausblicke auf die Küste von Alanya.",
    "hotel.discover": "Mehr erfahren",

    "comfort.title": "Komfort und Stil",
    "comfort.p": "Zimmer für jede Stimmung. Wählen Sie zwischen Standard oder Suite — alle mit Balkon, Klimaanlage und Minibar. Römisches, osmanisches und klassisches Design schaffen ein historisches Ambiente.",
    "explore.rooms": "Zimmer entdecken",

    "taste.title": "Genuss, Unterhaltung & Entspannung",
    "taste.p": "Ultra All Inclusive: Türkische und europäische Küche, Restaurant mit Meerblick, zwei Pools und privater Strand. Tägliche Shows, Wettbewerbe, Türkischer Abend, Live-Musik, Hamam und Massage.",
    "view.amenities": "Hotelausstattung ansehen",

    "apartments.title": "Unsere Zimmer",

    "hero.image1": "/assets/img/first.jpg",
    "hero.image2": "/assets/img/second.jpg",
    "hero.image3": "/assets/img/third.jpg",
    "hero.image4": "/assets/imgs/10.webp",
    "hero.image5": "/assets/imgs/a.avif",

    "welcome.image": "/assets/img/kit.jpg",
    "comfort.image": "/assets/img/style.webp",
    "taste.image": "/assets/img/comfort.jpg",

    // Defaults for section visibility
    "visible.hero": "true",
    "visible.welcome": "true",
    "visible.comfort": "true",
    "visible.taste": "true",
    "visible.apartments": "true"
  }
};


module.exports = router;
