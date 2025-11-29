const tcsCarouselData = [
                {
                    img: 'Aboutus/Carousel/tejas3.jpg',
                    quote: '"Every problem is a gift, without problems we would not grow."',
                    author: '– Anthony Robbins'
                },
                {
                    img: 'Aboutus/Carousel/tejas5.jpg',
                    quote: '"I don\'t know the word \'quit.\' Either I never did, or I have abolished it."',
                    author: '– Susan Butcher'
                },
                {
                    img: 'Aboutus/Carousel/tejas4.jpg',
                    quote: '"If you want to shine like a sun, first burn like a sun."',
                    author: '– APJ Abdul Kalam'
                }
            ];

            let tcsCurrentSlide = 0;
            const tcsImgEl = document.getElementById('tcs-carousel-img');
            const tcsQuoteEl = document.getElementById('tcs-quote');
            const tcsAuthorEl = document.getElementById('tcs-author');
            const tcsPrevEl = document.getElementById('tcs-prev');
            const tcsNextEl = document.getElementById('tcs-next');
            const tcsDotsEl = document.getElementById('tcs-dots');
            const tcsCarouselContainer = document.querySelector('.tcs-quote-carousel');

            // Create dots
            function tcsRenderDots() {
                if (!tcsDotsEl) return;
                tcsDotsEl.innerHTML = '';
                tcsCarouselData.forEach((_, idx) => {
                    const dot = document.createElement('button');
                    dot.className = 'tcs-dot' + (idx === tcsCurrentSlide ? ' active' : '');
                    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
                    dot.addEventListener('click', () => tcsGoTo(idx));
                    tcsDotsEl.appendChild(dot);
                });
            }

            let tcsIsTransitioning = false;
            function tcsGoTo(index) {
                if (tcsIsTransitioning) return;
                tcsIsTransitioning = true;
                tcsImgEl.style.opacity = 0;
                tcsQuoteEl.style.opacity = 0;
                tcsAuthorEl.style.opacity = 0;
                setTimeout(() => {
                    tcsCurrentSlide = (index + tcsCarouselData.length) % tcsCarouselData.length;
                    tcsImgEl.src = tcsCarouselData[tcsCurrentSlide].img;
                    tcsQuoteEl.textContent = tcsCarouselData[tcsCurrentSlide].quote;
                    tcsAuthorEl.textContent = tcsCarouselData[tcsCurrentSlide].author;
                    tcsImgEl.style.opacity = 1;
                    tcsQuoteEl.style.opacity = 1;
                    tcsAuthorEl.style.opacity = 1;
                    tcsRenderDots();
                    setTimeout(() => { tcsIsTransitioning = false; }, 260);
                }, 240);
            }

            tcsPrevEl?.addEventListener('click', () => tcsGoTo(tcsCurrentSlide - 1));
            tcsNextEl?.addEventListener('click', () => tcsGoTo(tcsCurrentSlide + 1));

            // Autoplay with pause on hover
            let tcsAutoplayId;
            function tcsStartAutoplay() {
                tcsStopAutoplay();
                tcsAutoplayId = setInterval(() => tcsGoTo(tcsCurrentSlide + 1), 4500);
            }
            function tcsStopAutoplay() { if (tcsAutoplayId) clearInterval(tcsAutoplayId); }
            tcsCarouselContainer?.addEventListener('mouseenter', tcsStopAutoplay);
            tcsCarouselContainer?.addEventListener('mouseleave', tcsStartAutoplay);

            // Swipe support
            let tcsTouchStartX = 0;
            tcsCarouselContainer?.addEventListener('touchstart', (e) => { tcsTouchStartX = e.changedTouches[0].clientX; }, { passive: true });
            tcsCarouselContainer?.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - tcsTouchStartX;
                if (Math.abs(dx) > 45) tcsGoTo(tcsCurrentSlide + (dx < 0 ? 1 : -1));
            }, { passive: true });

            // Init
            tcsGoTo(0);
            tcsRenderDots();
            tcsStartAutoplay();

            // Legacy popup helpers kept for compatibility
            function showHistoryPopup() { document.querySelector('.tcs-popup-overlay').style.display = 'none'; document.getElementById('tcs-history-popup').style.display = 'flex'; }
            function hideHistoryPopup() { document.getElementById('tcs-history-popup').style.display = 'none'; }
            function showMissionPopup() { document.querySelector('.tcs-popup-overlay').style.display = 'none'; document.getElementById('tcs-mission-popup').style.display = 'flex'; }
            function hideMissionPopup() { document.getElementById('tcs-mission-popup').style.display = 'none'; }
            function showWhyChoosePopup() { document.querySelector('.tcs-popup-overlay').style.display = 'none'; document.getElementById('tcs-why-choose-popup').style.display = 'flex'; }
            function hideWhyChoosePopup() { document.getElementById('tcs-why-choose-popup').style.display = 'none'; }
            function backToMainPopup() { document.querySelector('.tcs-popup-overlay').style.display = 'flex'; document.getElementById('tcs-history-popup').style.display = 'none'; document.getElementById('tcs-mission-popup').style.display = 'none'; document.getElementById('tcs-why-choose-popup').style.display = 'none'; }