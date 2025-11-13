document.addEventListener('DOMContentLoaded', function() {
    // Избранное
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            
            if (this.classList.contains('active')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    });
    
    // Бронирование (Book Now)
    const bookButtons = document.querySelectorAll('.room-btn');
    
    bookButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Здесь можно добавить логику для бронирования, например открытие формы
            const roomTitle = this.closest('.room-card').querySelector('.room-title').textContent;
            console.log(`Вы выбрали номер "${roomTitle}" для бронирования.`);
        });
    });

    // Подробнее (Details) теперь полностью через ссылки в HTML
});
