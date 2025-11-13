
            document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll('.count');
    const speed = 200; // скорость (чем меньше — тем быстрее)

    const animateCounters = () => {
        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;

                const increment = target / speed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    };

    // Запуск анимации только когда секция появилась на экране
    const numbersSection = document.querySelector('.numbers-section');
    if (numbersSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateCounters();
                observer.disconnect();
            }
        }, { threshold: 0.3 });

        observer.observe(numbersSection);
    }
});
        // Add animation on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    
                    // Start counter animation when numbers section is visible
                    if (entry.target.classList.contains('numbers-section')) {
                        setTimeout(animateCounters, 500);
                    }
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.story-content, .story-image, .feature-card, .team-member, .number-item, .cta-content').forEach(el => {
            observer.observe(el);
        });

        // Initialize counters with data attributes
        document.addEventListener('DOMContentLoaded', function() {
            const counts = document.querySelectorAll('.count');
            counts.forEach(count => {
                const value = count.textContent.replace('+', '');
                count.setAttribute('data-target', value);
                count.textContent = '0+';
            });
        });
