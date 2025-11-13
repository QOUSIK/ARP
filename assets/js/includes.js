(function(){
  // Simple HTML include loader
  // Usage: <div data-include="/includes/header.html"></div>
  function loadInclude(el){
    const url = el.getAttribute('data-include');
    if(!url) return Promise.resolve();
    return fetch(url, {cache:'no-cache'})
      .then(r => { if(!r.ok) throw new Error('Failed to load '+url); return r.text(); })
      .then(html => {
        el.innerHTML = html;
        return el;
      })
      .catch(err => {
        console.warn('Include failed', url, err);
        return el;
      });
  }

  function init(){
    const includeEls = Array.from(document.querySelectorAll('[data-include]'));
    if(includeEls.length===0){
      // nothing to do
      document.dispatchEvent(new CustomEvent('includesLoaded'));
      return;
    }

    Promise.all(includeEls.map(loadInclude)).then(()=>{
      // re-run i18n if available to translate included content
      try{ if(window.arp_i18n && typeof window.arp_i18n.applyTranslations === 'function') window.arp_i18n.applyTranslations(); }catch(e){}
      // dispatch event for other scripts
      document.dispatchEvent(new CustomEvent('includesLoaded'));
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
