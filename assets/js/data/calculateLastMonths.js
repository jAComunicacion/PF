// Comparativa de ingresos/gastos de los últimos `n` meses (el actual
// incluido), del más viejo al más nuevo. Es el reporte por columnas que
// Microsoft Money mostraba en "Informes", llevado a la pantalla de Gráficas.
function calculateLastMonths(n = 3, hoy = new Date()) {
    const meses = [];
    for (let i = n - 1; i >= 0; i--) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        const nombre = fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
        meses.push({ clave, nombre, income: 0, expense: 0 });
    }

    const porClave = Object.fromEntries(meses.map(m => [m.clave, m]));

    (window.transactions || []).forEach(t => {
        const mes = porClave[String(t.date || '').slice(0, 7)];
        if (!mes) return;
        if (t.type === 'income') mes.income += parseFloat(t.amount || 0);
        else mes.expense += parseFloat(t.amount || 0);
    });

    return meses;
}

window.calculateLastMonths = calculateLastMonths;
