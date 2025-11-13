const st = document.getElementById('status');
const langSel = document.getElementById('lang');
const slugSel = document.getElementById('slug');
const defaultLang = 'ru';

const fields = {
  'hero_image': s => `room.${s}.hero.image`,
  'slides': s => `room.${s}.slides`,
  'area': s => `room.${s}.area`,
  'flooring': s => `room.${s}.flooring`,
  'view': s => `room.${s}.view`,
  'tv': s => `room.${s}.tv`,
  'bedType': s => `room.${s}.bedType`,
  'capacity': s => `room.${s}.capacity`,
  'smoking': s => `room.${s}.smoking`,
  'balcony': s => `room.${s}.balcony`,
  'checkin': s => `room.${s}.checkin`,
  'checkout': s => `room.${s}.checkout`,
  // also edit hero texts that are used on both Room list and detail
  'rooms_title': s => `rooms.${s}.title`,
  'rooms_desc': s => `rooms.${s}.description`
};
const visKeys = {
  'v_hero': s => `visible.room.${s}.hero`,
  'v_slider': s => `visible.room.${s}.slider`,
  'v_info': s => `visible.room.${s}.info`,
  'v_features': s => `visible.room.${s}.features`
};

function setThumb(url){ const img = document.getElementById('p_hero'); if (!img) return; if (url && url.trim()){ img.style.display='block'; img.src=url; img.onerror=()=>{img.style.display='none';}; } else { img.removeAttribute('src'); img.style.display='none'; } }
function nlToArray(text){ return (text || '').split(/\r?\n/).map(s=>s.trim()).filter(Boolean); }
function arrayToNl(arr){ return (arr || []).join('\n'); }

function hasContent(obj){
  return obj && Object.keys(obj).length > 0;
}

async function load(){
  st.textContent = 'Loading...';
  const lang = langSel.value; const slug = slugSel.value;
  try{
    let [detail, roomsList] = await Promise.all([
      API.api(`/translations/roomdetail/${slug}/${lang}`),
      API.api(`/translations/roomslist/${lang}`).catch(()=>({}))
    ]);
    let usedFallback = false;
    if (!hasContent(detail) && lang !== defaultLang){
      detail = await API.api(`/translations/roomdetail/${slug}/${defaultLang}`).catch(()=> (detail));
      if (hasContent(detail)) usedFallback = true;
    }
    if (!hasContent(roomsList) && lang !== defaultLang){
      roomsList = await API.api(`/translations/roomslist/${defaultLang}`).catch(()=> (roomsList));
      if (hasContent(roomsList)) usedFallback = true;
    }
    const data = Object.assign({}, roomsList||{}, detail||{});
    for (const id in fields){ const el=document.getElementById(id); if (!el) continue; let val = data[fields[id](slug)] || ''; if (id==='slides' && typeof val==='string' && val.trim().startsWith('[')){ try{ val = arrayToNl(JSON.parse(val)); }catch{} } el.value = val; }
    for (const id in visKeys){ const cb=document.getElementById(id); if (cb){ const v = data[visKeys[id](slug)]; cb.checked = !(v === 'false' || v === false); }}
    st.textContent = usedFallback ? 'Loaded (no data for this language, showing RU copy).' : 'Loaded.';
  } catch(e){ st.textContent = e.message || 'Failed to load'; }
  setThumb(document.getElementById('hero_image')?.value);
}

async function save(){
  st.textContent = 'Saving...';
  const lang = langSel.value; const slug = slugSel.value;
  try{
    const payloadDetail = {};
    const payloadRooms = {};
    for (const id in fields){
      const el=document.getElementById(id); if(!el) continue; let val=(el.value||'').toString(); if (!val.trim()) continue;
      if (id==='slides') val = JSON.stringify(nlToArray(val));
      const key = fields[id](slug);
      if (key.startsWith('room.')) payloadDetail[key] = val; else payloadRooms[key] = val;
    }
    for (const id in visKeys){ const cb=document.getElementById(id); if (cb) payloadDetail[visKeys[id](slug)] = cb.checked ? 'true' : 'false'; }
    if (Object.keys(payloadDetail).length) await API.api(`/translations/roomdetail/${slug}/${lang}`, { method:'PATCH', body: JSON.stringify(payloadDetail) });
    if (Object.keys(payloadRooms).length) await API.api(`/translations/roomslist/${lang}`, { method:'PATCH', body: JSON.stringify(payloadRooms) });
    st.textContent = '✅ Saved.';
  } catch(e){ st.textContent = e.message || 'Failed to save'; }
}

document.getElementById('logoutBtn').addEventListener('click', ()=>{ localStorage.removeItem('token'); location.href='login.html'; });
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('saveBtn').addEventListener('click', save);
[document.getElementById('exportBtn')].forEach(btn=>btn&&btn.addEventListener('click', exportJson));
langSel.addEventListener('change', load);
slugSel.addEventListener('change', load);

document.getElementById('previewBtn').addEventListener('click', () => {
  const lang = langSel.value; const slug=slugSel.value; const url = `${location.origin}/room/${slug.charAt(0).toUpperCase()+slug.slice(1)}.html?preview=true&draft=1&lang=${encodeURIComponent(lang)}`;
  const draft = {}; for (const id in fields){ const el=document.getElementById(id); if(!el) continue; let val=(el.value||'').toString(); if(!val.trim()) continue; if (id==='slides') val = JSON.stringify(nlToArray(val)); draft[fields[id](slug)] = val; }
  for (const id in visKeys){ const cb=document.getElementById(id); if (cb) draft[visKeys[id](slug)] = cb.checked ? 'true' : 'false'; }
  try{ localStorage.setItem(`arp_preview_draft_${lang}`, JSON.stringify(draft)); }catch{}
  window.open(url,'_blank'); st.textContent='Открыт предпросмотр без сохранения.';
});

// uploads
document.getElementById('f_hero').addEventListener('change', async (e)=>{
  const file = e.target.files[0]; if (!file) return; st.textContent='Uploading...'; try{ const res = await API.apiUpload(`/upload?slot=room-${slugSel.value}`, file); document.getElementById('hero_image').value = res.url; st.textContent='Uploaded.'; setThumb(res.url); }catch(err){ st.textContent = err.message || 'Upload failed'; }
});
document.getElementById('hero_image').addEventListener('input', e=> setThumb(e.target.value));
document.getElementById('f_slides').addEventListener('change', async (e)=>{
  const files = Array.from(e.target.files||[]); if (!files.length) return; st.textContent='Uploading...'; try{ const urls=[]; for (const f of files){ const r=await API.apiUpload(`/upload?slot=room-${slugSel.value}`, f); urls.push(r.url); } const t=document.getElementById('slides'); const existing = t.value ? t.value + '\n' : ''; t.value = existing + urls.join('\n'); st.textContent='Uploaded.'; }catch(err){ st.textContent = err.message || 'Upload failed'; }
});

load();

async function exportJson(){
  st.textContent = 'Exporting...';
  const lang = langSel.value; const slug = slugSel.value;
  try{
    const payload = {};
    for (const id in fields){ const el=document.getElementById(id); if(!el) continue; let val=(el.value||'').toString().trim(); if(!val) continue; if (id==='slides') val = JSON.stringify(nlToArray(val)); payload[fields[id](slug)] = val; }
    for (const id in visKeys){ const cb=document.getElementById(id); if (cb) payload[visKeys[id](slug)] = cb.checked ? 'true' : 'false'; }
    const res = await API.api(`/translations/export/${lang}`, { method:'POST', body: JSON.stringify(payload) });
    st.textContent = '✅ Exported: ' + (res.path || '');
  } catch(e){ st.textContent = e.message || 'Export failed'; }
}
