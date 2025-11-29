// ==================== UNIVERSAL VOICE CONTROL ====================
(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        activationShortcut: 'Alt+V',
        inactiveTimeout: 120000, // 2 minutes
        hintDisplayTime: 5000, // 5 seconds for temporary hints
        beepSound: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3' // Short beep sound
    };

    // State management
    let recognition;
    let isVoiceMode = localStorage.getItem('universalVoiceMode') === 'true';
    let currentInput = null;
    let voiceHint = null;
    let pronunciationPanel = null;
    let voiceTimeout;
    let beepAudio = null;

    // Character mapping for voice spelling
    const CHAR_MAP = (() => {
        const map = {};

        // Letters (a-z and capital letters)
        'abcdefghijklmnopqrstuvwxyz'.split('').forEach(char => {
            map[char] = char;
            map[`capital ${char}`] = char.toUpperCase();
        });

        // Numbers (0-9)
        ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
            .forEach((word, index) => map[word] = index.toString());

        // Special characters
        Object.assign(map, {
            at: '@', 'at the rate': '@',
            dot: '.', point: '.', period: '.', fullstop: '.', 'full stop': '.',
            comma: ',', space: ' ',
            delete: 'delete', backspace: 'delete', clear: 'clear',
            dash: '-', hyphen: '-', underscore: '_',
            colon: ':', semicolon: ';',
            slash: '/', backslash: '\\',
            'question mark': '?', exclamation: '!',
            'open parenthesis': '(', 'close parenthesis': ')',
            'open bracket': '[', 'close bracket': ']',
            'open brace': '{', 'close brace': '}',
            'single quote': "'", 'double quote': '"',
            'equals': '=', 'plus': '+', 'minus': '-', 'asterisk': '*', 'percent': '%',
            'dollar': '$', 'hash': '#', 'ampersand': '&', 'pipe': '|'
        });

        return map;
    })();

    // Create UI elements
    function createUIElements() {
        // Voice mode hint (shown when activated)
        if (!voiceHint) {
            voiceHint = document.createElement('div');
            voiceHint.id = 'universal-voice-hint';
            voiceHint.textContent = 'Voice Mode Active (Alt+V to disable) • Say "help" for commands';
            voiceHint.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255,255,255,0.2);
                max-width: 90%;
                text-align: center;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(voiceHint);
        }

        // Pronunciation help panel
        if (!pronunciationPanel) {
            pronunciationPanel = document.createElement('div');
            pronunciationPanel.id = 'universal-voice-help';
            pronunciationPanel.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999998;
                background: rgba(255,255,255,0.95);
                color: #333;
                padding: 20px;
                border-radius: 12px;
                font-size: 14px;
                display: none;
                max-height: 70vh;
                overflow-y: auto;
                width: 320px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                border: 1px solid rgba(0,0,0,0.1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.5;
            `;
            pronunciationPanel.innerHTML = `
                <h3 style="margin-top: 0; color: #4a4a4a;">Voice Commands</h3>
                <div style="margin-bottom: 15px;">
                    <strong>Popup Navigation:</strong><br>
                    "close history" - Closes the history popup<br>
                    "go back" - Returns to main popup view<br>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>About Us Sections:</strong><br>
                    "our history" - Shows company history<br>
                    "our mission" - Shows company mission<br>
                    "why choose us" - Shows why choose our services<br>
                    "close popup" - Closes any open popup<br>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Content Popups:</strong><br>
                    "read more" - Opens the detailed content<br>
                    "close popup" - Closes the popup window<br>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Cost Calculator:</strong><br>
                    "open calculator" - Open the cost estimator<br>
                    "close calculator" - Close the estimator<br>
                    "next step" - Go to next step<br>
                    "previous step" - Go back a step<br>
                    "select service [type]" - Choose service type<br>
                    "new estimate" - Start over<br>
                    (Works when calculator is open)
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Navigation:</strong><br>
                    "scroll up/down", "page up/down",<br>
                    "go to top/bottom", "go back", "go forward"
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Forms:</strong><br>
                    "input [field name]" - focus a field<br>
                    "type [text]" - type into focused field<br>
                    "click [button text]" - click a button<br>
                    "submit" - submit a form<br>
                    "clear" - clear current field
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Special Characters:</strong><br>
                    "at" (@), "dot" (.), "space", "dash" (-),<br>
                    "underscore" (_), "comma" (,), etc.
                </div>
                <div style="color: #666; font-size: 13px;">
                    Press Alt+V to toggle voice mode
                </div>
            `;
            document.body.appendChild(pronunciationPanel);
        }

        // Load beep sound
        if (!beepAudio && CONFIG.beepSound) {
            beepAudio = new Audio(CONFIG.beepSound);
            beepAudio.volume = 0.3;
        }
    }

    // Play feedback sound
    function playFeedbackSound() {
        if (beepAudio) {
            beepAudio.currentTime = 0;
            beepAudio.play().catch(e => console.log('Could not play sound:', e));
        }
    }

    // Show temporary hint
    function showTemporaryHint(message) {
        if (!voiceHint) return;

        voiceHint.textContent = message;
        voiceHint.style.display = 'block';
        voiceHint.style.opacity = '1';

        setTimeout(() => {
            if (voiceHint) {
                voiceHint.style.opacity = '0';
                setTimeout(() => {
                    if (voiceHint && isVoiceMode) {
                        voiceHint.textContent = 'Voice Mode Active (Alt+V to disable) • Say "help" for commands';
                        voiceHint.style.opacity = '1';
                    } else if (voiceHint) {
                        voiceHint.style.display = 'none';
                    }
                }, 300);
            }
        }, CONFIG.hintDisplayTime);
    }

    // Handle spelling input
    function handleSpellingInput(spokenText) {
        if (!currentInput) return;

        let result = currentInput.value || '';
        const words = spokenText.trim().toLowerCase().split(/\s+/);

        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            // Handle capital letters ("capital a")
            if (word === 'capital' && i + 1 < words.length) {
                const nextWord = words[i + 1];
                if (nextWord.length === 1 && nextWord >= 'a' && nextWord <= 'z') {
                    result += nextWord.toUpperCase();
                    i++;
                    continue;
                }
            }

            // Handle special commands
            if (word === 'clear') {
                result = '';
                continue;
            }

            // Handle mapped characters
            if (CHAR_MAP[word] !== undefined) {
                if (CHAR_MAP[word] === 'delete') {
                    result = result.slice(0, -1);
                } else {
                    result += CHAR_MAP[word];
                }
                continue;
            }

            // Handle single letters
            if (word.length === 1 && word >= 'a' && word <= 'z') {
                result += word;
                continue;
            }

            // Handle numbers
            if (!isNaN(Number(word))) {
                result += word;
                continue;
            }
        }

        // Update input value
        currentInput.value = result;

        // Trigger appropriate events for modern frameworks
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        currentInput.dispatchEvent(inputEvent);
        currentInput.dispatchEvent(changeEvent);
    }

    // Find input element by various attributes
    function findInputElement(fieldName) {
        const selectors = [
            `input[name*="${fieldName}" i], textarea[name*="${fieldName}" i]`,
            `input[id*="${fieldName}" i], textarea[id*="${fieldName}" i]`,
            `input[placeholder*="${fieldName}" i], textarea[placeholder*="${fieldName}" i]`,
            `input[aria-label*="${fieldName}" i], textarea[aria-label*="${fieldName}" i]`
        ];

        // Try selectors first
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }

        // Fallback to label association
        const labels = Array.from(document.querySelectorAll('label')).filter(label =>
            label.textContent.toLowerCase().includes(fieldName));

        if (labels.length > 0) {
            const forId = labels[0].getAttribute('for');
            if (forId) {
                return document.getElementById(forId);
            }
        }

        // Extended field matching
        const extendedFields = ['phone', 'address', 'date', 'time', 'message'];
        for (const field of extendedFields) {
            if (fieldName.includes(field)) {
                const extendedSelector = `input[type="${field}"], textarea`;
                const matchingInputs = Array.from(document.querySelectorAll(extendedSelector));
                if (matchingInputs.length > 0) return matchingInputs[0];
            }
        }

        return null;
    }

    // Find clickable element by text
    function findClickableElement(text) {
        // Try explicit buttons/links first
        const explicitElements = document.querySelectorAll(
            'button, a, [role="button"], [onclick], input[type="button"], input[type="submit"]'
        );

        for (const el of explicitElements) {
            if (el.textContent.toLowerCase().includes(text)) {
                return el;
            }
        }

        // Fallback to any element with matching text
        const allElements = Array.from(document.querySelectorAll('*'));
        return allElements.find(el =>
            el.textContent.toLowerCase().includes(text) &&
            getComputedStyle(el).cursor === 'pointer');
    }

    // Initialize speech recognition
    function setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showTemporaryHint('Speech recognition not supported in this browser');
            return null;
        }

        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim().toLowerCase();

            console.log('Voice command:', transcript);
            playFeedbackSound();

            // Handle navigation commands
            if (transcript.includes('scroll up')) {
                window.scrollBy(0, -window.innerHeight * 0.7);
                showTemporaryHint('Scrolled up');
            }
            else if (transcript.includes('scroll down')) {
                window.scrollBy(0, window.innerHeight * 0.7);
                showTemporaryHint('Scrolled down');
            }
            else if (transcript.includes('page up')) {
                window.scrollBy(0, -window.innerHeight);
                showTemporaryHint('Page up');
            }
            else if (transcript.includes('page down')) {
                window.scrollBy(0, window.innerHeight);
                showTemporaryHint('Page down');
            }
            else if (transcript.includes('go to top')) {
                window.scrollTo(0, 0);
                showTemporaryHint('At top of page');
            }
            else if (transcript.includes('go to bottom')) {
                window.scrollTo(0, document.body.scrollHeight);
                showTemporaryHint('At bottom of page');
            }
            else if (transcript.includes('go back')) {
                window.history.back();
                showTemporaryHint('Going back');
            }
            else if (transcript.includes('go forward')) {
                window.history.forward();
                showTemporaryHint('Going forward');
            }
            else if (transcript.startsWith('go to ')) {
                const pageKeyword = transcript.replace('go to ', '').trim();
                const links = Array.from(document.querySelectorAll('a[href]'));

                const target = links.find(link =>
                    link.textContent.toLowerCase().includes(pageKeyword) ||
                    link.getAttribute('href').toLowerCase().includes(pageKeyword)
                );

                if (target) {
                    showTemporaryHint(`Navigating to ${pageKeyword}...`);
                    window.location.href = target.href;
                } else {
                    showTemporaryHint(`No link found for "${pageKeyword}"`);
                }
            }
            // Handle chatbot commands
            else if (transcript === 'open chatbot') {
                const toggleBtn = document.getElementById('tycs-chatbotToggle');
                if (toggleBtn) {
                    toggleBtn.click();
                    showTemporaryHint('Chatbot opened');
                } else {
                    showTemporaryHint('Chatbot toggle not found');
                }
            }
            else if (transcript.startsWith('chat ')) {
                const chatInput = document.getElementById('tycs-chatInput');
                const chatbotBox = document.getElementById('tycs-chatbotBox');
                if (chatbotBox && chatInput) {
                    if (chatbotBox.classList.contains('tycs-hidden')) {
                        document.getElementById('tycs-chatbotToggle')?.click(); // auto open if closed
                    }
                    const message = transcript.substring(5).trim();
                    chatInput.value = message;
                    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                    showTemporaryHint(`Typed in chatbot: "${message}"`);
                } else {
                    showTemporaryHint('Chat input not found');
                }
            }
            else if (transcript === 'send message' || transcript === 'send') {
                const sendBtn = document.getElementById('tycs-sendMessageBtn');
                if (sendBtn) {
                    sendBtn.click();
                    showTemporaryHint('Message sent');
                } else {
                    showTemporaryHint('Send button not found');
                }
            }
            else if (transcript === 'close chatbot') {
                const closeBtn = document.getElementById('tycs-closeChatbot');
                if (closeBtn) {
                    closeBtn.click();
                    showTemporaryHint('Chatbot closed');
                } else {
                    showTemporaryHint('Chatbot close button not found');
                }
            }
            else if (transcript === 'close home popup' || transcript === 'close accessibility popup') {
                const closePopupBtn = document.getElementById('close-popup');
                if (closePopupBtn) {
                    closePopupBtn.click();
                    showTemporaryHint('Accessibility popup closed');
                } else {
                    showTemporaryHint('Close button not found for popup');
                }
            }
            // Handle form interactions
            else if (transcript.startsWith('input ')) {
                const fieldName = transcript.substring(6).trim();
                const inputEl = findInputElement(fieldName);

                if (inputEl) {
                    currentInput = inputEl;
                    inputEl.focus();
                    pronunciationPanel.style.display = 'block';
                    showTemporaryHint(`Ready to input in ${fieldName} field`);
                } else {
                    showTemporaryHint(`Couldn't find ${fieldName} field`);
                }
            }
            else if (transcript.startsWith('type ') && currentInput) {
                const textToType = transcript.substring(5).trim();
                handleSpellingInput(textToType);
            }
            else if (transcript.startsWith('click ')) {
                const buttonText = transcript.substring(6).trim();
                const clickableEl = findClickableElement(buttonText);

                if (clickableEl) {
                    clickableEl.click();
                    showTemporaryHint(`Clicked ${buttonText}`);
                } else {
                    showTemporaryHint(`Couldn't find ${buttonText} to click`);
                }
            }
            else if (transcript.includes('submit')) {
                const form = currentInput?.form || document.querySelector('form');
                if (form) {
                    form.submit();
                    showTemporaryHint('Form submitted');
                } else {
                    showTemporaryHint('No form found to submit');
                }
            }
            // Handle calculator commands
            else if (transcript.includes('open calculator') || transcript.includes('open cost estimator')) {
                const calculatorBtn = document.getElementById('costEstimatorBtn');
                if (calculatorBtn) {
                    calculatorBtn.click();
                    showTemporaryHint('Cost calculator opened');
                } else {
                    showTemporaryHint('Calculator button not found');
                }
            }
            else if (transcript.includes('close calculator') || transcript.includes('close cost estimator')) {
                const closeBtn = document.getElementById('closeSidebar');
                if (closeBtn) {
                    closeBtn.click();
                    showTemporaryHint('Cost calculator closed');
                } else {
                    showTemporaryHint('Close button not found');
                }
            }
            else if ((transcript.includes('next step')) && document.querySelector('#costSidebar.style.display !== "none"')) {
                const nextBtn = document.querySelector('.next-btn:not(.hidden)');
                if (nextBtn) {
                    nextBtn.click();
                    showTemporaryHint('Moving to next step');
                }
            }
            else if ((transcript.includes('previous step') || transcript.includes('back step')) && document.querySelector('#costSidebar.style.display !== "none"')) {
                const backBtn = document.querySelector('.back-btn:not(.hidden)');
                if (backBtn) {
                    backBtn.click();
                    showTemporaryHint('Going back to previous step');
                }
            }
            else if (transcript.startsWith('select service ') && document.querySelector('#costSidebar.style.display !== "none"')) {
                const serviceType = transcript.replace('select service', '').trim();
                const serviceOptions = document.querySelectorAll('.service-option');

                let found = false;
                serviceOptions.forEach(option => {
                    const optionText = option.textContent.toLowerCase();
                    if (optionText.includes(serviceType)) {
                        option.click();
                        showTemporaryHint(`Selected ${serviceType} service`);
                        found = true;
                    }
                });

                if (!found) {
                    showTemporaryHint(`Couldn't find ${serviceType} service option`);
                }
            }
            else if (transcript.includes('new estimate') && document.querySelector('#costSidebar.style.display !== "none"')) {
                const newEstimateBtn = document.querySelector('.new-estimate-btn');
                if (newEstimateBtn) {
                    newEstimateBtn.click();
                    showTemporaryHint('Starting new estimate');
                }
            }
            // Handle content popups
            else if (transcript.includes('read more')) {
                const readMoreBtn = document.querySelector('.tcs-read-more-btn');
                if (readMoreBtn) {
                    readMoreBtn.click();
                    showTemporaryHint('Opening read more content');
                } else {
                    showTemporaryHint('Read more button not found');
                }
            }
            else if (transcript.includes('close popup') || transcript.includes('close read more')) {
                const popupOverlay = document.querySelector('.tcs-popup-overlay');
                if (popupOverlay && popupOverlay.style.display === 'flex') {
                    popupOverlay.style.display = 'none';
                    showTemporaryHint('Popup closed');
                } else {
                    showTemporaryHint('No popup found to close');
                }
            }
            // Handle about us sections
            else if (transcript.includes('our history') || transcript.includes('show history')) {
                const historyBtn = document.querySelector('.tcs-popup-buttons-vertical button[onclick*="showHistoryPopup"]');
                if (historyBtn) {
                    historyBtn.click();
                    showTemporaryHint('Showing our history');
                } else {
                    showTemporaryHint('History button not found');
                }
            }
            else if (transcript.includes('our mission') || transcript.includes('show mission')) {
                const missionBtn = document.querySelector('.tcs-popup-buttons-vertical button[onclick*="showMissionPopup"]');
                if (missionBtn) {
                    missionBtn.click();
                    showTemporaryHint('Showing our mission');
                } else {
                    showTemporaryHint('Mission button not found');
                }
            }
            else if (transcript.includes('why choose us') || transcript.includes('why choose')) {
                const whyChooseBtn = document.querySelector('.tcs-popup-buttons-vertical button[onclick*="showWhyChoosePopup"]');
                if (whyChooseBtn) {
                    whyChooseBtn.click();
                    showTemporaryHint('Showing why choose us');
                } else {
                    showTemporaryHint('Why choose us button not found');
                }
            }
            else if (transcript.includes('close popup') || transcript.includes('close all popups')) {
                const popups = document.querySelectorAll('.tcs-popup-overlay, .tcs-popup-container');
                popups.forEach(popup => {
                    popup.style.display = 'none';
                });
                showTemporaryHint('All popups closed');
            }
            else if (transcript.includes('close history') || transcript.includes('hide history')) {
                const closeBtn = document.querySelector('.tcs-close-btn');
                if (closeBtn) {
                    closeBtn.click();
                    showTemporaryHint('History popup closed');
                } else {
                    showTemporaryHint('Close button not found');
                }
            }
            else if (transcript.includes('go back') || transcript.includes('back to main')) {
                const backBtn = document.querySelector('.tcs-back-btn');
                if (backBtn) {
                    backBtn.click();
                    showTemporaryHint('Returned to main popup');
                } else {
                    showTemporaryHint('Back button not found');
                }
            }
            // Handle special commands
            else if (transcript.includes('help')) {
                pronunciationPanel.style.display = 'block';
                showTemporaryHint('Showing voice commands help');
            }
            else if (transcript.includes('hide help')) {
                pronunciationPanel.style.display = 'none';
            }
            // Handle direct input
            else if (currentInput) {
                handleSpellingInput(transcript);
            }

            resetVoiceTimeout();
        };

        recog.onend = () => {
            if (isVoiceMode) {
                setTimeout(() => {
                    try {
                        recog.start();
                    } catch (e) {
                        console.log('Error restarting recognition:', e);
                    }
                }, 100);
            }
        };

        recog.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                showTemporaryHint('Microphone not detected');
                setTimeout(() => recog.start(), 1000);
            }
        };

        return recog;
    }

    // Start voice recognition
    function startRecognition() {
        if (!recognition) {
            recognition = setupRecognition();
            if (!recognition) return;
        }

        try {
            recognition.start();
            isVoiceMode = true;
            localStorage.setItem('universalVoiceMode', 'true');
            createUIElements();
            voiceHint.style.display = 'block';
            voiceHint.style.opacity = '1';
            showTemporaryHint('Voice mode activated • Say "help" for commands');
            resetVoiceTimeout();
            
            // Update the accessibility toggle if it exists
            const voiceToggle = document.querySelector('.accessibility-voice-toggle input[type="checkbox"]');
            if (voiceToggle) voiceToggle.checked = true;
        } catch (e) {
            console.error('Failed to start recognition:', e);
            showTemporaryHint('Error starting voice recognition');
            setTimeout(() => startRecognition(), 500);
        }
    }

    // Stop voice recognition
    function stopRecognition() {
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.log('Error stopping recognition:', e);
            }
        }

        isVoiceMode = false;
        localStorage.setItem('universalVoiceMode', 'false');
        currentInput = null;

        if (voiceHint) {
            voiceHint.style.opacity = '0';
            setTimeout(() => {
                if (voiceHint) voiceHint.style.display = 'none';
            }, 300);
        }

        if (pronunciationPanel) {
            pronunciationPanel.style.display = 'none';
        }

        clearTimeout(voiceTimeout);
        showTemporaryHint('Voice mode deactivated');
        
        // Update the accessibility toggle if it exists
        const voiceToggle = document.querySelector('.accessibility-voice-toggle input[type="checkbox"]');
        if (voiceToggle) voiceToggle.checked = false;
    }

    // Reset the inactivity timeout
    function resetVoiceTimeout() {
        clearTimeout(voiceTimeout);
        voiceTimeout = setTimeout(() => {
            stopRecognition();
            showTemporaryHint('Voice mode deactivated after inactivity');
        }, CONFIG.inactiveTimeout);
    }

    // Initialize the functionality
    function init() {
        createUIElements();

        // Connect with the accessibility toggle
        const voiceToggle = document.querySelector('.accessibility-voice-toggle input[type="checkbox"]');
        if (voiceToggle) {
            // Set initial state from localStorage
            voiceToggle.checked = isVoiceMode;
            
            // Add event listener for toggle changes
            voiceToggle.addEventListener('change', function() {
                if (this.checked) {
                    startRecognition();
                } else {
                    stopRecognition();
                }
            });
        }

        // Toggle with Alt+V
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                if (!isVoiceMode) {
                    startRecognition();
                    // Update the toggle if it exists
                    if (voiceToggle) voiceToggle.checked = true;
                } else {
                    stopRecognition();
                    // Update the toggle if it exists
                    if (voiceToggle) voiceToggle.checked = false;
                }
            }

            // Hide help panel with Escape
            if (e.key === 'Escape' && pronunciationPanel && pronunciationPanel.style.display === 'block') {
                pronunciationPanel.style.display = 'none';
            }
        });

        // Hide help panel when clicking outside
        document.addEventListener('click', (e) => {
            if (pronunciationPanel && pronunciationPanel.style.display === 'block' &&
                !pronunciationPanel.contains(e.target)) {
                pronunciationPanel.style.display = 'none';
            }
        });

        console.log('Universal Voice Input initialized. Press Alt+V to toggle.');
    }

    // Start the script
    init();
    if (isVoiceMode) {
        startRecognition();
    }
})();
