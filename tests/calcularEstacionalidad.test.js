const test = require('node:test');
const assert = require('node:assert/strict');
const {
    calcularEstacionalidad,
    describirProximo,
    MES_PAREJO
} = require('../assets/js/data/calcularEstacionalidad.js');

const HOY = new Date(2026, 7, 11); // 11 de agosto de 2026

// Un anio completo: mismo monto todos los meses salvo los que se indiquen.
function anioCompleto(anio, base = 100, especiales = {}) {
    const movimientos = [];
    for (let mes = 1; mes <= 12; mes++) {
        const mm = String(mes).padStart(2, '0');
        movimientos.push({
            type: 'expense',
            date: `${anio}-${mm}-10`,
            amount: especiales[mes] || base,
            category: 'Varios',
            subcategory: null,
            name: 'x'
        });
    }
    return movimientos;
}

function mesDe(resultado, numero) {
    return resultado.meses.find((m) => m.mes === numero);
}

test('un anio parejo reparte 8,33% por mes y ningun mes es pesado', () => {
    const r = calcularEstacionalidad([...anioCompleto(2024), ...anioCompleto(2025)], { hoy: HOY });

    assert.equal(Math.round(mesDe(r, 3).participacion * 100) / 100, 8.33);
    assert.equal(mesDe(r, 3).pesado, false);
    assert.equal(Math.round(MES_PAREJO * 100) / 100, 8.33);
});

test('marca como pesado el mes que se lleva mas que un mes parejo', () => {
    // Marzo al triple los dos anios: el mes escolar.
    const especiales = { 3: 300 };
    const r = calcularEstacionalidad(
        [...anioCompleto(2024, 100, especiales), ...anioCompleto(2025, 100, especiales)],
        { hoy: HOY }
    );

    const marzo = mesDe(r, 3);
    const abril = mesDe(r, 4);

    assert.ok(marzo.participacion > MES_PAREJO);
    assert.equal(marzo.pesado, true);
    assert.equal(abril.pesado, false);
});

// El filtro que evita el defecto mas grave: en agosto, 2026 tiene 8 meses
// cargados, asi que cada uno se lleva ~12,5% de "su anio" y TODOS parecerian
// meses pesados.
test('el anio en curso, incompleto, no entra en el calculo', () => {
    const parciales2026 = [];
    for (let mes = 1; mes <= 8; mes++) {
        parciales2026.push({
            type: 'expense', date: `2026-${String(mes).padStart(2, '0')}-10`,
            amount: 100, category: 'Varios', subcategory: null, name: 'x'
        });
    }

    const r = calcularEstacionalidad(
        [...anioCompleto(2024), ...anioCompleto(2025), ...parciales2026],
        { hoy: HOY }
    );

    assert.deepEqual(r.aniosUsados, ['2024', '2025']);
    assert.equal(Math.round(mesDe(r, 1).participacion * 100) / 100, 8.33,
        'si 2026 entrara, enero daria ~12,5%');
});

test('un anio importado a medias tampoco entra', () => {
    const medioAnio = [];
    for (let mes = 7; mes <= 12; mes++) {
        medioAnio.push({
            type: 'expense', date: `2021-${String(mes).padStart(2, '0')}-10`,
            amount: 100, category: 'Varios', subcategory: null, name: 'x'
        });
    }

    const r = calcularEstacionalidad(
        [...medioAnio, ...anioCompleto(2024), ...anioCompleto(2025)],
        { hoy: HOY }
    );

    assert.ok(!r.aniosUsados.includes('2021'));
});

test('con un solo anio no alcanza para hablar de estacionalidad', () => {
    const r = calcularEstacionalidad(anioCompleto(2025), { hoy: HOY });

    assert.equal(r.aniosUsados.length, 1);
    assert.equal(r.suficiente, false);
    assert.equal(mesDe(r, 3).confiable, false, 'una muestra es una anecdota, no un patron');
});

test('con dos anios completos ya hay patron', () => {
    const r = calcularEstacionalidad([...anioCompleto(2024), ...anioCompleto(2025)], { hoy: HOY });

    assert.equal(r.suficiente, true);
    assert.equal(mesDe(r, 3).muestras, 2);
    assert.equal(mesDe(r, 3).confiable, true);
});

// Mediana y no promedio: un anio con un gasto extraordinario en un mes no
// deberia definir el patron de ese mes para siempre.
test('un anio atipico no arrastra la participacion del mes', () => {
    const r = calcularEstacionalidad([
        ...anioCompleto(2023),
        ...anioCompleto(2024),
        ...anioCompleto(2025, 100, { 5: 5000 })
    ], { hoy: HOY });

    assert.equal(Math.round(mesDe(r, 5).participacion * 100) / 100, 8.33);
});

test('el proximo mes es el siguiente al actual, no el actual', () => {
    const r = calcularEstacionalidad([...anioCompleto(2024), ...anioCompleto(2025)], { hoy: HOY });

    assert.equal(r.proximo.mes, 9, 'en agosto hay que anticipar septiembre');
});

test('en diciembre el proximo mes es enero', () => {
    const r = calcularEstacionalidad(
        [...anioCompleto(2024), ...anioCompleto(2025)],
        { hoy: new Date(2026, 11, 15) }
    );

    assert.equal(r.proximo.mes, 1);
});

test('describirProximo avisa cuando el mes que viene pega fuerte', () => {
    const especiales = { 9: 300 };
    const r = calcularEstacionalidad(
        [...anioCompleto(2024, 100, especiales), ...anioCompleto(2025, 100, especiales)],
        { hoy: HOY }
    );

    const frase = describirProximo(r);

    assert.match(frase, /Septiembre/);
    assert.match(frase, /pesado/);
});

test('describirProximo no opina cuando no hay datos suficientes', () => {
    assert.equal(describirProximo(calcularEstacionalidad([], { hoy: HOY })), '');
    assert.equal(describirProximo(calcularEstacionalidad(anioCompleto(2025), { hoy: HOY })), '');
});

test('los ingresos no cuentan: esto mide gasto', () => {
    const conIngresos = [
        ...anioCompleto(2024),
        ...anioCompleto(2025),
        { type: 'income', date: '2025-03-10', amount: 999999, category: 'Estudio', subcategory: null, name: 'x' }
    ];

    const r = calcularEstacionalidad(conIngresos, { hoy: HOY });

    assert.equal(Math.round(mesDe(r, 3).participacion * 100) / 100, 8.33);
});

test('sin movimientos no rompe', () => {
    const r = calcularEstacionalidad([], { hoy: HOY });

    assert.equal(r.aniosUsados.length, 0);
    assert.equal(r.suficiente, false);
    assert.equal(r.meses.length, 12);
});
