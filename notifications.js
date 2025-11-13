// Update Notification System

class UpdateNotifier {
    constructor() {
        this.notificationQueue = [];
        this.isShowing = false;
        this.setupStyles();
    }

    setupStyles() {
        // Styles are already in notifications.css
    }

    // Show update notification
    show(updates, duration = 5000) {
        const notificationHTML = `
            <div class="update-notification" id="updateNotif">
                <div class="update-content">
                    <div class="update-title">
                        <span class="update-icon">✨</span>
                        <span>Updates Available</span>
                    </div>
                    <div class="update-items">
                        ${updates.map(update => `
                            <div class="update-item">
                                <span class="update-item-icon">${update.icon || '•'}</span>
                                <span>${update.text}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="update-progress-container">
                        <div class="update-progress-bar"></div>
                    </div>
                    <div class="update-time">
                        Dismissing in ${duration / 1000}s...
                    </div>
                </div>
            </div>
        `;

        // Remove existing notification if present
        const existing = document.getElementById('updateNotif');
        if (existing) {
            existing.remove();
        }

        // Add notification to body
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
        const notification = document.getElementById('updateNotif');

        // Auto-dismiss after duration
        setTimeout(() => {
            if (notification && document.body.contains(notification)) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification && document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 500);
            }
        }, duration);

        return notification;
    }

    // Queue multiple notifications
    queue(updates, duration = 5000) {
        this.notificationQueue.push({ updates, duration });
        if (!this.isShowing) {
            this.processQueue();
        }
    }

    processQueue() {
        if (this.notificationQueue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const { updates, duration } = this.notificationQueue.shift();

        this.show(updates, duration);

        setTimeout(() => {
            this.processQueue();
        }, duration + 500);
    }
}

// Initialize global notifier
const updateNotifier = new UpdateNotifier();

// Helper function for common updates
function notifyPremiumGranted(username) {
    updateNotifier.show([
        { icon: '👑', text: `Premium granted to ${username}` },
        { icon: '🎉', text: 'All apps unlocked' }
    ]);
}

function notifyPremiumRemoved(username) {
    updateNotifier.show([
        { icon: '🔒', text: `Premium removed from ${username}` },
        { icon: '📱', text: 'Limited access restored' }
    ]);
}

function notifyUserDeleted(username) {
    updateNotifier.show([
        { icon: '❌', text: `Account deleted: ${username}` },
        { icon: '🗑️', text: 'User data removed' }
    ]);
}

function notifyPaymentReceived(username, amount) {
    updateNotifier.show([
        { icon: '💰', text: `Payment received from ${username}` },
        { icon: '✅', text: `Amount: $${amount.toFixed(2)}` }
    ]);
}

function notifyNewMessage(username) {
    updateNotifier.show([
        { icon: '💬', text: `New message from ${username}` },
        { icon: '🔔', text: 'Check the chat' }
    ]);
}

function notifyPremiumActivated() {
    updateNotifier.show([
        { icon: '🎊', text: 'Premium activated!' },
        { icon: '🔓', text: 'All features unlocked' }
    ]);
}

function notifySignupSuccess(username) {
    updateNotifier.show([
        { icon: '✅', text: `Welcome ${username}!` },
        { icon: '🚀', text: 'Account created successfully' }
    ]);
}

function notifyLoginSuccess(username) {
    updateNotifier.show([
        { icon: '✅', text: `Welcome back ${username}!` },
        { icon: '🎯', text: 'Logged in successfully' }
    ]);
}

function notifyAppLaunched(appName) {
    updateNotifier.show([
        { icon: '🚀', text: `Launching ${appName}...` },
        { icon: '⚡', text: 'Opening in popup' }
    ], 3000);
}

function notifyPaymentPending() {
    updateNotifier.show([
        { icon: '⏳', text: 'Payment pending' },
        { icon: '📝', text: 'Admin notification sent' }
    ]);
}

function notifyPaymentProcessing() {
    updateNotifier.show([
        { icon: '⏳', text: 'Processing payment...' },
        { icon: '💳', text: 'Please wait' }
    ]);
}

function notifyBroadcast(message) {
    updateNotifier.show([
        { icon: '📣', text: message }
    ], 5000);
}

// Auto-poll broadcasts and display them
let _lastBroadcastId = parseInt(localStorage.getItem('lastBroadcastId') || '0');
async function pollBroadcasts() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/broadcasts?since=' + _lastBroadcastId, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) return;
        const data = await res.json();
        if (data.newBroadcasts && data.newBroadcasts.length) {
            data.newBroadcasts.forEach(b => {
                try { updateNotifier.show([{ icon: '📣', text: b.message }], 5000); } catch (e) {}
                _lastBroadcastId = Math.max(_lastBroadcastId, b.id);
            });
            localStorage.setItem('lastBroadcastId', String(_lastBroadcastId));
        }
    } catch (e) {
        // ignore
    }
}

// Start polling every 3 seconds
setInterval(pollBroadcasts, 3000);
pollBroadcasts();
