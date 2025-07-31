// Package data
const packages = [
    { name: "Starter", duration: "1 Day", data: "5GB", price: 30 },
    { name: "Basic", duration: "3 Days", data: "12GB", price: 60 },
    { name: "Weekly", duration: "7 Days", data: "25GB", price: 99 },
    { name: "Bi-Weekly", duration: "14 Days", data: "45GB", price: 169 },
    { name: "Monthly", duration: "30 Days", data: "Unlimited", price: 299 },
    { name: "Extended", duration: "60 Days", data: "Unlimited", price: 550 },
];

// Global variables
let selectedPackage = null;
let customerId = '';
let isLoading = false;

// Utility functions
function generateCustomerId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

function showToast(title, description, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}

function openModal(pkg) {
    selectedPackage = pkg;
    customerId = generateCustomerId();
    
    document.getElementById('customerId').value = customerId;
    document.getElementById('phone').value = '';
    
    // Update package summary
    const summary = document.getElementById('packageSummary');
    summary.innerHTML = `
        <h4>${pkg.duration} - ${pkg.data}</h4>
        <div class="price">Ksh ${pkg.price}</div>
    `;
    
    document.getElementById('paymentModal').classList.add('show');
}

function closeModal() {
    document.getElementById('paymentModal').classList.remove('show');
    selectedPackage = null;
    customerId = '';
}

// Safaricom Daraja API functions
async function getAccessToken() {
    const consumerKey = "nLuyXezRJgm3fpxYDCjQE1vxLo4cz4Y9tSV3tdZAhjRl7pGT";
    const consumerSecret = "7LrWGPDLkLg7FPcJHgq8OZjVEoE1AnuLEUzq6TTX6nBw3TxqNf9qz6dPnqm3udRa";
    
    const credentials = btoa(`${consumerKey}:${consumerSecret}`);
    
    try {
        const response = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            method: "GET",
            headers: {
                "Authorization": `Basic ${credentials}`,
            },
        });
        
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error getting access token:", error);
        throw error;
    }
}

async function initiateMpesaPayment(accessToken, phone) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 14);
    const shortCode = "174379"; // Test shortcode
    const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; // Test passkey
    const password = btoa(`${shortCode}${passkey}${timestamp}`);

    const paymentData = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: selectedPackage.price,
        PartyA: `254${phone}`,
        PartyB: shortCode,
        PhoneNumber: `254${phone}`,
        CallBackURL: "https://mydomain.com/callback",
        AccountReference: customerId,
        TransactionDesc: `${selectedPackage.duration} - ${selectedPackage.data} Package`,
    };

    try {
        const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error initiating M-Pesa payment:", error);
        throw error;
    }
}

// Firebase functions
async function storeUserData(userData) {
    try {
        const { ref, push } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js");
        const userRef = ref(window.database, 'users');
        await push(userRef, userData);
        console.log('User data stored successfully');
    } catch (error) {
        console.error('Error storing user data:', error);
    }
}

// Event handlers
async function handleSubmit() {
    const phone = document.getElementById('phone').value.trim();
    
    if (!selectedPackage || !phone || phone.length < 8) {
        showToast('Invalid Input', 'Please enter a valid phone number', 'error');
        return;
    }

    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    
    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';

    try {
        // Store user data immediately when payment is initiated
        const userData = {
            customerId,
            phone: `+254${phone}`,
            package: selectedPackage.name,
            duration: selectedPackage.duration,
            data: selectedPackage.data,
            amount: selectedPackage.price,
            timestamp: new Date().toISOString(),
            status: 'initiated'
        };
        
        await storeUserData(userData);
        
        // Get access token
        const accessToken = await getAccessToken();
        
        // Initiate M-Pesa payment
        const paymentResponse = await initiateMpesaPayment(accessToken, phone);
        
        if (paymentResponse.ResponseCode === "0") {
            // Payment initiated successfully
            const transaction = {
                id: paymentResponse.CheckoutRequestID,
                customerId,
                phone: `+254${phone}`,
                package: selectedPackage.name,
                duration: selectedPackage.duration,
                data: selectedPackage.data,
                amount: selectedPackage.price,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            // Store transaction in localStorage
            const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            existingTransactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(existingTransactions));

            showToast('Payment Initiated! 📱', 'Check your phone for M-Pesa prompt');

            closeModal();
        } else {
            throw new Error(paymentResponse.errorMessage || "Payment failed");
        }
    } catch (error) {
        console.error("Payment error:", error);
        showToast('Payment Failed', 'Please try again or contact support', 'error');
    } finally {
        isLoading = false;
        showLoading(false);
        payBtn.disabled = false;
        payBtn.textContent = 'Pay Now';
    }
}

function handleWhatsAppSupport() {
    const message = "Hello! I need help with my internet package purchase.";
    const whatsappUrl = `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Initialize the page
function initializePage() {
    const packagesContainer = document.getElementById('packages');
    
    packages.forEach(pkg => {
        const button = document.createElement('button');
        button.className = 'package-btn';
        button.onclick = () => openModal(pkg);
        
        button.innerHTML = `
            <div>
                <div style="font-weight: 600;">${pkg.duration} - ${pkg.data}</div>
            </div>
            <div style="font-weight: bold;">Ksh ${pkg.price}</div>
        `;
        
        packagesContainer.appendChild(button);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', initializePage);

// Close modal when clicking outside
document.getElementById('paymentModal').addEventListener('click', (e) => {
    if (e.target.id === 'paymentModal') {
        closeModal();
    }
});

// Handle Enter key in phone input
document.getElementById('phone').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});