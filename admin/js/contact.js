const st = document.getElementById('status');
const langSel = document.getElementById('lang');
const defaultLang = 'ru';

// Map fields to keys
const fields = {
  // hero
  'contact_hero_title': 'contact.hero.title',
  'contact_hero_subtitle': 'contact.hero.subtitle',
  'contact_hero_image': 'contact.hero.image',
  // info
  'contact_info_title': 'contact.info.title',
  'contact_phone_title': 'contact.info.phone.title',
  'contact_phone_content': 'contact.info.phone.content',
  'contact_email_title': 'contact.info.email.title',
  'contact_email_content': 'contact.info.email.content',
  'contact_address_title': 'contact.info.address.title',
  'contact_address_content': 'contact.info.address.content',
  'contact_hours_title': 'contact.info.hours.title',
  'contact_hours_content': 'contact.info.hours.content',
  // form
  'contact_form_title': 'contact.form.title',
  'contact_name_label': 'contact.form.name.label',
  'contact_name_ph': 'contact.form.name.placeholder',
  'contact_email_label': 'contact.form.email.label',
  'contact_email_ph': 'contact.form.email.placeholder',
  'contact_phone_label': 'contact.form.phone.label',
  'contact_phone_ph': 'contact.form.phone.placeholder',
  'contact_subject_label': 'contact.form.subject.label',
  'contact_subject_default': 'contact.form.subject.default',
  'contact_subject_res': 'contact.form.subject.reservation',
  'contact_subject_info': 'contact.form.subject.information',
  'contact_subject_compl': 'contact.form.subject.complaint',
  'contact_subject_part': 'contact.form.subject.partnership',
  'contact_subject_other': 'contact.form.subject.other',
  'contact_message_label': 'contact.form.message.label',
  'contact_message_ph': 'contact.form.message.placeholder',
  'contact_submit': 'contact.form.submit',
  // map
  'contact_map_title': 'contact.map.title',
  'contact_map_open': 'contact.map.openInMaps',
  'contact_map_route': 'contact.map.getDirections'
};

const sectionKeys = ['hero','info','form','map'];

function setThumb(id, url){ const img = document.getElementById(id); if (!img) return; if (url && url.trim()){ img.style.display='block'; img.src=API.normalizeUploadUrl(url); img.onerror=()=>{img.style.display='none';}; } else { img.removeAttribute('src'); img.style.display='none'; } }
function updateThumb(){ setThumb('p_contact_hero', document.getElementById('contact_hero_image')?.value); }

function hasContent(obj){
  return obj && Object.keys(obj).length > 0;
}

async function load(){
  st.textContent = 'Loading...';
  const lang = langSel.value;
  try {
    let base={}; try{ const r=await fetch(`/assets/i18n/${lang}.json`, {cache:'no-cache'}); if(r.ok) base = await r.json(); }catch{}
    let db = await API.api(`/translations/contact/${lang}`).catch(()=> ({}));
    let usedFallback = false;
    if (!hasContent(db) && lang !== defaultLang){
      const fallback = await API.api(`/translations/contact/${defaultLang}`).catch(()=> ({}));
      if (hasContent(fallback)){
        db = fallback;
        usedFallback = true;
      }
    }
    const data = Object.assign({}, base, db);
    for (const id in fields){ const el=document.getElementById(id); if(!el) continue; el.value = data[fields[id]] || ''; }
    sectionKeys.forEach(k => { const cb = document.getElementById(`visible_contact_${k}`); if (cb){ const v = data[`visible.contact.${k}`]; cb.checked = !(v === 'false' || v === false); }});
    st.textContent = usedFallback ? 'Loaded (no data for this language, showing RU copy).' : 'Loaded.';
  } catch(e){ st.textContent = e.message || 'Failed to load'; }
  loadDraft(); updateThumb(); bindAutosave();
}

async function save(){
  st.textContent = 'Saving...';
  const lang = langSel.value;
  try{
    const payload = {};
    for (const id in fields){ const el=document.getElementById(id); if(!el) continue; let v=(el.value||'').toString(); if (/\.image$/.test(fields[id])) v = API.normalizeUploadUrl(v); if(v.trim()) payload[fields[id]] = v; }
    sectionKeys.forEach(k => { const cb=document.getElementById(`visible_contact_${k}`); if (cb) payload[`visible.contact.${k}`] = cb.checked ? 'true' : 'false'; });
    await API.api(`/translations/contact/${lang}`, { method:'PATCH', body: JSON.stringify(payload) });
    st.textContent = '✅ Saved.';
  } catch(e){ st.textContent = e.message || 'Failed to save'; }
  saveDraft(); updateThumb();
}

async function exportJson(){
  st.textContent = 'Exporting...';
  try{
    const lang = langSel.value; const data = {};
    for (const id in fields){ const el=document.getElementById(id); if(!el) continue; let v=(el.value||'').toString().trim(); if (/\.image$/.test(fields[id])) v = API.normalizeUploadUrl(v); if(v) data[fields[id]] = v; }
    sectionKeys.forEach(k => { const cb=document.getElementById(`visible_contact_${k}`); if (cb) data[`visible.contact.${k}`] = cb.checked ? 'true' : 'false'; });
    const res = await API.api(`/translations/export/${lang}`, { method:'POST', body: JSON.stringify(data) });
    st.textContent = '✅ Exported: ' + (res.path || '');
  } catch(e){ st.textContent = e.message || 'Export failed'; }
}

function bindUploads(){
  const file = document.getElementById('f_contact_hero');
  if (file) file.addEventListener('change', async () => {
    if (!file.files[0]) return; st.textContent = 'Uploading...';
    try{
      const res = await API.apiUpload(`/upload?slot=contact`, file.files[0]);
      const t = document.getElementById('contact_hero_image'); if (t) t.value = res.url;
      st.textContent = 'Uploaded.';
    } catch(e){ st.textContent = e.message || 'Upload failed'; }
    saveDraft(); updateThumb();
  });
  const t = document.getElementById('contact_hero_image'); if (t) t.addEventListener('input', ()=>{ updateThumb(); saveDraft(); });
}

// Draft persistence
function draftKey(){ return `arp_admin_draft_contact_${langSel.value}`; }
function saveDraft(){ try{ const data={}; for(const id in fields){ const el=document.getElementById(id); if (el) data[id]=el.value||''; } sectionKeys.forEach(k=>{ const cb=document.getElementById(`visible_contact_${k}`); if (cb) data[`visible_contact_${k}`]=!!cb.checked; }); localStorage.setItem(draftKey(), JSON.stringify(data)); }catch{} }
function loadDraft(){ try{ const raw=localStorage.getItem(draftKey()); if(!raw) return; const data=JSON.parse(raw); for(const id in fields){ const el=document.getElementById(id); if(el && data[id]!=null) el.value=data[id]; } sectionKeys.forEach(k=>{ const key=`visible_contact_${k}`; const cb=document.getElementById(key); if (cb && data[key]!=null) cb.checked=!!data[key]; }); }catch{} }
function bindAutosave(){ for(const id in fields){ const el=document.getElementById(id); if (el) el.addEventListener('input', saveDraft); } sectionKeys.forEach(k=>{ const cb=document.getElementById(`visible_contact_${k}`); if (cb) cb.addEventListener('change', saveDraft); }); }

// Handlers
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('token'); location.href='login.html'; });
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('exportBtn').addEventListener('click', exportJson);
langSel.addEventListener('change', load);
document.getElementById('previewBtn').addEventListener('click', () => {
  const lang = langSel.value; const url = `${location.origin}/Contact-Us.html?preview=true&draft=1&lang=${encodeURIComponent(lang)}`;
  const draft = {}; for(const id in fields){ const el=document.getElementById(id); if(!el) continue; let v=(el.value||'').toString(); if (/\.image$/.test(fields[id])) v = API.normalizeUploadUrl(v); if(v.trim()) draft[fields[id]]=v; }
  sectionKeys.forEach(k=>{ const cb=document.getElementById(`visible_contact_${k}`); if (cb) draft[`visible.contact.${k}`]=cb.checked?'true':'false'; });
  try{ localStorage.setItem(`arp_preview_draft_${lang}`, JSON.stringify(draft)); }catch{}
  window.open(url,'_blank'); st.textContent='Открыт предпросмотр без сохранения.';
});

bindUploads();
load();
