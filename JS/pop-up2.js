document.addEventListener("DOMContentLoaded", () => {
            const popup = document.getElementById("accessibility-popup");
            const closeBtn = document.getElementById("close-popup");

            if (!popup || !closeBtn) return;

            // Show after 2 seconds
            setTimeout(() => {
                popup.classList.add("show");
            }, 2000);

            // Close button
            closeBtn.addEventListener("click", () => {
                popup.classList.remove("show");
            });

            // Toggle with Alt + A
            document.addEventListener("keydown", (e) => {
                if (e.altKey && e.key.toLowerCase() === "a") {
                    popup.classList.toggle("show");
                }
            });
        });

        function googleTranslateElementInit() {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                autoDisplay: false
            }, 'google_translate_element');
        }

        function changeLanguage(lang) {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                select.value = lang;
                select.dispatchEvent(new Event('change'));
            }
        }

        document.getElementById('customLangSelect').addEventListener('change', function () {
            const selectedLang = this.value;
            if (selectedLang) changeLanguage(selectedLang);
        });