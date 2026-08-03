function renderLegend(data) {
    const legendEl = document.getElementById('chart-legend');
    if (!legendEl) return;
    legendEl.innerHTML = '';

    const colors = ['#ff00ff', '#00ffff', '#00ff88', '#ffaa00', '#ff0066', '#7000ff', '#0070ff', '#66ff00'];
    let colorIdx = 0;

    for (const [category, amount] of Object.entries(data)) {
        const item = document.createElement('div');
        item.classList.add('legend-item');
        item.style.borderLeft = `4px solid ${colors[colorIdx % colors.length]}`;

        const labelEl = document.createElement('span');
        labelEl.textContent = category;

        const amountEl = document.createElement('span');
        amountEl.style.fontWeight = 'bold';
        amountEl.style.color = '#00ffff';
        amountEl.textContent = formatCurrency(amount);

        item.appendChild(labelEl);
        item.appendChild(amountEl);
        legendEl.appendChild(item);
        colorIdx++;
    }
}

window.renderLegend = renderLegend;
