const st = document.getElementById('status');
const langSel = document.getElementById('lang');

// Map inputs to keys
const fields = {
  // hero
  'hero_title': 'hero.title',
  'hero_subtitle': 'hero.subtitle',
  // story
  'story_title': 'story.title',
  'story_p1': 'story.p1',
  'story_p2': 'story.p2',
  'story_p3': 'story.p3',
  'story_imageText': 'story.imageText',
  // features
  'features_title': 'features.title',
  'f1_title': 'features.1.title',
  'f1_text': 'features.1.text',
  'f2_title': 'features.2.title',
  'f2_text': 'features.2.text',
  'f3_title': 'features.3.title',
  'f3_text': 'features.3.text',
  'f4_title': 'features.4.title',
  'f4_text': 'features.4.text',
  'f5_title': 'features.5.title',
  'f5_text': 'features.5.text',
  'f6_title': 'features.6.title',
  'f6_text': 'features.6.text',
  // numbers labels
  'numbers_1': 'numbers.1',
  'numbers_2': 'numbers.2',
  'numbers_3': 'numbers.3',
  // team
  'team_title': 'team.title',
  't1_name': 'team.1.name',
  't1_pos': 'team.1.position',
  't1_desc': 'team.1.description',
  't2_name': 'team.2.name',
  't2_pos': 'team.2.position',
  't2_desc': 'team.2.description',
  't3_name': 'team.3.name',
  't3_pos': 'team.3.position',
  't3_desc': 'team.3.description',
  't4_name': 'team.4.name',
  't4_pos': 'team.4.position',
  't4_desc': 'team.4.description',
  // cta
  'cta_title': 'cta.title',
  'cta_description': 'cta.description',
  'cta_button': 'cta.button',
  // images
  'about_hero_image': 'about.hero.image',
  'about_story_image': 'about.story.image',
  'about_numbers_image': 'about.numbers.image'
};

const sectionKeys = ['hero','story','features','numbers','team','cta'];

const imageInputs = [
  ['about_hero_image','f_about_hero','about.hero.image','about'],
  ['about_story_image','f_about_story','about.story.image','about'],
  ['about_numbers_image','f_about_numbers','about.numbers.image','about']
];

function setThumb(id, url){
  const img = document.getElementById(id);
  if (!img) return;
  if (url && url.trim()){
    img.style.display = 'block';
    img.src = API.normalizeUploadUrl(url);
    img.onerror = () => { img.style.display = 'none'; };
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
  }
}

function updateImagePreviews(){
  setThumb('p_about_hero', document.getElementById('about_hero_image')?.value);
  setThumb('p_about_story', document.getElementById('about_story_image')?.value);
  setThumb('p_about_numbers', document.getElementById('about_numbers_image')?.value);
}

// --- Persist admin values locally to keep thumbnails on refresh ---
function draftKey(){ return `arp_admin_draft_about_${langSel.value}`; }
function saveDraft(){
  const data = {};
  Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) data[id] = el.value || ''; });
  sectionKeys.forEach(k => { const cb = document.getElementById(`visible_about_${k}`); if (cb) data[`visible_about_${k}`] = !!cb.checked; });
  try { localStorage.setItem(draftKey(), JSON.stringify(data)); } catch {}
}
function loadDraft(){
  try {
    const raw = localStorage.getItem(draftKey());
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(fields).forEach(id => { if (data[id] != null) { const el = document.getElementById(id); if (el) el.value = data[id]; }});
    sectionKeys.forEach(k => { const key = `visible_about_${k}`; if (data[key] != null) { const cb = document.getElementById(key); if (cb) cb.checked = !!data[key]; }});
  } catch {}
}
function bindAutosave(){
  Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', saveDraft); });
  sectionKeys.forEach(k => { const cb = document.getElementById(`visible_about_${k}`); if (cb) cb.addEventListener('change', saveDraft); });
}

async function load() {
  st.textContent = 'Loading...';
  const lang = langSel.value;
  try {
    // base JSON from assets
    let base = {};
    try {
      const r = await fetch(`/assets/i18n/${lang}.json`, { cache: 'no-cache' });
      if (r.ok) base = await r.json();
    } catch {}
    // overlay from DB
    const db = await API.api(`/translations/about/${lang}`);
    const data = Object.assign({}, base, db);
    // fill fields
    for (const id in fields) {
      const key = fields[id];
      const el = document.getElementById(id);
      if (!el) continue;
      el.value = data[key] || '';
    }
    // visibility checkboxes
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_about_${k}`);
      if (cb){
        const v = data[`visible.about.${k}`];
        cb.checked = !(v === 'false' || v === false);
      }
    });

    st.textContent = 'Loaded.';
  } catch (e) {
    st.textContent = e.message || 'Failed to load';
  }
  loadDraft();
  updateImagePreviews();
  bindAutosave();
}

async function save() {
  st.textContent = 'Saving...';
  const lang = langSel.value;
  try {
    const payload = {};
    for (const id in fields) {
      const key = fields[id];
      const el = document.getElementById(id);
      if (!el) continue;
      let val = (el.value || '').toString();
      if (/\.image$/.test(key)) val = API.normalizeUploadUrl(val);
      if (val.trim()) payload[key] = val;
    }
    // visibility
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_about_${k}`);
      if (cb) payload[`visible.about.${k}`] = cb.checked ? 'true' : 'false';
    });
    await API.api(`/translations/about/${lang}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    st.textContent = '✅ Saved.';
  } catch (e) {
    st.textContent = e.message || 'Failed to save';
  }
  saveDraft();
  updateImagePreviews();
}

async function exportJson(){
  st.textContent = 'Exporting...';
  try {
    // Get latest JSON and DB about keys to produce filtered export
    const lang = langSel.value;
    // Gather only non-empty fields
    const data = {};
    for (const id in fields) {
      const key = fields[id];
      const el = document.getElementById(id);
      if (!el) continue;
      const v = (el.value || '').toString().trim();
      if (v) data[key] = v;
    }
    // include visibility flags
    sectionKeys.forEach(k => {
      const cb = document.getElementById(`visible_about_${k}`);
      if (cb) data[`visible.about.${k}`] = cb.checked ? 'true' : 'false';
    });
    const res = await API.api(`/translations/export/${lang}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    st.textContent = '✅ Exported: ' + (res.path || '');
  } catch (e) {
    st.textContent = e.message || 'Export failed';
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  location.href = 'login.html';
});

document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('exportBtn').addEventListener('click', exportJson);
langSel.addEventListener('change', load);

document.getElementById('previewBtn').addEventListener('click', async () => {
  const lang = langSel.value;
  const url = `${location.origin}/about.html?preview=true&draft=1&lang=${encodeURIComponent(lang)}`;

  // snapshot draft to localStorage
  const draft = {};
  for (const id in fields) {
    const key = fields[id];
    const el = document.getElementById(id);
    if (!el) continue;
    let val = (el.value || '').toString();
    if (/\.image$/.test(key)) val = API.normalizeUploadUrl(val);
    if (val.trim()) draft[key] = val;
  }
  sectionKeys.forEach(k => {
    const cb = document.getElementById(`visible_about_${k}`);
    if (cb) draft[`visible.about.${k}`] = cb.checked ? 'true' : 'false';
  });
  try { localStorage.setItem(`arp_preview_draft_${lang}`, JSON.stringify(draft)); } catch {}
  window.open(url, '_blank');
  st.textContent = 'Открыт предпросмотр без сохранения.';
});

// init
function bindUploads(){
  imageInputs.forEach(([textId, fileId, key, slot]) => {
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
      } catch (e) {
        st.textContent = e.message || 'Upload failed';
      }
      updateImagePreviews();
      saveDraft();
    });
    const t = document.getElementById(textId);
    if (t) t.addEventListener('input', updateImagePreviews);
  });
}

bindUploads();
load();
