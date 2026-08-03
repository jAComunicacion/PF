function calculateHealthScore() {
    const income = (window.transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const expenses = (window.transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    if (income === 0) return expenses > 0 ? 0 : 0;

    const score = Math.round(((income - expenses) / income) * 100);
    return Math.max(0, Math.min(100, score));
}

window.calculateHealthScore = calculateHealthScore;
