// Simple client-side i18n
// Works with elements having data-i18n="key"

(function () {
  // --- Fallback translations (минимальные) ---
  const fallbackTranslations = { en: {}, ru: {}, tr: {}, de: {} };

  const defaultLang = "en";
  const storageKey = "arp_lang";
  const params = new URLSearchParams(window.location.search);
  const isPreview = params.has("preview");
  const isDraft = params.has("draft");

  // главный объект переводов
  let translations = {};

  // ============================================================
  // applyTranslations()
  // ============================================================
  function applyTranslations() {
    const elems = document.querySelectorAll("[data-i18n]");

    elems.forEach((el) => {
      const key = el.getAttribute("data-i18n");

      // сохраняем оригинальный текст
      if (!el.dataset.i18nDefault) {
        el.dataset.i18nDefault = el.textContent.trim();
      }

      const text = translations[key] || el.dataset.i18nDefault;

      // placeholder
      if (el.hasAttribute("data-i18n-placeholder")) {
        const phKey = el.getAttribute("data-i18n-placeholder");
        const ph =
          translations[phKey] ||
          el.dataset.i18nPlaceholderDefault ||
          el.getAttribute("placeholder") ||
          "";
        el.setAttribute("placeholder", ph);

        if (!el.dataset.i18nPlaceholderDefault) {
          el.dataset.i18nPlaceholderDefault = ph;
        }
      }

      // alt
      if (el.tagName === "IMG" && el.hasAttribute("data-i18n-alt")) {
        const altKey = el.getAttribute("data-i18n-alt");
        const alt =
          translations[altKey] ||
          el.dataset.i18nAltDefault ||
          el.getAttribute("alt") ||
          "";
        el.alt = alt;
        if (!el.dataset.i18nAltDefault) el.dataset.i18nAltDefault = alt;
        return;
      }

      // input/select/textarea — value
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT"
      ) {
        el.value = text;
      } else {
        el.textContent = text;
      }
    });

    // === Visibility Control ===
    ["hero", "welcome", "comfort", "taste", "apartments"].forEach((section) => {
      const visibleKey = `visible.${section}`;
      const isVisible = translations[visibleKey];

      document.querySelectorAll(`[data-block="${section}"]`).forEach((el) => {
        el.style.display =
          isVisible === false || isVisible === "false" ? "none" : "";
      });
    });
  }

  // ============================================================
  // loadTranslations(lang)
  // ============================================================
  function loadTranslations(lang) {
    let url;

    try {
      const basePath = window.location.href.startsWith("file://")
        ? "../"
        : "/";
      url = `${basePath}assets/i18n/${lang}.json`;
    } catch (e) {
      url = `../assets/i18n/${lang}.json`;
    }

    return fetch(url, { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("Translation load failed");
        return r.json();
      })
      .catch((err) => {
        console.warn("i18n: using fallback for", lang, err);
        return fallbackTranslations[lang] || {};
      })
      .then(async (baseJson) => {
        let base = baseJson;

        // === preview overlays ===
        if (isPreview) {
          try {
            const t = Date.now();
            const reqs = [
              `/api/translations/main/${lang}?t=${t}`,
              `/api/translations/about/${lang}?t=${t}`,
              `/api/translations/rest/${lang}?t=${t}`,
              `/api/translations/gallery/${lang}?t=${t}`,
              `/api/translations/roomslist/${lang}?t=${t}`,
              `/api/translations/contact/${lang}?t=${t}`
            ];

            const responses = await Promise.all(
              reqs.map((u) =>
                fetch(u, { cache: "no-cache" }).catch(() => null)
              )
            );

            for (const res of responses) {
              if (res && res.ok) {
                const overlay = await res.json();
                base = Object.assign({}, base, overlay);
              }
            }
          } catch (e) {
            console.warn("i18n: preview overlay failed", e);
          }
        }

        // === draft override ===
        if (isPreview && isDraft) {
          try {
            const raw = localStorage.getItem(`arp_preview_draft_${lang}`);
            if (raw) {
              const draft = JSON.parse(raw);
              base = Object.assign({}, base, draft);
            }
          } catch (e) {
            console.warn("i18n: draft overlay error", e);
          }
        }

        translations = base;
        window.__arpTranslations = translations;
        return translations;
      });
  }

  // ============================================================
  // setLang(lang) — только синхронизирует DOM (без загрузки)
  // ============================================================
  function setLang(lang) {
    document.documentElement.lang = lang;

    // селекторы языка
    document.querySelectorAll(".language-dropdown").forEach((s) => {
      s.value = lang;
    });

    // обёртки
    document.querySelectorAll(".language-selector").forEach((wrap) => {
      wrap.dataset.lang = lang;
    });
  }

  // ============================================================
  // changeLang(lang) — загрузить JSON + применить
  // ============================================================
  function changeLang(lang) {
    return loadTranslations(lang).then(() => {
      try {
        localStorage.setItem(storageKey, lang);
      } catch {}

      setLang(lang);
      applyTranslations();
    });
  }

  // ============================================================
  // wireSelectors()
  // ============================================================
  function wireSelectors() {
    const selectors = document.querySelectorAll(".language-dropdown");
    if (!selectors.length) return;

    selectors.forEach((sel) => {
      if (sel.dataset.arpI18nWired) return;

      sel.addEventListener("change", () => {
        const lang = sel.value;

        // синхронизируем все <select>
        selectors.forEach((s) => (s.value = lang));

        changeLang(lang);
      });

      sel.dataset.arpI18nWired = "1";
    });
  }

  // ============================================================
  // init()
  // ============================================================
  function init() {
    const saved = (
      localStorage.getItem(storageKey) ||
      navigator.language ||
      defaultLang
    ).slice(0, 2);

    const allowed = ["en", "ru", "tr", "de", "uk"];
    const urlLang = (params.get("lang") || "").toLowerCase();
    const initial = allowed.includes(urlLang) ? urlLang : saved;
    const lang = allowed.includes(initial) ? initial : defaultLang;

    // 1) Загружаем переводы и применяем
    changeLang(lang).then(() => {
      // 2) Подключаем селекторы сразу
      wireSelectors();

      // 3) И ещё раз — когда догрузятся include'ы (header/footer)
      document.addEventListener("includesLoaded", function onIncludes() {
        // перевести заново всё, что вставили include'ы
        applyTranslations();
        wireSelectors(); // чтобы language-dropdown внутри include тоже получили обработчик
      });
    });

    // Экспорт для дебага
    window.arp_i18n = {
      setLang: changeLang, // грузит JSON + применяет
      applyTranslations,
      getTranslations: () => translations
    };

    // ====== SEO / Analytics injection (как было) ======
    (function injectSEO() {
      const keys = [
        "settings.google.site_verification",
        "settings.google.analytics_id",
        "settings.gtm.container_id",
        "settings.yandex.site_verification",
        "settings.facebook.pixel_id"
      ];

      Promise.all(
        keys.map((k) =>
          fetch(`/api/content/${encodeURIComponent(k)}`)
            .then((r) => r.json())
            .catch(() => ({ value: null }))
        )
      ).then(([gsc, ga4, gtm, yandex, fb]) => {
        // Google Search Console
        try {
          if (
            gsc &&
            gsc.value &&
            !document.querySelector('meta[name="google-site-verification"]')
          ) {
            const m = document.createElement("meta");
            m.name = "google-site-verification";
            m.content = gsc.value;
            document.head.appendChild(m);
          }
        } catch {}

        // Yandex
        try {
          if (
            yandex &&
            yandex.value &&
            !document.querySelector('meta[name="yandex-verification"]')
          ) {
            const m = document.createElement("meta");
            m.name = "yandex-verification";
            m.content = yandex.value;
            document.head.appendChild(m);
          }
        } catch {}

        // Google Analytics (GA4)
        try {
          const id = ga4 && (ga4.value || "").trim();
          if (id && !window._ga4Injected) {
            const s1 = document.createElement("script");
            s1.async = true;
            s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              id
            )}`;
            document.head.appendChild(s1);

            const s2 = document.createElement("script");
            s2.text =
              "window.dataLayer = window.dataLayer || [];" +
              "function gtag(){dataLayer.push(arguments);} " +
              "gtag('js', new Date()); gtag('config','" +
              id +
              "');";
            document.head.appendChild(s2);

            window._ga4Injected = true;
          }
        } catch {}

        // Google Tag Manager
        try {
          const cid = gtm && (gtm.value || "").trim();
          if (cid && !window._gtmInjected) {
            const s = document.createElement("script");
            s.text =
              "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
              "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
              "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
              "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
              "})(window,document,'script','dataLayer','" +
              cid +
              "');";
            document.head.appendChild(s);

            const ns = document.createElement("noscript");
            ns.innerHTML =
              '<iframe src="https://www.googletagmanager.com/ns.html?id=' +
              cid +
              '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
            document.body.appendChild(ns);

            window._gtmInjected = true;
          }
        } catch {}

        // Facebook Pixel
        try {
          const pid = fb && (fb.value || "").trim();
          if (pid && !window._fbqInjected) {
            !(function (f, b, e, v, n, t, s) {
              if (f.fbq) return;
              n = f.fbq = function () {
                n.callMethod
                  ? n.callMethod.apply(n, arguments)
                  : n.queue.push(arguments);
              };
              if (!f._fbq) f._fbq = n;
              n.push = n;
              n.loaded = !0;
              n.version = "2.0";
              n.queue = [];
              t = b.createElement(e);
              t.async = !0;
              t.src = v;
              s = b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t, s);
            })(
              window,
              document,
              "script",
              "https://connect.facebook.net/en_US/fbevents.js"
            );

            window.fbq("init", pid);
            window.fbq("track", "PageView");

            const ns = document.createElement("noscript");
            ns.innerHTML =
              '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' +
              pid +
              '&ev=PageView&noscript=1"/>';
            document.body.appendChild(ns);

            window._fbqInjected = true;
          }
        } catch {}
      });
    })();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
