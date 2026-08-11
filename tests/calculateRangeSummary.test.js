const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateRangeSummary } = require('../assets/js/data/calculateRangeSummary.js');

const HOY = new Date(2026, 7, 11); // 11 de agosto de 2026

function mov(type, date, amount) {
    return { type, date, amount, name: 'x', category: 'Varios', subcategory: null };
}

test('el balance resta gastos a ingresos en el periodo', () => {
    const r = calculateRangeSummary([
        mov('income', '2026-08-05', 1000),
        mov('expense', '2026-08-06', 300)
    ], '30d', HOY);

    assert.equal(r.income, 1000);
    assert.equal(r.expense, 300);
    assert.equal(r.balance, 700);
    assert.equal(r.cantidad, 2);
});

// El motivo del cambio: con cinco anios importados, la suma de todo dejo de
// responder "cuanta plata tengo".
test('30 dias deja afuera el historial viejo', () => {
    const r = calculateRangeSummary([
        mov('income', '2026-08-05', 1000),
        mov('income', '2021-09-05', 999999)
    ], '30d', HOY);

    assert.equal(r.income, 1000);
    assert.equal(r.cantidad, 1);
});

test('"todo" sigue sumando el historial completo', () => {
    const r = calculateRangeSummary([
        mov('income', '2026-08-05', 1000),
        mov('income', '2021-09-05', 500)
    ], 'todo', HOY);

    assert.equal(r.income, 1500);
    assert.equal(r.cantidad, 2);
    assert.equal(r.etiqueta, 'Todo el historial');
});

test('cada rango trae su etiqueta, para que el numero no mienta sobre que muestra', () => {
    assert.equal(calculateRangeSummary([], '30d', HOY).etiqueta, 'Últimos 30 días');
    assert.equal(calculateRangeSummary([], 'mes', HOY).etiqueta, 'Este mes');
    assert.equal(calculateRangeSummary([], '3m', HOY).etiqueta, 'Últimos 3 meses');
    assert.equal(calculateRangeSummary([], 'ano', HOY).etiqueta, 'Este año');
});

test('un rango desconocido cae en 30 dias en vez de romper', () => {
    const r = calculateRangeSummary([mov('income', '2026-08-05', 100)], 'inventado', HOY);

    assert.equal(r.etiqueta, 'Últimos 30 días');
});

test('"este mes" incluye el dia 1, que es donde este proyecto ya tropezo cuatro veces', () => {
    const r = calculateRangeSummary([mov('expense', '2026-08-01', 500)], 'mes', HOY);

    assert.equal(r.expense, 500);
    assert.equal(r.cantidad, 1);
});

test('"este anio" no toma el anio anterior', () => {
    const r = calculateRangeSummary([
        mov('expense', '2026-01-01', 100),
        mov('expense', '2025-12-31', 900)
    ], 'ano', HOY);

    assert.equal(r.expense, 100);
});

test('la ventana de 30 dias incluye sus dos extremos', () => {
    const r = calculateRangeSummary([
        mov('expense', '2026-07-13', 10), // hace 29 dias: entra
        mov('expense', '2026-07-12', 99), // hace 30 dias: queda afuera
        mov('expense', '2026-08-11', 20)  // hoy: entra
    ], '30d', HOY);

    assert.equal(r.expense, 30);
    assert.equal(r.cantidad, 2);
});

test('sin movimientos da cero y no rompe', () => {
    const r = calculateRangeSummary([], '30d', HOY);

    assert.equal(r.balance, 0);
    assert.equal(r.cantidad, 0);
});
