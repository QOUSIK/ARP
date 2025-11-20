(function () {
  function normalizeUploadUrl(u){ return (u == null) ? "" : String(u); }
  const htmlLang = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const paramLang = (params.get("lang") || "").toLowerCase();
  // keep compatibility with site i18n storage key
  const stored = (window.localStorage && (localStorage.getItem("arp_lang") || localStorage.getItem("lang"))) || htmlLang;
  const allowed = ["en", "ru", "tr", "de"];
  const baseLang = allowed.includes(stored) ? stored : "en";
  const lang = allowed.includes(paramLang) ? paramLang : baseLang;

  const isPreview = params.has("preview");
  const isDraft = params.has("draft");

  // 👁 Если включён предпросмотр — берём данные из базы
  const mainUrl = isPreview
    ? `/api/translations/main/${lang}?t=${Date.now()}`
    : `/api/translations/main/${lang}`;
  const aboutUrl = isPreview
    ? `/api/translations/about/${lang}?t=${Date.now()}`
    : `/api/translations/about/${lang}`;
  const restUrl = isPreview
    ? `/api/translations/rest/${lang}?t=${Date.now()}`
    : `/api/translations/rest/${lang}`;
  const galleryUrl = isPreview
    ? `/api/translations/gallery/${lang}?t=${Date.now()}`
    : `/api/translations/gallery/${lang}`;
  const roomsListUrl = isPreview
    ? `/api/translations/roomslist/${lang}?t=${Date.now()}`
    : `/api/translations/roomslist/${lang}`;
  const contactUrl = isPreview
    ? `/api/translations/contact/${lang}?t=${Date.now()}`
    : `/api/translations/contact/${lang}`;
  // Room detail (per slug)
  function currentRoomSlug(){
    const m = location.pathname.match(/\/room\/(economy|standart|comfort|queen|king)\.html$/i);
    return m ? m[1].toLowerCase() : null;
  }
  const roomSlug = currentRoomSlug();
  const roomDetailUrl = roomSlug && (isPreview
    ? `/api/translations/roomdetail/${roomSlug}/${lang}?t=${Date.now()}`
    : `/api/translations/roomdetail/${roomSlug}/${lang}`);

  const noCache = { cache: 'no-cache' };
  const promises = [
    fetch(mainUrl, noCache).then(r=>r.json()).catch(()=>({})),
    fetch(aboutUrl, noCache).then(r=>r.json()).catch(()=>({})),
    fetch(restUrl, noCache).then(r=>r.json()).catch(()=>({})),
    fetch(galleryUrl, noCache).then(r=>r.json()).catch(()=>({})),
    fetch(roomsListUrl, noCache).then(r=>r.json()).catch(()=>({})),
    fetch(contactUrl, noCache).then(r=>r.json()).catch(()=>({}))
  ];
  if (roomDetailUrl) promises.push(fetch(roomDetailUrl, noCache).then(r=>r.json()).catch(()=>({})));

  Promise.all(promises)
    .then((arr) => {
      let data = Object.assign({}, ...arr);
      if (isPreview && isDraft) {
        try {
          const raw = localStorage.getItem(`arp_preview_draft_${lang}`);
          if (raw) {
            const draft = JSON.parse(raw);
            data = Object.assign({}, data, draft);
          }
        } catch (e) { console.warn('cms-main: draft overlay error', e); }
      }
      updateContent(data);
      applyAbout(data);
      applyRest(data);
      applyGallery(data);
      applyRoomsList(data);
      applyContact(data);
      if (roomSlug) applyRoomDetail(roomSlug, data);
    })
    .catch(err => console.warn("i18n load error:", err));

  function updateContent(data) {
    // Тексты
    Object.keys(data).forEach(k => {
      document.querySelectorAll(`[data-i18n="${k}"]`).forEach(el => {
        if (data[k]) el.textContent = data[k];
      });
    });

    // Изображения
    document.querySelectorAll("[data-img]").forEach(el => {
      const key = el.getAttribute("data-img");
      if (!Object.prototype.hasOwnProperty.call(data, key)) return;
      const url = normalizeUploadUrl(data[key]);
      if (el.tagName === "IMG") {
        if (url) el.src = url;
        else el.removeAttribute("src");
      } else {
        el.style.backgroundImage = url ? `url('${url}')` : "none";
      }
    });

    // Apply section visibility for preview
    ["hero", "welcome", "comfort", "taste", "apartments"].forEach(section => {
      const v = data[`visible.${section}`];
      const hidden = (v === "false" || v === false);
      document.querySelectorAll(`[data-block="${section}"]`).forEach(el => {
        el.style.display = hidden ? "none" : "";
      });
    });
  }

  function applyAbout(data){
    // Background images for about sections
    const styleId = 'aboutDynamicStyles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl){
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    let css = '';
    const hImg = normalizeUploadUrl(data['about.hero.image']);
    if (hImg) {
      css += `.about-hero{background: linear-gradient(rgba(60,10,22,0.9), rgba(60,10,22,0.9)), url('${hImg}') !important; background-size: cover !important; background-position: center !important;}`;
    }
    const sImg = data['about.story.image'];
    if (sImg) {
      css += `.story-image::before{background-image: url('${sImg}') !important; background-size: cover !important; background-position: center !important;}`;
    }
    const nImg = data['about.numbers.image'];
    if (nImg) {
      css += `.numbers-section::before{background-image: url('${nImg}') !important; background-size: cover !important; background-position: center !important;}`;
    }
    styleEl.textContent = css;

    // Visibility for about sections
    const vis = (k) => !(data[k] === 'false' || data[k] === false);
    const map = [
      ['visible.about.hero', '.about-hero'],
      ['visible.about.story', '.story-section'],
      ['visible.about.features', '.features-section'],
      ['visible.about.numbers', '.numbers-section'],
      ['visible.about.team', '.team-section'],
      ['visible.about.cta', '.cta-section']
    ];
    map.forEach(([key, sel]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.style.display = vis(key) ? '' : 'none';
    });
  }

  function applyRest(data){
    // Hero background for Rest-Bar (uses .about-hero section on that page)
    const styleId = 'restDynamicStyles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl){
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    let css = '';
    const hImg = normalizeUploadUrl(data['rest.hero.image']);
    if (hImg) {
      css += `.about-hero{background: linear-gradient(rgba(109,26,44,0.85), rgba(60,10,22,0.9)), url('${hImg}') !important; background-size: cover !important; background-position: center !important;}`;
    }
    styleEl.textContent = css;

    // Visibility toggles for each rest section
    const map = [
      ['visible.rest.hero', '.about-hero'],
      ['visible.rest.main', '[data-block="rest.main"]'],
      ['visible.rest.harem', '[data-block="rest.harem"]'],
      ['visible.rest.agora', '[data-block="rest.agora"]'],
      ['visible.rest.american', '[data-block="rest.american"]'],
      ['visible.rest.beach', '[data-block="rest.beach"]']
    ];
    const vis = (k) => !(data[k] === 'false' || data[k] === false);
    map.forEach(([key, sel]) => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.display = vis(key) ? '' : 'none';
      });
    });
  }

  function applyRoomsList(data){
    // Apply hero background for Room.html
    const styleId = 'roomsListDynamicStyles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl){ styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
    const heroImg = normalizeUploadUrl(data['rooms.hero.image']);
    let css = '';
    if (heroImg) css += `.about-hero{background: linear-gradient(rgba(109,26,44,0.85), rgba(60,10,22,0.9)), url('${heroImg}') !important; background-size: cover !important; background-position: center !important;}`;
    styleEl.textContent = css;

    // Visibility toggles
    const isFalse = v => (v === 'false' || v === false);
    const visAny = (keys) => {
      // if any key explicitly provided and false -> hidden
      // if any key explicitly provided and true  -> shown
      // if none provided -> default to shown
      let seen = false, visible = true;
      for (const k of keys){
        if (Object.prototype.hasOwnProperty.call(data, k)){
          seen = true;
          if (isFalse(data[k])) return false;
          visible = true; // keep true if provided and not false
        }
      }
      return seen ? visible : true;
    };
    const map = [
      [[ 'visible.rooms.hero' ], '.about-hero'],
      [[ 'visible.rooms.economy' ], '[data-block="rooms.economy"]'],
      // support both "standard" and legacy "standart"
      [[ 'visible.rooms.standard', 'visible.rooms.standart' ], '[data-block="rooms.standard"], [data-block="rooms.standart"]'],
      [[ 'visible.rooms.comfort' ], '[data-block="rooms.comfort"]'],
      [[ 'visible.rooms.queen' ], '[data-block="rooms.queen"]'],
      [[ 'visible.rooms.king' ], '[data-block="rooms.king"]']
    ];
    map.forEach(([keys, sel]) => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.display = visAny(keys) ? '' : 'none';
      });
    });
  }

  function applyContact(data){
    // Hero background on Contact page
    const styleId = 'contactDynamicStyles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl){ styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
    const hero = normalizeUploadUrl(data['contact.hero.image']);
    let css = '';
    if (hero) css += `.about-hero{background: linear-gradient(rgba(109,26,44,0.85), rgba(60,10,22,0.9)), url('${hero}') !important; background-size: cover !important; background-position: center !important;}`;
    styleEl.textContent = css;

    // Visibility toggles
    const vis = (k) => !(data[k] === 'false' || data[k] === false);
    const map = [
      ['visible.contact.hero', '[data-block="contact.hero"]'],
      ['visible.contact.info', '[data-block="contact.info"]'],
      ['visible.contact.form', '[data-block="contact.form"]'],
      ['visible.contact.map', '[data-block="contact.map"]']
    ];
    map.forEach(([key, sel]) => {
      document.querySelectorAll(sel).forEach(el => { el.style.display = vis(key) ? '' : 'none'; });
    });
  }

  function parseList(val){
    if (!val) return [];
    try{ const arr = JSON.parse(val); if (Array.isArray(arr)) return arr.filter(Boolean); }catch{}
    return String(val).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  }

  function applyRoomDetail(slug, data){
    // Hero background
    const styleId = 'roomDetailDynamicStyles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl){ styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
    const heroImg = normalizeUploadUrl(data[`room.${slug}.hero.image`]);
    let css = '';
    if (heroImg) css += `.about-hero{background: linear-gradient(rgba(109,26,44,0.85), rgba(60,10,22,0.9)), url('${heroImg}') !important; background-size: cover !important; background-position: center !important;}`;
    styleEl.textContent = css;

    // Slider images
    const slides = parseList(data[`room.${slug}.slides`]);
    // If CMS data provides more than one slide, rebuild from it.
    // For a single or empty slide list, keep the static HTML slider
    // (useful when DB still has old 1-image data but page markup has several images).
    if (slides && slides.length > 1){
      const cont = document.querySelector('.slide-container');
      const ind = document.querySelector('.slide-indicators');
      if (cont){
        cont.innerHTML = '';
        slides.forEach((url, idx) => {
          const d = document.createElement('div'); d.className = 'slide' + (idx===0?' active':'');
          const img = document.createElement('img'); img.src = url; img.alt = `Room Image ${idx+1}`;
          d.appendChild(img); cont.appendChild(d);
        });
      }
      if (ind){
        ind.innerHTML = '';
        slides.forEach((_, idx) => {
          const dot = document.createElement('div'); dot.className = 'indicator' + (idx===0?' active':''); dot.dataset.index = String(idx);
          ind.appendChild(dot);
        });
      }
      try { document.dispatchEvent(new CustomEvent('roomSliderUpdated')); } catch {}
    }

    // Info values (if present)
    const mapVals = ['area','flooring','view','tv','bedType','capacity','smoking','balcony','checkin','checkout'];
    mapVals.forEach(k => {
      const el = document.querySelector(`[data-room="${k}"]`);
      const v = data[`room.${slug}.${k}`];
      if (el && v) el.textContent = v;
    });

    // Visibility toggles
    const vis = key => !(data[key] === 'false' || data[key] === false);
    const pairs = [
      [`visible.room.${slug}.hero`, '.about-hero'],
      [`visible.room.${slug}.slider`, '.slider-container'],
      [`visible.room.${slug}.info`, '.room-info'],
      [`visible.room.${slug}.features`, '.features-section']
    ];
    pairs.forEach(([k, sel]) => {
      document.querySelectorAll(sel).forEach(el => { el.style.display = vis(k) ? '' : 'none'; });
    });
  }

  function parseList(val){
    if (!val) return [];
    try {
      const arr = JSON.parse(val);
      if (Array.isArray(arr)) return arr.filter(Boolean);
    } catch {}
    // newline-separated fallback
    return String(val).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  }

  function applyGallery(data){
    // Hero background for gallery page (.about-hero reused)
    const styleId = 'galleryDynamicStyles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl){ styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
    const gHero = normalizeUploadUrl(data['gallery.hero.image']);
    let css = '';
    if (gHero) {
      css += `.about-hero{background: linear-gradient(rgba(109,26,44,0.85), rgba(60,10,22,0.9)), url('${gHero}') !important; background-size: cover !important; background-position: center !important;}`;
    } else {
      css += `.about-hero{background: linear-gradient(rgba(109,26,44,0.85), rgba(60,10,22,0.9)) !important; background-size: cover !important; background-position: center !important;}`;
    }
    styleEl.textContent = css;

    // Visibility for hero and categories
    const vis = (k) => !(data[k] === 'false' || data[k] === false);
    const btns = document.querySelector('.gallery-categories');
    const grid = document.querySelector('.gallery-grid');
    const hero = document.querySelector('.about-hero');
    if (hero) hero.style.display = vis('visible.gallery.hero') ? '' : 'none';
    const cats = ['hotel','rooms','restaurants','pool','spa','events'];
    cats.forEach(c => {
      // hide category button
      if (btns) btns.querySelectorAll(`[data-category="${c}"]`).forEach(el => el.style.display = vis(`visible.gallery.${c}`) ? '' : 'none');
      // hide existing items
      if (grid) grid.querySelectorAll(`.gallery-item[data-category="${c}"]`).forEach(el => el.style.display = vis(`visible.gallery.${c}`) ? '' : 'none');
    });

    // Rebuild grid if arrays provided
    if (!grid) return;
    let anyProvided = false;
    const imgs = {};
    cats.forEach(c => {
      const key = `gallery.images.${c}`;
      const hasKey = Object.prototype.hasOwnProperty.call(data, key);
      const list = parseList(data[key]);
      if (hasKey) anyProvided = true; // даже пустые массивы должны перекрывать дефолтную разметку
      imgs[c] = list;
    });
    if (!anyProvided) return; // если ни один ключ не передан — оставляем дефолтную разметку

    grid.innerHTML = '';
    cats.forEach(c => {
      if (!vis(`visible.gallery.${c}`)) return;
      (imgs[c] || []).forEach(url => {
        const item = document.createElement('div');
        item.className = 'gallery-item visible';
        item.setAttribute('data-category', c);
        const img = document.createElement('img');
        img.src = normalizeUploadUrl(url);
        img.alt = c;
        item.appendChild(img);
        grid.appendChild(item);
      });
    });
    try { document.dispatchEvent(new CustomEvent('galleryUpdated')); } catch {}
  }
})();
