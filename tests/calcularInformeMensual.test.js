const test = require('node:test');
const assert = require('node:assert/strict');
const {
    calcularInformeMensual,
    balancePorMes,
    ultimosMeses,
    etiquetarMeses,
    SIN_SUBCATEGORIA
} = require('../assets/js/data/calcularInformeMensual.js');

const HOY = new Date(2026, 7, 11); // 11 de agosto de 2026

function mov(type, date, category, subcategory, amount, name = 'x') {
    return { type, date, category, subcategory, amount, name };
}

function seccion(informe, tipo) {
    return informe.secciones.find((s) => s.tipo === tipo);
}

function grupo(informe, tipo, categoria) {
    return seccion(informe, tipo).grupos.find((g) => g.categoria === categoria);
}

// A diferencia del presupuesto sugerido, el informe SI incluye el mes en curso:
// es un informe de lo que paso, no un numero derivado que deba ser estable.
test('ultimosMeses incluye el mes en curso', () => {
    assert.deepEqual(ultimosMeses(3, HOY), ['2026-06', '2026-07', '2026-08']);
});

test('ultimosMeses cruza el cambio de anio', () => {
    assert.deepEqual(ultimosMeses(3, new Date(2026, 1, 5)), ['2025-12', '2026-01', '2026-02']);
});

test('las etiquetas llevan el anio solo cuando el informe cruza anios', () => {
    assert.deepEqual(etiquetarMeses(['2026-06', '2026-07', '2026-08']), ['jun', 'jul', 'ago']);
    assert.deepEqual(etiquetarMeses(['2025-12', '2026-01']), ['dic 25', 'ene 26']);
});

// Sin el anio, un informe de 12 meses tendria dos columnas "ago".
test('un informe de 12 meses no repite el nombre de un mes', () => {
    const { etiquetas } = calcularInformeMensual([], { hoy: HOY, meses: 12 });

    assert.equal(etiquetas.length, 12);
    assert.equal(new Set(etiquetas).size, 12, 'cada columna tiene que ser distinguible');
});

test('agrupa por categoria y subcategoria, con subtotal y total', () => {
    const transacciones = [
        mov('expense', '2026-07-05', 'Bills', 'Electricidad', 60000),
        mov('expense', '2026-07-18', 'Bills', 'Gas', 21000),
        mov('expense', '2026-07-09', 'Automovil', 'Nafta', 45000)
    ];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });
    const bills = grupo(informe, 'expense', 'Bills');

    assert.equal(bills.filas.length, 2);
    assert.equal(bills.totalPorMes['2026-07'], 81000);
    assert.equal(seccion(informe, 'expense').totalPorMes['2026-07'], 126000);
});

test('suma varios movimientos de la misma subcategoria en el mismo mes', () => {
    const transacciones = [
        mov('expense', '2026-07-03', 'Comida', 'Supermercado', 10000),
        mov('expense', '2026-07-21', 'Comida', 'Supermercado', 15000)
    ];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });

    assert.equal(grupo(informe, 'expense', 'Comida').filas[0].porMes['2026-07'], 25000);
});

// El criterio de aceptacion 5: el hueco es informacion. Una celda en cero y una
// celda vacia dicen cosas distintas, y es lo que muestra que un cliente dejo de
// facturar.
test('un mes sin movimientos deja la celda ausente, no en cero', () => {
    const transacciones = [mov('income', '2026-06-10', 'Estudio', 'Ruta J', 200000)];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });
    const fila = grupo(informe, 'income', 'Estudio').filas[0];

    assert.equal(fila.porMes['2026-06'], 200000);
    assert.ok(!('2026-07' in fila.porMes), 'julio no tiene que existir como clave');
    assert.ok(!('2026-08' in fila.porMes));
});

test('ingresos y gastos van en secciones separadas', () => {
    const transacciones = [
        mov('income', '2026-07-02', 'Estudio', 'Karina Petelin', 1500000),
        mov('expense', '2026-07-04', 'Bills', 'Electricidad', 60000)
    ];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });

    assert.equal(seccion(informe, 'income').grupos.length, 1);
    assert.equal(seccion(informe, 'expense').grupos.length, 1);
    assert.equal(seccion(informe, 'income').totalPorMes['2026-07'], 1500000);
});

test('los movimientos fuera de la ventana quedan afuera', () => {
    const transacciones = [
        mov('expense', '2026-07-05', 'Bills', 'Gas', 21000),
        mov('expense', '2025-11-05', 'Bills', 'Gas', 999999)
    ];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY, meses: 3 });
    const gas = grupo(informe, 'expense', 'Bills').filas[0];

    assert.deepEqual(Object.keys(gas.porMes), ['2026-07']);
});

// Money muestra "Automobile - Unassigned" como una fila mas.
test('un movimiento sin subcategoria entra como fila "Sin asignar"', () => {
    const transacciones = [mov('expense', '2026-07-05', 'Automovil', null, 45000)];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });

    assert.equal(grupo(informe, 'expense', 'Automovil').filas[0].nombre, SIN_SUBCATEGORIA);
});

test('las categorias y subcategorias salen en orden alfabetico, como Money', () => {
    const transacciones = [
        mov('expense', '2026-07-05', 'Vivienda', 'Alquiler', 1),
        mov('expense', '2026-07-05', 'Automovil', 'Nafta', 1),
        mov('expense', '2026-07-05', 'Automovil', 'Chapa', 1)
    ];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });
    const gastos = seccion(informe, 'expense');

    assert.deepEqual(gastos.grupos.map((g) => g.categoria), ['Automovil', 'Vivienda']);
    assert.deepEqual(gastos.grupos[0].filas.map((f) => f.nombre), ['Chapa', 'Nafta']);
});

// La misma familia de error que ya mordio cuatro veces en el proyecto.
test('un movimiento del dia 1 cae en su mes y no en el anterior', () => {
    const transacciones = [mov('expense', '2026-08-01', 'Bills', 'Gas', 21000)];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });

    assert.equal(grupo(informe, 'expense', 'Bills').filas[0].porMes['2026-08'], 21000);
});

test('balancePorMes resta gastos a ingresos', () => {
    const transacciones = [
        mov('income', '2026-07-02', 'Estudio', 'Karina Petelin', 1500000),
        mov('expense', '2026-07-04', 'Bills', 'Electricidad', 500000)
    ];

    const informe = calcularInformeMensual(transacciones, { hoy: HOY });

    assert.equal(balancePorMes(informe)['2026-07'], 1000000);
});

test('balancePorMes deja vacio el mes sin ningun movimiento', () => {
    const transacciones = [mov('income', '2026-07-02', 'Estudio', 'Ruta J', 200000)];

    const balance = balancePorMes(calcularInformeMensual(transacciones, { hoy: HOY }));

    assert.equal(balance['2026-07'], 200000);
    assert.ok(!('2026-06' in balance), 'un mes sin nada no vale cero, vale vacio');
});

test('sin movimientos devuelve la estructura vacia sin romper', () => {
    const informe = calcularInformeMensual([], { hoy: HOY });

    assert.equal(informe.meses.length, 3);
    assert.equal(seccion(informe, 'income').grupos.length, 0);
    assert.deepEqual(balancePorMes(informe), {});
});
