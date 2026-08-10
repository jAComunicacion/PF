// Comparativa de ingresos/gastos de los últimos 3 meses, en barras — el
// reporte que en Microsoft Money se armaba desde Informes.
function renderMonthCompareChart() {
    const container = document.querySelector('#charts-view-comparativa .chart-container');
    if (!container) return;

    if (typeof Chart === 'undefined') {
        container.innerHTML = '';
        const errorMessage = document.createElement('p');
        errorMessage.className = 'chart-empty-message';
        errorMessage.textContent = 'Error: Chart.js no cargó.';
        container.appendChild(errorMessage);
        return;
    }

    const meses = window.calculateLastMonths(3);
    const hayMovimientos = meses.some(m => m.income > 0 || m.expense > 0);

    if (!hayMovimientos) {
        container.innerHTML = '';
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'chart-empty-message';
        emptyMessage.textContent = 'No hay movimientos en los últimos 3 meses.';
        container.appendChild(emptyMessage);
        document.getElementById('compare-legend').innerHTML = '';
        return;
    }

    const ctx = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(ctx);

    const styles = getComputedStyle(document.documentElement);
    const colorIngresos = styles.getPropertyValue('--income').trim() || '#2E7D82';
    const colorGastos = styles.getPropertyValue('--expense').trim() || '#B4553A';

    if (window.compareChart) {
        window.compareChart.destroy();
    }

    window.compareChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses.map(m => m.nombre.charAt(0).toUpperCase() + m.nombre.slice(1)),
            datasets: [
                { label: 'Ingresos', data: meses.map(m => m.income), backgroundColor: colorIngresos, borderRadius: 3 },
                { label: 'Gastos', data: meses.map(m => m.expense), backgroundColor: colorGastos, borderRadius: 3 }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => formatCurrency(value) }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Barlow Condensed', size: 13 } }
                },
                tooltip: {
                    backgroundColor: '#143638',
                    padding: 11,
                    cornerRadius: 4,
                    titleFont: { family: 'Barlow Condensed', size: 15 },
                    bodyFont: { family: 'Barlow Condensed', size: 16, weight: '600' },
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    });

    renderCompareLegend(meses);
}

// Balance neto de cada mes, debajo del gráfico — para ver de un vistazo si
// ese mes cerró en positivo o negativo, no sólo el detalle de barras.
function renderCompareLegend(meses) {
    const legendEl = document.getElementById('compare-legend');
    if (!legendEl) return;
    legendEl.innerHTML = '';

    meses.forEach(mes => {
        const balance = mes.income - mes.expense;
        const item = document.createElement('div');
        item.className = 'legend-item';

        const labelEl = document.createElement('span');
        labelEl.className = 'legend-label';
        labelEl.textContent = `Balance ${mes.nombre.charAt(0).toUpperCase() + mes.nombre.slice(1)}`;

        const amountEl = document.createElement('span');
        amountEl.className = 'legend-value';
        amountEl.textContent = formatCurrency(balance);

        item.appendChild(labelEl);
        item.appendChild(amountEl);
        legendEl.appendChild(item);
    });
}

window.renderMonthCompareChart = renderMonthCompareChart;
