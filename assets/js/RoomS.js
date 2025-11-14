function __arpInitRoomPage(){
  let index = 0;
  let autoTimer;

  function initRoomSlider(){
    const slideContainer = document.querySelector('.slide-container');
    const prev = document.getElementById('prev');
    const next = document.getElementById('next');
    const indicatorsWrap = document.querySelector('.slide-indicators');
    const slides = document.querySelectorAll('.slide');

    if (!slideContainer || !slides || !slides.length) return;

    if (indicatorsWrap){
      indicatorsWrap.innerHTML = '';
      for (let i = 0; i < slides.length; i++){
        const dot = document.createElement('div');
        dot.className = 'indicator' + (i === index ? ' active' : '');
        dot.dataset.index = String(i);
        indicatorsWrap.appendChild(dot);
      }
      indicatorsWrap.onclick = (e) => {
        const dot = e.target.closest('.indicator');
        if (!dot) return;
        const i = parseInt(dot.dataset.index || '0', 10);
        if (!Number.isNaN(i)) { stopAuto(); index = i; update(); startAuto(); }
      };
    }

    function update(){
      const safe = Math.max(0, Math.min(index, slides.length - 1));
      index = safe;
      slides.forEach(s => s.classList.remove('active'));
      slides[index].classList.add('active');
      slideContainer.style.transform = `translateX(-${index * 100}%)`;
      if (indicatorsWrap){
        const dots = indicatorsWrap.querySelectorAll('.indicator');
        dots.forEach(d => d.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
      }
    }

    if (prev) prev.onclick = () => { stopAuto(); index = (index - 1 + slides.length) % slides.length; update(); startAuto(); };
    if (next) next.onclick = () => { stopAuto(); index = (index + 1) % slides.length; update(); startAuto(); };

    function startAuto(){ stopAuto(); autoTimer = setInterval(() => { index = (index + 1) % slides.length; update(); }, 5000); }
    function stopAuto(){ if (autoTimer) clearInterval(autoTimer); }

    const hoverables = [slideContainer, prev, next, indicatorsWrap];
    hoverables.forEach(el => {
      if (!el) return;
      el.onmouseenter = stopAuto;
      el.onmouseleave = startAuto;
      el.onfocusin = stopAuto;
      el.onfocusout = startAuto;
      el.ontouchstart = () => stopAuto();
      el.ontouchend = () => startAuto();
    });

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const closeLightbox = document.querySelector('.close-lightbox');
    const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const openLightbox = () => { if (!lightbox || !lightboxImg) return; lightboxImg.src = slides[index].querySelector('img').src; lightbox.classList.add('active'); };
    slides.forEach(slide => { slide.onclick = openLightbox; });
    if (closeLightbox) closeLightbox.onclick = () => { if (lightbox) lightbox.classList.remove('active'); };
    if (lightbox) lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); };
    if (lightboxPrev) lightboxPrev.onclick = (e) => { e.stopPropagation(); index = (index - 1 + slides.length) % slides.length; if (lightboxImg) lightboxImg.src = slides[index].querySelector('img').src; update(); };
    if (lightboxNext) lightboxNext.onclick = (e) => { e.stopPropagation(); index = (index + 1) % slides.length; if (lightboxImg) lightboxImg.src = slides[index].querySelector('img').src; update(); };

    update();
    startAuto();
  }

  initRoomSlider();
  // Re-init when cms-main rebuilds slider DOM
  try { document.addEventListener('roomSliderUpdated', initRoomSlider); } catch {}

  // Animation on scroll (unchanged)
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver(function(entries){
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.animationPlayState = 'running'; observer.unobserve(entry.target); } });
  }, observerOptions);
  document.querySelectorAll('.info-item, .feature').forEach(item => { item.style.animationPlayState = 'paused'; observer.observe(item); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __arpInitRoomPage);
} else {
  __arpInitRoomPage();
}
