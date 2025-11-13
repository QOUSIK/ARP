        document.addEventListener('DOMContentLoaded', function() {
            const categoryButtons = document.querySelectorAll('.category-btn');
            const grid = document.querySelector('.gallery-grid');
            let currentCategory = 'all';

            function getItems(){
                return document.querySelectorAll('.gallery-item');
            }

            // Фильтрация: динамически выбираем текущие элементы
            function filterGallery(category) {
                currentCategory = category || currentCategory || 'all';
                getItems().forEach(item => {
                    if (currentCategory === 'all' || item.getAttribute('data-category') === currentCategory) {
                        item.classList.remove('hidden');
                        item.classList.add('visible');
                    } else {
                        item.classList.add('hidden');
                        item.classList.remove('visible');
                    }
                });
            }

            // Обработчики для кнопок категорий
            categoryButtons.forEach(button => {
                button.addEventListener('click', function() {
                    categoryButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    const category = this.getAttribute('data-category') || 'all';
                    filterGallery(category);
                });
            });

            // Анимация появления элементов при скролле (повторная привязка при обновлении)
            const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
            let observer;
            function wireObserver(){
                if (observer) { try { observer.disconnect(); } catch {} }
                observer = new IntersectionObserver(function(entries) {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.animationPlayState = 'running';
                            observer.unobserve(entry.target);
                        }
                    });
                }, observerOptions);
                getItems().forEach(item => {
                    item.style.animationPlayState = 'paused';
                    observer.observe(item);
                });
            }
            wireObserver();

            // Ре-байнд при обновлении галереи (после перерисовки CMS)
            document.addEventListener('galleryUpdated', () => {
                wireObserver();
                filterGallery(currentCategory);
            });

            // Lightbox — делегирование на контейнер
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.querySelector('.lightbox-img');
            const closeBtn = document.querySelector('.lightbox-close');
            const prevBtn = document.querySelector('.lightbox-prev');
            const nextBtn = document.querySelector('.lightbox-next');

            let currentIndex = 0;

            function showImage(index) {
                const visibleImages = Array.from(document.querySelectorAll('.gallery-item.visible img'));
                if (visibleImages.length === 0) return;
                if (index < 0) index = visibleImages.length - 1;
                if (index >= visibleImages.length) index = 0;
                currentIndex = index;
                lightboxImg.src = visibleImages[index].src;
            }

            if (grid) {
                grid.addEventListener('click', (e) => {
                    const img = e.target.closest('.gallery-item img');
                    if (!img) return;
                    const visibleImages = Array.from(document.querySelectorAll('.gallery-item.visible img'));
                    currentIndex = visibleImages.indexOf(img);
                    showImage(currentIndex);
                    lightbox.classList.add('active');
                });
            }

            if (closeBtn) closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
            if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('active'); });
            if (prevBtn) prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
            if (nextBtn) nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
            document.addEventListener('keydown', e => {
                if (!lightbox.classList.contains('active')) return;
                if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
                if (e.key === 'ArrowRight') showImage(currentIndex + 1);
            });

            // Инициализация фильтра по активной кнопке
            const activeBtn = document.querySelector('.category-btn.active');
            if (activeBtn) filterGallery(activeBtn.getAttribute('data-category') || 'all');
        });

        // Lightbox
// ниже удален статический lightbox-биндинг — заменен на делегирование внутри DOMContentLoaded
