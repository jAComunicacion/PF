const test = require('node:test');
const assert = require('node:assert');

const {
    limitesDelRango,
    aplicarFiltros,
    describirRango,
    coincideTexto,
    normalizar
} = require('../assets/js/data/transactionFilters.js');

// Un dia fijo para que los tests no dependan de cuando se corran.
const HOY = new Date(2026, 7, 10); // 10 de agosto de 2026

const movimientos = [
    { name: 'Despensa Emanuel', category: 'Alimentación', subcategory: null, date: '2026-08-02', amount: 16650, type: 'expense' },
    { name: 'Estacion de Servicio', category: 'Auto', subcategory: 'Nafta 307', date: '2026-08-01', amount: 25000, type: 'expense' },
    { name: 'Para Ir Picando', category: 'Alimentación', subcategory: 'Fiambres', date: '2026-07-31', amount: 16912, type: 'expense' },
    { name: 'Silvia', category: 'Salud', subcategory: 'Psicóloga', date: '2026-06-03', amount: 35000, type: 'expense' },
    { name: 'Karina Coiffeur', category: 'Estudio', subcategory: 'Karina Petelin', date: '2026-03-09', amount: 900000, type: 'income' },
    { name: 'Video Digital', category: 'Salidas', subcategory: 'Entretenimiento', date: '2025-12-20', amount: 29900, type: 'expense' }
];

const filtro = (extra = {}) => ({ texto: '', rango: '30d', desde: '', hasta: '', ...extra });

test('los ultimos 30 dias incluyen hoy', () => {
    const { desde, hasta } = limitesDelRango(filtro(), HOY);
    assert.strictEqual(hasta, '2026-08-10');
    // 29 dias para atras + hoy = 30 dias de ventana.
    assert.strictEqual(desde, '2026-07-12');
});

test('cada rango recorta donde corresponde', () => {
    assert.deepStrictEqual(limitesDelRango(filtro({ rango: 'mes' }), HOY),
        { desde: '2026-08-01', hasta: '2026-08-10' });
    assert.deepStrictEqual(limitesDelRango(filtro({ rango: 'ano' }), HOY),
        { desde: '2026-01-01', hasta: '2026-08-10' });
    assert.deepStrictEqual(limitesDelRango(filtro({ rango: '3m' }), HOY),
        { desde: '2026-05-10', hasta: '2026-08-10' });
    assert.deepStrictEqual(limitesDelRango(filtro({ rango: 'todo' }), HOY),
        { desde: '', hasta: '' });
});

test('"3 meses" en enero retrocede al ano anterior', () => {
    const enero = new Date(2026, 0, 15);
    assert.deepStrictEqual(limitesDelRango(filtro({ rango: '3m' }), enero),
        { desde: '2025-10-15', hasta: '2026-01-15' });
});

test('la vista inicial de 30 dias deja afuera lo viejo', () => {
    const r = aplicarFiltros(movimientos, filtro(), 'all', HOY);
    assert.deepStrictEqual(r.map(t => t.date), ['2026-08-02', '2026-08-01', '2026-07-31']);
});

test('"todo" no recorta nada', () => {
    assert.strictEqual(aplicarFiltros(movimientos, filtro({ rango: 'todo' }), 'all', HOY).length, 6);
});

test('los extremos del rango entran (no se pierde el ultimo dia)', () => {
    const r = aplicarFiltros(movimientos, filtro({
        rango: 'entre', desde: '2026-06-03', hasta: '2026-07-31'
    }), 'all', HOY);
    // Los dos limites son movimientos reales y los dos tienen que aparecer.
    assert.deepStrictEqual(r.map(t => t.date), ['2026-07-31', '2026-06-03']);
});

test('desde y hasta al reves se dan vuelta en vez de no mostrar nada', () => {
    const alReves = aplicarFiltros(movimientos, filtro({
        rango: 'entre', desde: '2026-07-31', hasta: '2026-06-03'
    }), 'all', HOY);
    assert.strictEqual(alReves.length, 2);
});

test('"entre fechas" con un solo extremo funciona igual', () => {
    const soloDesde = aplicarFiltros(movimientos, filtro({ rango: 'entre', desde: '2026-08-01' }), 'all', HOY);
    assert.strictEqual(soloDesde.length, 2);

    const soloHasta = aplicarFiltros(movimientos, filtro({ rango: 'entre', hasta: '2025-12-31' }), 'all', HOY);
    assert.strictEqual(soloHasta.length, 1);
});

test('la busqueda ignora acentos y mayusculas', () => {
    assert.strictEqual(normalizar('Psicóloga'), 'psicologa');
    const r = aplicarFiltros(movimientos, filtro({ texto: 'psicologa', rango: 'todo' }), 'all', HOY);
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].name, 'Silvia');
});

test('la busqueda mira nombre, categoria y subcategoria', () => {
    // "nafta" solo existe en la subcategoria.
    assert.ok(coincideTexto(movimientos[1], 'nafta'));
    // "auto" solo en la categoria.
    assert.ok(coincideTexto(movimientos[1], 'auto'));
    // "estacion" en el nombre.
    assert.ok(coincideTexto(movimientos[1], 'estacion'));
    assert.ok(!coincideTexto(movimientos[1], 'farmacia'));
});

test('varias palabras se exigen todas, en cualquier orden', () => {
    assert.ok(coincideTexto(movimientos[1], 'nafta estacion'));
    assert.ok(coincideTexto(movimientos[1], 'estacion nafta'));
    assert.ok(!coincideTexto(movimientos[1], 'estacion farmacia'));
});

test('la busqueda se combina con el rango y con la categoria', () => {
    // "despensa" existe, pero fuera del rango pedido.
    const fuera = aplicarFiltros(movimientos, filtro({
        texto: 'despensa', rango: 'entre', desde: '2026-01-01', hasta: '2026-06-30'
    }), 'all', HOY);
    assert.strictEqual(fuera.length, 0);

    // Misma busqueda, rango que si la contiene.
    const dentro = aplicarFiltros(movimientos, filtro({ texto: 'despensa', rango: 'todo' }), 'all', HOY);
    assert.strictEqual(dentro.length, 1);

    // Y el filtro de categoria sigue mandando.
    const otraCat = aplicarFiltros(movimientos, filtro({ texto: 'despensa', rango: 'todo' }), 'Auto', HOY);
    assert.strictEqual(otraCat.length, 0);
});

test('el encabezado describe el periodo en criollo', () => {
    assert.strictEqual(describirRango(filtro(), HOY), '12/07/26 al 10/08/26');
    assert.strictEqual(describirRango(filtro({ rango: 'todo' }), HOY), 'Todo el historial');
    assert.strictEqual(
        describirRango(filtro({ rango: 'entre', desde: '2026-03-01', hasta: '2026-04-15' }), HOY),
        '01/03/26 al 15/04/26'
    );
    assert.strictEqual(
        describirRango(filtro({ rango: 'entre', desde: '2026-03-01' }), HOY),
        'desde el 01/03/26'
    );
});

test('una lista vacia o nula no rompe', () => {
    assert.deepStrictEqual(aplicarFiltros(null, filtro(), 'all', HOY), []);
    assert.deepStrictEqual(aplicarFiltros([], filtro(), 'all', HOY), []);
});
