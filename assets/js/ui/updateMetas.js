function updateMetas() {
    const budgetValueEl = document.getElementById('monthly-budget-value');
    const budgetFillEl = document.getElementById('budget-fill');
    const budgetStatusEl = document.getElementById('budget-status');

    if (!budgetValueEl || !budgetFillEl || !budgetStatusEl) return;

    const budget = window.monthlyBudget || 0;

    // Calcular gastos del mes actual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = (window.transactions || [])
        .filter(t => t.type === 'expense')
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Actualizar UI
    budgetValueEl.textContent = formatCurrency(budget);

    let percentage = 0;
    if (budget > 0) {
        percentage = Math.min(100, Math.round((monthlyExpenses / budget) * 100));
    }

    budgetFillEl.style.width = `${percentage}%`;
    budgetStatusEl.textContent = `Gastado: ${formatCurrency(monthlyExpenses)} de ${formatCurrency(budget)}`;

    // Aviso cuando el gasto se acerca al tope. Estos colores eran degradés de
    // neón (#00ffff → #00ff88) que sobrevivieron al rediseño "Libro mayor" y
    // pisaban la paleta desde JS, por inline style. Ahora: arena para el curso
    // normal, terracota para el aviso — la misma semántica del dinero que usa
    // el resto de la app (--expense).
    budgetFillEl.style.background = percentage >= 90 ? '#B4553A' : '#D4B896';
}

window.updateMetas = updateMetas;
