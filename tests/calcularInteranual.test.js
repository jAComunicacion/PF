const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularInteranual, hayPeriodoAnterior } = require('../assets/js/data/calcularInteranual.js');

const HOY = new Date(2026, 7, 11); // 11 de agosto de 2026

function gasto(date, category, amount) {
    return { type: 'expense', date, category, subcategory: null, amount, name: 'x' };
}

function seccion(comparativa, tipo) {
    return comparativa.secciones.find((s) => s.tipo === tipo);
}

function fila(comparativa, tipo, categoria) {
    return seccion(comparativa, tipo).filas.find((f) => f.categoria === categoria);
}

test('compara los ultimos 3 meses contra los mismos 3 del anio anterior', () => {
    const transacciones = [
        gasto('2026-07-05', 'Automovil', 100),
        gasto('2025-07-05', 'Automovil', 40)
    ];

    const c = calcularInteranual(transacciones, { hoy: HOY });
    const automovil = fila(c, 'expense', 'Automovil');

    assert.deepEqual(c.mesesActual, ['2026-06', '2026-07', '2026-08']);
    assert.deepEqual(c.mesesAnterior, ['2025-06', '2025-07', '2025-08']);
    assert.equal(automovil.montoActual, 100);
    assert.equal(automovil.montoAnterior, 40);
});

// El nucleo del diseno: con inflacion, los pesos no comparan nada. El
// porcentaje sobre el total del propio periodo si.
test('el porcentaje es sobre el total de su propio periodo, no entre periodos', () => {
    const transacciones = [
        // Este anio: Automovil es 1 de cada 4 pesos.
        gasto('2026-07-05', 'Automovil', 250),
        gasto('2026-07-06', 'Comida', 750),
        // El anio pasado: la mitad de lo que se gastaba, pero Automovil pesaba
        // lo mismo. Los montos cambiaron; la estructura no.
        gasto('2025-07-05', 'Automovil', 125),
        gasto('2025-07-06', 'Comida', 375)
    ];

    const c = calcularInteranual(transacciones, { hoy: HOY });
    const automovil = fila(c, 'expense', 'Automovil');

    assert.equal(automovil.porcentajeActual, 25);
    assert.equal(automovil.porcentajeAnterior, 25);
    assert.equal(automovil.puntos, 0, 'gastar el doble nominal no cambia la estructura');
});

test('la diferencia se expresa en puntos porcentuales', () => {
    const transacciones = [
        gasto('2026-07-05', 'Automovil', 180),
        gasto('2026-07-06', 'Comida', 820),
        gasto('2025-07-05', 'Automovil', 110),
        gasto('2025-07-06', 'Comida', 890)
    ];

    const c = calcularInteranual(transacciones, { hoy: HOY });
    const automovil = fila(c, 'expense', 'Automovil');

    assert.equal(automovil.porcentajeActual, 18);
    assert.equal(automovil.porcentajeAnterior, 11);
    assert.equal(Math.round(automovil.puntos), 7, 'de 11% a 18% son 7 puntos, no "63% mas"');
});

// Una categoria que existia el anio pasado y este anio desaparecio es
// justamente lo que interesa ver.
test('incluye las categorias que existian antes y ya no', () => {
    const transacciones = [
        gasto('2026-07-05', 'Comida', 100),
        gasto('2025-07-05', 'Vacaciones', 500)
    ];

    const c = calcularInteranual(transacciones, { hoy: HOY });
    const vacaciones = fila(c, 'expense', 'Vacaciones');

    assert.ok(vacaciones, 'la categoria del anio pasado tiene que aparecer');
    assert.equal(vacaciones.montoActual, 0);
    assert.equal(vacaciones.montoAnterior, 500);
    assert.ok(vacaciones.puntos < 0);
});

test('y las categorias nuevas de este anio', () => {
    const transacciones = [
        gasto('2026-07-05', 'Psicologa', 100),
        gasto('2025-07-05', 'Comida', 500)
    ];

    const c = calcularInteranual(transacciones, { hoy: HOY });
    const nueva = fila(c, 'expense', 'Psicologa');

    assert.equal(nueva.montoAnterior, 0);
    assert.equal(nueva.porcentajeActual, 100);
});

// Sin esto, el informe muestra una columna en cero y parece que se gasto todo
// de golpe, cuando en realidad no habia datos cargados.
test('hayPeriodoAnterior detecta que no hay con que comparar', () => {
    const soloEsteAnio = calcularInteranual([gasto('2026-07-05', 'Comida', 100)], { hoy: HOY });
    const conHistoria = calcularInteranual(
        [gasto('2026-07-05', 'Comida', 100), gasto('2025-07-05', 'Comida', 50)],
        { hoy: HOY }
    );

    assert.equal(hayPeriodoAnterior(soloEsteAnio), false);
    assert.equal(hayPeriodoAnterior(conHistoria), true);
});

test('las etiquetas nombran los dos periodos con su anio', () => {
    const c = calcularInteranual([], { hoy: HOY });

    assert.match(c.etiquetaActual, /jun a ago 2026/);
    assert.match(c.etiquetaAnterior, /jun a ago 2025/);
});

test('ingresos y gastos se comparan por separado', () => {
    const transacciones = [
        { type: 'income', date: '2026-07-02', category: 'Estudio', subcategory: null, amount: 1000, name: 'x' },
        gasto('2026-07-05', 'Comida', 300),
        { type: 'income', date: '2025-07-02', category: 'Estudio', subcategory: null, amount: 600, name: 'x' }
    ];

    const c = calcularInteranual(transacciones, { hoy: HOY });

    assert.equal(seccion(c, 'income').totalActual, 1000);
    assert.equal(seccion(c, 'income').totalAnterior, 600);
    assert.equal(seccion(c, 'expense').totalActual, 300);
});

test('sin movimientos no rompe', () => {
    const c = calcularInteranual([], { hoy: HOY });

    assert.equal(seccion(c, 'expense').filas.length, 0);
    assert.equal(seccion(c, 'expense').totalActual, 0);
    assert.equal(hayPeriodoAnterior(c), false);
});

// El 29 de febrero no existe en un anio no bisiesto: restar un anio a la fecha
// exacta lo correria a marzo y el periodo comparado quedaria desplazado.
test('un 29 de febrero no corre el periodo del anio anterior', () => {
    const c = calcularInteranual([], { hoy: new Date(2024, 1, 29), meses: 3 });

    assert.deepEqual(c.mesesActual, ['2023-12', '2024-01', '2024-02']);
    assert.deepEqual(c.mesesAnterior, ['2022-12', '2023-01', '2023-02']);
});
