 // Toggle mobile menu
        document.querySelector('.menu-toggle').addEventListener('click', function () {
            const navList = document.querySelector('.nav-list');
            navList.classList.toggle('active');
            this.textContent = this.textContent === '☰' ? '✕' : '☰';
        });

        // Close menu when clicking on a link (mobile)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    const navList = document.querySelector('.nav-list');
                    const menuToggle = document.querySelector('.menu-toggle');
                    navList.classList.remove('active');
                    menuToggle.textContent = '☰';
                }
            });
        });

        // Close menu when clicking outside (mobile)
        document.addEventListener('click', function (event) {
            const nav = document.querySelector('nav');
            const menuToggle = document.querySelector('.menu-toggle');
            const navList = document.querySelector('.nav-list');

            if (window.innerWidth <= 768 &&
                !nav.contains(event.target) &&
                navList.classList.contains('active')) {
                navList.classList.remove('active');
                menuToggle.textContent = '☰';
            }
        });