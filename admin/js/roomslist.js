const st = document.getElementById('status');
const langSel = document.getElementById('lang');
const defaultLang = 'ru';

const slugs = [
  ['economy','Economy'],
  ['standard','Standard'],
  ['comfort','Comfort'],
  ['queen','Queen Suite'],
  ['king','King Suite']
];

// Dynamically render forms for cards
const container = document.getElementById('roomsForms');
container.innerHTML = slugs.map(([slug, label]) => `
  <div class="card" style="margin-top:16px;">
    <h3 style="margin-top:0;">
      ${label}
      <label class="toggle"><input type="checkbox" id="visible_rooms_${slug}" checked> Показать</label>
    </h3>
    <div class="upload-card">
      <img class="upload-preview" id="p_rooms_${slug}" alt="preview">
      <input id="rooms_image_${slug}"><input type="file" id="f_rooms_${slug}">
    </div>
    <div class="grid-3">
      <label>Бейдж <input id="rooms_${slug}_badge"></label>
      <label>Заголовок <input id="rooms_${slug}_title"></label>
      <label>Описание <textarea id="rooms_${slug}_desc" rows="3"></textarea></label>
    </div>
  </div>
`).join('');

// Map inputs to keys
const fields = {
  'hero_title': 'hero.title',
  'hero_subtitle': 'hero.subtitle',
  'rooms_hero_image': 'rooms.hero.image'
};
slugs.forEach(([slug]) => {
  fields[`rooms_image_${slug}`] = `rooms.image.${slug}`;
  fields[`rooms_${slug}_badge`] = `rooms.${slug}.badge`;
  fields[`rooms_${slug}_title`] = `rooms.${slug}.title`;
  fields[`rooms_${slug}_desc`] = `rooms.${slug}.description`;
});

const sectionKeys = ['hero'].concat(slugs.map(([s])=>s));

function setThumb(id, url){ const img = document.getElementById(id); if (!img) return; if (url && url.trim()){ img.style.display='block'; img.src=url; img.onerror=()=>{img.style.display='none';}; } else { img.removeAttribute('src'); img.style.display='none'; } }
function updateThumbs(){ setThumb('p_rooms_hero', document.getElementById('rooms_hero_image')?.value); slugs.forEach(([slug]) => setThumb(`p_rooms_${slug}`, document.getElementById(`rooms_image_${slug}`)?.value)); }

function hasContent(obj){
  return obj && Object.keys(obj).length > 0;
}

async function load(){
  st.textContent = 'Loading...';
  const lang = langSel.value;
  try {
    // base json
    let base={}; try{ const r = await fetch(`/assets/i18n/${lang}.json`, {cache:'no-cache'}); if(r.ok) base = await r.json(); }catch{}
    let db = await API.api(`/translations/roomslist/${lang}`).catch(()=> ({}));
    let usedFallback = false;
    if (!hasContent(db) && lang !== defaultLang){
      const fallback = await API.api(`/translations/roomslist/${defaultLang}`).catch(()=> ({}));
      if (hasContent(fallback)){
        db = fallback;
        usedFallback = true;
      }
    }
    const data = Object.assign({}, base, db);
    // fill
    for (const id in fields){ const el = document.getElementById(id); if (!el) continue; el.value = data[fields[id]] || ''; }
    sectionKeys.forEach(k => { const cb = document.getElementById(`visible_rooms_${k}`); if (cb){ const v = data[`visible.rooms.${k}`]; cb.checked = !(v === 'false' || v === false); }});
    st.textContent = usedFallback ? 'Loaded (no data for this language, showing RU copy).' : 'Loaded.';
  } catch(e){ st.textContent = e.message || 'Failed to load'; }
  loadDraft();
  updateThumbs();
  bindAutosave();
}

async function save(){
  st.textContent = 'Saving...';
  const lang = langSel.value;
  try {
    const payload = {};
    for (const id in fields){ const el = document.getElementById(id); if (!el) continue; const v = (el.value || '').toString(); if (v.trim()) payload[fields[id]] = v; }
    sectionKeys.forEach(k => { const cb = document.getElementById(`visible_rooms_${k}`); if (cb) payload[`visible.rooms.${k}`] = cb.checked ? 'true' : 'false'; });
    await API.api(`/translations/roomslist/${lang}`, { method:'PATCH', body: JSON.stringify(payload) });
    st.textContent = '✅ Saved.';
  } catch(e){ st.textContent = e.message || 'Failed to save'; }
  saveDraft();
  updateThumbs();
}

async function exportJson(){
  st.textContent = 'Exporting...';
  try{
    const lang = langSel.value; const data = {};
    for (const id in fields){ const el = document.getElementById(id); if (!el) continue; const v = (el.value || '').toString().trim(); if (v) data[fields[id]] = v; }
    sectionKeys.forEach(k => { const cb = document.getElementById(`visible_rooms_${k}`); if (cb) data[`visible.rooms.${k}`] = cb.checked ? 'true' : 'false'; });
    const res = await API.api(`/translations/export/${lang}`, { method:'POST', body: JSON.stringify(data) });
    st.textContent = '✅ Exported: ' + (res.path || '');
  } catch(e){ st.textContent = e.message || 'Export failed'; }
}

function bindUploads(){
  const uploads = [['rooms_hero_image','f_rooms_hero','rooms.hero.image','rooms']].concat(slugs.map(([slug])=>[`rooms_image_${slug}`,`f_rooms_${slug}`,`rooms.image.${slug}`,'rooms']));
  uploads.forEach(([textId, fileId, key, slot]) => {
    const f = document.getElementById(fileId); if (!f) return;
    f.addEventListener('change', async () => {
      if (!f.files[0]) return; st.textContent = 'Uploading...';
      try{
        const res = await API.apiUpload(`/upload?slot=${encodeURIComponent(slot)}`, f.files[0]);
        const t = document.getElementById(textId); if (t) t.value = res.url;
        st.textContent = 'Uploaded.';
      } catch(e){ st.textContent = e.message || 'Upload failed'; }
      saveDraft(); updateThumbs();
    });
    const t = document.getElementById(textId); if (t) t.addEventListener('input', ()=>{ updateThumbs(); saveDraft(); });
  });
}

// Draft persistence
function draftKey(){ return `arp_admin_draft_roomslist_${langSel.value}`; }
function saveDraft(){ try{ const data={}; for(const id in fields){ const el=document.getElementById(id); if (el) data[id]=el.value||''; } sectionKeys.forEach(k=>{ const cb=document.getElementById(`visible_rooms_${k}`); if (cb) data[`visible_rooms_${k}`]=!!cb.checked; }); localStorage.setItem(draftKey(), JSON.stringify(data)); }catch{} }
function loadDraft(){ try{ const raw=localStorage.getItem(draftKey()); if(!raw) return; const data=JSON.parse(raw); for(const id in fields){ const el=document.getElementById(id); if(el && data[id]!=null) el.value=data[id]; } sectionKeys.forEach(k=>{ const key=`visible_rooms_${k}`; const cb=document.getElementById(key); if (cb && data[key]!=null) cb.checked=!!data[key]; }); }catch{} }
function bindAutosave(){ for(const id in fields){ const el=document.getElementById(id); if (el) el.addEventListener('input', saveDraft); } sectionKeys.forEach(k=>{ const cb=document.getElementById(`visible_rooms_${k}`); if (cb) cb.addEventListener('change', saveDraft); }); }

// Handlers
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('token'); location.href='login.html'; });
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('exportBtn').addEventListener('click', exportJson);
langSel.addEventListener('change', load);
document.getElementById('previewBtn').addEventListener('click', () => {
  const lang = langSel.value; const url = `${location.origin}/Room.html?preview=true&draft=1&lang=${encodeURIComponent(lang)}`;
  const draft = {}; for(const id in fields){ const el=document.getElementById(id); if(!el) continue; const v=(el.value||'').toString(); if(v.trim()) draft[fields[id]]=v; }
  sectionKeys.forEach(k=>{ const cb=document.getElementById(`visible_rooms_${k}`); if (cb) draft[`visible.rooms.${k}`]=cb.checked?'true':'false'; });
  try{ localStorage.setItem(`arp_preview_draft_${lang}`, JSON.stringify(draft)); }catch{}
  window.open(url,'_blank'); st.textContent='Открыт предпросмотр без сохранения.';
});

bindUploads();
load();
