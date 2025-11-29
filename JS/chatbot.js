document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const chatbotToggle = document.getElementById('tycs-chatbotToggle');
    const chatbotBox = document.getElementById('tycs-chatbotBox');
    const closeChatbotBtn = document.getElementById('tycs-closeChatbot');
    const chatArea = document.getElementById('tycs-chatArea');
    const chatInput = document.getElementById('tycs-chatInput');
    const sendMessageBtn = document.getElementById('tycs-sendMessageBtn');
    const imageInput = document.getElementById('tycs-imageInput');
    const uploadImageBtn = document.getElementById('tycs-uploadImageBtn');

    const API_URL = 'http://localhost:3001/chat';
    let attachedImageFile = null;
    let hasGreeted = false;

    // --- Helper Functions ---
    const markdownToHtml = (text) => {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    };

    const addMessageToChat = (sender, message, imageUrl = null, save = true) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `tycs-message ${sender === 'user' ? 'tycs-message-user' : 'tycs-message-bot'}`;

        let contentHtml = '';
        if (sender === 'user') {
            const imageHtml = imageUrl
                ? `<img src="${imageUrl}" alt="User upload" class="tycs-message-image">`
                : '';
            const textHtml = message ? `<p>${message}</p>` : '';
            contentHtml = `
                <div class="tycs-user-bubble">
                    ${imageHtml}
                    ${textHtml}
                </div>
                <img src="assets/user.png" alt="User" class="tycs-avatar" />
            `;
        } else {
            const formattedMessage = markdownToHtml(message);
            contentHtml = `
                <img src="assets/tycs.png" alt="Bot" class="tycs-avatar" />
                <div class="tycs-bot-bubble">
                    <p>${formattedMessage}</p>
                </div>
            `;
        }

        messageDiv.innerHTML = contentHtml;
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Save message to localStorage
        if (save) {
            const stored = JSON.parse(localStorage.getItem('tycs-chatHistory') || '[]');
            stored.push({ sender, message, imageUrl });
            localStorage.setItem('tycs-chatHistory', JSON.stringify(stored));
        }
    };

    const showTypingIndicator = () => {
        if (document.getElementById('tycs-typing-indicator')) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'tycs-typing-indicator';
        typingDiv.className = 'tycs-message tycs-message-bot';

        typingDiv.innerHTML = `
            <img src="assets/tycs.png" alt="Bot" class="tycs-avatar" />
            <div class="tycs-bot-bubble">
                <p><i>Thinking...</i></p>
            </div>
        `;
        chatArea.appendChild(typingDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const typingIndicator = document.getElementById('tycs-typing-indicator');
        if (typingIndicator) typingIndicator.remove();
    };

    const resetInputState = () => {
        chatInput.value = '';
        imageInput.value = '';
        attachedImageFile = null;
        chatInput.placeholder = "Type a message...";
        uploadImageBtn.classList.remove('tycs-image-attached');
    };

    const sendMessage = async () => {
        const userText = chatInput.value.trim();
        if (!userText && !attachedImageFile) return;

        const formData = new FormData();
        formData.append('question', userText);
        if (attachedImageFile) {
            formData.append('image', attachedImageFile);
        }

        const imagePreviewUrl = attachedImageFile
            ? URL.createObjectURL(attachedImageFile)
            : null;

        addMessageToChat('user', userText, imagePreviewUrl);
        resetInputState();
        showTypingIndicator();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            removeTypingIndicator();

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.statusText}`);
            }

            const data = await response.json();
            addMessageToChat('bot', data.answer);
        } catch (error) {
            console.error('Error fetching chatbot reply:', error);
            removeTypingIndicator();
            addMessageToChat('bot', `Sorry, an error occurred. Please check the server terminal or browser console.`);
        }
    };

    // --- GREETING & EVENT LISTENERS ---
    const sendGreeting = () => {
        if (hasGreeted) return;
        addMessageToChat('bot', "Hello! I'm an AI assistant. How can I help you today?");
        hasGreeted = true;
    };

    const toggleChatbot = () => {
        chatbotBox.classList.toggle('tycs-hidden');
        const calculatorBtn = document.getElementById('costEstimatorBtn');

        if (!chatbotBox.classList.contains('tycs-hidden')) {
            // Chatbot is being opened - hide calculator button
            calculatorBtn.classList.add('hidden');
            sendGreeting();
        } else {
            // Chatbot is being closed - show calculator button
            calculatorBtn.classList.remove('hidden');
        }
    };

    chatbotToggle.addEventListener('click', toggleChatbot);
    closeChatbotBtn.addEventListener('click', toggleChatbot);
    sendMessageBtn.addEventListener('click', sendMessage);

    uploadImageBtn.addEventListener('click', () => imageInput.click());

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            attachedImageFile = e.target.files[0];
            chatInput.placeholder = `Image attached. Add a message...`;
            uploadImageBtn.classList.add('tycs-image-attached');
        }
    });
});
