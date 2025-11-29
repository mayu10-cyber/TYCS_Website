document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("colorBlindToggle");

  function applyColorBlindMode() {
    document.body.classList.add("color-blind-mode");

    // CONTACT SECTION
    const contact = document.getElementById("contact");
    if (contact) {
      contact.style.backgroundColor = "#e6f7ff"; // soft blue
      contact.style.color = "#000";

      const mapPanel = contact.querySelector("iframe");
      if (mapPanel) {
        mapPanel.style.border = "4px solid #007acc";
        mapPanel.style.borderRadius = "16px";
      }

      const buttons = contact.querySelectorAll("button");
      buttons.forEach((btn) => {
        btn.style.backgroundColor = "#007acc";
        btn.style.color = "white";
      });

      const formInputs = contact.querySelectorAll("input, textarea");
      formInputs.forEach((input) => {
        input.style.backgroundColor = "#ffffff";
        input.style.border = "2px solid #007acc";
        input.style.color = "#000";
      });
    }

    // TEAM SECTION
    const team = document.getElementById("team");
    if (team) {
      team.style.backgroundColor = "#e8f5e9"; // light green
      team.style.color = "#000";
    }
  }

  function removeColorBlindMode() {
    document.body.classList.remove("color-blind-mode");

    const contact = document.getElementById("contact");
    if (contact) {
      contact.removeAttribute("style");

      const mapPanel = contact.querySelector("iframe");
      if (mapPanel) mapPanel.removeAttribute("style");

      const buttons = contact.querySelectorAll("button");
      buttons.forEach((btn) => btn.removeAttribute("style"));

      const formInputs = contact.querySelectorAll("input, textarea");
      formInputs.forEach((input) => input.removeAttribute("style"));
    }

    const team = document.getElementById("team");
    if (team) team.removeAttribute("style");
  }

  if (toggle) {
    toggle.addEventListener("change", function () {
      const enabled = toggle.checked;
      localStorage.setItem("colorBlindMode", enabled);
      enabled ? applyColorBlindMode() : removeColorBlindMode();
    });

    // Load saved state
    const saved = localStorage.getItem("colorBlindMode") === "true";
    toggle.checked = saved;
    if (saved) applyColorBlindMode();
  }
});
