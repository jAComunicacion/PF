function updateDashboard() {
    const healthScore = calculateHealthScore();

    // Solapa "Total": el período lo elige el usuario. Antes sumaba los cinco
    // años del historial y mostraba un "+0%" escrito a mano en el HTML que
    // nunca se calculaba.
    const resumen = window.rangeSummary.calculateRangeSummary(
        window.transactions || [],
        window.balanceRange || '30d'
    );

    const totalBalanceEl = document.getElementById('current-balance');
    if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(resumen.balance);

    const rangeLabelEl = document.getElementById('range-label');
    const rangeIncomeEl = document.getElementById('range-income');
    const rangeExpenseEl = document.getElementById('range-expense');
    const rangeCountEl = document.getElementById('range-count');
    if (rangeLabelEl) rangeLabelEl.textContent = resumen.etiqueta;
    if (rangeIncomeEl) rangeIncomeEl.textContent = formatCurrency(resumen.income, 'income');
    if (rangeExpenseEl) rangeExpenseEl.textContent = formatCurrency(resumen.expense, 'expense');
    if (rangeCountEl) {
        rangeCountEl.textContent = resumen.cantidad === 1
            ? '1 movimiento'
            : `${resumen.cantidad} movimientos`;
    }

    // Solapa "Este Mes": lo que se ve al abrir la app.
    const monthSummary = calculateMonthSummary();
    const monthBalanceEl = document.getElementById('month-balance');
    const monthIncomeEl = document.getElementById('month-income');
    const monthExpenseEl = document.getElementById('month-expense');
    const monthLabelEl = document.getElementById('month-label-name');
    if (monthBalanceEl) monthBalanceEl.textContent = formatCurrency(monthSummary.balance);
    if (monthIncomeEl) monthIncomeEl.textContent = formatCurrency(monthSummary.income, 'income');
    if (monthExpenseEl) monthExpenseEl.textContent = formatCurrency(monthSummary.expense, 'expense');
    if (monthLabelEl) {
        const nombreMes = new Date().toLocaleDateString('es-AR', { month: 'long' });
        monthLabelEl.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    }

    // Update health bar
    const healthFill = document.getElementById('health-fill');
    const healthPercentageEl = document.getElementById('health-percentage');
    if (healthFill && healthPercentageEl) {
        healthFill.style.width = `${healthScore}%`;
        healthPercentageEl.textContent = `${healthScore}%`;
    }
}

function triggerShine(selector) {
    const el = document.querySelector(selector);
    if (el) {
        el.classList.remove('shine-active');
        void el.offsetWidth; // force reflow
        el.classList.add('shine-active');
    }
}

function cambiarRangoSaldo(rango) {
    window.balanceRange = rango;
    updateDashboard();
}

window.updateDashboard = updateDashboard;
window.cambiarRangoSaldo = cambiarRangoSaldo;
