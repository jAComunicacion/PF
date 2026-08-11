// Ingresos, gastos y balance de un periodo cualquiera.
//
// Generaliza calculateMonthSummary, que solo sabia del mes en curso. La solapa
// "Total" del dashboard sumaba los cinco anios de historial: con el label
// "Saldo Total" no estaba mal, pero desde la importacion de Microsoft Money
// ese numero dejo de responder "cuanta plata tengo" y paso a ser la suma de
// todo lo que entro y salio desde 2021, que no le sirve a nadie.
//
// Ahora el periodo se elige, igual que en la lista de movimientos, y "Todo"
// sigue disponible para quien lo quiera.

(function (raiz) {
    'use strict';

    // Los mismos rangos que la lista de movimientos, para que la app no tenga
    // dos vocabularios distintos para decir lo mismo.
    const ETIQUETAS = {
        '30d': 'Últimos 30 días',
        'mes': 'Este mes',
        '3m': 'Últimos 3 meses',
        'ano': 'Este año',
        'todo': 'Todo el historial'
    };

    function filtros() {
        return (typeof module !== 'undefined' && module.exports)
            ? require('./transactionFilters.js')
            : raiz.transactionFilters;
    }

    function calculateRangeSummary(transacciones, rango = '30d', hoy = new Date()) {
        const { desde, hasta } = filtros().limitesDelRango({ rango }, hoy);

        let income = 0;
        let expense = 0;
        let cantidad = 0;

        (transacciones || []).forEach((t) => {
            // Comparacion como texto: 'YYYY-MM-DD' por new Date se lee en UTC
            // y en Argentina retrocede un dia.
            const fecha = String(t.date || '');
            if (desde && fecha < desde) return;
            if (hasta && fecha > hasta) return;

            cantidad++;
            const monto = parseFloat(t.amount || 0);
            if (t.type === 'income') income += monto;
            else expense += monto;
        });

        return {
            rango,
            etiqueta: ETIQUETAS[rango] || ETIQUETAS['30d'],
            income,
            expense,
            balance: income - expense,
            cantidad
        };
    }

    const api = { calculateRangeSummary, ETIQUETAS };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (raiz) raiz.rangeSummary = api;
})(typeof window !== 'undefined' ? window : null);
