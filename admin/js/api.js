const API_BASE = location.origin.replace(/\/admin.*/,'') + "/api";

// Normalize uploaded image URLs (identity for Cloudinary secure_url)
function normalizeUploadUrl(u){ return (u == null) ? "" : String(u); }

async function api(path, opts={}) {
  const headers = Object.assign({ "Content-Type":"application/json", "X-Requested-With":"fetch" }, opts.headers || {});
  const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers, credentials: 'same-origin' }));
  if (res.status === 401) {
    if (!/\/admin\/login\.html$/i.test(location.pathname)) location.href = 'login.html';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let msg = "Request failed";
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}
async function apiUpload(path, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(API_BASE + path, {
    method: "POST",
    body: fd,
    credentials: 'same-origin'
  });
  if (res.status === 401) { if (!/\/admin\/login\.html$/i.test(location.pathname)) location.href = 'login.html'; throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

async function ensureAuth() {
  try { await api('/auth/me', { method: 'GET' }); } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  if (!/\/admin\/login\.html$/i.test(location.pathname)) ensureAuth();
  const btn = document.getElementById('logoutBtn');
  if (btn && !btn._wired) {
    btn.addEventListener('click', async (e) => {
      try {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
        await api('/auth/logout', { method: 'POST' });
      } catch {}
      location.href = 'login.html';
    }, true);
    btn._wired = true;
  }
});

window.API = { api, apiUpload, normalizeUploadUrl };
