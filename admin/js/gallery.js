const st = document.getElementById('status');
const langSel = document.getElementById('lang');
const defaultLang = 'ru';

// Key mapping
const fields = {
  // hero
  'g_hero_title': 'gallery.hero.title',
  'g_hero_subtitle': 'gallery.hero.subtitle',
  'g_hero_image': 'gallery.hero.image',
  // category labels
  'gc_all': 'gallery.category.all',
  'gc_hotel': 'gallery.category.hotel',
  'gc_rooms': 'gallery.category.rooms',
  'gc_restaurants': 'gallery.category.restaurants',
  'gc_pool': 'gallery.category.pool',
  'gc_spa': 'gallery.category.spa',
  'gc_events': 'gallery.category.events',
  // image lists (stored as JSON array strings)
  'gi_hotel': 'gallery.images.hotel',
  'gi_rooms': 'gallery.images.rooms',
  'gi_restaurants': 'gallery.images.restaurants',
  'gi_pool': 'gallery.images.pool',
  'gi_spa': 'gallery.images.spa',
  'gi_events': 'gallery.images.events'
};

const sectionKeys = ['hero','hotel','rooms','restaurants','pool','spa','events'];

const uploads = [
  ['g_hero_image','f_g_hero','gallery.hero.image','gallery'],
  ['gi_hotel','f_g_hotel','gallery.images.hotel','gallery'],
  ['gi_rooms','f_g_rooms','gallery.images.rooms','gallery'],
  ['gi_restaurants','f_g_restaurants','gallery.images.restaurants','gallery'],
  ['gi_pool','f_g_pool','gallery.images.pool','gallery'],
  ['gi_spa','f_g_spa','gallery.images.spa','gallery'],
  ['gi_events','f_g_events','gallery.images.events','gallery']
];

function nlToArray(text){
  return (text || '').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
}
function arrayToNl(arr){
  return (arr || []).join('\n');
}

function setThumbHero(url){
  const img = document.getElementById('p_gallery_hero');
  if (!img) return;
  if (url && url.trim()) { img.style.display='block'; img.src=API.normalizeUploadUrl(url); img.onerror=()=>{img.style.display='none';}; }
  else { img.removeAttribute('src'); img.style.display='none'; }
}

function hasContent(obj){
  return obj && Object.keys(obj).length > 0;
}

async function load(){
  st.textContent = 'Loading...';
  const lang = langSel.value;
  try {
    let base = {};
    try { const r = await fetch(`/assets/i18n/${lang}.json`, {cache:'no-cache'}); if (r.ok) base = await r.json(); } catch {}
    let db = await API.api(`/translations/gallery/${lang}`).catch(()=> ({}));
    let usedFallback = false;
    if (!hasContent(db) && lang !== defaultLang){
      const fallback = await API.api(`/translations/gallery/${defaultLang}`).catch(()=> ({}));
      if (hasContent(fallback)){
        db = fallback;
        usedFallback = true;
      }
    }
    const data = Object.assign({}, base, db);
    for (const id in fields){
      const el = document.getElementById(id);
      if (!el) continue;
      const key = fields[id];
      let val = data[key] || '';
      if (id.startsWith('gi_') && typeof val === 'string' && val.trim().startsWith('[')){
        // JSON array -> textarea
        try { val = arrayToNl(JSON.parse(val)); } catch {}
      }
      el.value = val;
    }
    // visibility
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_gallery_${k}`);
      if (cb){ const v = data[`visible.gallery.${k}`]; cb.checked = !(v === 'false' || v === false); }
    });
    st.textContent = usedFallback ? 'Loaded (no data for this language, showing RU copy).' : 'Loaded.';
  } catch(e) {
    st.textContent = e.message || 'Failed to load';
  }
  loadDraft();
  setThumbHero(document.getElementById('g_hero_image')?.value);
  renderAllThumbs();
}

async function save(){
  st.textContent = 'Saving...';
  const lang = langSel.value;
  try {
    const payload = {};
    for (const id in fields){
      const el = document.getElementById(id);
      if (!el) continue;
      let val = (el.value || '').toString();
      // lists -> store as JSON array
      if (id.startsWith('gi_')){
        // even if list is empty, store "[]" so that public gallery stops using old URLs
        val = JSON.stringify(nlToArray(val).map(API.normalizeUploadUrl));
      }
      if (id === 'g_hero_image') val = API.normalizeUploadUrl(val);
      if (val.trim()) payload[fields[id]] = val;
    }
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_gallery_${k}`);
      if (cb) payload[`visible.gallery.${k}`] = cb.checked ? 'true' : 'false';
    });
    await API.api(`/translations/gallery/${lang}`, { method:'PATCH', body: JSON.stringify(payload) });
    st.textContent = '✅ Saved.';
  } catch(e) { st.textContent = e.message || 'Failed to save'; }
  setThumbHero(document.getElementById('g_hero_image')?.value);
  saveDraft();
}

async function exportJson(){
  st.textContent = 'Exporting...';
  try {
    const lang = langSel.value;
    const data = {};
    for (const id in fields){
      const el = document.getElementById(id);
      if (!el) continue;
      let val = (el.value || '').toString().trim();
      if (!val) continue;
      if (id.startsWith('gi_')) val = JSON.stringify(nlToArray(val).map(API.normalizeUploadUrl));
      if (id === 'g_hero_image') val = API.normalizeUploadUrl(val);
      data[fields[id]] = val;
    }
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_gallery_${k}`);
      if (cb) data[`visible.gallery.${k}`] = cb.checked ? 'true' : 'false';
    });
    const res = await API.api(`/translations/export/${lang}`, { method:'POST', body: JSON.stringify(data) });
    st.textContent = '✅ Exported: ' + (res.path || '');
  } catch(e) { st.textContent = e.message || 'Export failed'; }
}

function bindUploads(){
  uploads.forEach(([targetId, fileId, key, slot]) => {
    const f = document.getElementById(fileId);
    if (!f) return;
    f.addEventListener('change', async () => {
      if (!f.files || !f.files.length) return;
      // support multiple files for lists
      st.textContent = 'Uploading...';
      try {
        const urls = [];
        for (const file of Array.from(f.files)){
          const res = await API.apiUpload(`/upload?slot=${encodeURIComponent(slot)}`, file);
          urls.push(res.url);
        }
        const target = document.getElementById(targetId);
        if (targetId.startsWith('gi_')){
          const existing = nlToArray(target.value);
          target.value = arrayToNl(existing.concat(urls));
        } else {
          target.value = urls[0] || '';
          setThumbHero(target.value);
        }
        st.textContent = 'Uploaded.';
      } catch(e) { st.textContent = e.message || 'Upload failed'; }
      renderAllThumbs();
      saveDraft();
    });
  });
}

function renderThumbsFor(textareaId, gridId){
  const t = document.getElementById(textareaId);
  const grid = document.getElementById(gridId);
  if (!t || !grid) return;
  const urls = nlToArray(t.value);
  grid.innerHTML = '';
  urls.forEach((url, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    const img = document.createElement('img');
    img.src = API.normalizeUploadUrl(url);
    wrap.appendChild(img);
    const btn = document.createElement('button');
    btn.className = 'remove';
    btn.textContent = '×';
    btn.title = 'Удалить';
    btn.addEventListener('click', async () => {
      // remove from list
      const list = nlToArray(t.value);
      list.splice(idx, 1);
      t.value = arrayToNl(list);
      grid.removeChild(wrap);
      // attempt to delete physical file (support local /uploads and Cloudinary URLs)
      if (url.startsWith('/uploads/') || /^https?:/i.test(url)){
        try { await API.api(`/upload?url=${encodeURIComponent(url)}`, { method: 'DELETE' }); } catch {}
      }
    });
    wrap.appendChild(btn);
    grid.appendChild(wrap);
  });
}

function renderAllThumbs(){
  renderThumbsFor('gi_hotel','th_g_hotel');
  renderThumbsFor('gi_rooms','th_g_rooms');
  renderThumbsFor('gi_restaurants','th_g_restaurants');
  renderThumbsFor('gi_pool','th_g_pool');
  renderThumbsFor('gi_spa','th_g_spa');
  renderThumbsFor('gi_events','th_g_events');
}

// live update thumbs when user edits textareas
['gi_hotel','gi_rooms','gi_restaurants','gi_pool','gi_spa','gi_events'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', renderAllThumbs);
});

document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('token'); location.href = 'login.html'; });
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('exportBtn').addEventListener('click', exportJson);
langSel.addEventListener('change', load);
document.getElementById('g_hero_image').addEventListener('input', (e)=> setThumbHero(e.target.value));

document.getElementById('previewBtn').addEventListener('click', () => {
  const lang = langSel.value;
  const url = `${location.origin}/gallery.html?preview=true&draft=1&lang=${encodeURIComponent(lang)}`;
  const draft = {};
  for (const id in fields){
    const el = document.getElementById(id);
    if (!el) continue;
    let val = (el.value || '').toString();
    if (!val.trim()) continue;
    if (id.startsWith('gi_')) val = JSON.stringify(nlToArray(val));
    draft[fields[id]] = val;
  }
  sectionKeys.forEach(k => {
    const cb = document.getElementById(`visible_gallery_${k}`);
    if (cb) draft[`visible.gallery.${k}`] = cb.checked ? 'true' : 'false';
  });
  try { localStorage.setItem(`arp_preview_draft_${lang}`, JSON.stringify(draft)); } catch{}
  window.open(url, '_blank');
  st.textContent = 'Открыт предпросмотр без сохранения.';
});

bindUploads();
load();
renderAllThumbs();

// --- Persist gallery admin values locally to keep thumbnails after refresh ---
function draftKey(){ return `arp_admin_draft_gallery_${langSel.value}`; }
function saveDraft(){
  const data = {};
  Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) data[id] = el.value || ''; });
  sectionKeys.forEach(k => { const cb = document.getElementById(`visible_gallery_${k}`); if (cb) data[`visible_gallery_${k}`] = !!cb.checked; });
  try { localStorage.setItem(draftKey(), JSON.stringify(data)); } catch {}
}
function loadDraft(){
  try {
    const raw = localStorage.getItem(draftKey());
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el && data[id] != null) el.value = data[id]; });
    sectionKeys.forEach(k => { const key = `visible_gallery_${k}`; const cb = document.getElementById(key); if (cb && data[key] != null) cb.checked = !!data[key]; });
  } catch{}
}

// autosave on edit
Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', saveDraft); });
sectionKeys.forEach(k => { const cb = document.getElementById(`visible_gallery_${k}`); if (cb) cb.addEventListener('change', saveDraft); });

// Bulk clear/delete helpers
function clearList(textareaId){
  const t = document.getElementById(textareaId);
  if (!t) return;
  t.value = '';
  renderAllThumbs();
}

async function deleteAllFilesIn(textareaId){
  const t = document.getElementById(textareaId);
  if (!t) return;
  const urls = nlToArray(t.value).filter(u => u.startsWith('/uploads/') || /^https?:/i.test(u));
  for (const u of urls){
    try { await API.api(`/upload?url=${encodeURIComponent(u)}`, { method: 'DELETE' }); } catch {}
  }
  t.value = '';
  renderAllThumbs();
}

const mapBtns = [
  ['clr_g_hotel','gi_hotel'], ['del_g_hotel','gi_hotel'],
  ['clr_g_rooms','gi_rooms'], ['del_g_rooms','gi_rooms'],
  ['clr_g_restaurants','gi_restaurants'], ['del_g_restaurants','gi_restaurants'],
  ['clr_g_pool','gi_pool'], ['del_g_pool','gi_pool'],
  ['clr_g_spa','gi_spa'], ['del_g_spa','gi_spa'],
  ['clr_g_events','gi_events'], ['del_g_events','gi_events']
];
mapBtns.forEach(([btnId, taId], i) => {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (btnId.startsWith('clr_')) btn.addEventListener('click', () => clearList(taId));
  else btn.addEventListener('click', () => deleteAllFilesIn(taId));
});
