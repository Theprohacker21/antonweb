// Dashboard JavaScript - App Launcher with Popup Windows and Search

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
            if (!response) return localStorage.getItem('isPremium') === 'true';
            const text = await response.text();
            if (!text) return localStorage.getItem('isPremium') === 'true';
            try {
                const data = JSON.parse(text);
                return !!data.isPremium;
            } catch (e) {
                return localStorage.getItem('isPremium') === 'true';
            }
        } catch (e) {
            console.error('checkPremiumStatus error', e);
            return localStorage.getItem('isPremium') === 'true';
        }
    }

    async function updateAppAccess() {
        const isPremium = await checkPremiumStatus();
        localStorage.setItem('isPremium', isPremium);

        // Update locked cards visually
        document.querySelectorAll('.app-card').forEach(card => {
            if (card.classList.contains('locked')) {
                const status = card.querySelector('.app-status');
                const btn = card.querySelector('.btn-app');
                if (isPremium) {
                    card.classList.remove('locked');
                    if (status) status.textContent = 'Unlocked';
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = 'Launch';
                    }
                } else {
                    if (status) status.textContent = '🔒 Premium Only';
                    if (btn) {
                        btn.disabled = true;
                        btn.textContent = 'Locked';
                    }
                }
            }
        });

        // Render search card (inserts next to app cards)
        renderSearchCard(!isPremium);
    }

    // Basic button handlers
    document.getElementById('adminBtn').addEventListener('click', () => window.location.href = 'admin.html');
    document.getElementById('premiumBtn').addEventListener('click', () => window.location.href = 'premium.html');
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'signup.html';
    });

    // Insert a search card at the start of the apps grid
    function renderSearchCard(isLocked) {
        const appsGrid = document.querySelector('.apps-grid');
        if (!appsGrid) return;
        if (document.getElementById('searchCard')) {
            const note = document.querySelector('#searchCard .app-status');
            if (note) note.textContent = isLocked ? 'Other apps are available only for Premium users. Upgrade to unlock them.' : 'Use the search box to find sites';
            // Still render apps and VM card even if search card already exists
            renderAppCards(isLocked);
            renderVMCard();
            return;
        }

        const div = document.createElement('div');
        div.className = 'app-card';
        div.id = 'searchCard';
        div.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;min-width:260px;';
        div.innerHTML = `
            <div class="app-icon" style="font-size:40px">🔎</div>
            <h3>Google Search</h3>
            <p class="app-status">${isLocked ? 'Other apps are available only for Premium users. Upgrade to unlock them.' : 'Use the search box to find sites'}</p>
            <div style="display:flex;gap:8px;margin-top:8px;">
                <button id="openSearchBtn" class="btn-app" style="padding:8px 12px;border-radius:6px;">Open Search</button>
                <button id="goToPremiumBtn" class="btn-premium" style="padding:8px 12px;border-radius:6px;">Get Premium</button>
            </div>
        `;

        appsGrid.insertBefore(div, appsGrid.firstChild);

        document.getElementById('openSearchBtn').addEventListener('click', () => {
            const opened = openSearchPopupWindow();
            if (!opened) createSearchModal();
        });
        document.getElementById('goToPremiumBtn').addEventListener('click', () => window.location.href = 'premium.html');

        // Render app cards after search card
        renderAppCards(isLocked);
        renderVMCard();
    }

    // Render a Virtual Machine / Terminal card
    function renderVMCard() {
        const appsGrid = document.querySelector('.apps-grid');
        if (!appsGrid) return;
        if (document.getElementById('vmCard')) return; // Don't duplicate

        const div = document.createElement('div');
        div.className = 'app-card';
        div.id = 'vmCard';
        div.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;min-width:260px;';
        div.innerHTML = `
            <div class="app-icon" style="font-size:40px">🖥️</div>
            <h3>Virtual Terminal</h3>
            <p class="app-status">Run commands in a web-based terminal</p>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
                <button id="openVMBtn" class="btn-app" style="padding:8px 12px;border-radius:6px;">Launch Terminal</button>
                <button id="openRemoteVMBtn" class="btn-app" style="padding:8px 12px;border-radius:6px;">Open Remote VM</button>
                <button id="requestAdminBtn" class="btn-app" style="padding:8px 12px;border-radius:6px;background:#ff9800;border:1px solid #e67e22;" title="Request server to restart with Admin privileges">🔐 Request Admin</button>
            </div>
        `;

        appsGrid.insertBefore(div, appsGrid.children[1] || appsGrid.firstChild);

        document.getElementById('openVMBtn').addEventListener('click', () => {
            openVMTerminal();
        });
        const remoteBtn = document.getElementById('openRemoteVMBtn');
        if (remoteBtn) {
            remoteBtn.addEventListener('click', () => {
                openRemoteVM();
            });
        }
        const adminBtn = document.getElementById('requestAdminBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                requestServerAdmin();
            });
        }
    }

    // Ensure VM card exists (in case it's not created by renderSearchCard)
    function createVMCardIfMissing() {
        try {
            const appsGrid = document.querySelector('.apps-grid');
            if (!appsGrid) return;
            if (document.getElementById('vmCard')) return;

            const div = document.createElement('div');
            div.className = 'app-card';
            div.id = 'vmCard';
            div.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;min-width:260px;';
            div.innerHTML = `
                <div class="app-icon" style="font-size:40px">🖥️</div>
                <h3>Virtual Terminal</h3>
                <p class="app-status">Run commands in a web-based terminal</p>
                <button id="openVMBtn" class="btn-app" style="padding:8px 12px;border-radius:6px;">Launch Terminal</button>
            `;

            appsGrid.insertBefore(div, appsGrid.children[1] || appsGrid.firstChild);
            const btn = document.getElementById('openVMBtn');
            if (btn) btn.addEventListener('click', () => { try{ openVMTerminal(); }catch(e){console.error(e);} });
        } catch (e) {
            console.error('createVMCardIfMissing error', e);
        }
    }

    // Map of app URLs
    const APP_URLS = {
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

    // Remote VM configuration (can be set per-user via localStorage)
    // To set a default remote VM endpoint, set localStorage.setItem('REMOTE_VM_URL', 'https://your.remote-vm.example');
    const REMOTE_VM = {
        url: localStorage.getItem('REMOTE_VM_URL') || ''
    };

    // Render all app cards from APP_URLS
    function renderAppCards(isPremium) {
        const appsGrid = document.querySelector('.apps-grid');
        if (!appsGrid) return;

        const appIcons = {
            chatgpt: '🤖', geforce: '🎮', tiktok: '📱', instagram: '📷', snapchat: '👻',
            discord: '💬', twitch: '📺', youtube: '📹', roblox: '🎲', minecraft: '⛏️',
            fortnite: '🎯', valorant: '🔫', twitter: '𝕏', reddit: '🔴', spotify: '🎵',
            netflix: '🎬', steam: '🎮', epicgames: '🎮', 'discord-nitro': '💎', 'among-us': '👨‍🚀',
            pinterest: '📌', wattpad: '📖', deviantart: '🎨'
        };

        Object.entries(APP_URLS).forEach(([appKey, appUrl]) => {
            if (document.getElementById(`app-${appKey}`)) return; // Don't duplicate

            const div = document.createElement('div');
            div.className = 'app-card';
            if (!isPremium) div.classList.add('locked');
            div.id = `app-${appKey}`;
            div.dataset.app = appKey;
            div.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;min-width:260px;';

            const displayName = appKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const icon = appIcons[appKey] || '📱';
            const locked = !isPremium ? '<p style="color:#ff6b6b;font-size:12px;">Premium only</p>' : '';

            div.innerHTML = `
                <div class="app-icon" style="font-size:40px">${icon}</div>
                <h3 style="margin:8px 0;">${displayName}</h3>
                <p class="app-status" style="font-size:13px;color:#666;">Open app</p>
                ${locked}
                <button class="btn-app" style="padding:8px 12px;border-radius:6px;margin-top:8px;">Open</button>
            `;

            appsGrid.appendChild(div);
        });

        // Re-attach handlers for newly created app cards
        attachAppButtons();
    }

    // Attach click handlers for all .btn-app elements
    function attachAppButtons() {
        document.querySelectorAll('.btn-app').forEach(btn => {
            // Avoid double attach
            if (btn.dataset._attached === '1') return;
            btn.dataset._attached = '1';

            btn.addEventListener('click', function() {
                const card = this.closest('.app-card');
                const app = card && card.dataset && card.dataset.app;
                const isLocked = card && card.classList.contains('locked');

                if (isLocked) {
                    alert('This app requires premium access. Contact the admin for premium upgrade.');
                    return;
                }

                const redirectUrl = APP_URLS[app];
                if (!redirectUrl) return;

                const opened = openAppPopup(redirectUrl, app);
                if (!opened) showPopupBlockedModal(redirectUrl);
            });
        });
    }

    // Open an about:blank popup with custom URL input. Returns true if popup created.
    function openAppPopup(redirectUrl, appName) {
        const features = 'width=1000,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
        let popup = null;
        try {
            const winName = 'app_popup_' + (appName || 'app');
            popup = window.open('about:blank', winName, features);
        } catch (e) {
            popup = null;
        }

        if (!popup) return false;

        try {
            const doc = popup.document;
            doc.open();
            // Encode the URL to avoid detection in source code
            const encodedUrl = btoa(redirectUrl);
            doc.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src *; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval'; img-src * data:; font-src * data:;"><title>about:blank</title><style>*{margin:0;padding:0}html,body{width:100%;height:100%;font-family:Arial,sans-serif;background:#f0f0f0;display:flex;flex-direction:column}#toolbar{background:#fff;padding:8px;border-bottom:1px solid #ddd;display:flex;gap:6px;align-items:center;flex-shrink:0;z-index:999999}#urlInput{flex:1;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px}#goBtn{padding:8px 14px;background:#0b66c3;color:#fff;border:none;border-radius:4px;cursor:pointer;z-index:999999}#goBtn:hover{background:#0952a3}#contentArea{flex:1;overflow:auto;width:100%}</style></head><body><div id="toolbar"><input id="urlInput" type="text" placeholder="Search Google or enter URL..." value="" /><button id="goBtn">Go</button></div><div id="contentArea"></div><script>(function(){try{var encodedUrl="${encodedUrl}";var decodedUrl=atob(encodedUrl);var input=document.getElementById('urlInput');input.value=decodedUrl;var btn=document.getElementById('goBtn');var contentArea=document.getElementById('contentArea');function navigate(){var val=input.value.trim();if(!val)return;var url=val;if(!val.startsWith('http://') && !val.startsWith('https://')){var searchQuery=encodeURIComponent(val);try{var xhr=new XMLHttpRequest();xhr.open('GET','/api/search/google?q='+searchQuery,true);xhr.timeout=5000;xhr.onload=function(){try{var data=JSON.parse(xhr.responseText);if(data.redirect){url=data.url;}else if(data.results && data.results.length>0){url=data.results[0].url;}}catch(e){}doNavigate(url);};xhr.onerror=function(){/* fallback to Google search; direct navigation avoids opener/referrer */doNavigate('https://www.google.com/search?q='+searchQuery);};xhr.send();}catch(e){doNavigate('https://www.google.com/search?q='+searchQuery);} }else{doNavigate(url);}}function doNavigate(url){try{window.location.href=url;}catch(e){contentArea.innerHTML='<iframe src="'+url+'" style="width:100%;height:100%;border:0;"></iframe>';}}btn.addEventListener('click',navigate);input.addEventListener('keydown',function(e){if(e.key==='Enter')navigate();});document.addEventListener('keydown',function(e){if(e.ctrlKey && e.key==='l'){e.preventDefault();input.focus();input.select();}});var originalFetch=window.fetch;var originalXHR=window.XMLHttpRequest;window.fetch=originalFetch;window.XMLHttpRequest=originalXHR;}catch(e){console.error(e);}})();<\/script></body></html>`);
            doc.close();
            try { popup.focus(); } catch (e) {}
            return true;
        } catch (err) {
            try { popup.close(); } catch (e) {}
            return false;
        }
    }

    // Open a popup with a simple search UI (about:blank). Returns true if opened.
    function openSearchPopupWindow() {
        const features = 'width=1000,height=700,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes';
        let popup = null;
        try { popup = window.open('about:blank', '_blank', features); } catch (e) { popup = null; }
        if (!popup) return false;

        try {
            const doc = popup.document;
            doc.open();
            doc.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>about:blank</title><style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:18px;background:#f6f7fb} .container{max-width:920px;margin:24px auto;background:#fff;padding:18px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.08)} input{width:100%;padding:10px 12px;border:1px solid #ccc;border-radius:6px;font-size:16px} button{margin-top:10px;padding:10px 14px;border-radius:6px;background:#0b66c3;color:#fff;border:none;cursor:pointer} .small{font-size:13px;color:#666;margin-top:8px}</style></head><body><div class="container"><h2 style="margin-top:0">Search Google</h2><form id="gform"><input id="ginput" type="search" placeholder="Type your search and press Enter" autocomplete="off" /><div style="display:flex;gap:8px;margin-top:10px"><button id="gsearch" type="submit">Search</button><button id="gclose" type="button" style="background:#6c757d">Close</button></div><p class="small">Search results will open in this window.</p></form></div><script> (function(){ var form=document.getElementById('gform'); var input=document.getElementById('ginput'); var btn=document.getElementById('gsearch'); var closeBtn=document.getElementById('gclose'); form.addEventListener('submit',function(e){ e.preventDefault(); var q=input.value.trim(); if(!q) return; var url='https://www.google.com/search?q='+encodeURIComponent(q); window.location.href=url; }); closeBtn.addEventListener('click',function(){ try{ window.close(); }catch(e){} }); input.focus(); })(); <\/script></body></html>`);
            doc.close();
            try { popup.focus(); } catch (e) {}
            return true;
        } catch (err) {
            try { popup.close(); } catch (e) {}
            return false;
        }
    }

    // Modal fallback for blocked popups
    function showPopupBlockedModal(url) {
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
                <div style="background:#fff;padding:18px;border-radius:8px;max-width:520px;width:92%;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:inherit;">
                    <h3 style="margin-top:0">Popup Blocked</h3>
                    <p>It looks like your browser blocked opening a new window. You can open the app manually, search for it via Google, run a diagnostic to help IT, or allow popups for this site.</p>
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap;">
                        <button id="pbOpenSameBtn" style="background:#007bff;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Open Here</button>
                        <button id="pbGoogleBtn" style="background:#0b66c3;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Search via Google</button>
                        <button id="pbDiagBtn" style="background:#17a2b8;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Diagnose</button>
                        <button id="pbCopyBtn" style="background:#6c757d;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Copy Link</button>
                        <button id="pbCloseBtn" style="background:transparent;border:1px solid #ccc;padding:8px 12px;border-radius:4px;cursor:pointer">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('pbCloseBtn').addEventListener('click', () => { modal.style.display = 'none'; });
            document.getElementById('pbOpenSameBtn').addEventListener('click', () => { window.location.href = document.getElementById('pbOpenSameBtn').dataset.url || url; });
            document.getElementById('pbGoogleBtn').addEventListener('click', () => { const link = document.getElementById('pbOpenSameBtn').dataset.url || url; openGoogleSearchFor(link); });
            document.getElementById('pbCopyBtn').addEventListener('click', async () => {
                const link = document.getElementById('pbOpenSameBtn').dataset.url || url;
                try {
                    await navigator.clipboard.writeText(link);
                    alert('Link copied to clipboard');
                } catch (e) {
                    prompt('Copy this link:', link);
                }
            });

            // Diagnose handler: ask server to fetch headers/status to explain blocking
            document.getElementById('pbDiagBtn').addEventListener('click', async () => {
                const link = document.getElementById('pbOpenSameBtn').dataset.url || url;
                const modalRoot = modal.querySelector('div');
                try {
                    modalRoot.innerHTML = '<div style="padding:18px;font-family:inherit;"><h3>Diagnosing...</h3><p>Please wait while we check the target site headers and response status.</p></div>';

                    const resp = await fetch('/api/diagnose?url=' + encodeURIComponent(link));
                    const data = await resp.json();
                    const diagnosisText = JSON.stringify(data, null, 2);
                    const userAgent = navigator.userAgent;
                    const timestamp = new Date().toISOString();

                    modalRoot.innerHTML = `
                        <div style="padding:18px;font-family:inherit;max-height:72vh;overflow:auto;">
                            <h3 style="margin-top:0">Diagnosis Results</h3>
                            <pre style="background:#f4f4f4;border:1px solid #e1e1e1;padding:12px;border-radius:6px;white-space:pre-wrap;">${diagnosisText}</pre>
                            <p style="color:#444">If this site refuses to be embedded it commonly sets <code>X-Frame-Options</code> or a restrictive <code>Content-Security-Policy</code>. Use the button below to copy a prepared message for your IT/filters team.</p>
                            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap;">
                                <button id="pbCopyRequest" style="background:#28a745;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Copy Whitelist Request</button>
                                <button id="pbBackBtn" style="background:#6c757d;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Back</button>
                                <button id="pbCloseNow" style="background:transparent;border:1px solid #ccc;padding:8px 12px;border-radius:4px;cursor:pointer">Close</button>
                            </div>
                        </div>
                    `;

                    document.getElementById('pbCopyRequest').addEventListener('click', async () => {
                        const message = `Hello IT team,\n\nI'm requesting that the following URL be reviewed/whitelisted so it can be used in our browser without blocking.\n\nURL: ${link}\nTimestamp: ${timestamp}\nUser Agent: ${userAgent}\n\nDiagnosis (server-side):\n${diagnosisText}\n\nPlease let me know if you need further details or logs.`;
                        try {
                            await navigator.clipboard.writeText(message);
                            alert('Whitelist request copied to clipboard. Paste it into your ticket or email.');
                        } catch (err) {
                            prompt('Copy whitelist request:', message);
                        }
                    });

                    document.getElementById('pbBackBtn').addEventListener('click', () => {
                        modal.style.display = 'none';
                        setTimeout(() => { modal.style.display = 'flex'; }, 50);
                        modal.remove();
                        showPopupBlockedModal(link);
                    });

                    document.getElementById('pbCloseNow').addEventListener('click', () => { modal.style.display = 'none'; });

                } catch (err) {
                    console.error('Diagnosis failed', err);
                    alert('Diagnosis failed: ' + (err && err.message ? err.message : String(err)));
                }
            });
        }

        document.getElementById('pbOpenSameBtn').dataset.url = url;
        modal.style.display = 'flex';
    }

    function openGoogleSearchFor(targetUrl) {
        try {
            let q = targetUrl;
            try {
                const u = new URL(targetUrl);
                q = u.hostname;
            } catch (e) {
                q = targetUrl;
            }
            /* Use direct navigation (window.location.href) instead of window.open to avoid opener/referrer leaks */
            const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(q);
            window.location.href = googleUrl;
        } catch (err) {
            console.error('Failed to open Google search fallback:', err);
            try { window.location.href = targetUrl; } catch (e) {}
        }
    }

    function createSearchModal() {
        let modal = document.getElementById('searchModal');
        if (modal) {
            modal.style.display = 'flex';
            const input = modal.querySelector('#searchInput');
            if (input) input.focus();
            return;
        }

        modal = document.createElement('div');
        modal.id = 'searchModal';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = 'rgba(0,0,0,0.6)';
        modal.style.zIndex = '100000';

        modal.innerHTML = `
            <div style="background:#fff;padding:16px;border-radius:8px;max-width:980px;width:92%;height:76%;display:flex;flex-direction:column;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <input id="searchInput" placeholder="Type your search and press Enter" style="flex:1;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:16px;" />
                    <button id="searchDoBtn" style="padding:10px 14px;border-radius:6px;background:#0b66c3;color:#fff;border:none;">Search</button>
                    <button id="searchCloseBtn" style="margin-left:8px;padding:8px 10px;border-radius:6px;background:#eee;border:1px solid #ccc;">Close</button>
                </div>
                <div id="searchFrameWrap" style="flex:1;margin-top:12px;position:relative;background:#f8f8f8;border-radius:6px;overflow:hidden;">
                    <iframe id="searchFrame" src="about:blank" style="width:100%;height:100%;border:0;background:#fff;"></iframe>
                    <div id="searchFrameBlocked" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;flex-direction:column;padding:18px;">
                        <p style="color:#333;max-width:720px;text-align:center;">The site may block embedding. You can open search results in a new tab instead.</p>
                        <div style="margin-top:12px;display:flex;gap:8px;">
                            <button id="openSearchNewTab" style="padding:8px 12px;background:#007bff;color:#fff;border:none;border-radius:6px;">Open in New Tab</button>
                            <button id="openSearchSameTab" style="padding:8px 12px;background:#6c757d;color:#fff;border:none;border-radius:6px;">Open Here</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#searchInput');
        const btn = modal.querySelector('#searchDoBtn');
        const closeBtn = modal.querySelector('#searchCloseBtn');
        const iframe = modal.querySelector('#searchFrame');
        const blocked = modal.querySelector('#searchFrameBlocked');
        const openNewTab = modal.querySelector('#openSearchNewTab');
        const openSameTab = modal.querySelector('#openSearchSameTab');

        function doSearch(q) {
            if (!q) return;
            /* Use direct navigation (window.location.href) to avoid opener/referrer leaks and work around filters */
            const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(q);
            window.location.href = googleUrl;
        }

        btn.addEventListener('click', () => doSearch(input.value.trim()));
        input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') doSearch(input.value.trim()); });
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; iframe.src = 'about:blank'; });

        input.focus();
    }

    // Start initialization
    await updateAppAccess();

    // Ensure the VM card is present on the dashboard
    createVMCardIfMissing();

    // Refresh premium status periodically
    setInterval(updateAppAccess, 5000);
 // Open a Virtual Terminal in a popup
    function openVMTerminal() {
        const features = 'width=1200,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
        let popup = null;
        try {
            popup = window.open('about:blank', 'vm_terminal', features);
        } catch (e) {
            popup = null;
        }

        if (!popup) {
            alert('Popup blocked. Please allow popups for this site to use the terminal.');
            return;
        }

        try {
            const doc = popup.document;
            doc.open();
            doc.write(`<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>about:blank</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/xterm/4.18.0/xterm.min.css" />
    <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; background: #1e1e1e; }
        #terminal { width: 100%; height: 100%; }
        .xterm { padding: 10px; }
        #fallback { width:100%; height:100%; box-sizing:border-box; padding:12px; background:#111; color:#ddd; font-family:monospace; }
    </style>
</head>
<body>
    <div id="terminal" style="display:none"></div>
    <textarea id="fallback" style="display:none" readonly></textarea>
    <script>
        // Load xterm and initialize only after script loads. Provide a fallback textarea if xterm fails.
        function initTerminal() {
            try {
                if (typeof Terminal !== 'undefined') {
                    const term = new Terminal({ cols: 120, rows: 30, cursorBlink: true, theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#aeafad' } });
                    term.open(document.getElementById('terminal'));
                    document.getElementById('terminal').style.display = 'block';
                    document.getElementById('fallback').style.display = 'none';

                    term.write('\r\n✓ Virtual Terminal Ready\r\n');
                    term.write('\r\nThis is a web-based terminal emulator.\r\n');
                    term.write('Type "help" for a list of available commands.\r\n');
                    term.write('Type "exit" to close this terminal.\r\n');
                    term.write('\r\n$ ');

                    let inputBuffer = '';
                    const commands = {
                        'help': 'Available commands: help, echo, pwd, ls, date, whoami, clear, exit\\n',
                        'pwd': '/home/user\\n',
                        'ls': 'Desktop/  Documents/  Downloads/  Pictures/\\n',
                        'date': new Date().toString() + '\\n',
                        'whoami': 'terminal_user\\n',
                        'clear': '\\x1b[2J\\x1b[H',
                        'exit': 'goodbye'
                    };

                    term.onKey((key) => {
                        const char = key.key;
                        if (key.domEvent.code === 'Enter') {
                            term.write('\r\n');
                            const cmd = inputBuffer.trim().toLowerCase();
                            if (cmd === 'exit') { term.write('Goodbye!\\r\\n'); setTimeout(() => window.close(), 800); return; }
                            if (commands[cmd]) { term.write(commands[cmd]); } else if (cmd !== '') { term.write('Command not found: ' + cmd + '\\n'); }
                            inputBuffer = '';
                            term.write('$ ');
                        } else if (key.domEvent.code === 'Backspace') {
                            if (inputBuffer.length > 0) { inputBuffer = inputBuffer.slice(0, -1); term.write('\\x08 \\x08'); }
                        } else if (char && char.length === 1 && char.charCodeAt(0) >= 32) {
                            inputBuffer += char; term.write(char);
                        }
                    });
                    return;
                }
            } catch (e) {
                console.error('initTerminal error', e);
            }
            // Fallback: show simple read-only textarea with instructions
            const fb = document.getElementById('fallback');
            fb.style.display = 'block';
            fb.value = 'Virtual Terminal (fallback)\n\nThe advanced terminal failed to load. You can still see demo output here.\n\n$ help\nAvailable commands: help, echo, pwd, ls, date, whoami, clear, exit\n';
        }

        // Dynamically load xterm script and initialize
        (function(){
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xterm/4.18.0/xterm.min.js';
            s.async = true;
            s.onload = function(){ setTimeout(initTerminal, 50); };
            s.onerror = function(){ console.error('Failed to load xterm.js'); initTerminal(); };
            document.head.appendChild(s);
            // Also attempt to init in case xterm is already present
            setTimeout(initTerminal, 200);
        })();
    <\/script>
</body>
</html>`);
            doc.close();
            try { popup.focus(); } catch (e) {}
        } catch (err) {
            console.error('Failed to open VM terminal:', err);
            try { popup.close(); } catch (e) {}
        }
    }

    // Open a remote VM URL in a popup. If a remote URL is not configured, prompt the user to enter one and save to localStorage.
    function openRemoteVM() {
        try {
            // If the user wants to start the local Hyper-V VM, choose that option
            const startLocal = confirm('Start local Hyper-V VM on this machine? Click OK to start the local Win10-VM, or Cancel to open a remote URL.');
            if (startLocal) {
                // Call local server endpoint to start VM
                const token = localStorage.getItem('token');
                fetch('/api/vm/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({ name: 'Win10-VM' })
                }).then(r => r.json()).then(data => {
                    if (data && data.ok) {
                        // Copy vmconnect command to clipboard and show instructions
                        const cmd = 'vmconnect.exe localhost Win10-VM';
                        try {
                            navigator.clipboard.writeText(cmd);
                            const instructionsMsg = `✓ VM start requested!\n\nThe command to launch the VM console has been copied to your clipboard:\n\n${cmd}\n\nTo proceed:\n1. Open PowerShell on this machine\n2. Paste the command above (Ctrl+V)\n3. Press Enter\n\nThe Windows 10 VM console should open.`;
                            alert(instructionsMsg);
                        } catch (clipErr) {
                            const instructionsMsg = `✓ VM start requested!\n\nTo open the VM console on this machine, run:\n\nvmconnect.exe localhost Win10-VM\n\nYou can paste this into PowerShell or Command Prompt.`;
                            alert(instructionsMsg);
                        }
                    } else {
                        const errorMsg = data && data.error ? data.error : JSON.stringify(data);
                        const isPermissionError = errorMsg && (errorMsg.includes('permission') || errorMsg.includes('authorized') || errorMsg.includes('Access denied'));
                        
                        if (isPermissionError) {
                            const permissionInstructions = `⚠️ PERMISSION ERROR\n\nThe server does not have Administrator privileges to control the VM.\n\nTo fix this:\n\n1. Close the current Node.js server (press Ctrl+C in PowerShell)\n2. Right-click PowerShell and select "Run as Administrator"\n3. Navigate to: C:\\Users\\anton\\OneDrive\\Desktop\\idk-anton\n4. Run: npm start\n5. Then try "Open Remote VM" again\n\nThe browser will show a warning that the server is running as Admin - this is expected and needed for VM control to work.`;
                            alert(permissionInstructions);
                        } else {
                            alert('Failed to start VM: ' + errorMsg);
                        }
                    }
                }).catch(err => {
                    console.error('openRemoteVM start error', err);
                    alert('Failed to contact local server to start VM: ' + err.message);
                });
                return;
            }

            let url = REMOTE_VM.url || '';
            if (!url) {
                const input = prompt('Enter the full URL of the remote VM (https://...):');
                if (!input) return;
                url = input.trim();
                if (!url) return;
                localStorage.setItem('REMOTE_VM_URL', url);
                REMOTE_VM.url = url;
            }

            const features = 'width=1200,height=800,menubar=no,toolbar=no,location=yes,status=yes,resizable=yes,scrollbars=yes';
            let popup = null;
            try {
                popup = window.open('about:blank', 'remote_vm', features);
            } catch (e) {
                popup = null;
            }

            // If popup was blocked, try opening the URL directly in a new tab
            if (!popup) {
                const opened = window.open(url, '_blank');
                if (!opened) alert('Popup blocked. Please allow popups or set the Remote VM URL in localStorage.');
                return;
            }

            try {
                // Navigate the popup to the remote VM URL to avoid including URL in our inline HTML
                try { popup.location.href = url; } catch (e) { popup.document.location = url; }
                try { popup.focus(); } catch (e) {}
            } catch (err) {
                console.error('Failed to open remote VM:', err);
                try { popup.close(); } catch (e) {}
            }
        } catch (e) {
            console.error('openRemoteVM error', e);
            alert('Failed to open remote VM: ' + (e && e.message ? e.message : String(e)));
        }
    }

    // Request the server to restart with Administrator privileges
    function requestServerAdmin() {
        const token = localStorage.getItem('token');
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
        
        const content = document.createElement('div');
        content.style.cssText = 'background:#fff;border-radius:8px;padding:24px;max-width:500px;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-family:inherit;';
        content.innerHTML = `
            <h3 style="margin-top:0;color:#333;">Request Administrator Privileges</h3>
            <p style="color:#666;line-height:1.6;">
                This will request the server to restart with Administrator privileges so it can control Hyper-V VMs.
            </p>
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:12px;margin:12px 0;color:#856404;font-size:14px;">
                <strong>⚠️ Note:</strong> You will see a Windows dialog asking to confirm the privilege escalation. Click "Yes" to proceed.
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
                <button id="requestAdminCancel" style="background:#6c757d;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Cancel</button>
                <button id="requestAdminConfirm" style="background:#28a745;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Request Admin</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        document.getElementById('requestAdminCancel').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('requestAdminConfirm').addEventListener('click', async () => {
            content.innerHTML = '<p style="color:#666;text-align:center;">Requesting administrator privileges...</p>';
            
            try {
                const response = await fetch('/api/request-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });
                
                const data = await response.json();
                
                if (data.ok) {
                    content.innerHTML = `
                        <h3 style="color:#28a745;margin-top:0;">✓ Request Sent</h3>
                        <p style="color:#666;line-height:1.6;">
                            The server has been requested to restart with Administrator privileges.
                        </p>
                        <p style="color:#666;line-height:1.6;">
                            <strong>You should see a Windows dialog on your computer.</strong> Click "Yes" to approve the restart.
                        </p>
                        <p style="color:#666;line-height:1.6;">
                            After approval, the server will restart (you may see a brief disconnect). Refresh this page and try "Open Remote VM" again.
                        </p>
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
                            <button id="requestAdminOK" style="background:#28a745;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">OK</button>
                        </div>
                    `;
                    document.getElementById('requestAdminOK').addEventListener('click', () => { modal.remove(); });
                } else {
                    content.innerHTML = `
                        <h3 style="color:#dc3545;margin-top:0;">⚠️ Request Failed</h3>
                        <p style="color:#666;line-height:1.6;">
                            ${data.error || 'Could not request administrator privileges.'}
                        </p>
                        <p style="color:#666;font-size:14px;">
                            <strong>Fallback:</strong> Use start-server-admin.bat or start-server-admin.ps1 to manually restart the server as Admin.
                        </p>
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
                            <button id="requestAdminOK" style="background:#6c757d;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">OK</button>
                        </div>
                    `;
                    document.getElementById('requestAdminOK').addEventListener('click', () => { modal.remove(); });
                }
            } catch (err) {
                console.error('Request admin error', err);
                content.innerHTML = `
                    <h3 style="color:#dc3545;margin-top:0;">⚠️ Error</h3>
                    <p style="color:#666;line-height:1.6;">
                        Failed to contact server: ${err.message}
                    </p>
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
                        <button id="requestAdminOK" style="background:#6c757d;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">OK</button>
                    </div>
                `;
                document.getElementById('requestAdminOK').addEventListener('click', () => { modal.remove(); });
            }
        });
    }
});
