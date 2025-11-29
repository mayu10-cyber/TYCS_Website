document.addEventListener('DOMContentLoaded', function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target); // Uncomment if you want the animation to happen only once
            }
            else {
                entry.target.classList.remove('appear');
            }

        });
    }, { threshold: 0.1 }); // Adjust threshold as needed (0.1 = 10% visible)

    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });
});