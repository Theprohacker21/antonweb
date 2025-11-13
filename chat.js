// Chat Widget Functionality

let currentUser = '';
let chatOpen = false;
let unreadCount = 0;
let lastMessageId = 0;

// Initialize chat
document.addEventListener('DOMContentLoaded', function() {
    // Get current user from token
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const decoded = atob(token);
            currentUser = decoded.split(':')[0];
        } catch (e) {
            console.error('Failed to decode token');
            return;
        }
    }

    const chatToggle = document.getElementById('chatToggle');
    const chatClose = document.getElementById('chatClose');
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');

    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', closeChat);
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Load messages on init
    loadMessages();

    // Poll for new messages every 2 seconds
    setInterval(loadMessages, 2000);

    // Browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

function toggleChat() {
    chatOpen ? closeChat() : openChat();
}

function openChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.style.display = 'flex';
    chatOpen = true;
    unreadCount = 0;
    updateUnreadBadge();
    loadMessages();
    document.getElementById('chatInput').focus();
}

function closeChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.style.display = 'none';
    chatOpen = false;
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                group: 'NMS'
            })
        });

        if (response.ok) {
            chatInput.value = '';
            loadMessages();
        } else {
            console.error('Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function loadMessages() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/chat/messages?group=NMS&since=' + lastMessageId, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderMessages(data.messages);

            // Check for new messages and notify
            if (data.newMessages && data.newMessages.length > 0 && !chatOpen) {
                handleNewMessages(data.newMessages);
            }

            // Update last message ID
            if (data.messages.length > 0) {
                lastMessageId = data.messages[data.messages.length - 1].id;
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');

    if (messages.length === 0) {
        if (container.innerHTML === '') {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <div class="empty-state-text">No messages yet. Start the conversation!</div>
                </div>
            `;
        }
        return;
    }

    // Clear if it's showing empty state
    if (container.innerHTML.includes('empty-state')) {
        container.innerHTML = '';
    }

    // Build message HTML
    let messagesHTML = '';
    messages.forEach(msg => {
        const isOwn = msg.username === currentUser;
        const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let tierBadgeClass = 'tier-badge';
        if (msg.tier === 'Founder (Admin)') {
            tierBadgeClass += ' tier-admin';
        } else if (msg.tier === 'Premium') {
            tierBadgeClass += ' tier-premium';
        } else {
            tierBadgeClass += ' tier-free';
        }
        
        messagesHTML += `
            <div class="message ${isOwn ? 'own' : ''}">
                ${!isOwn ? `<div class="message-sender">${msg.username} <span class="${tierBadgeClass}">${msg.tier}</span></div>` : `<div class="message-sender-own">${msg.username} <span class="${tierBadgeClass}">${msg.tier}</span></div>`}
                <div class="message-bubble">${escapeHtml(msg.message)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
    });

    container.innerHTML = messagesHTML;

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function handleNewMessages(newMessages) {
    // Count unread messages from other users
    newMessages.forEach(msg => {
        if (msg.username !== currentUser) {
            unreadCount++;
        }
    });

    updateUnreadBadge();

    // Show browser notification for the latest message
    const latestMsg = newMessages[newMessages.length - 1];
    if (latestMsg && latestMsg.username !== currentUser) {
        showNotification(latestMsg.username, latestMsg.message);
    }
}

function updateUnreadBadge() {
    const badge = document.getElementById('unreadBadge');
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function showNotification(username, message) {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New message from ' + username, {
            body: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            icon: 'https://cdn.discordapp.com/attachments/1436520150047133706/1438390237305770158/a0KC3AAAAAZJREFUAwBBCk6Pi6At2gAAAABJRU5ErkJggg.png?ex=6916b4cc&is=6915634c&hm=57a7b34402197369126aebe700272de17c4e8ee95c160369d662d2c35b0e607f&',
            tag: 'nms-chat',
            requireInteraction: false
        });
    }

    // Desktop title notification
    const originalTitle = document.title;
    document.title = `💬 ${username}: ${message.substring(0, 30)}...`;
    
    setTimeout(() => {
        document.title = originalTitle;
    }, 5000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
