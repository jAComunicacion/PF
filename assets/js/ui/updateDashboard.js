function updateDashboard() {
    const balance = calculateBalance();
    const healthScore = calculateHealthScore();

    // Update balance display
    const totalBalanceEl = document.getElementById('current-balance');
    if (totalBalanceEl) {
        totalBalanceEl.textContent = formatCurrency(balance);
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
