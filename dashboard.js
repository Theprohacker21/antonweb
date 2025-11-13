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
                const data = await response.json();
                return data.isPremium;
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
                    
                    // Generate obfuscated random window name
                    const randomWindowName = 'w' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
                    
                    // Advanced stealth features
                    const features = [
                        'menubar=no',
                        'toolbar=no',
                        'location=no',
                        'status=no',
                        'scrollbars=yes',
                        'resizable=yes',
                        'width=1280',
                        'height=720',
                        'left=0',
                        'top=0',
                        'chrome=no',
                        'channelmode=no',
                        'directories=no',
                        'fullscreen=no',
                        'personalbar=no',
                        'titlebar=no'
                    ].join(',');
                    
                    // Open popup with stealth features
                    const popup = window.open('about:blank', randomWindowName, features);
                    
                    if (popup) {
                        // Attempt to hide window object properties
                        try {
                            Object.defineProperty(popup, 'opener', { value: null });
                        } catch (e) {}
                        
                        // Clear document immediately
                        popup.document.write('');
                        popup.document.close();
                        
                        // Multiple redirect methods with random delays to evade detection
                        const delays = [50, 100, 150, 200];
                        
                        // Method 1: Direct href
                        setTimeout(() => {
                            try {
                                popup.location.href = redirectUrl;
                            } catch (e) {}
                        }, delays[Math.floor(Math.random() * delays.length)]);
                        
                        // Method 2: Replace (no history)
                        setTimeout(() => {
                            try {
                                popup.location.replace(redirectUrl);
                            } catch (e) {}
                        }, delays[Math.floor(Math.random() * delays.length)]);
                        
                        // Method 3: Assign (alternative redirect)
                        setTimeout(() => {
                            try {
                                popup.location.assign(redirectUrl);
                            } catch (e) {}
                        }, delays[Math.floor(Math.random() * delays.length)]);
                        
                        // Obfuscate popup reference
                        try {
                            popup.window = undefined;
                            popup.self = undefined;
                        } catch (e) {}
                        
                        // Multiple focus attempts
                        setTimeout(() => {
                            if (popup && popup.focus) {
                                popup.focus();
                            }
                        }, 50);
                        
                        // Clear all references
                        setTimeout(() => {
                            try {
                                popup = null;
                            } catch (e) {}
                        }, 300);
                        
                        // Create dummy reference to mislead detectors
                        window['_temp_' + randomWindowName] = null;
                        
                        // Open a small same-origin monitor window to deliver broadcasts while user is in external popup
                        try {
                            const monitorKey = 'monitor_' + (username || 'user');
                            if (!window[monitorKey] || window[monitorKey].closed) {
                                const monName = 'mon_' + Math.random().toString(36).substr(2,6);
                                const mon = window.open('/popup-monitor.html', monName, 'width=360,height=200,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
                                try { window[monitorKey] = mon; } catch (e) {}
                            }
                        } catch (e) {}
                        
                    } else {
                        // If popup is blocked, use alternative method
                        // Attempt iframe approach first (can bypass some filters)
                        try {
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.src = redirectUrl;
                            document.body.appendChild(iframe);
                            
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                            }, 5000);
                        } catch (e) {
                            // Fallback to direct navigation
                            window.location.href = redirectUrl;
                        }
                    }
                } catch (error) {
                    // Ultimate fallback
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
