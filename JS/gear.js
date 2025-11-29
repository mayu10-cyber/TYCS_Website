
// ==================== ACCESSIBILITY MENU ====================
document.addEventListener('DOMContentLoaded', function() {
    // Toggle popup visibility when gear icon is clicked
    const accessibilityGear = document.getElementById('accessibilityGear');
    const accessibilityMenu = document.getElementById('accessibilityMenu');

    if (accessibilityGear && accessibilityMenu) {
        accessibilityGear.addEventListener('click', function (e) {
            e.stopPropagation();
            accessibilityMenu.style.display = accessibilityMenu.style.display === 'block' ? 'none' : 'block';
            accessibilityLanguageDropdown.classList.remove('show');
        });

        // Close popup when clicking anywhere outside
        document.addEventListener('click', function (e) {
            if (!accessibilityMenu.contains(e.target) && e.target !== accessibilityGear) {
                accessibilityMenu.style.display = 'none';
                accessibilityLanguageDropdown.classList.remove('show');
            }
        });
    }

    // Initialize voiceEnabled from localStorage (default to false if not set)
    let voiceEnabled = localStorage.getItem("universalVoiceMode") === "true";

    // Update the toggle state in the accessibility menu
    const voiceToggle = document.querySelector('.accessibility-voice-toggle input[type="checkbox"]');
    if (voiceToggle) {
        voiceToggle.checked = voiceEnabled;
    }

    // Toggle function for voice control
    function toggleVoiceControl() {
        voiceEnabled = !voiceEnabled;
        localStorage.setItem("universalVoiceMode", voiceEnabled);

        // Update toggle state
        if (voiceToggle) {
            voiceToggle.checked = voiceEnabled;
        }

        // Trigger the voice control system
        if (voiceEnabled) {
            startRecognition();
        } else {
            stopRecognition();
        }
    }

    // Update the event listener for the voice control toggle
    if (voiceToggle) {
        voiceToggle.addEventListener('change', toggleVoiceControl);
    }

    // Update the Alt+V shortcut to match the voice control system
    document.addEventListener("keydown", (e) => {
        if (e.altKey && e.key.toLowerCase() === "v") {
            e.preventDefault();
            toggleVoiceControl();
        }
    });

    // Toggle functionality for other accessibility features
    document.querySelectorAll('.accessibility-toggle input').forEach(switchInput => {
        // Skip the voice control toggle as we've already handled it
        if (switchInput.closest('.accessibility-item:nth-child(4)')) return;

        switchInput.addEventListener('change', function () {
            const feature = this.closest('.accessibility-item').textContent.trim();
            console.log(`${feature} is now ${this.checked ? 'enabled' : 'disabled'}`);

            if (feature.includes('Color Blind') && this.checked) {
                document.body.classList.add('accessibility-color-blind-mode');
            } else if (feature.includes('Color Blind') && !this.checked) {
                document.body.classList.remove('accessibility-color-blind-mode');
            }
        });
    });

    // Language dropdown functionality
    const accessibilityLanguageItem = document.getElementById('accessibilityLanguageItem');
    const accessibilityLanguageDropdown = document.getElementById('accessibilityLanguageDropdown');
    const accessibilityCurrentLanguage = document.getElementById('accessibilityCurrentLanguage');
    const accessibilityCancelLanguageBtn = document.getElementById('accessibilityCancelLanguage');

    if (accessibilityLanguageItem && accessibilityLanguageDropdown) {
        accessibilityLanguageItem.addEventListener('click', function (e) {
            if (e.target.classList.contains('accessibility-language-option') ||
                e.target.classList.contains('accessibility-cancel-btn')) return;
            e.stopPropagation();
            accessibilityLanguageDropdown.classList.toggle('show');
        });

        // Select language
        document.querySelectorAll('.accessibility-language-option').forEach(option => {
            option.addEventListener('click', function () {
                accessibilityCurrentLanguage.textContent = this.textContent;
                console.log('Selected language:', this.getAttribute('data-value'));
                accessibilityLanguageDropdown.classList.remove('show');
            });
        });

        // Cancel language selection
        if (accessibilityCancelLanguageBtn) {
            accessibilityCancelLanguageBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                accessibilityLanguageDropdown.classList.remove('show');
            });
        }
    }

    // Click functionality for other menu items
    document.querySelectorAll('.accessibility-item:not(.accessibility-language-item)').forEach(item => {
        item.addEventListener('click', function (e) {
            if (!e.target.classList.contains('accessibility-toggle') &&
                e.target.tagName !== 'INPUT') {

                const action = this.textContent.trim();
                console.log('Action:', action);
            }
        });
    });

    // Function to get clean text from an element
    const getCleanText = (element) => {
        if (element.classList.contains('stars') ||
            element.classList.contains('fa') ||
            element.tagName === 'SCRIPT' ||
            element.tagName === 'STYLE' ||
            element.tagName === 'IFRAME') {
            return '';
        }

        let text = element.innerText || element.textContent;
        return text
            .replace(/\s+/g, ' ')
            .replace(/[★☆]/g, '')
            .trim();
    };

    // Function to attach event listeners
    const attachSpeakListeners = (element) => {
        if (element._hasSpeakListener) return;

        const cleanText = getCleanText(element);
        if (!cleanText) return;

        element.addEventListener("mouseenter", () => speak(cleanText));
        element.addEventListener("touchstart", (e) => {
            e.preventDefault();
            speak(cleanText);
        }, { passive: false });

        element._hasSpeakListener = true;
    };

    // Initial setup for existing content
    const allElements = document.querySelectorAll("*");
    allElements.forEach(attachSpeakListeners);

    // MutationObserver for dynamic content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    attachSpeakListeners(node);
                    const elements = node.querySelectorAll("*");
                    elements.forEach(attachSpeakListeners);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});