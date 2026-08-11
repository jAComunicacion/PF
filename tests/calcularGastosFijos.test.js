const test = require('node:test');
const assert = require('node:assert/strict');
const {
    calcularGastosFijos,
    describirSugerencia,
    mediana,
    mesesCompletosPrevios
} = require('../assets/js/data/calcularGastosFijos.js');

// Fecha fija para que los tests no dependan del dia en que se corren.
const HOY = new Date(2026, 7, 11); // 11 de agosto de 2026

function gasto(date, name, amount) {
    return { type: 'expense', date, name, amount };
}

// Genera el mismo gasto en varios meses.
function repetir(meses, name, amount, dia = '10') {
    return meses.map((mes) => gasto(`${mes}-${dia}`, name, amount));
}

const SEIS_MESES = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];

test('mesesCompletosPrevios excluye el mes en curso', () => {
    const meses = mesesCompletosPrevios(6, HOY);

    assert.deepEqual(meses, SEIS_MESES);
    assert.ok(!meses.includes('2026-08'), 'agosto esta a mitad de camino');
});

test('mesesCompletosPrevios cruza el cambio de anio', () => {
    assert.deepEqual(
        mesesCompletosPrevios(3, new Date(2026, 1, 5)),
        ['2025-11', '2025-12', '2026-01']
    );
});

test('mediana usa el valor del medio, no el promedio', () => {
    assert.equal(mediana([100, 100, 100, 100, 100, 500]), 100);
    assert.equal(mediana([1, 2, 3]), 2);
    assert.equal(mediana([]), 0);
});

// El criterio de aceptacion 3 del spec: un mes con la luz al doble no tiene que
// inflar el piso.
test('un gasto con un mes atipico se computa por la mediana, no por el promedio', () => {
    const transacciones = [
        ...repetir(SEIS_MESES.slice(0, 5), 'Electricidad', 100),
        gasto('2026-07-10', 'Electricidad', 500)
    ];

    const { fijos } = calcularGastosFijos(transacciones, { hoy: HOY });
    const luz = fijos.find((f) => f.nombre === 'Electricidad');

    assert.equal(luz.mediana, 100, 'el promedio habria dado 166');
});

test('detecta como fijo lo que aparece en 4 de 6 meses, y descarta lo que aparece en 3', () => {
    const transacciones = [
        ...repetir(SEIS_MESES.slice(0, 4), 'Alquiler', 500000),
        ...repetir(SEIS_MESES.slice(0, 3), 'Regalo', 20000),
        // Relleno para que los 6 meses de la ventana tengan movimientos. Sin
        // esto la historia efectiva es de 4 meses, se activa el minimo
        // adaptativo y la vara baja a 3 -que es correcto, pero es otro caso,
        // cubierto por el test de "2 meses de historia".
        ...repetir(SEIS_MESES.slice(4), 'Suelto', 1000)
    ];

    const { fijos } = calcularGastosFijos(transacciones, { hoy: HOY });
    const nombres = fijos.map((f) => f.nombre);

    assert.ok(nombres.includes('Alquiler'));
    assert.ok(!nombres.includes('Regalo'), '3 de 6 no alcanza');
});

// La misma normalizacion que el buscador: si las variantes no colapsan, cada
// una cuenta por separado y ninguna llega al minimo.
test('agrupa el mismo comercio escrito distinto', () => {
    const transacciones = [
        gasto('2026-02-10', 'Farmacia Suárez', 100),
        gasto('2026-03-10', 'farmacia suarez', 100),
        gasto('2026-04-10', 'FARMACIA SUAREZ', 100),
        gasto('2026-05-10', 'Farmacia Suarez', 100)
    ];

    const { fijos } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.equal(fijos.length, 1, 'las cuatro grafias son el mismo gasto');
    assert.equal(fijos[0].apariciones, 4);
});

test('la mediana de un fijo ignora los meses en los que no aparece', () => {
    // Aparece en 5 de 6 meses. Rellenar el mes faltante con 0 daria 250.
    const transacciones = repetir(SEIS_MESES.slice(0, 5), 'Alquiler', 500);

    const { fijos } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.equal(fijos[0].mediana, 500);
});

test('el sugerido suma el piso de gastos fijos y el margen variable', () => {
    const transacciones = [
        ...repetir(SEIS_MESES, 'Alquiler', 100000),
        // Gastos sueltos, distintos cada mes: nunca llegan al minimo, asi que
        // no son piso, pero si son margen.
        ...SEIS_MESES.map((mes, i) => gasto(`${mes}-15`, `Compra ${i}`, 20000))
    ];

    const { piso, margen, sugeridoExacto } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.equal(piso, 100000);
    assert.equal(margen, 20000);
    assert.equal(sugeridoExacto, 120000);
});

test('el margen nunca es negativo', () => {
    const transacciones = repetir(SEIS_MESES, 'Alquiler', 100000);

    const { margen } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.equal(margen, 0, 'si todo es fijo, no hay sobrante');
});

test('el sugerido se redondea al millar', () => {
    const transacciones = repetir(SEIS_MESES, 'Alquiler', 1247893);

    const { sugerido, sugeridoExacto } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.equal(sugeridoExacto, 1247893);
    assert.equal(sugerido, 1248000);
});

// El caso que motiva excluir el mes en curso: consultado el dia 2 y el dia 28
// tiene que dar lo mismo.
test('el sugerido no cambia segun el dia del mes en que se consulta', () => {
    const transacciones = [
        ...repetir(SEIS_MESES, 'Alquiler', 100000),
        gasto('2026-08-01', 'Alquiler', 100000)
    ];

    const dia2 = calcularGastosFijos(transacciones, { hoy: new Date(2026, 7, 2) });
    const dia28 = calcularGastosFijos(transacciones, { hoy: new Date(2026, 7, 28) });

    assert.equal(dia2.sugerido, dia28.sugerido);
});

test('los ingresos no entran en el presupuesto de gastos', () => {
    const transacciones = [
        ...repetir(SEIS_MESES, 'Alquiler', 100000),
        ...SEIS_MESES.map((mes) => ({
            type: 'income', date: `${mes}-05`, name: 'Karina', amount: 900000
        }))
    ];

    const { piso, sugeridoExacto } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.equal(piso, 100000);
    assert.equal(sugeridoExacto, 100000);
});

test('sin movimientos no inventa un presupuesto', () => {
    const resultado = calcularGastosFijos([], { hoy: HOY });

    assert.equal(resultado.sugerido, null);
    assert.equal(resultado.fijos.length, 0);
    assert.match(describirSugerencia(resultado), /no hay movimientos suficientes/i);
});

// Con poca historia, exigir 4 de 6 no detectaria nada y la app diria "no hay
// gastos fijos", que es falso: lo que falta es historia.
test('con 2 meses de historia baja el minimo en vez de no detectar nada', () => {
    const transacciones = [
        gasto('2026-06-10', 'Alquiler', 500000),
        gasto('2026-07-10', 'Alquiler', 500000)
    ];

    const { fijos, mesesConDatos } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.equal(mesesConDatos.length, 2);
    assert.equal(fijos.length, 1);
    assert.equal(fijos[0].nombre, 'Alquiler');
});

test('describirSugerencia explica de donde sale el numero', () => {
    const transacciones = repetir(SEIS_MESES, 'Alquiler', 100000);
    const resultado = calcularGastosFijos(transacciones, { hoy: HOY });

    const frase = describirSugerencia(resultado);

    assert.match(frase, /1 gasto fijo/);
    assert.match(frase, /6 meses/);
});

test('los movimientos anteriores a la ventana quedan afuera', () => {
    const transacciones = [
        ...repetir(SEIS_MESES, 'Alquiler', 100000),
        ...repetir(['2025-01', '2025-02', '2025-03', '2025-04'], 'Viejo', 999999)
    ];

    const { fijos } = calcularGastosFijos(transacciones, { hoy: HOY });

    assert.ok(!fijos.some((f) => f.nombre === 'Viejo'));
});
