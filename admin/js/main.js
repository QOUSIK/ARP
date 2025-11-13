function $(id) {
  return document.getElementById(id);
}

const st = $("status");
const langSel = $("lang");

const sectionKeys = ["hero", "welcome", "comfort", "taste", "apartments"];

const imageInputs = [
  ["hero_image1", "f_hero1", "hero.image1", "hero"],
  ["hero_image2", "f_hero2", "hero.image2", "hero"],
  ["hero_image3", "f_hero3", "hero.image3", "hero"],
  ["hero_image4", "f_hero4", "hero.image4", "hero"],
  ["hero_image5", "f_hero5", "hero.image5", "hero"],
  ["welcome_image", "f_welcome", "welcome.image", "welcome"],
  ["comfort_image", "f_comfort", "comfort.image", "comfort"],
  ["taste_image", "f_taste", "taste.image", "taste"]
];

// --- Persist form values locally so thumbnails survive refresh ---
function draftKey() { return `arp_admin_draft_main_${langSel.value}`; }
const inputIds = [
  'hero_greeting','hero_name','hero_age',
  'hero_image1','hero_image2','hero_image3','hero_image4','hero_image5',
  'welcome_title','welcome_p1','hotel_discover','welcome_image',
  'comfort_title','comfort_p','explore_rooms','comfort_image',
  'taste_title','taste_p','view_amenities','taste_image',
  'apartments_title'
];
const cbIds = ['visible_hero','visible_welcome','visible_comfort','visible_taste','visible_apartments'];

function saveDraft(){
  const data = {};
  inputIds.forEach(id => { const el = document.getElementById(id); if (el) data[id] = el.value || ''; });
  cbIds.forEach(id => { const el = document.getElementById(id); if (el) data[id] = !!el.checked; });
  try { localStorage.setItem(draftKey(), JSON.stringify(data)); } catch {}
}
function loadDraft(){
  try {
    const raw = localStorage.getItem(draftKey());
    if (!raw) return;
    const data = JSON.parse(raw);
    inputIds.forEach(id => { if (data[id] != null) { const el = document.getElementById(id); if (el) el.value = data[id]; }});
    cbIds.forEach(id => { if (data[id] != null) { const el = document.getElementById(id); if (el) { el.checked = !!data[id]; updateSectionState(id.replace('visible_',''), el.checked); } }});
  } catch {}
}
function bindAutosave(){
  inputIds.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', saveDraft); });
  cbIds.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', saveDraft); });
}

function setThumb(imgId, url){
  const img = document.getElementById(imgId);
  if (!img) return;
  if (url && url.trim()) {
    img.style.display = 'block';
    img.src = url;
    img.onerror = () => { img.style.display = 'none'; };
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
  }
}

function updateImagePreviews(){
  setThumb('p_hero1', $("hero_image1")?.value);
  setThumb('p_hero2', $("hero_image2")?.value);
  setThumb('p_hero3', $("hero_image3")?.value);
  setThumb('p_hero4', $("hero_image4")?.value);
  setThumb('p_hero5', $("hero_image5")?.value);
  setThumb('p_welcome', $("welcome_image")?.value);
  setThumb('p_comfort', $("comfort_image")?.value);
  setThumb('p_taste', $("taste_image")?.value);
}

// === LOAD TRANSLATIONS ===
async function load() {
  st.textContent = "Loading...";
  try {
    const data = await API.api(`/translations/main/${langSel.value}`);

    // Общие тексты
    $("hero_greeting").value = data["hero.greeting"] || "";
    $("hero_name").value = data["hero.name"] || "";
    $("hero_age").value = data["hero.age"] || "";
    $("hero_image1").value = data["hero.image1"] || "";
    $("hero_image2").value = data["hero.image2"] || "";
    $("hero_image3").value = data["hero.image3"] || "";
    $("hero_image4").value = data["hero.image4"] || "";
    $("hero_image5").value = data["hero.image5"] || "";
    $("welcome_title").value = data["hotel.welcome.title"] || "";
    $("welcome_p1").value = data["hotel.welcome.p1"] || "";
    $("hotel_discover").value = data["hotel.discover"] || "";
    $("welcome_image").value = data["welcome.image"] || "";
    $("comfort_title").value = data["comfort.title"] || "";
    $("comfort_p").value = data["comfort.p"] || "";
    $("explore_rooms").value = data["explore.rooms"] || "";
    $("comfort_image").value = data["comfort.image"] || "";
    $("taste_title").value = data["taste.title"] || "";
    $("taste_p").value = data["taste.p"] || "";
    $("view_amenities").value = data["view.amenities"] || "";
    $("taste_image").value = data["taste.image"] || "";
    $("apartments_title").value = data["apartments.title"] || "";

    // Состояния секций (visibility)
    sectionKeys.forEach(k => {
      const cb = $(`visible_${k}`);
      if (cb) {
        const val = data[`visible.${k}`];
        cb.checked = !(val === "false" || val === false);
        updateSectionState(k, cb.checked);
      }
    });

    st.textContent = "Loaded.";
  } catch (e) {
    st.textContent = e.message;
  }
  // Reapply unsaved local draft so thumbnails persist across refresh
  loadDraft();
  updateImagePreviews();
  bindAutosave();
}

// === SAVE CHANGES ===
async function save() {
  st.textContent = "Saving...";
  try {
    const allKeys = {
      "hero.greeting": $("hero_greeting").value,
      "hero.name": $("hero_name").value,
      "hero.age": $("hero_age").value,
      "hero.image1": $("hero_image1").value,
      "hero.image2": $("hero_image2").value,
      "hero.image3": $("hero_image3").value,
      "hero.image4": $("hero_image4").value,
      "hero.image5": $("hero_image5").value,
      "hotel.welcome.title": $("welcome_title").value,
      "hotel.welcome.p1": $("welcome_p1").value,
      "hotel.discover": $("hotel_discover").value,
      "welcome.image": $("welcome_image").value,
      "comfort.title": $("comfort_title").value,
      "comfort.p": $("comfort_p").value,
      "explore.rooms": $("explore_rooms").value,
      "comfort.image": $("comfort_image").value,
      "taste.title": $("taste_title").value,
      "taste.p": $("taste_p").value,
      "view.amenities": $("view_amenities").value,
      "taste.image": $("taste_image").value,
      "apartments.title": $("apartments_title").value
    };

    // + Состояние видимости
    sectionKeys.forEach(k => {
      const cb = $(`visible_${k}`);
      if (cb) allKeys[`visible.${k}`] = cb.checked ? "true" : "false";
    });

    // Пропускаем пустые значения
    const payload = {};
    for (const key in allKeys) {
      const val = allKeys[key];
      if (val !== undefined && val !== null && val.toString().trim() !== "") {
        payload[key] = val;
      }
    }

    await API.api(`/translations/main/${langSel.value}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });

    st.textContent = "✅ Saved successfully.";
  } catch (e) {
    st.textContent = e.message;
  }
  saveDraft();
  updateImagePreviews();
}

// === VISIBILITY CONTROL ===
function updateSectionState(section, visible) {
  const sectionHeader = document.querySelector(`#visible_${section}`)?.closest("h3");
  if (sectionHeader) {
    const block = sectionHeader.nextElementSibling;
    if (!block) return;
    block.style.opacity = visible ? "1" : "0.4";
    block.style.pointerEvents = visible ? "auto" : "none";
  }
}

sectionKeys.forEach(k => {
  const cb = $(`visible_${k}`);
  if (cb) {
    cb.addEventListener("change", e => {
      updateSectionState(k, e.target.checked);
    });
  }
});

// === EXPORT JSON ===
async function exportJson() {
  st.textContent = "Exporting...";
  try {
    const current = await API.api(`/translations/main/${langSel.value}`);
    const filtered = {};
    Object.entries(current || {}).forEach(([k, v]) => {
      const val = (v ?? "").toString().trim();
      if (val) filtered[k] = val;
    });
    const res = await API.api(`/translations/export/${langSel.value}`, {
      method: "POST",
      body: JSON.stringify(filtered)
    });
    st.textContent = "✅ Exported: " + (res.path || "");
  } catch (e) {
    st.textContent = e.message;
  }
}

// === FILE UPLOAD ===
function bindUploads() {
  imageInputs.forEach(([textId, fileId, key, slot]) => {
    const f = $(fileId);
    if (!f) return;
    f.addEventListener("change", async () => {
      if (!f.files[0]) return;
      st.textContent = "Uploading...";
      try {
        const res = await API.apiUpload(`/upload?slot=${encodeURIComponent(slot)}`, f.files[0]);
        $(textId).value = res.url;
        st.textContent = "Uploaded.";
      } catch (e) {
        st.textContent = e.message;
      }
      updateImagePreviews();
      saveDraft();
    });

    // update preview when typing/pasting URL
    const t = $(textId);
    if (t) t.addEventListener('input', updateImagePreviews);
  });
}

// === LOGOUT ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  location.href = "login.html";
});

// === BUTTONS ===
document.getElementById("loadBtn").addEventListener("click", load);
document.getElementById("saveBtn").addEventListener("click", save);
document.getElementById("exportBtn").addEventListener("click", exportJson);
langSel.addEventListener("change", load);

document.getElementById("previewBtn").addEventListener("click", async () => {
  const lang = langSel.value;
  const url = `${location.origin}/?preview=true&draft=1&lang=${encodeURIComponent(lang)}`;

  // Снимаем снимок текущих полей (без сохранения в БД)
  const draft = {
    "hero.greeting": $("hero_greeting").value,
    "hero.name": $("hero_name").value,
    "hero.age": $("hero_age").value,
    "hero.image1": $("hero_image1").value,
    "hero.image2": $("hero_image2").value,
    "hero.image3": $("hero_image3").value,
    "hero.image4": $("hero_image4").value,
    "hero.image5": $("hero_image5").value,
    "hotel.welcome.title": $("welcome_title").value,
    "hotel.welcome.p1": $("welcome_p1").value,
    "hotel.discover": $("hotel_discover").value,
    "welcome.image": $("welcome_image").value,
    "comfort.title": $("comfort_title").value,
    "comfort.p": $("comfort_p").value,
    "explore.rooms": $("explore_rooms").value,
    "comfort.image": $("comfort_image").value,
    "taste.title": $("taste_title").value,
    "taste.p": $("taste_p").value,
    "view.amenities": $("view_amenities").value,
    "taste.image": $("taste_image").value,
    "apartments.title": $("apartments_title").value
  };
  // + видимость секций
  sectionKeys.forEach(k => {
    const cb = $(`visible_${k}`);
    if (cb) draft[`visible.${k}`] = cb.checked ? "true" : "false";
  });

  try {
    localStorage.setItem(`arp_preview_draft_${lang}`, JSON.stringify(draft));
  } catch {}

  // Открываем окно сразу, чтобы не блокировалось всплывающее окно браузером
  const win = window.open(url, "_blank");
  if (!win) {
    st.textContent = "Разрешите всплывающие окна для предпросмотра.";
    return;
  }
  st.textContent = "Открыт предпросмотр без сохранения.";
});

// === INIT ===
bindUploads();
load();
