// Solapas "Este Mes" / "Total" del panel de saldo en el dashboard.
function showBalanceView(view) {
    document.querySelectorAll('#balance-tabs .range-tab').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.balanceView === view);
    });

    const monthView = document.getElementById('balance-view-month');
    const totalView = document.getElementById('balance-view-total');
    if (monthView) monthView.hidden = view !== 'mes';
    if (totalView) totalView.hidden = view !== 'total';
}

function setupBalanceTabs() {
    const tabs = document.getElementById('balance-tabs');
    if (!tabs) return;

    tabs.addEventListener('click', (event) => {
        const btn = event.target.closest('.range-tab');
        if (!btn) return;
        showBalanceView(btn.dataset.balanceView);
    });
}

window.showBalanceView = showBalanceView;
window.setupBalanceTabs = setupBalanceTabs;
