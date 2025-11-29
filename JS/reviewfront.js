const formBtn = document.querySelector(".btn"); // "Add Review" button
        const reviewModal = document.getElementById("reviewModal");
        const thankYouModal = document.getElementById("thankYouModal");
        const slide = document.getElementById("r-slide");
        const upArrow = document.getElementById("upArrow");
        const downArrow = document.getElementById("downArrow");

        let feedbacks = [];
        let currentIndex = 0;

        // Initialize on page load
        document.addEventListener("DOMContentLoaded", function () {
            // First show hardcoded reviews immediately
            showHardcodedReviews();

            // Then try to load from server
            loadFeedbacks();
        });

        function showHardcodedReviews() {
            // Keep the original HTML content
            const originalContent = `
            <div class="r-card">
                <div class="review-info">
                    <div>
                        <h3>Rushikesh Pandit</h3>
                        <p>Hardware Devices</p>
                    </div>
                    <div class="review-rating">
                        <span class="stars">★★★★★</span>
                    </div>
                </div>
                <p>TejYash Cyber solutions is one of the best company for cyber solutions in Mumbai area. Mr.
                    Tejas is very prompt about their services. They have given me best services for my company's hardware and
                    software issues. Thank you Mr. Tejas for your excellent and prompt services. Also thank you for your
                    suggestions in purchasing the best hardware devices for my company.
                </p>
            </div>
            <div class="r-card">
                <div class="review-info">
                    <div>
                        <h3>Huma Khan</h3>
                        <p>Laptop Repairing</p>
                    </div>
                    <div class="review-rating">
                        <span class="stars">★★★★☆</span>
                    </div>
                </div>
                <p>Well!! It was wonderfull experience with tejas Infocom and He did repair my laptop which
                    i was thinking will never work..He did a great Job by giving his genuine customer service
                    and I would really recommend Tejyas Infocom for any laptop related issues. Thank you😊.
                </p>
            </div>
            <div class="r-card">
                <div class="review-info">
                    <div>
                        <h3>Aman Wallia</h3>
                        <p>Laptop Repairing</p>
                    </div>
                    <div class="review-rating">
                        <span class="stars">★★★★★</span>
                    </div>
                </div>
                <p>The best place to attend to your IT requirements.
                    Tejas is extremely knowledgeable and an expert in his field...!!
                </p>
            </div>
            <div class="r-card">
                <div class="review-info">
                    <div>
                        <h3>Pratiksha Murukate</h3>
                        <p>Laptop Repairing</p>
                    </div>
                    <div class="review-rating">
                        <span class="stars">★★★★☆</span>
                    </div>
                </div>
                <p>Laptop is working very nice....Genuineness in work...thank you 😊👍.
                </p>
            </div>
            <div class="r-card">
                <div class="review-info">
                    <div>
                        <h3>Raj Barsing</h3>
                        <p>Software Solution</p>
                    </div>
                    <div class="review-rating">
                        <span class="stars">★★★★☆</span>
                    </div>
                </div>
                <p>My laptop had a software issue that stopped the battery from charging. Other shops told me
                    the battery was dead and quoted ₹4k–₹5k. But at Tejyash, they fixed the issue in 5 minutes and didn't even
                    charge me. Truly honest and helpful — highly recommended! 🙌
                </p>
            </div>
        `;

            slide.innerHTML = originalContent;

            // Initialize the card display for hardcoded reviews
            const cards = slide.querySelectorAll(".r-card");
            if (cards.length > 0) {
                cards.forEach((card, i) => {
                    card.style.display = i === 0 ? "block" : "none";
                });
                upArrow.style.opacity = "0.5";
                downArrow.style.opacity = cards.length > 1 ? "1" : "0.5";
            }
        }

        formBtn.addEventListener("click", () => {
            reviewModal.style.display = "flex";
        });

        function closeReviewModal() {
            reviewModal.style.display = "none";
        }

        function closeThankYouModal() {
            thankYouModal.style.display = "none";
        }

        // Interactive rating state
        let selectedRating = 0;

        // Setup interactive stars and character counter
        function setupInteractiveReviewUI() {
            const stars = Array.from(document.querySelectorAll('#interactiveRating .modal-star'));
            const ratingLabel = document.getElementById('ratingLabel');
            const textarea = document.getElementById('reviewInput');
            const counter = document.getElementById('reviewCounter');

            function updateStars(value) {
                selectedRating = value;
                stars.forEach((s, i) => {
                    s.classList.remove('active', 'half');
                    const starIndex = i + 1;
                    if (value >= starIndex) {
                        s.classList.add('active');
                    } else if (value + 0.5 >= starIndex) {
                        s.classList.add('half');
                    }
                });
                ratingLabel.textContent = value > 0 ? `${value}/5` : 'Choose rating';
            }

            stars.forEach(star => {
                star.addEventListener('click', (e) => {
                    const rect = star.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const half = clickX < rect.width / 2 ? 0.5 : 0;
                    const base = Number(star.dataset.value);
                    updateStars(base - (half ? 0.5 : 0));
                });
            });

            // Character counter
            function updateCounter() {
                const max = Number(textarea.getAttribute('maxlength')) || 300;
                const len = textarea.value.length;
                counter.textContent = `${len}/${max}`;
            }
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupInteractiveReviewUI);
        } else {
            setupInteractiveReviewUI();
        }

        let isSubmitting = false;

        async function performSubmit() {
            if (isSubmitting) return; // guard
            isSubmitting = true;
            try {
                const name = document.getElementById("reviewerName").value.trim();
                const department = document.getElementById("reviewService").value.trim();
                // Prefer interactive selectedRating; fallback to legacy select if needed
                const ratingStr = document.getElementById("reviewRating").value;
                const feedback = document.getElementById("reviewInput").value.trim();

                const interactiveRating = selectedRating || 0;
                const rating = interactiveRating || (parseInt((ratingStr.match(/\★/g) || []).length) || 0);

                if (!name || !department || !rating || !feedback) {
                    alert("Please fill in all fields.");
                    return;
                }

                const data = { name, department, rating, feedback };

                const res = await fetch("http://localhost:5502/api/feedback", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                    credentials: 'include',
                    mode: 'cors'
                });

                if (!res.ok) throw new Error("Submission failed");

                await loadFeedbacks();
                closeReviewModal();
                thankYouModal.style.display = 'flex';
                navigator.clipboard.writeText(feedback).catch(() => alert("Couldn't copy to clipboard."));

                // reset form
                document.getElementById("reviewerName").value = '';
                document.getElementById("reviewService").value = '';
                document.getElementById("reviewRating").selectedIndex = 0;
                // Reset interactive stars
                selectedRating = 0;
                const stars = document.querySelectorAll('#interactiveRating .modal-star');
                stars.forEach(s => s.classList.remove('active','half'));
                const ratingLabel = document.getElementById('ratingLabel');
                if (ratingLabel) ratingLabel.textContent = 'Choose rating';
                document.getElementById("reviewInput").value = '';
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                isSubmitting = false;
            }
        }

        // Remove click listener to avoid double-submit; rely on inline window.submitReview()
        // document.querySelector(".modal-buttons .btn:last-child").addEventListener("click", (e) => {
        //     e.preventDefault();
        //     performSubmit();
        // });

        document.querySelector("#thankYouModal .close-link").addEventListener("click", () => {
            closeThankYouModal();
        });

        async function loadFeedbacks() {
            try {
                console.log('Attempting to fetch reviews...');
                const response = await fetch("http://localhost:5502/api/feedback");

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const list = await response.json();
                console.log('Received reviews:', list.length);

                list.sort((a, b) => b.rating - a.rating);
                feedbacks = list;
                renderFeedbacks();

            } catch (err) {
                console.error("Failed to fetch reviews:", err);
                showHardcodedReviews();

                // Show error to user (optional)
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = 'Note: Could not connect to server. Showing sample reviews.';
                slide.prepend(errorElement);
            }
        }

        function renderFeedbacks() {
            if (feedbacks.length === 0) return;

            slide.innerHTML = "";

            feedbacks.forEach((fb) => {
                const card = document.createElement("div");
                card.className = "r-card";
                const full = Math.floor(Number(fb.rating) || 0);
                const hasHalf = Math.abs((Number(fb.rating) || 0) - full - 0.5) < 1e-9;
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    const classes = ["list-star"];
                    if (i <= full) classes.push('active');
                    else if (i === full + 1 && hasHalf) classes.push('half');
                    starsHtml += `<span class="${classes.join(' ')}">★</span>`;
                }
                card.innerHTML = `
                <div class="review-info">
                    <div>
                        <h3>${fb.name}</h3>
                        <p>${fb.department}</p>
                    </div>
                    <div class="review-rating">
                        <span class="stars">${starsHtml}</span>
                    </div>
                </div>
                <p>${fb.feedback}</p>
                <div class="review-sub">${new Date(fb.createdAt || Date.now()).toLocaleDateString()}</div>
            `;
                card.style.display = "none";
                slide.appendChild(card);
            });

            showCard(0);
        }

        function showCard(index) {
            const cards = slide.querySelectorAll(".r-card");
            if (!cards.length) return;

            currentIndex = Math.max(0, Math.min(index, cards.length - 1));
            cards.forEach((card, i) => {
                card.style.display = i === currentIndex ? "block" : "none";
            });

            upArrow.style.opacity = currentIndex === 0 ? "0.5" : "1";
            downArrow.style.opacity = currentIndex === cards.length - 1 ? "0.5" : "1";
        }

        upArrow.addEventListener("click", () => showCard(currentIndex - 1));
        downArrow.addEventListener("click", () => showCard(currentIndex + 1));

        // Expose functions used by inline HTML handlers
        window.openReviewModal = function () {
            reviewModal.style.display = "flex";
        };

        window.submitReview = function () {
            performSubmit();
        };