// Global variables
let allTransactions = [];
let filteredTransactions = [];

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

// Data functions
function loadTransactions() {
    allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    filteredTransactions = [...allTransactions];
    updateDashboard();
    renderTransactionsTable();
}

function updateDashboard() {
    const totalSales = allTransactions.length;
    const totalRevenue = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const activeCustomers = new Set(allTransactions.map(t => t.customerId)).size;
    
    // Find most popular package
    const packageCounts = {};
    allTransactions.forEach(t => {
        if (t.package) {
            packageCounts[t.package] = (packageCounts[t.package] || 0) + 1;
        }
    });
    
    const popularPackage = Object.keys(packageCounts).length > 0 
        ? Object.keys(packageCounts).reduce((a, b) => packageCounts[a] > packageCounts[b] ? a : b)
        : '-';

    // Update DOM
    document.getElementById('totalSales').textContent = totalSales;
    document.getElementById('totalRevenue').textContent = `Ksh ${totalRevenue.toLocaleString()}`;
    document.getElementById('activeCustomers').textContent = activeCustomers;
    document.getElementById('popularPackage').textContent = popularPackage;
}

function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = filteredTransactions.map(transaction => `
        <tr>
            <td style="font-family: monospace; font-size: 12px;">${transaction.id}</td>
            <td style="font-weight: 600;">${transaction.customerId}</td>
            <td>${transaction.phone}</td>
            <td>${transaction.package}</td>
            <td>${transaction.duration}</td>
            <td>${transaction.data}</td>
            <td style="font-weight: 600;">Ksh ${transaction.amount}</td>
            <td>${formatDate(transaction.timestamp)}</td>
            <td>${getStatusBadge(transaction.status)}</td>
        </tr>
    `).join('');
}

function filterTransactions(searchTerm) {
    if (!searchTerm.trim()) {
        filteredTransactions = [...allTransactions];
    } else {
        const term = searchTerm.toLowerCase();
        filteredTransactions = allTransactions.filter(transaction => 
            transaction.id.toLowerCase().includes(term) ||
            transaction.customerId.toLowerCase().includes(term) ||
            transaction.phone.toLowerCase().includes(term) ||
            transaction.package.toLowerCase().includes(term) ||
            transaction.status.toLowerCase().includes(term)
        );
    }
    renderTransactionsTable();
}

function exportToCSV() {
    if (allTransactions.length === 0) {
        showToast('No Data', 'No transactions available to export', 'error');
        return;
    }

    const headers = [
        'Transaction ID',
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
        ...allTransactions.map(t => [
            `"${t.id}"`,
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
    link.setAttribute('download', `starnet-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Export Successful', 'Transactions exported to CSV file');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterTransactions(e.target.value);
        }, 300);
    });
});

// Auto-refresh every 30 seconds
setInterval(() => {
    loadTransactions();
}, 30000);