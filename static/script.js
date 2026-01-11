const messagesContainer = document.getElementById('messages');
const queryForm = document.getElementById('queryForm');
const queryInput = document.getElementById('queryInput');
const submitBtn = document.getElementById('submitBtn');

// ============================================================================
// SESSION-BASED CONVERSATION MEMORY
// ============================================================================
// Generate a unique session_id once when the page loads.
// This session_id will be sent with every API request to maintain
// conversation context across multiple turns.
// ============================================================================
const sessionId = (() => {
    // Try to use crypto.randomUUID() (modern browsers) or fallback to timestamp
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
})();

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    // Add avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (isUser) {
        avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    } else {
        avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const p = document.createElement('p');
    p.textContent = content;
    
    contentDiv.appendChild(p);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

// Show loading message with typing indicator
function showLoadingMessage() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = 'loading-message';
    
    // Add avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingIndicator.appendChild(dot);
    }
    
    contentDiv.appendChild(typingIndicator);
    loadingDiv.appendChild(avatar);
    loadingDiv.appendChild(contentDiv);
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove loading message
function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// Handle form submission
queryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = queryInput.value.trim();
    if (!query) return;
    
    // Add user message
    addMessage(query, true);
    
    // Clear input
    queryInput.value = '';
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    // Show loading message
    showLoadingMessage();
    
    try {
        const response = await fetch('/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send session_id with every request to maintain conversation context
            body: JSON.stringify({ q: query, session_id: sessionId }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loading message
        removeLoadingMessage();
        
        // Add bot response
        if (data.answer) {
            addMessage(data.answer, false);
        } else {
            addMessage('Sorry, I could not generate a response. Please try again.', false);
        }
    } catch (error) {
        console.error('Error:', error);
        
        // Remove loading message
        removeLoadingMessage();
        
        // Show error message
        addMessage('Sorry, an error occurred while processing your query. Please try again.', false);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        queryInput.focus();
    }
});

// Focus input on load
window.addEventListener('load', () => {
    queryInput.focus();
});

// Allow Enter key to submit (Shift+Enter for new line if needed)
queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        queryForm.dispatchEvent(new Event('submit'));
    }
});
