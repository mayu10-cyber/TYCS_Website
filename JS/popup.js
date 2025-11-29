window.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => {
                const popup = document.getElementById("accessibility-popup");
                if (popup) popup.classList.add("show");
            }, 5000);

            const closeBtn = document.getElementById("close-popup");
            if (closeBtn) {
                closeBtn.addEventListener("click", () => {
                    document.getElementById("accessibility-popup").classList.remove("show");
                });
            }
        });

        