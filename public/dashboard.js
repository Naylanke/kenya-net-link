// Global variables
let currentCustomerId = '';
let userTransactions = [];

// Utility functions
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    return `<span class="status-badge status-${status}">${status}</span>`;
}

// Firebase functions
async function loadUserDataFromFirebase(customerId) {
    try {
        const { ref, query, orderByChild, equalTo, get } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js");
        
        const userRef = ref(window.database, 'users');
        const userQuery = query(userRef, orderByChild('customerId'), equalTo(customerId));
        const snapshot = await get(userQuery);
        
        const transactions = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                transactions.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        
        return transactions;
    } catch (error) {
        console.error('Error loading user data from Firebase:', error);
        return [];
    }
}

// Data functions
async function loadUserData() {
    const customerIdInput = document.getElementById('customerIdInput');
    const customerId = customerIdInput.value.trim();
    
    if (!customerId) {
        showToast('Invalid Input', 'Please enter a valid Customer ID', 'error');
        return;
    }
    
    currentCustomerId = customerId;
    
    // Load from Firebase first, then fallback to localStorage
    const firebaseTransactions = await loadUserDataFromFirebase(customerId);
    const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // Combine and filter transactions for this customer
    const allTransactions = [...firebaseTransactions, ...localTransactions];
    userTransactions = allTransactions.filter(t => t.customerId === customerId);
    
    if (userTransactions.length === 0) {
        showToast('No Data Found', 'No purchases found for this Customer ID', 'error');
        return;
    }
    
    showToast('Data Loaded', `Found ${userTransactions.length} transactions`);
    updateUserDashboard();
    renderUserTransactionsTable();
    showUserDashboard();
}

function updateUserDashboard() {
    const totalPurchases = userTransactions.length;
    const totalSpent = userTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Find favorite package
    const packageCounts = {};
    userTransactions.forEach(t => {
        if (t.package) {
            packageCounts[t.package] = (packageCounts[t.package] || 0) + 1;
        }
    });
    
    const favoritePackage = Object.keys(packageCounts).length > 0 
        ? Object.keys(packageCounts).reduce((a, b) => packageCounts[a] > packageCounts[b] ? a : b)
        : '-';
    
    // Find last purchase
    const lastPurchase = userTransactions.length > 0 
        ? userTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
        : null;
    
    const lastPurchaseText = lastPurchase 
        ? formatDate(lastPurchase.timestamp).split(',')[0]
        : '-';

    // Update DOM
    document.getElementById('userTotalPurchases').textContent = totalPurchases;
    document.getElementById('userTotalSpent').textContent = `Ksh ${totalSpent.toLocaleString()}`;
    document.getElementById('userFavoritePackage').textContent = favoritePackage;
    document.getElementById('userLastPurchase').textContent = lastPurchaseText;
}

function renderUserTransactionsTable() {
    const tbody = document.getElementById('userTransactionsTableBody');
    const emptyState = document.getElementById('userEmptyState');
    
    if (userTransactions.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = userTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    tbody.innerHTML = sortedTransactions.map(transaction => `
        <tr>
            <td style="font-weight: 600;">${transaction.package}</td>
            <td>${transaction.duration}</td>
            <td>${transaction.data}</td>
            <td style="font-weight: 600;">Ksh ${transaction.amount}</td>
            <td>${formatDate(transaction.timestamp)}</td>
            <td>${getStatusBadge(transaction.status)}</td>
        </tr>
    `).join('');
}

function showUserDashboard() {
    document.getElementById('initialState').style.display = 'none';
    document.getElementById('userStats').style.display = 'grid';
    document.getElementById('userControls').style.display = 'flex';
    document.getElementById('userTransactionsTable').style.display = 'block';
}

function exportUserData() {
    if (userTransactions.length === 0) {
        showToast('No Data', 'No transactions available to export', 'error');
        return;
    }

    const headers = [
        'Customer ID',
        'Phone',
        'Package',
        'Duration',
        'Data',
        'Amount',
        'Date',
        'Status'
    ];

    const csvContent = [
        headers.join(','),
        ...userTransactions.map(t => [
            `"${t.customerId}"`,
            `"${t.phone}"`,
            `"${t.package}"`,
            `"${t.duration}"`,
            `"${t.data}"`,
            t.amount,
            `"${formatDate(t.timestamp)}"`,
            `"${t.status}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `neonet-ogg-${currentCustomerId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Export Successful', 'Your data exported to CSV file');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle Enter key in customer ID input
    const customerIdInput = document.getElementById('customerIdInput');
    customerIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadUserData();
        }
    });
});