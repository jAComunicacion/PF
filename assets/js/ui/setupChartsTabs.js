// Solapas "Por Categoría" / "Comparativa 3 Meses" de la pantalla de Gráficas.
function showChartsView(view) {
    document.querySelectorAll('#charts-tabs .range-tab').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.chartsView === view);
    });

    const categoriaView = document.getElementById('charts-view-categoria');
    const comparativaView = document.getElementById('charts-view-comparativa');
    if (categoriaView) categoriaView.hidden = view !== 'categoria';
    if (comparativaView) comparativaView.hidden = view !== 'comparativa';

    window.chartsView = view;

    if (view === 'comparativa') {
        if (window.renderMonthCompareChart) renderMonthCompareChart();
    } else if (window.renderChart) {
        renderChart();
    }
}

function setupChartsTabs() {
    const tabs = document.getElementById('charts-tabs');
    if (!tabs) return;

    tabs.addEventListener('click', (event) => {
        const btn = event.target.closest('.range-tab');
        if (!btn) return;
        showChartsView(btn.dataset.chartsView);
    });
}

window.showChartsView = showChartsView;
window.setupChartsTabs = setupChartsTabs;
