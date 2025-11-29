document.addEventListener("DOMContentLoaded", () => {
            const toggle = document.getElementById("colorBlindToggle");

            function applyColorBlindMode() {
                document.body.classList.add("color-blind-mode");
            }

            function removeColorBlindMode() {
                document.body.classList.remove("color-blind-mode");
            }

            toggle.addEventListener("change", () => {
                if (toggle.checked) {
                    applyColorBlindMode();
                    localStorage.setItem("colorBlindMode", "true");
                } else {
                    removeColorBlindMode();
                    localStorage.setItem("colorBlindMode", "false");
                }
            });

            // Load from local storage
            if (localStorage.getItem("colorBlindMode") === "true") {
                toggle.checked = true;
                applyColorBlindMode();
            }
        });