// Main translation controller
class LanguageTranslator {
    constructor() {
        this.debug = true;
        this.currentLanguage = 'en';
        this.init();
    }

    log(message) {
        if (this.debug) console.log('[Translator]', message);
    }

    init() {
        this.loadElements();
        this.loadSavedLanguage();
        this.setupEventListeners();
        this.loadGoogleTranslate();
    }

    loadElements() {
        this.languageSelector = document.querySelector('.accessibility-language-selector');
        this.currentLanguageDisplay = document.getElementById('accessibilityCurrentLanguage');
        this.languageDropdown = document.getElementById('accessibilityLanguageDropdown');
        this.cancelButton = document.getElementById('accessibilityCancelLanguage');
        this.languageOptions = document.querySelectorAll('.accessibility-language-option');

        if (!this.languageSelector || !this.currentLanguageDisplay || 
            !this.languageDropdown || !this.cancelButton || this.languageOptions.length === 0) {
            this.log('Error: One or more elements not found');
            return false;
        }
        return true;
    }

    loadSavedLanguage() {
        // Check URL first for language parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('hl');
        
        // Then check localStorage
        const savedLang = localStorage.getItem('preferredLanguage');
        
        // Then check browser language
        const browserLang = navigator.language.split('-')[0];
        
        // Priority: URL > localStorage > browser > default English
        this.currentLanguage = urlLang || savedLang || browserLang || 'en';
        
        // Update UI to match current language
        this.updateLanguageDisplay(this.currentLanguage);
    }

    updateLanguageDisplay(langCode) {
        const selectedOption = Array.from(this.languageOptions).find(opt => 
            opt.dataset.value === langCode
        );
        
        if (selectedOption) {
            this.currentLanguageDisplay.textContent = selectedOption.textContent.trim();
        }
    }

    setupEventListeners() {
        // Toggle dropdown
        this.languageSelector?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.languageDropdown.style.display = 
                this.languageDropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Cancel button
        this.cancelButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.languageDropdown.style.display = 'none';
        });

        // Language selection
        this.languageOptions.forEach(option => {
            option.addEventListener('click', () => {
                const langCode = option.dataset.value;
                this.changeLanguage(langCode);
                this.languageDropdown.style.display = 'none';
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.languageDropdown.style.display = 'none';
        });

        // Prevent dropdown close when clicking inside
        this.languageDropdown?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    loadGoogleTranslate() {
        // Remove existing if present
        const existingScript = document.querySelector('script[src*="translate.google.com"]');
        if (existingScript) existingScript.remove();

        // Create new script
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.onerror = () => this.log('Failed to load Google Translate script');
        document.body.appendChild(script);
    }

    changeLanguage(langCode) {
        if (!langCode) return;

        this.log(`Changing language to ${langCode}`);
        this.currentLanguage = langCode;
        
        // Save preference
        localStorage.setItem('preferredLanguage', langCode);
        
        // Update URL without reload (for SPA) or with parameter (for traditional sites)
        if (window.history.replaceState) {
            const newUrl = `${window.location.pathname}?hl=${langCode}`;
            window.history.replaceState(null, '', newUrl);
        }
        
        // Update UI
        this.updateLanguageDisplay(langCode);
        
        // Execute translation
        this.executeTranslation(langCode);
    }

    executeTranslation(langCode) {
        if (typeof google !== 'undefined' && google.translate) {
            const selectField = document.querySelector('.goog-te-combo');
            if (selectField) {
                selectField.value = langCode;
                selectField.dispatchEvent(new Event('change'));
                this.log(`Translation to ${langCode} executed`);
            } else {
                this.log('Google Translate select element not found - reinitializing');
                this.initializeGoogleTranslate();
            }
        } else {
            this.log('Google Translate API not loaded - attempting to reload');
            this.loadGoogleTranslate();
        }
    }
}

// Global initialization function
window.googleTranslateElementInit = function() {
    if (typeof translator === 'undefined') {
        window.translator = new LanguageTranslator();
    }
    
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: translator?.getLanguagesString() || 'en,es,fr,de,it,pt,ru,zh-CN,ja,ko',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');

    // Hide Google's default UI
    // const googleTranslateElement = document.querySelector('.goog-te-combo');
    // if (googleTranslateElement) {
    //     googleTranslateElement.style.display = '';
    // }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.translator = new LanguageTranslator();
});