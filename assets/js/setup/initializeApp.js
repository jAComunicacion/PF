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

// Trae el estado desde el servidor. Antes leía IndexedDB, que era local a cada
// navegador: por eso el celular mostraba los movimientos y la compu $0.00.
window.refreshData = async function () {
    try {
        // Las dos consultas son independientes, así que van juntas en vez de
        // una detrás de la otra.
        const [rows, settings] = await Promise.all([
            window.api.getTransactions(),
            window.api.getSettings()
        ]);

        const txs = (rows || []).map(window.api.toUiTransaction);
        txs.sort((a, b) => new Date(b.date) - new Date(a.date));
        window.transactions = txs;

        window.monthlyBudget = settings && settings.monthlyBudget
            ? window.api.toNumber(settings.monthlyBudget)
            : 0;

        updateDashboard();
        renderTransactions();
        updateMetas();

        if (window.currentScreen === 'charts' && window.renderChart) {
            window.renderChart();
        }
    } catch (e) {
        console.error('Error al refrescar datos:', e);
        // Un 401 ya redirigió al ingreso; cualquier otra cosa se avisa, porque
        // la alternativa es una pantalla en $0.00 que parece un saldo real.
        if (e.message !== 'Sesión vencida.' && typeof showToast === 'function') {
            showToast(`No se pudieron cargar los datos: ${e.message}`, 'error');
        }
    }
};

async function initializeApp() {
    setupNavigationListeners();
    setupFormListeners();
    setupActionButtons();

    if (window.setupAuth) setupAuth();

    // Siembra las categorías por defecto si la base está vacía. El servidor
    // decide; acá sólo se dispara.
    if (window.seedCategories) {
        await window.seedCategories();
    }

    const dateInput = document.getElementById('transaction-date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    await window.refreshData();

    showScreen('dashboard');
}

document.addEventListener('DOMContentLoaded', initializeApp);
