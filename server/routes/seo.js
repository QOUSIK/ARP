const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

function listHtmlFiles(dir, base='/'){
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries){
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()){
      if (e.name === 'includes') continue; // skip includes
      out.push(...listHtmlFiles(path.join(dir, e.name), path.posix.join(base, e.name, '/')));
    } else if (/\.html?$/i.test(e.name)){
      out.push(path.posix.join(base, e.name));
    }
  }
  return out;
}

router.get('/sitemap.xml', (req, res) => {
  try{
    const origin = `${req.protocol}://${req.get('host')}`;
    const files = listHtmlFiles(PUBLIC_DIR);
    const urls = files.map(f => `${origin}${f}`);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n`+
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
      urls.map(u => `\n  <url><loc>${u}</loc></url>`).join('') +
      `\n</urlset>`;
    res.set('Content-Type','application/xml');
    res.send(xml);
  } catch(e){ res.status(500).send(''); }
});

router.get('/robots.txt', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  res.set('Content-Type','text/plain');
  res.send(
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /admin\n` +
    `Disallow: /api\n` +
    `Disallow: /upload\n` +
    `Disallow: /uploads\n` +
    `Sitemap: ${origin}/sitemap.xml\n`
  );
});

module.exports = router;
