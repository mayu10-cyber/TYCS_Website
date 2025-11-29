document.addEventListener("DOMContentLoaded", () => {
    let voiceEnabled = localStorage.getItem("voiceEnabled") !== "false";

    // Get the toggle element
    const voiceToggle = document.querySelector('#accessibilitySpeakItem input[type="checkbox"]');
    
    // Set initial toggle state
    if (voiceToggle) {
        voiceToggle.checked = voiceEnabled;
    }

    // Speak feedback function
    const speakStatus = (msg) => {
        const utterance = new SpeechSynthesisUtterance(msg);
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    };

    // Toggle with Alt + S
    document.addEventListener("keydown", (e) => {
        if (e.altKey && e.key.toLowerCase() === "s") {
            toggleVoiceControl();
        }
    });

    // Toggle when button is clicked
    if (voiceToggle) {
        voiceToggle.addEventListener('change', toggleVoiceControl);
    }

    // Function to handle toggling
    function toggleVoiceControl() {
        voiceEnabled = !voiceEnabled;
        localStorage.setItem("voiceEnabled", voiceEnabled);
        
        // Update toggle state
        if (voiceToggle) {
            voiceToggle.checked = voiceEnabled;
        }
        
        speakStatus(voiceEnabled ? "Hover to speak enabled" : "Hover to speak disabled");
    }

    // Enhanced speak function with voice selection
    let speakTimeout;
    const speak = (text) => {
        if (!voiceEnabled || !text.trim()) return;

        clearTimeout(speakTimeout);
        speakTimeout = setTimeout(() => {
            const speakWithVoice = () => {
                const voices = speechSynthesis.getVoices();
                const preferredVoice =
                    voices.find((v) => v.lang === "mr-IN") ||
                    voices.find((v) => v.lang === "hi-IN") ||
                    voices.find((v) => v.lang.startsWith("en")) ||
                    voices[0];

                const utterance = new SpeechSynthesisUtterance(text.trim());
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                    utterance.lang = preferredVoice.lang;
                }
                utterance.rate = 1;
                utterance.pitch = 1;

                speechSynthesis.cancel();
                speechSynthesis.speak(utterance);
            };

            if (speechSynthesis.getVoices().length === 0) {
                speechSynthesis.onvoiceschanged = speakWithVoice;
            } else {
                speakWithVoice();
            }
        }, 100);
    };

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

    // Function to attach event listeners to iframes
    const setupIframeSpeak = (iframe) => {
        try {
            // Only proceed if iframe is from same origin
            if (iframe.contentDocument) {
                const iframeDoc = iframe.contentDocument;

                const iframeElements = iframeDoc.querySelectorAll("*");
                iframeElements.forEach((el) => {
                    const cleanText = getCleanText(el);
                    if (!cleanText) return;

                    el.addEventListener("mouseenter", () => speak(cleanText));
                    el.addEventListener("touchstart", (e) => {
                        e.preventDefault();
                        speak(cleanText);
                    }, { passive: false });
                });

                // Observe for changes in iframe
                const iframeObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType !== 1) return;
                            const cleanText = getCleanText(node);
                            if (cleanText) {
                                node.addEventListener("mouseenter", () => speak(cleanText));
                                node.addEventListener("touchstart", (e) => {
                                    e.preventDefault();
                                    speak(cleanText);
                                }, { passive: false });
                            }
                        });
                    });
                });

                iframeObserver.observe(iframeDoc.body, {
                    childList: true,
                    subtree: true
                });
            }
        } catch (error) {
            console.log("Could not access iframe content due to security restrictions");
        }
    };

    // Function to attach event listeners
    const attachSpeakListeners = (element) => {
        if (element._hasSpeakListener) return;

        // Special handling for iframes
        if (element.tagName === 'IFRAME') {
            // Wait for iframe to load
            element.addEventListener('load', () => setupIframeSpeak(element));
            return;
        }

        const cleanText = getCleanText(element);
        if (!cleanText) return;

        element.addEventListener("mouseenter", () => speak(cleanText));
        element.addEventListener("touchstart", (e) => {
            e.preventDefault();
            speak(cleanText);
        }, { passive: false });

        element._hasSpeakListener = true;
    };

    // MutationObserver for dynamic content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== 1) return;

                if (node.nodeType === 1) {
                    attachSpeakListeners(node);
                }

                const elements = node.querySelectorAll?.("*") || [];
                elements.forEach(attachSpeakListeners);
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial setup for existing content
    const allElements = document.querySelectorAll("*");
    allElements.forEach(attachSpeakListeners);

    // Special handling for existing iframes
    document.querySelectorAll("iframe").forEach(setupIframeSpeak);
});