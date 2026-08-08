function renderChart() {
    const container = document.querySelector('.chart-container');
    if (!container) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        container.innerHTML = '';
        const errorMessage = document.createElement('p');
        errorMessage.className = 'chart-empty-message';
        errorMessage.style.color = 'red';
        errorMessage.textContent = 'Error: Chart.js no cargó.';
        container.appendChild(errorMessage);
        return;
    }

    const ctx = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(ctx);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenseTransactions = (window.transactions || []).filter(t => {
        if (t.type !== 'expense') return false;
        if (window.chartFilter === 'month') {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
        return true;
    });

    if (expenseTransactions.length === 0) {
        container.innerHTML = '';
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'chart-empty-message';
        emptyMessage.textContent = window.chartFilter === 'month' ? 'No hay gastos este mes.' : 'No hay gastos para mostrar.';
        container.appendChild(emptyMessage);
        return;
    }

    const expensesByCategory = {};
    expenseTransactions.forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    if (window.expenseChart) {
        window.expenseChart.destroy();
    }

    window.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: window.CHART_PALETTE,
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--card').trim() || '#FFFFFF',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            // Anillo fino: el gráfico acompaña a la leyenda, no compite con ella
            cutout: '68%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#143638',
                    padding: 11,
                    cornerRadius: 4,
                    titleFont: { family: 'Barlow Condensed', size: 15 },
                    bodyFont: { family: 'Barlow Condensed', size: 16, weight: '600' },
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    renderLegend(expensesByCategory);
}

window.renderChart = renderChart;
