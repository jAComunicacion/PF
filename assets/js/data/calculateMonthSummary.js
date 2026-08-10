// Ingresos, gastos y balance del mes en curso — lo primero que se ve al
// abrir la app, porque un saldo acumulado de años no dice si este mes fue
// bueno o malo. El saldo total sigue disponible en la solapa "Total".
function calculateMonthSummary(hoy = new Date()) {
    const delMes = (window.transactions || [])
        .filter(t => window.transactionFilters.esDelMes(t, hoy));

    const income = delMes
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const expense = delMes
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return { income, expense, balance: income - expense };
}

window.calculateMonthSummary = calculateMonthSummary;
