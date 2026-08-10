// Variables de estado global
let transactions = [];
let currentScreen = 'dashboard';
let expenseChart = null;
let monthlyBudget = 0;
let chartFilter = 'month'; // 'month', 'all'
let chartsView = 'categoria'; // 'categoria', 'comparativa' — solapa activa de Gráficas

// Exponer al objeto window para acceso desde otros scripts.
//
// `chartFilter` y `monthlyBudget` faltaban acá. Un `let` de nivel superior NO
// crea una propiedad en window, así que renderChart preguntaba por
// `window.chartFilter === 'month'`, recibía undefined y caía en el histórico:
// el desplegable decía "Este Mes" y el gráfico mostraba los cinco años. Se
// arreglaba solo al tocar el desplegable, que era lo que lo hacía confuso.
window.transactions = transactions;
window.currentScreen = currentScreen;
window.expenseChart = expenseChart;
window.chartFilter = chartFilter;
window.chartsView = chartsView;
window.monthlyBudget = monthlyBudget;

// Paleta categórica del gráfico. Derivada de la marca (petróleo + arena +
// terracota): una sola familia cromática, no colores sueltos. Vive acá para
// que el gráfico y su leyenda no se desincronicen.
window.CHART_PALETTE = [
    '#2E7D82', // verde petróleo
    '#D4B896', // arena
    '#B4553A', // terracota
    '#7BA7A0', // salvia
    '#1D4F52', // petróleo profundo
    '#E0C9A6', // arena clara
    '#C8785A', // terracota clara
    '#A8C0BE'  // teal pálido
];
