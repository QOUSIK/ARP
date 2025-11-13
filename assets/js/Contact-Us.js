// Form submission handling
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    // Prepare email content
    const mailTo = "kigurdazeiosif@gmail.com";
    const mailSubject = encodeURIComponent(subject);
    const mailBody = encodeURIComponent(
        `Имя: ${name}\nEmail: ${email}\n\nСообщение:\n${message}`
    );

    // Open default mail app or Gmail page
    window.location.href = `mailto:${mailTo}?subject=${mailSubject}&body=${mailBody}`;

    // Optionally reset form after redirect
    this.reset();
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
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.contact-info, .contact-form, .map-section').forEach(el => {
    observer.observe(el);
});
