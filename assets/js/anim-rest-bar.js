// anim-rest-bar.js

document.addEventListener('DOMContentLoaded', () => {
    // Создаём наблюдатель для анимации появления при скролле
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Наблюдаем за всеми карточками ресторанов
    document.querySelectorAll('.restaurant-card').forEach(card => {
        observer.observe(card);
    });

    // Наблюдаем за элементами часов
    document.querySelectorAll('.hours li').forEach(item => {
        observer.observe(item);
    });

    // Наблюдаем за особенностями (features)
    document.querySelectorAll('.feature').forEach(feature => {
        observer.observe(feature);
    });

    // Добавляем лёгкий эффект при наведении на время работы
    document.querySelectorAll('.hours li').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(5px)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
        });
    });
});
