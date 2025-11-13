// Simple client-side i18n
// Works with elements that have data-i18n="key"
// It preserves the original text as default and replaces textContent when language changes.

(function(){
    // Fallback inline translations (used only if fetch fails)
    const fallbackTranslations = {
        en: {
            "hero.title": "Welcome to Antique Roman Palace",
            "hero.subtitle": "Where ancient Roman elegance meets modern luxury",
            "about.hero.title": "Our History",
            "cta.button": "Book a Room",
            "contact.title": "Contact Us",
            "contact.getintouch": "Get In Touch",
            "map.open": "Open in Google Maps",
            "map.route": "Get Directions"
        },
        ru: {
            "hero.title": "Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ Antique Roman Palace",
            "hero.subtitle": "Р“РґРµ РґСЂРµРІРЅСЏСЏ СЂРёРјСЃРєР°СЏ СЌР»РµРіР°РЅС‚РЅРѕСЃС‚СЊ РІСЃС‚СЂРµС‡Р°РµС‚СЃСЏ СЃ СЃРѕРІСЂРµРјРµРЅРЅРѕР№ СЂРѕСЃРєРѕС€СЊСЋ",
            "about.hero.title": "РќР°С€Р° РСЃС‚РѕСЂРёСЏ",
            "cta.button": "Р—Р°Р±СЂРѕРЅРёСЂРѕРІР°С‚СЊ",
            "contact.title": "РЎРІСЏР¶РёС‚РµСЃСЊ СЃ РЅР°РјРё",
            "contact.getintouch": "РЎРІСЏР¶РёС‚РµСЃСЊ СЃ РЅР°РјРё",
            "map.open": "РћС‚РєСЂС‹С‚СЊ РІ Google Maps",
            "map.route": "РџСЂРѕР»РѕР¶РёС‚СЊ РјР°СЂС€СЂСѓС‚"
        },
        tr: {
            "hero.title": "Antique Roman Palace'e HoЕџ Geldiniz",
            "hero.subtitle": "Antik Roma zarafeti ile modern lГјks buluЕџuyor",
            "about.hero.title": "РќР°С€Рё РСЃС‚РѕСЂРёРё",
            "cta.button": "Oda Rezervasyonu",
            "contact.title": "Д°letiЕџim",
            "contact.getintouch": "Д°letiЕџime GeГ§in",
            "map.open": "Google Haritalarda AГ§",
            "map.route": "Rota OluЕџtur"
        },
        de: {
            "hero.title": "Willkommen im Antique Roman Palace",
            "hero.subtitle": "Wo antike rГ¶mische Eleganz auf modernen Luxus trifft",
            "about.hero.title": "Unsere Geschichte",
            "cta.button": "Zimmer buchen",
            "contact.title": "Kontakt",
            "contact.getintouch": "Kontaktieren Sie uns",
            "map.open": "In Google Maps Г¶ffnen",
            "map.route": "Route planen"
        }
    };

    const defaultLang = 'en';
    const storageKey = 'arp_lang';
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.has('preview');
    const isDraft = params.has('draft');
    let translations = {}; // will hold the flat translations for the current language

    function applyTranslations(){
        const elems = document.querySelectorAll('[data-i18n]');
        elems.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!el.dataset.i18nDefault) {
                el.dataset.i18nDefault = el.textContent.trim();
            }
            const text = (translations && translations[key]) || el.dataset.i18nDefault;

            if (el.hasAttribute('data-i18n-placeholder')){
                const phKey = el.getAttribute('data-i18n-placeholder');
                const ph = (translations && translations[phKey]) || el.dataset.i18nPlaceholderDefault || el.getAttribute('placeholder') || '';
                el.setAttribute('placeholder', ph);
                if (!el.dataset.i18nPlaceholderDefault) el.dataset.i18nPlaceholderDefault = el.getAttribute('placeholder') || '';
            }

            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'){
                el.value = text;
            } else if (el.tagName === 'IMG' && el.hasAttribute('data-i18n-alt')){
                const alt = (translations && translations[el.getAttribute('data-i18n-alt')]) || el.dataset.i18nAltDefault || el.getAttribute('alt') || '';
                el.alt = alt;
                if (!el.dataset.i18nAltDefault) el.dataset.i18nAltDefault = el.alt;
            } else {
                el.textContent = text;
            }
        });
          // === Visibility Control ===
    ["hero", "welcome", "comfort", "taste", "apartments"].forEach(section => {
      const visibleKey = `visible.${section}`;
      const isVisible = translations[visibleKey];
      document.querySelectorAll(`[data-block="${section}"]`).forEach(el => {
        el.style.display = (isVisible === "false" || isVisible === false) ? "none" : "";
      });
    });
    }

    function setLang(lang){
        document.documentElement.lang = lang;
        const selector = document.querySelector('.language-dropdown');
        const wrapper = document.querySelector('.language-selector');
        if (selector) selector.value = lang;
        if (wrapper) wrapper.dataset.lang = lang;
        applyTranslations();
        
        try{ localStorage.setItem(storageKey, lang); } catch(e){}
    }

    // createToggleButton removed вЂ” we now rely only on the select element for language switching

    function loadTranslations(lang){
        // determine JSON url relative to this script's location
        let translationsUrl;
        try {
            let basePath = window.location.href.startsWith('file://') ? '../' : '/';
            translationsUrl = `${basePath}assets/i18n/${lang}.json`;
        } catch(e) {
            translationsUrl = `../assets/i18n/${lang}.json`;
        }

        // 1) Load base JSON
        return fetch(translationsUrl, {cache: 'no-cache'})
            .then(r => { if (!r.ok) throw new Error('Failed to load translations'); return r.json(); })
            .catch(err => {
                console.warn('i18n: could not load language json, using fallback for', lang, err);
                return fallbackTranslations[lang] || {};
            })
            .then(async base => {
                // 2) If preview mode, overlay DB values for main/about/rest/gallery/rooms/contact pages
                if (isPreview) {
                    try {
                        const t = Date.now();
                        const [mRes, aRes, rRes, gRes, rlRes, cRes] = await Promise.all([
                          fetch(`/api/translations/main/${lang}?t=${t}`, {cache: 'no-cache'}).catch(()=>null),
                          fetch(`/api/translations/about/${lang}?t=${t}`, {cache: 'no-cache'}).catch(()=>null),
                          fetch(`/api/translations/rest/${lang}?t=${t}`, {cache: 'no-cache'}).catch(()=>null),
                          fetch(`/api/translations/gallery/${lang}?t=${t}`, {cache: 'no-cache'}).catch(()=>null),
                          fetch(`/api/translations/roomslist/${lang}?t=${t}`, {cache: 'no-cache'}).catch(()=>null),
                          fetch(`/api/translations/contact/${lang}?t=${t}`, {cache: 'no-cache'}).catch(()=>null)
                        ]);
                        if (mRes && mRes.ok) {
                          const overlay = await mRes.json();
                          base = Object.assign({}, base, overlay);
                        }
                        if (aRes && aRes.ok) {
                          const overlayA = await aRes.json();
                          base = Object.assign({}, base, overlayA);
                        }
                        if (rRes && rRes.ok) {
                          const overlayR = await rRes.json();
                          base = Object.assign({}, base, overlayR);
                        }
                        if (gRes && gRes.ok) {
                          const overlayG = await gRes.json();
                          base = Object.assign({}, base, overlayG);
                        }
                        if (rlRes && rlRes.ok) {
                          const overlayRL = await rlRes.json();
                          base = Object.assign({}, base, overlayRL);
                        }
                        if (cRes && cRes.ok) {
                          const overlayC = await cRes.json();
                          base = Object.assign({}, base, overlayC);
                        }
                    } catch(e) {
                        console.warn('i18n: preview overlay fetch failed', e);
                    }
                }
                // 3) If draft flag set, overlay localStorage draft last (highest priority)
                if (isPreview && isDraft) {
                    try {
                        const raw = localStorage.getItem(`arp_preview_draft_${lang}`);
                        if (raw) {
                            const draft = JSON.parse(raw);
                            base = Object.assign({}, base, draft);
                        }
                    } catch(e) { console.warn('i18n: draft overlay error', e); }
                }
                translations = base;
                return translations;
            });
    }

    function init(){
        const saved = (localStorage.getItem(storageKey) || navigator.language || defaultLang).slice(0,2);
        const allowed = ['en','ru','tr','de','uk'];
        const urlLang = (params.get('lang') || '').toLowerCase();
        const initial = allowed.includes(urlLang) ? urlLang : saved;
        const lang = (allowed.includes(initial) ? initial : defaultLang);

        // load initial language file then set language and wire selector
        loadTranslations(lang).then(()=>{
            setLang(lang);

            // wire the selector if present, otherwise wait for includes to be injected.
            function wireSelectorOnce(){
                const selector = document.querySelector('.language-dropdown');
                if (!selector) return false;
                // avoid double-wiring
                if (selector.dataset.arpI18nWired) return true;
                selector.addEventListener('change', function(){
                    const l = selector.value;
                    loadTranslations(l).then(()=>{ setLang(l); });
                });
                selector.dataset.arpI18nWired = '1';
                return true;
            }

            // try to wire now; if header/include wasn't present yet, wire on includesLoaded
            if (!wireSelectorOnce()){
                document.addEventListener('includesLoaded', function onIncludes(){
                    wireSelectorOnce();
                    document.removeEventListener('includesLoaded', onIncludes);
                });
            }
        });

        // expose for debug
        window.arp_i18n = { setLang, applyTranslations };

        // Inject SEO/analytics if present in content settings
        (function injectSEO(){
          const keys = [
            'settings.google.site_verification',
            'settings.google.analytics_id',
            'settings.gtm.container_id',
            'settings.yandex.site_verification',
            'settings.facebook.pixel_id'
          ];
          Promise.all(keys.map(k => fetch(`/api/content/${encodeURIComponent(k)}`).then(r=>r.json()).catch(()=>({value:null}))))
            .then(([gsc, ga4, gtm, yandex, fb]) => {
              try {
                if (gsc && gsc.value && !document.querySelector('meta[name="google-site-verification"]')){
                  const m = document.createElement('meta');
                  m.name = 'google-site-verification';
                  m.content = gsc.value;
                  document.head.appendChild(m);
                }
              } catch(e){}
              try {
                if (yandex && yandex.value && !document.querySelector('meta[name="yandex-verification"]')){
                  const m = document.createElement('meta');
                  m.name = 'yandex-verification';
                  m.content = yandex.value;
                  document.head.appendChild(m);
                }
              } catch(e){}
              try {
                const id = ga4 && (ga4.value||'').trim();
                if (id && !window._ga4Injected){
                  const s1 = document.createElement('script'); s1.async = true; s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`; document.head.appendChild(s1);
                  const s2 = document.createElement('script'); s2.text = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config','${id}');`;
                  document.head.appendChild(s2); window._ga4Injected = true;
                }
              } catch(e){}
              try {
                const cid = gtm && (gtm.value||'').trim();
                if (cid && !window._gtmInjected){
                  const s = document.createElement('script'); s.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${cid}');`;
                  document.head.appendChild(s);
                  const ns = document.createElement('noscript'); ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${cid}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`; document.body.appendChild(ns);
                  window._gtmInjected = true;
                }
              } catch(e){}
              try {
                const pid = fb && (fb.value||'').trim();
                if (pid && !window._fbqInjected){
                  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  window.fbq('init', pid); window.fbq('track', 'PageView');
                  const ns = document.createElement('noscript');
                  ns.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pid}&ev=PageView&noscript=1"/>`;
                  document.body.appendChild(ns);
                  window._fbqInjected = true;
                }
              } catch(e){}
            });
        })();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

