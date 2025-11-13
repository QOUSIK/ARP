const st = document.getElementById('status');
const keys = {
  gsc_verification: 'settings.google.site_verification',
  yandex_verification: 'settings.yandex.site_verification',
  ga4_id: 'settings.google.analytics_id',
  gtm_id: 'settings.gtm.container_id',
  fb_pixel_id: 'settings.facebook.pixel_id'
};

async function load() {
  st.textContent = 'Loading...';
  try {
    await Promise.all(Object.entries(keys).map(async ([id, key]) => {
      try {
        const r = await API.api(`/content/${encodeURIComponent(key)}`);
        const el = document.getElementById(id);
        if (el && r && typeof r.value === 'string') el.value = r.value;
      } catch {}
    }));
    st.textContent = 'Loaded.';
  } catch(e){ st.textContent = e.message || 'Failed to load'; }
}

async function save(){
  st.textContent = 'Saving...';
  try {
    for (const [id, key] of Object.entries(keys)){
      const el = document.getElementById(id);
      if (!el) continue;
      await API.api(`/content/${encodeURIComponent(key)}`, { method:'PUT', body: JSON.stringify({ value: el.value || '' }) });
    }
    st.textContent = '✅ Saved.';
  } catch(e){ st.textContent = e.message || 'Failed to save'; }
}

// Logout is handled centrally in js/api.js to clear HttpOnly cookie
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('saveBtn').addEventListener('click', save);

load();
