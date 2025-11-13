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
            const data = await response.json();

            if (response.ok) {
                displayUsers(data.users);
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
            const data = await response.json();

            if (response.ok) {
                displayPayments(data.payments);
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

        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-info">
                    <h4>${user.username}</h4>
                    <p>Email: ${user.email}</p>
                    <p>Premium: ${user.isPremium ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div class="user-actions">
                    <button class="btn-delete" data-username="${user.username}">Delete Account</button>
                </div>
            `;

            userItem.querySelector('.btn-delete').addEventListener('click', async function() {
                if (confirm(`Are you sure you want to delete account: ${user.username}?`)) {
                    await deleteUser(user.username);
                }
            });

            usersList.appendChild(userItem);
        });
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

    // Grant premium
    document.getElementById('grantPremiumBtn').addEventListener('click', async function() {
        const targetUsername = document.getElementById('premiumUsername').value;

        if (!targetUsername) {
            alert('Please enter a username');
            return;
        }

        try {
            const response = await fetch('/api/admin/grant-premium', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: targetUsername })
            });

            if (response.ok) {
                notifyPremiumGranted(targetUsername);
                document.getElementById('premiumUsername').value = '';
                loadUsers();
            } else {
                alert('Error granting premium');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Remove premium
    document.getElementById('removePremiumBtn').addEventListener('click', async function() {
        const targetUsername = document.getElementById('removePremiumUsername').value;

        if (!targetUsername) {
            alert('Please enter a username');
            return;
        }

        if (!confirm(`Are you sure you want to remove premium from ${targetUsername}?`)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/remove-premium', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: targetUsername })
            });

            if (response.ok) {
                notifyPremiumRemoved(targetUsername);
                document.getElementById('removePremiumUsername').value = '';
                loadUsers();
            } else {
                alert('Error removing premium');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

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
