// Premium Page JavaScript

let stripe = null;
let elements = null;
let cardElement = null;
const token = localStorage.getItem('token') || localStorage.getItem('authToken');
const username = localStorage.getItem('username');

document.addEventListener('DOMContentLoaded', function() {
    if (!token || !username) {
        window.location.href = 'signup.html';
        return;
    }

    // Initialize Stripe (using a test public key for now)
    // Replace with your actual Stripe public key
    const stripePublicKey = 'pk_test_51234567890'; // Replace with your actual key
    
    try {
        stripe = Stripe(stripePublicKey);
        elements = stripe.elements();
        cardElement = elements.create('card');
    } catch (e) {
        console.log('Stripe not initialized - using fallback payment method');
    }

    setupEventListeners();
});

function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Upgrade button
    document.getElementById('upgradeBtn').addEventListener('click', openPaymentModal);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Payment options
    document.getElementById('cashOption').addEventListener('click', openCashConfirmation);
    document.getElementById('stripeOption').addEventListener('click', openStripeModal);

    // Cash confirmation
    document.getElementById('confirmCashBtn').addEventListener('click', handleCashPayment);

    // Stripe form
    if (cardElement) {
        cardElement.mount('#card-element');
        document.getElementById('stripeForm').addEventListener('submit', handleStripePayment);
    }

    // Success modal button
    document.getElementById('successBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function openPaymentModal() {
    document.getElementById('paymentModal').style.display = 'flex';
}

function openCashConfirmation() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('cashConfirmModal').style.display = 'flex';
}

function openStripeModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('stripeModal').style.display = 'flex';

    // Mount card element when modal opens
    if (cardElement && !cardElement._isMounted) {
        cardElement.mount('#card-element');
    }
}

async function handleCashPayment() {
    try {
        // Send payment pending notification to admin
        const response = await fetch('/api/premium/cash-payment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                amount: 15.00,
                status: 'pending'
            })
        });

        if (response.ok) {
            document.getElementById('cashConfirmModal').style.display = 'none';
            showSuccessModal('Payment Pending', 'Your payment is pending. Once Anton confirms receipt of the $15 cash payment, you will receive premium access.');
        } else {
            alert('Error processing cash payment request');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing payment');
    }
}

async function handleStripePayment(e) {
    e.preventDefault();

    if (!stripe || !cardElement) {
        alert('Payment system not available. Please try cash payment instead.');
        return;
    }

    const payBtn = document.getElementById('payBtn');
    const errorDiv = document.getElementById('card-errors');
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';

    try {
        // Create payment method
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value
            }
        });

        if (error) {
            errorDiv.textContent = error.message;
            payBtn.disabled = false;
            payBtn.textContent = 'Pay $15.00';
            return;
        }

        // Send payment to backend
        const response = await fetch('/api/premium/stripe-payment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                paymentMethodId: paymentMethod.id,
                amount: 1500, // $15.00 in cents
                email: document.getElementById('email').value
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Payment successful
            document.getElementById('stripeModal').style.display = 'none';
            showSuccessModal('Premium Activated!', 'Your payment has been processed. Premium access is now active!');
        } else {
            errorDiv.textContent = data.message || 'Payment failed. Please try again.';
            payBtn.disabled = false;
            payBtn.textContent = 'Pay $15.00';
        }
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = 'An error occurred. Please try again.';
        payBtn.disabled = false;
        payBtn.textContent = 'Pay $15.00';
    }
}

function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    modal.querySelector('h2').textContent = title;
    modal.querySelector('p').textContent = message;
    modal.style.display = 'flex';
}
