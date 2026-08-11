// Solapas "Por Categoría" / "Comparativa 3 Meses" de la pantalla de Gráficas.
function showChartsView(view) {
    document.querySelectorAll('#charts-tabs .range-tab').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.chartsView === view);
    });

    const vistas = {
        categoria: document.getElementById('charts-view-categoria'),
        comparativa: document.getElementById('charts-view-comparativa'),
        informe: document.getElementById('charts-view-informe')
    };

    Object.entries(vistas).forEach(([nombre, elemento]) => {
        if (elemento) elemento.hidden = nombre !== view;
    });

    window.chartsView = view;

    if (view === 'comparativa') {
        if (window.renderMonthCompareChart) renderMonthCompareChart();
    } else if (view === 'informe') {
        if (window.renderInformeMensual) renderInformeMensual();
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
