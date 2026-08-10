function updateDashboard() {
    const balance = calculateBalance();
    const healthScore = calculateHealthScore();

    // Update balance display
    const totalBalanceEl = document.getElementById('current-balance');
    if (totalBalanceEl) {
        totalBalanceEl.textContent = formatCurrency(balance);
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

window.updateDashboard = updateDashboard;
