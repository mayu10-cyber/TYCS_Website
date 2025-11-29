document.querySelectorAll("form")[1].addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent default form submission

    const form = e.currentTarget;

    // Get and trim form data
    const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        message: document.getElementById("message").value.trim()
    };

    // Validate required fields (contact optional)
    if (!formData.name || !formData.email || !formData.message) {
        showMessage("Please fill in Name, Email, and Message.", "error");
        return;
    }

    // Show loading state
    const submitButton = document.getElementById('submit');
    const originalText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
        submitButton.textContent = "Sending...";
        submitButton.disabled = true;
    }

    // Announce sending state
    showMessage("Sending your message...", "info");

    // Determine API base URL
    const isFile = window.location.protocol === 'file:';
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const isProdHost = (window.location.hostname || '').endsWith('tycs.in');
    const apiBase = isProdHost ? '' : ((isLocalHost || isFile) ? 'http://localhost:3000' : 'https://tycs.in');

    // Send email
    const url = `${apiBase}/send-email`;
    console.log('[ContactForm] POST', url, formData);
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('[ContactForm] Response', data);
        if (data.success) {
            showMessage(data.message || "Submitted! We'll get back to you shortly.", "success");
            form.reset();
            if (submitButton) {
                submitButton.textContent = "Sent ✅";
            }
        } else {
            showMessage(data.message || "Failed to send email", "error");
            if (submitButton) {
                submitButton.textContent = originalText || "Submit";
            }
        }
    })
    .catch(error => {
        console.error("Error:", error);
        showMessage("Network error. Please check your connection and try again.", "error");
        if (submitButton) {
            submitButton.textContent = originalText || "Submit";
        }
    })
    .finally(() => {
        // Reset button state
        if (submitButton) submitButton.disabled = false;
    });
});

// Function to show messages
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('#submitStatus');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.id = 'submitStatus';
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.setAttribute('role', type === 'error' ? 'alert' : 'status');
    messageDiv.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    messageDiv.tabIndex = -1;
    
    // Style the message
    let styleString = `
        padding: 10px 15px;
        margin: 10px 0;
        border-radius: 5px;
        font-weight: 500;
        text-align: center;
    `;
    if (type === 'success') {
        styleString += 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
    } else if (type === 'info') {
        styleString += 'background-color: #dbeafe; color: #1e3a8a; border: 1px solid #3b82f6;';
    } else if (type === 'warning') {
        styleString += 'background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b;';
    } else {
        styleString += 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
    }
    messageDiv.style.cssText = styleString;

    // Insert message after the form
    const form = document.querySelectorAll("form")[1];
    form.parentNode.insertBefore(messageDiv, form.nextSibling);

    // Auto-remove message after 5 seconds
    setTimeout(() => {
        if (messageDiv && messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, type === 'success' ? 4000 : 6000);

    // Ensure visibility and focus for accessibility
    try {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => messageDiv.focus(), 300);
    } catch (_) {
        // no-op
    }
}