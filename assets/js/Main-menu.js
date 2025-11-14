document.addEventListener("DOMContentLoaded", () => {
    /* ================= HERO SLIDER ================= */
    const hero = document.querySelector('.hero');
    const heroSlides = document.querySelectorAll('.hero .slide');
    const heroDots = document.querySelectorAll('.slider-dots .dot');
    let currentHeroSlide = 0;
    let heroTimer;

    if (heroSlides.length > 0) {

        function showHeroSlide(index) {
            heroSlides.forEach(slide => slide.classList.remove('active'));
            heroDots.forEach(dot => dot.classList.remove('active'));

            heroSlides[index].classList.add('active');
            heroDots[index].classList.add('active');
        }

        function nextHeroSlide() {
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
            showHeroSlide(currentHeroSlide);
        }
        function startHeroAuto(){
            stopHeroAuto();
            heroTimer = setInterval(nextHeroSlide, 5000);
        }
        function stopHeroAuto(){
            if (heroTimer) clearInterval(heroTimer);
        }
        // Start autoplay
        startHeroAuto();

        heroDots.forEach(dot => {
            dot.addEventListener('click', function () {
                currentHeroSlide = parseInt(this.getAttribute('data-index'));
                showHeroSlide(currentHeroSlide);
            });
            // pause on focus (keyboard users)
            dot.addEventListener('focus', stopHeroAuto);
            dot.addEventListener('blur', startHeroAuto);
        });
        // pause on hover over hero area
        if (hero){
            hero.addEventListener('mouseenter', stopHeroAuto);
            hero.addEventListener('mouseleave', startHeroAuto);
            hero.addEventListener('touchstart', stopHeroAuto, { passive:true });
            hero.addEventListener('touchend', startHeroAuto, { passive:true });
        }
    }

    /* ================= SCROLL ANIMATION ================= */
const animatedElements = document.querySelectorAll(
    '.hotel-row, .apartments-block, .divider, .fade-up, .fade-left, .fade-right, .fade-zoom'
);

if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show-on-scroll');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    animatedElements.forEach(el => observer.observe(el));
}

    /* ================= HOTEL CAROUSEL ================= */
    (function () {
        const track = document.querySelector(".carousel-track");
        const prevButton = document.querySelector(".prev");
        const nextButton = document.querySelector(".next");

        if (!track || !prevButton || !nextButton) return; // защита, если карусели нет на странице

        let index = 0;
        const itemsToShow = 3;
        const totalItems = track.children.length;

        function updateCarousel() {
            const width = track.children[0].offsetWidth;
            track.style.transform = `translateX(${-index * width}px)`;
        }

        nextButton.addEventListener("click", () => {
            if (index < totalItems - itemsToShow) {
                index++;
                updateCarousel();
            }
        });

        prevButton.addEventListener("click", () => {
            if (index > 0) {
                index--;
                updateCarousel();
            }
        });

        window.addEventListener("resize", updateCarousel);
        updateCarousel();
    })();
});
