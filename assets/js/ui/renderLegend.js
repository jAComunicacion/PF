function renderLegend(data) {
    const legendEl = document.getElementById('chart-legend');
    if (!legendEl) return;
    legendEl.innerHTML = '';

    const colors = window.CHART_PALETTE;
    let colorIdx = 0;

    for (const [category, amount] of Object.entries(data)) {
        const item = document.createElement('div');
        item.classList.add('legend-item');
        item.style.borderLeft = `4px solid ${colors[colorIdx % colors.length]}`;

        const labelEl = document.createElement('span');
        labelEl.className = 'legend-label';
        labelEl.textContent = category;

        const amountEl = document.createElement('span');
        amountEl.className = 'legend-value';
        amountEl.textContent = formatCurrency(amount);

        item.appendChild(labelEl);
        item.appendChild(amountEl);
        legendEl.appendChild(item);
        colorIdx++;
    }
}

window.renderLegend = renderLegend;
