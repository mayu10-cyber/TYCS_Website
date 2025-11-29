function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        let count = 0;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            count = Math.floor(target * easeOutQuart);
            
            // Format number with commas and add digit animation
            const formattedNumber = count.toLocaleString();
            counter.innerHTML = formattedNumber.split('').map((digit, index) => {
                if (digit === ',') return ',';
                return `<span style="animation-delay: ${index * 0.1}s">${digit}</span>`;
            }).join('');
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Final state with all digits
                counter.innerHTML = target.toLocaleString().split('').map((digit, index) => {
                    if (digit === ',') return ',';
                    return `<span style="animation-delay: ${index * 0.1}s">${digit}</span>`;
                }).join('');
            }
        };
        
        requestAnimationFrame(updateCounter);
    });
}

// Intersection Observer for better performance
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Reset numbers to 0
            document.querySelectorAll('.stat-number').forEach(counter => {
                counter.innerHTML = '0';
            });
            
            // Start animation
            setTimeout(animateCounters, 300);
            
            // Unobserve after animation starts
            statsObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe the stats section
const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Fallback for mouseenter (keeping original functionality)
statsSection.addEventListener('mouseenter', () => {
    // Only animate if not already animated
    if (!statsSection.classList.contains('animated')) {
        statsSection.classList.add('animated');
        document.querySelectorAll('.stat-number').forEach(counter => {
            counter.innerHTML = '0';
        });
        animateCounters();
    }
});

// Accessibility: Text-to-speech functionality
document.addEventListener('mouseover', function (event) {
    if (event.target && event.target.textContent.trim().length > 0) {
        speakText(event.target.textContent.trim());
    }
});