// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('assets/js/setup/sw.js').then(reg => {
            console.log('SW registrado', reg);
        }).catch(err => {
            console.log('SW fallo', err);
        });
    });
}

// Global function to refresh data from Local DB
window.refreshData = async function () {
    if (!window.db) return;

    try {
        // 1. Fetch Transactions
        const txs = await window.db.transactions.toArray();
        // Sort by date desc
        txs.sort((a, b) => new Date(b.date) - new Date(a.date));
        window.transactions = txs;

        // 2. Fetch Budget
        const budgetSetting = await window.db.settings.get('monthlyBudget');
        window.monthlyBudget = budgetSetting ? budgetSetting.value : 0;

        // 3. Update UI
        updateDashboard();
        renderTransactions();
        updateMetas();

        if (window.currentScreen === 'charts' && window.renderChart) {
            window.renderChart();
        }

        console.log("Datos actualizados desde DB Local.");
    } catch (e) {
        console.error("Error al refrescar datos:", e);
    }
};

async function initializeApp() {
    setupNavigationListeners();
    setupFormListeners();
    setupActionButtons();

    // Initialize Mock Auth (mostly for UI consistency)
    if (window.setupAuth) setupAuth();

    // Initialize Categories (Seed if empty)
    if (window.seedCategories) {
        await window.seedCategories();
    }

    // Initialize Date Input
    const dateInput = document.getElementById('transaction-date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Load Data
    await window.refreshData();

    showScreen('dashboard');
}

document.addEventListener('DOMContentLoaded', initializeApp);
