// Variables de estado global
let transactions = [];
let currentScreen = 'dashboard';
let expenseChart = null;
let monthlyBudget = 0;
let chartFilter = 'month'; // 'month', 'all'

// Exponer al objeto window para acceso desde otros scripts
window.transactions = transactions;
window.currentScreen = currentScreen;
window.expenseChart = expenseChart;
