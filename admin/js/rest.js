const st = document.getElementById('status');
const langSel = document.getElementById('lang');
const defaultLang = 'ru';

// Field map
const fields = {
  // hero
  'rest_hero_title': 'rest.hero.title',
  'rest_hero_subtitle': 'rest.hero.subtitle',
  'rest_hero_image': 'rest.hero.image',
  // main
  'rest_image_main': 'rest.image.main',
  'r_main_title': 'restaurant.main.title',
  'r_main_desc': 'restaurant.main.description',
  'r_main_hours': 'restaurant.main.hours',
  'r_main_breakfast': 'restaurant.main.breakfast',
  'r_main_lunch': 'restaurant.main.lunch',
  'r_main_dinner': 'restaurant.main.dinner',
  'r_main_f1': 'restaurant.main.feature1',
  'r_main_f2': 'restaurant.main.feature2',
  'r_main_f3': 'restaurant.main.feature3',
  // harem
  'rest_image_harem': 'rest.image.harem',
  'r_harem_title': 'restaurant.harem.title',
  'r_harem_desc': 'restaurant.harem.description',
  'r_harem_note': 'restaurant.harem.note',
  'r_harem_f1': 'restaurant.harem.feature1',
  'r_harem_f2': 'restaurant.harem.feature2',
  'r_harem_f3': 'restaurant.harem.feature3',
  // agora
  'rest_image_agora': 'rest.image.agora',
  'r_agora_title': 'restaurant.agora.title',
  'r_agora_desc': 'restaurant.agora.description',
  'r_agora_drink': 'restaurant.agora.drinkService',
  'r_agora_snacks': 'restaurant.agora.snacks',
  'r_agora_f1': 'restaurant.agora.feature1',
  'r_agora_f2': 'restaurant.agora.feature2',
  'r_agora_f3': 'restaurant.agora.feature3',
  // american
  'rest_image_american': 'rest.image.american',
  'r_american_title': 'restaurant.american.title',
  'r_american_desc': 'restaurant.american.description',
  'r_american_note': 'restaurant.american.note',
  'r_american_f1': 'restaurant.american.feature1',
  'r_american_f2': 'restaurant.american.feature2',
  'r_american_f3': 'restaurant.american.feature3',
  // beach
  'rest_image_beach': 'rest.image.beach',
  'r_beach_title': 'restaurant.beach.title',
  'r_beach_desc': 'restaurant.beach.description',
  'r_beach_open': 'restaurant.beach.open',
  'r_beach_note': 'restaurant.beach.note',
  'r_beach_f1': 'restaurant.beach.feature1',
  'r_beach_f2': 'restaurant.beach.feature2',
  'r_beach_f3': 'restaurant.beach.feature3'
};

const sectionKeys = ['hero','main','harem','agora','american','beach'];

const uploads = [
  ['rest_hero_image','f_rest_hero','rest.hero.image','rest'],
  ['rest_image_main','f_rest_main','rest.image.main','rest'],
  ['rest_image_harem','f_rest_harem','rest.image.harem','rest'],
  ['rest_image_agora','f_rest_agora','rest.image.agora','rest'],
  ['rest_image_american','f_rest_american','rest.image.american','rest'],
  ['rest_image_beach','f_rest_beach','rest.image.beach','rest']
];

function setThumb(id, url){
  const img = document.getElementById(id);
  if (!img) return;
  if (url && url.trim()){
    img.style.display = 'block';
    img.src = url;
    img.onerror = () => { img.style.display = 'none'; };
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
  }
}

function updateThumbs(){
  setThumb('p_rest_hero', document.getElementById('rest_hero_image')?.value);
  setThumb('p_rest_main', document.getElementById('rest_image_main')?.value);
  setThumb('p_rest_harem', document.getElementById('rest_image_harem')?.value);
  setThumb('p_rest_agora', document.getElementById('rest_image_agora')?.value);
  setThumb('p_rest_american', document.getElementById('rest_image_american')?.value);
  setThumb('p_rest_beach', document.getElementById('rest_image_beach')?.value);
}

// --- Persist values locally so thumbnails survive refresh ---
function draftKey(){ return `arp_admin_draft_rest_${langSel.value}`; }
function saveDraft(){
  const data = {};
  Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) data[id] = el.value || ''; });
  sectionKeys.forEach(k => { const cb = document.getElementById(`visible_rest_${k}`); if (cb) data[`visible_rest_${k}`] = !!cb.checked; });
  try { localStorage.setItem(draftKey(), JSON.stringify(data)); } catch {}
}
function loadDraft(){
  try {
    const raw = localStorage.getItem(draftKey());
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el && data[id] != null) el.value = data[id]; });
    sectionKeys.forEach(k => { const key = `visible_rest_${k}`; const cb = document.getElementById(key); if (cb && data[key] != null) cb.checked = !!data[key]; });
  } catch {}
}
function bindAutosave(){
  Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', saveDraft); });
  sectionKeys.forEach(k => { const cb = document.getElementById(`visible_rest_${k}`); if (cb) cb.addEventListener('change', saveDraft); });
}

function hasContent(obj){
  return obj && Object.keys(obj).length > 0;
}

async function load(){
  st.textContent = 'Loading...';
  const lang = langSel.value;
  try {
    // base json
    let base = {};
    try {
      const r = await fetch(`/assets/i18n/${lang}.json`, {cache:'no-cache'});
      if (r.ok) base = await r.json();
    } catch {}
    let db = await API.api(`/translations/rest/${lang}`).catch(()=> ({}));
    let usedFallback = false;
    if (!hasContent(db) && lang !== defaultLang){
      const fallback = await API.api(`/translations/rest/${defaultLang}`).catch(()=> ({}));
      if (hasContent(fallback)){
        db = fallback;
        usedFallback = true;
      }
    }
    const data = Object.assign({}, base, db);
    for (const id in fields){
      const el = document.getElementById(id);
      if (!el) continue;
      el.value = data[fields[id]] || '';
    }
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_rest_${k}`);
      if (cb) {
        const v = data[`visible.rest.${k}`];
        cb.checked = !(v === 'false' || v === false);
      }
    });
    st.textContent = usedFallback ? 'Loaded (no data for this language, showing RU copy).' : 'Loaded.';
  } catch(e) {
    st.textContent = e.message || 'Failed to load';
  }
  loadDraft();
  updateThumbs();
  bindAutosave();
}

async function save(){
  st.textContent = 'Saving...';
  const lang = langSel.value;
  try {
    const payload = {};
    for (const id in fields){
      const el = document.getElementById(id);
      if (!el) continue;
      const v = (el.value || '').toString();
      if (v.trim()) payload[fields[id]] = v;
    }
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_rest_${k}`);
      if (cb) payload[`visible.rest.${k}`] = cb.checked ? 'true' : 'false';
    });
    await API.api(`/translations/rest/${lang}`, { method:'PATCH', body: JSON.stringify(payload) });
    st.textContent = '✅ Saved.';
  } catch(e) {
    st.textContent = e.message || 'Failed to save';
  }
  saveDraft();
  updateThumbs();
}

async function exportJson(){
  st.textContent = 'Exporting...';
  try {
    const lang = langSel.value;
    const data = {};
    for (const id in fields){
      const el = document.getElementById(id);
      if (!el) continue;
      const v = (el.value || '').toString().trim();
      if (v) data[fields[id]] = v;
    }
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_rest_${k}`);
      if (cb) data[`visible.rest.${k}`] = cb.checked ? 'true' : 'false';
    });
    const res = await API.api(`/translations/export/${lang}`, { method:'POST', body: JSON.stringify(data) });
    st.textContent = '✅ Exported: ' + (res.path || '');
  } catch(e) {
    st.textContent = e.message || 'Export failed';
  }
}

function bindUploads(){
  uploads.forEach(([textId, fileId, key, slot]) => {
    const file = document.getElementById(fileId);
    if (!file) return;
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      st.textContent = 'Uploading...';
      try {
        const res = await API.apiUpload(`/upload?slot=${encodeURIComponent(slot)}`, file.files[0]);
        const t = document.getElementById(textId);
        if (t) t.value = res.url;
        st.textContent = 'Uploaded.';
      } catch(e) {
        st.textContent = e.message || 'Upload failed';
      }
      updateThumbs();
      saveDraft();
    });
    const t = document.getElementById(textId);
    if (t) t.addEventListener('input', updateThumbs);
  });
}

document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('token'); location.href = 'login.html'; });
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('exportBtn').addEventListener('click', exportJson);
langSel.addEventListener('change', load);

document.getElementById('previewBtn').addEventListener('click', () => {
  const lang = langSel.value;
  const url = `${location.origin}/Rest-Bar.html?preview=true&draft=1&lang=${encodeURIComponent(lang)}`;
  const draft = {};
  for (const id in fields){
    const el = document.getElementById(id);
    if (!el) continue;
    const v = (el.value || '').toString();
    if (v.trim()) draft[fields[id]] = v;
  }
  sectionKeys.forEach(k => {
    const cb = document.getElementById(`visible_rest_${k}`);
    if (cb) draft[`visible.rest.${k}`] = cb.checked ? 'true' : 'false';
  });
  try { localStorage.setItem(`arp_preview_draft_${lang}`, JSON.stringify(draft)); } catch {}
  window.open(url, '_blank');
  st.textContent = 'Открыт предпросмотр без сохранения.';
});

bindUploads();
load();
