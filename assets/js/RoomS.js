
        // Slider functionality
        const slides = document.querySelectorAll('.slide');
        const slideContainer = document.querySelector('.slide-container');
        const prev = document.getElementById('prev');
        const next = document.getElementById('next');
        const indicators = document.querySelectorAll('.indicator');
        let index = 0;
        let autoTimer;
        
        function updateSlides() {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
            slideContainer.style.transform = `translateX(-${index * 100}%)`;
            
            indicators.forEach(indicator => indicator.classList.remove('active'));
            indicators[index].classList.add('active');
        }
        
        prev.addEventListener('click', () => {
            index = (index - 1 + slides.length) % slides.length;
            updateSlides();
        });
        
        next.addEventListener('click', () => {
            index = (index + 1) % slides.length;
            updateSlides();
        });
        
        indicators.forEach((indicator, i) => {
            indicator.addEventListener('click', () => {
                index = i;
                updateSlides();
            });
        });
        
        // Auto-slide every 5 seconds with pause on hover/focus
        function startAuto(){
            stopAuto();
            autoTimer = setInterval(() => {
                index = (index + 1) % slides.length;
                updateSlides();
            }, 5000);
        }
        function stopAuto(){
            if (autoTimer) clearInterval(autoTimer);
        }
        startAuto();

        const hoverables = [slideContainer, prev, next, document.querySelector('.slide-indicators')];
        hoverables.forEach(el => {
            if (!el) return;
            el.addEventListener('mouseenter', stopAuto);
            el.addEventListener('mouseleave', startAuto);
            el.addEventListener('focusin', stopAuto);
            el.addEventListener('focusout', startAuto);
            el.addEventListener('touchstart', stopAuto, { passive: true });
            el.addEventListener('touchend', startAuto, { passive: true });
        });
        
        // Lightbox functionality
        const lightbox = document.getElementById('lightbox');
        const closeLightbox = document.querySelector('.close-lightbox');
        const lightboxImg = lightbox.querySelector('img');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        
        function openLightbox() {
            lightboxImg.src = slides[index].querySelector('img').src;
            lightbox.classList.add('active');
        }
        
        slides.forEach(slide => {
            slide.addEventListener('click', openLightbox);
        });
        
        closeLightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
        
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            index = (index - 1 + slides.length) % slides.length;
            lightboxImg.src = slides[index].querySelector('img').src;
            updateSlides();
        });
        
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            index = (index + 1) % slides.length;
            lightboxImg.src = slides[index].querySelector('img').src;
            updateSlides();
        });
        
        // Animation on scroll
        document.addEventListener('DOMContentLoaded', function() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationPlayState = 'running';
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            // Observe elements for animation
            document.querySelectorAll('.info-item, .feature').forEach(item => {
                item.style.animationPlayState = 'paused';
                observer.observe(item);
            });
        });
