document.addEventListener("DOMContentLoaded", () => {
  (function () {
    const track = document.querySelector('#rooms-carousel .carousel-track');
    if (!track) return;

    const items = document.querySelectorAll('#rooms-carousel .carousel-item');
    if (!items || items.length === 0) return;

    const prevArrow = document.querySelector('#rooms-carousel .arrow-left');
    const nextArrow = document.querySelector('#rooms-carousel .arrow-right');
    const dotsArea = document.querySelector('#rooms-carousel .carousel-dots');

    let currentSlide = 0;
    let autoMove;
    let isAnimating = false;
    const TRANSITION_TIME = 600; // совпадает с CSS transition 0.6s

    function getVisibleCount() {
      return window.innerWidth <= 768 ? 1 : 3;
    }

    function getTotalPages() {
      return Math.ceil(items.length / getVisibleCount());
    }

    function generateDots() {
      dotsArea.innerHTML = '';
      const totalPages = getTotalPages();
      for (let i = 0; i < totalPages; i++) {
        const btn = document.createElement('button');
        if (i === 0) btn.classList.add('active');
        dotsArea.appendChild(btn);
      }
    }

    function refreshCarousel() {
      const visibleCount = getVisibleCount();
      const itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(track).gap) || 0;
      const translateX = currentSlide * visibleCount * itemWidth;
      track.style.transform = `translateX(-${translateX}px)`;

      // обновление точек
      const points = dotsArea.querySelectorAll('button');
      points.forEach(dot => dot.classList.remove('active'));
      if (points[currentSlide]) points[currentSlide].classList.add('active');
    }

    function goNext() {
      if (isAnimating) return;
      isAnimating = true;
      const total = getTotalPages();
      currentSlide = (currentSlide + 1) % total;
      refreshCarousel();
      setTimeout(() => { isAnimating = false; }, TRANSITION_TIME);
    }

    function goPrev() {
      if (isAnimating) return;
      isAnimating = true;
      const total = getTotalPages();
      currentSlide = (currentSlide - 1 + total) % total;
      refreshCarousel();
      setTimeout(() => { isAnimating = false; }, TRANSITION_TIME);
    }

    // стрелки
    if (nextArrow) {
      nextArrow.addEventListener('click', () => {
        stopAutoMove();
        goNext();
        setTimeout(startAutoMove, 2500);
      });
    }

    if (prevArrow) {
      prevArrow.addEventListener('click', () => {
        stopAutoMove();
        goPrev();
        setTimeout(startAutoMove, 2500);
      });
    }

    // точки
    dotsArea.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        const points = Array.from(dotsArea.children);
        currentSlide = points.indexOf(e.target);
        refreshCarousel();
      }
    });

    // автопрокрутка
    function startAutoMove() {
      autoMove = setInterval(goNext, 4000);
    }
    function stopAutoMove() {
      clearInterval(autoMove);
    }
    // Pause autoplay when user interacts (hover or focus)
    const hoverables = [track, prevArrow, nextArrow, dotsArea];
    hoverables.forEach(el => {
      if (!el) return;
      el.addEventListener('mouseenter', stopAutoMove);
      el.addEventListener('mouseleave', startAutoMove);
      // keyboard focus
      el.addEventListener('focusin', stopAutoMove);
      el.addEventListener('focusout', startAutoMove);
      // touch interaction (mobile)
      el.addEventListener('touchstart', stopAutoMove, { passive: true });
      el.addEventListener('touchend', startAutoMove, { passive: true });
    });

    // анимация появления
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    items.forEach(item => observer.observe(item));

    // ресайз
    window.addEventListener('resize', () => {
      generateDots();
      refreshCarousel();
    });

    generateDots();
    refreshCarousel();
    startAutoMove();
  })();
});
