// Dashboard JavaScript

// Obfuscation layer to evade detection
(function() {
    // Hide execution context
    const originalOpen = window.open;
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;
    
    // Store original methods with obfuscated names
    window['_x' + Math.random().toString(36).substr(2, 5)] = {
        open: originalOpen,
        fetch: originalFetch,
        xhr: originalXHR
    };
})();

document.addEventListener('DOMContentLoaded', async function() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    // Check if user is logged in
    if (!token || !username) {
        window.location.href = 'signup.html';
        return;
    }

    // Display username
    document.getElementById('username').textContent = `Welcome, ${username}!`;

    // Show admin button if user is Anton
    if (username === 'Anton') {
        document.getElementById('adminBtn').style.display = 'block';
    }

    // Fetch user data to get current premium status
    async function checkPremiumStatus() {
        try {
            const response = await fetch('/api/user/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                async function safeJson(res) {
                    const text = await res.text();
                    if (!text) return null;
                    try { return JSON.parse(text); } catch (e) { return null; }
                }

                const data = await safeJson(response);
                return data && data.isPremium;
            }
        } catch (error) {
            console.error('Error checking premium status:', error);
        }
        
        return localStorage.getItem('isPremium') === 'true';
    }

    // Update app access based on premium status
    async function updateAppAccess() {
        const isPremium = await checkPremiumStatus();
        localStorage.setItem('isPremium', isPremium);

        if (isPremium) {
            // Unlock all apps
            document.querySelectorAll('.app-card.locked').forEach(card => {
                card.classList.remove('locked');
                card.querySelector('.app-status').textContent = 'Unlocked';
                const btn = card.querySelector('.btn-app');
                btn.disabled = false;
                btn.textContent = 'Launch';
            });
        }
    }

    // Handle admin button
    document.getElementById('adminBtn').addEventListener('click', () => {
        window.location.href = 'admin.html';
    });

    // Handle premium button
    document.getElementById('premiumBtn').addEventListener('click', () => {
        window.location.href = 'premium.html';
    });

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'signup.html';
    });

    // Handle app buttons
    document.querySelectorAll('.btn-app').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.app-card');
            const app = card.dataset.app;
            const isLocked = card.classList.contains('locked');

            if (isLocked) {
                alert('This app requires premium access. Contact the admin for premium upgrade.');
                return;
            }

            // Launch apps in hidden popups
            const appUrls = {
                chatgpt: 'https://chat.openai.com/',
                geforce: 'https://play.geforcenow.com/mall/#/layout/games',
                tiktok: 'https://www.tiktok.com/',
                instagram: 'https://www.instagram.com/',
                snapchat: 'https://www.snapchat.com/',
                discord: 'https://discord.com/',
                twitch: 'https://www.twitch.tv/',
                youtube: 'https://www.youtube.com/',
                roblox: 'https://www.roblox.com/',
                minecraft: 'https://www.minecraft.net/',
                fortnite: 'https://www.fortnite.com/',
                valorant: 'https://valorant.com/',
                twitter: 'https://twitter.com/',
                reddit: 'https://www.reddit.com/',
                spotify: 'https://www.spotify.com/',
                netflix: 'https://www.netflix.com/',
                steam: 'https://www.steampowered.com/',
                epicgames: 'https://www.epicgames.com/',
                'discord-nitro': 'https://discord.com/nitro',
                'among-us': 'https://www.innersloth.com/games/among-us/',
                pinterest: 'https://www.pinterest.com/',
                wattpad: 'https://www.wattpad.com/',
                deviantart: 'https://www.deviantart.com/'
            };

            if (appUrls[app]) {
                try {
                    const redirectUrl = appUrls[app];

                    // Try to open in a new tab/window in a normal, non-stealth way
                    const popup = window.open(redirectUrl, '_blank');

                    // If popup is blocked (returns null) or immediately closed, show a friendly fallback modal
                    if (!popup) {
                        showPopupBlockedModal(redirectUrl);
                    } else {
                        try { popup.focus(); } catch (e) {}
                    }
                } catch (error) {
                    // Ultimate fallback: navigate in current tab
                    window.location.href = appUrls[app];
                }
            }
        });
    });

    // Check premium status on page load
    await updateAppAccess();

    // Refresh premium status every 3 seconds
    setInterval(updateAppAccess, 3000);
});

    // Create a reusable modal to show when popups are blocked
    function showPopupBlockedModal(url) {
        // If modal already exists, update link and show
        let modal = document.getElementById('popupBlockedModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'popupBlockedModal';
            modal.style.position = 'fixed';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.background = 'rgba(0,0,0,0.5)';
            modal.style.zIndex = '99999';

            modal.innerHTML = `
                <div style="background:#fff;padding:18px;border-radius:8px;max-width:480px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:inherit;">
                    <h3 style="margin-top:0">Popup Blocked</h3>
                    <p>It looks like your browser or school device blocked opening a new window. You can open the app manually or allow popups for this site.</p>
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                        <button id="pbOpenSameBtn" style="background:#007bff;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Open Here</button>
                        <button id="pbCopyBtn" style="background:#6c757d;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Copy Link</button>
                        <button id="pbCloseBtn" style="background:transparent;border:1px solid #ccc;padding:8px 12px;border-radius:4px;cursor:pointer">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('pbCloseBtn').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            document.getElementById('pbOpenSameBtn').addEventListener('click', () => {
                // Navigate current tab to the URL
                window.location.href = document.getElementById('pbOpenSameBtn').dataset.url || url;
            });

            document.getElementById('pbCopyBtn').addEventListener('click', async () => {
                const link = document.getElementById('pbOpenSameBtn').dataset.url || url;
                try {
                    await navigator.clipboard.writeText(link);
                    alert('Link copied to clipboard');
                } catch (e) {
                    prompt('Copy this link:', link);
                }
            });
        }

        // Update stored URL and show modal
        document.getElementById('pbOpenSameBtn').dataset.url = url;
        modal.style.display = 'flex';
    }
