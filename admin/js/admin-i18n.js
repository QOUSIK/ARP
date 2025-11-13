// Lightweight i18n for admin UI
(function(){
  const storageKey = 'admin_lang';
  const allowed = ['en','ru','tr','de','uk'];

  function getLang(){
    const url = new URLSearchParams(location.search).get('alang');
    const stored = localStorage.getItem(storageKey);
    const lang = (url || stored || 'ru').toLowerCase();
    return allowed.includes(lang) ? lang : 'en';
  }

  let lang = getLang();

  function setElementTextPreserveChildren(el, text){
    // If element has child elements (e.g., <label>Text <input/></label>),
    // change only its leading text node to avoid removing inputs.
    const hasChildren = el.children && el.children.length > 0;
    if (!hasChildren) {
      el.textContent = text;
      return;
    }
    let updated = false;
    for (const node of el.childNodes) {
      if (node.nodeType === 3) { // Text node
        node.nodeValue = text + ' ';
        updated = true;
        break;
      }
    }
    if (!updated) el.prepend(document.createTextNode(text + ' '));
  }

  function apply(dict, currentLang){
    // text
    document.querySelectorAll('[data-admin-i18n]').forEach(el => {
      const k = el.getAttribute('data-admin-i18n');
      if (dict[k]) setElementTextPreserveChildren(el, dict[k]);
    });
    // placeholders
    document.querySelectorAll('[data-admin-i18n-ph]').forEach(el => {
      const k = el.getAttribute('data-admin-i18n-ph');
      if (dict[k]) el.setAttribute('placeholder', dict[k]);
    });
    // set dropdown value
    const sel = document.getElementById('adminLangSelect');
    if (sel) sel.value = currentLang || lang;
  }

  function load(nextLang){
    if (nextLang) lang = nextLang;
    const url = `i18n/${lang}.json`;
    fetch(url, { cache:'no-cache' })
      .then(r => r.json())
      .then(dict => apply(dict, lang))
      .catch(()=>{});
  }

  // wire language select
  document.addEventListener('DOMContentLoaded', () => {
    // Normalize content language dropdowns on each admin page
    try {
      // Normalize content language dropdowns
      document.querySelectorAll('select#lang').forEach(sel => {
        const desired = [
          { v: 'en', t: 'English' },
          { v: 'ru', t: 'Русский' },
          { v: 'tr', t: 'Türkçe' },
          { v: 'de', t: 'Deutsch' },
          { v: 'uk', t: 'Українська' }
        ];
        const current = sel.value || 'ru';
        const differs = sel.options.length !== desired.length || desired.some((d,i)=> !sel.options[i] || sel.options[i].value !== d.v);
        if (differs){
          sel.innerHTML = '';
          desired.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.v; opt.textContent = d.t; sel.appendChild(opt);
          });
          sel.value = desired.some(d=>d.v===current) ? current : 'ru';
        }
      });
      // Normalize header admin language selector as well
      const headerSel = document.getElementById('adminLangSelect');
      if (headerSel){
        const desiredAdmin = [
          { v: 'ru', t: 'RU' },
          { v: 'en', t: 'EN' },
          { v: 'tr', t: 'TR' },
          { v: 'de', t: 'DE' },
          { v: 'uk', t: 'UA' }
        ];
        const currentAdmin = headerSel.value || 'ru';
        const differsAdmin = headerSel.options.length !== desiredAdmin.length || desiredAdmin.some((d,i)=> !headerSel.options[i] || headerSel.options[i].value !== d.v);
        if (differsAdmin){
          headerSel.innerHTML = '';
          desiredAdmin.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.v; opt.textContent = d.t; headerSel.appendChild(opt);
          });
          headerSel.value = desiredAdmin.some(d=>d.v===currentAdmin) ? currentAdmin : 'ru';
        }
      }
    } catch {}

    const sel = document.getElementById('adminLangSelect');
    if (sel && !sel._wired){
      sel.addEventListener('change', () => {
        const next = sel.value;
        localStorage.setItem(storageKey, next);
        // optionally reflect in URL without reload
        try {
          const u = new URL(location.href);
          u.searchParams.set('alang', next);
          history.replaceState(null, '', u);
        } catch {}
        load(next);
      });
      sel._wired = true;
    }
    load();
  });
})();
