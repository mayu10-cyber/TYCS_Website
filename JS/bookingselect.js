document.querySelectorAll(".card").forEach((card) => {
            card.addEventListener("click", () => {
                const serviceName = card.querySelector("h3").textContent.trim();
                localStorage.setItem("selectedService", serviceName);
                window.location.href = "booking.html";
            });
        });