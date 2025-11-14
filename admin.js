// Admin JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    // Check if user is Anton
    if (username !== 'Anton') {
        alert('Access denied. Admin only.');
        window.location.href = 'dashboard.html';
        return;
    }

    // Load users list
    async function loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            async function safeJson(res) {
                const text = await res.text();
                if (!text) return null;
                try { return JSON.parse(text); } catch (e) { return null; }
            }

            const data = await safeJson(response);

            if (response.ok) {
                displayUsers((data && data.users) || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Load payments
    async function loadPayments() {
        try {
            const response = await fetch('/api/admin/payments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            async function safeJson(res) {
                const text = await res.text();
                if (!text) return null;
                try { return JSON.parse(text); } catch (e) { return null; }
            }

            const data = await safeJson(response);

            if (response.ok) {
                displayPayments((data && data.payments) || []);
            }
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    }

    function displayPayments(payments) {
        const paymentsList = document.getElementById('paymentsList');
        
        const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'confirmed');
        
        if (pendingPayments.length === 0) {
            paymentsList.innerHTML = '<p class="empty-message">No pending payments</p>';
            return;
        }

        paymentsList.innerHTML = '';

        pendingPayments.forEach(payment => {
            const paymentItem = document.createElement('div');
            paymentItem.className = 'payment-item';
            const statusBadge = payment.status === 'pending' ? '⏳ Pending' : '✅ Confirmed';
            const statusClass = payment.status === 'pending' ? 'status-pending' : 'status-confirmed';
            
            paymentItem.innerHTML = `
                <div class="payment-info">
                    <h4>${payment.username}</h4>
                    <p>Amount: $${payment.amount.toFixed(2)}</p>
                    <p>Type: ${payment.type === 'cash' ? '💵 Cash' : '💳 Stripe'}</p>
                    <p>Status: <span class="${statusClass}">${statusBadge}</span></p>
                </div>
                ${payment.status === 'pending' ? `
                    <div class="payment-actions">
                        <button class="btn-confirm" data-payment-id="${payment.id}">Confirm Payment</button>
                    </div>
                ` : ''}
            `;

            paymentsList.appendChild(paymentItem);

            if (payment.status === 'pending') {
                paymentItem.querySelector('.btn-confirm').addEventListener('click', async function() {
                    if (confirm(`Confirm payment from ${payment.username} for $${payment.amount.toFixed(2)}?`)) {
                        await confirmPayment(payment);
                    }
                });
            }
        });
    }

    function displayUsers(users) {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        // Separate users into active and all
        const allUsers = users || [];
        
        // Add header showing counts
        const header = document.createElement('div');
        header.style.cssText = 'margin-bottom: 20px; padding: 12px; background: #f0f0f0; border-radius: 6px;';
        header.innerHTML = `
            <h3 style="margin: 0 0 8px 0;">User Statistics</h3>
            <p style="margin: 4px 0;"><strong>Total Users:</strong> ${allUsers.length}</p>
            <p style="margin: 4px 0;"><strong>Premium Users:</strong> ${allUsers.filter(u => u.isPremium).length}</p>
            <p style="margin: 4px 0;"><strong>Free Users:</strong> ${allUsers.filter(u => !u.isPremium).length}</p>
        `;
        usersList.appendChild(header);

        if (allUsers.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'No users found';
            empty.style.color = '#999';
            usersList.appendChild(empty);
            return;
        }

        // Display all users
        allUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.style.cssText = 'border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 12px; background: #fff;';
            
            const premiumStatus = user.isPremium ? '✅ Premium' : '❌ Free';
            const premiumButtonText = user.isPremium ? 'Remove Premium' : 'Grant Premium';
            const premiumButtonColor = user.isPremium ? '#dc3545' : '#28a745';
            
            userItem.innerHTML = `
                <div class="user-info" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 8px 0;">${user.username}</h4>
                        <p style="margin: 4px 0; color: #666;">Email: ${user.email}</p>
                        <p style="margin: 4px 0; font-weight: bold;">${premiumStatus}</p>
                    </div>
                    <div class="user-actions" style="display: flex; gap: 8px; flex-direction: column;">
                        <button class="btn-premium-toggle" data-username="${user.username}" style="padding: 6px 12px; background: ${premiumButtonColor}; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            ${premiumButtonText}
                        </button>
                        <button class="btn-delete" data-username="${user.username}" style="padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Delete
                        </button>
                    </div>
                </div>
            `;

            // Premium toggle handler
            userItem.querySelector('.btn-premium-toggle').addEventListener('click', async function() {
                const action = user.isPremium ? 'Remove' : 'Grant';
                if (confirm(`${action} premium for ${user.username}?`)) {
                    if (user.isPremium) {
                        await removePremium(user.username);
                    } else {
                        await grantPremium(user.username);
                    }
                }
            });

            // Delete handler
            userItem.querySelector('.btn-delete').addEventListener('click', async function() {
                if (confirm(`Are you sure you want to delete account: ${user.username}?`)) {
                    await deleteUser(user.username);
                }
            });

            usersList.appendChild(userItem);
        });
    }

    // Grant premium to user
    async function grantPremium(targetUsername) {
        try {
            const response = await fetch('/api/admin/grant-premium', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: targetUsername })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('✅ Premium granted to ' + targetUsername);
                loadUsers();
            } else {
                alert('❌ Error: ' + (data.message || 'Failed to grant premium'));
                console.error('Grant premium error:', data);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error granting premium: ' + error.message);
        }
    }

    // Remove premium from user
    async function removePremium(targetUsername) {
        try {
            const response = await fetch('/api/admin/remove-premium', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: targetUsername })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('✅ Premium removed from ' + targetUsername);
                loadUsers();
            } else {
                alert('❌ Error: ' + (data.message || 'Failed to remove premium'));
                console.error('Remove premium error:', data);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error removing premium: ' + error.message);
        }
    }


    async function deleteUser(targetUsername) {
        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: targetUsername })
            });

            if (response.ok) {
                notifyUserDeleted(targetUsername);
                loadUsers();
            } else {
                alert('Error deleting user');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Send broadcast
    document.getElementById('sendBroadcastBtn').addEventListener('click', async function() {
        const msg = document.getElementById('broadcastMessage').value.trim();
        if (!msg) { alert('Please enter a message'); return; }
        try {
            const response = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: msg })
            });

            if (response.ok) {
                document.getElementById('broadcastMessage').value = '';
                // Show confirmation to admin
                try { notifyBroadcast(msg); } catch (e) {}
                loadPayments();
            } else {
                alert('Error sending broadcast');
            }
        } catch (e) { console.error(e); alert('Error sending broadcast'); }
    });

    // Confirm payment function (accepts full payment object)
    async function confirmPayment(payment) {
        try {
            const response = await fetch('/api/admin/confirm-payment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paymentId: payment.id })
            });

            if (response.ok) {
                // Notify admin UI about the received payment and update list
                try {
                    notifyPaymentReceived(payment.username, Number(payment.amount));
                } catch (e) {
                    console.log('Notifier not available');
                }
                loadPayments();
            } else {
                alert('Error confirming payment');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Load users on page load
    loadUsers();
    loadPayments();

    // Refresh payments every 5 seconds
    setInterval(loadPayments, 5000);
});
