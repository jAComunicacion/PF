const test = require('node:test');
const assert = require('node:assert');

// El traductor corre una sola vez sobre datos financieros reales de Julio y su
// resultado se pega a mano en Neon. No hay forma de "probarlo en produccion":
// si se equivoca, el error queda escrito en la base. De ahi que se testee cada
// decision del mapeo por separado.

const {
    decodificar,
    parsearFecha,
    parsearQIF,
    traducir,
    verificarNombres,
    generarSQL
} = require('../scripts/qif-a-sql.js');

// Arma un bloque QIF con la forma exacta que escribe Money.
function bloque({ fecha, importe, descripcion, categoria, nota }) {
    const lineas = [`D${fecha}`];
    if (nota) lineas.push(`M${nota}`);
    lineas.push(`T${importe}`, `P${descripcion}`, `L${categoria}`, '^');
    return lineas.join('\n');
}

function traducirQIF(bloques, anio = 2026) {
    return traducir(parsearQIF('!Type:Bank\n' + bloques.join('\n')), anio);
}

test('lee el archivo de Money aunque no venga en UTF-8', () => {
    // Money exporta en Windows-1252. Cuando esto se leia como UTF-8,
    // "Diseño&Marketing" llegaba roto, no coincidia con el mapa y los 34
    // ingresos del anio terminaban todos en "Otros ingresos".
    const win1252 = Buffer.from([0x44, 0x69, 0x73, 0x65, 0xF1, 0x6F]); // Diseño
    assert.strictEqual(decodificar(win1252), 'Diseño');

    // Un export en UTF-8 tiene que seguir funcionando.
    assert.strictEqual(decodificar(Buffer.from('Diseño', 'utf8')), 'Diseño');
});

test('un QIF en Windows-1252 mapea los ingresos al cliente correcto', () => {
    const bytes = Buffer.concat([
        Buffer.from("!Type:Bank\nD10/3'2026\nT8,164,000.00\nPMiriam Analia Schild\nLDise", 'latin1'),
        Buffer.from([0xF1]),
        Buffer.from('o&Marketing:Miriam Schild\n^\n', 'latin1')
    ]);
    const { filas, sinMapear } = traducir(parsearQIF(decodificar(bytes)), 2026);

    assert.strictEqual(sinMapear.size, 0);
    assert.strictEqual(filas[0].categoria, 'Estudio');
    assert.strictEqual(filas[0].subcategoria, 'Miriam Schild');
});

test('lee el formato de fecha de Money', () => {
    assert.strictEqual(parsearFecha("1/9'2021").toISOString().slice(0, 10), '2021-09-01');
    assert.strictEqual(parsearFecha("13/ 7'2026").toISOString().slice(0, 10), '2026-07-13');
    // Money abrevia el anio en exports viejos.
    assert.strictEqual(parsearFecha("2/8'26").toISOString().slice(0, 10), '2026-08-02');
    assert.strictEqual(parsearFecha('cualquier cosa'), null);
});

test('un gasto sale como expense con importe positivo', () => {
    const { filas } = traducirQIF([bloque({
        fecha: "4/1'2026", importe: '-2,585.416', descripcion: 'Despensa Emanuel',
        categoria: 'Groceries:Supermercado'
    })]);

    assert.strictEqual(filas.length, 1);
    assert.deepStrictEqual(filas[0], {
        tipo: 'expense',
        nombre: 'Despensa Emanuel',
        // El signo lo lleva el tipo: validateTransaction rechaza amount <= 0.
        importe: 2585.416,
        categoria: 'Alimentación',
        subcategoria: 'Supermercado',
        fecha: '2026-01-04'
    });
});

test('un ingreso sale como income', () => {
    const { filas } = traducirQIF([bloque({
        fecha: "10/3'2026", importe: '8,164,000.00', descripcion: 'Miriam Analia Schild',
        categoria: 'Diseño&Marketing:Miriam Schild'
    })]);

    assert.strictEqual(filas[0].tipo, 'income');
    assert.strictEqual(filas[0].categoria, 'Estudio');
    assert.strictEqual(filas[0].subcategoria, 'Miriam Schild');
});

test('el negocio textil queda afuera entero', () => {
    const { filas, descartados } = traducirQIF([
        bloque({ fecha: "5/2'2026", importe: '-76,000', descripcion: 'RockTex', categoria: 'Proveedores:Telas' }),
        bloque({ fecha: "5/2'2026", importe: '400,000', descripcion: 'Susana', categoria: 'Clientas:Susana Testino' }),
        bloque({ fecha: "5/2'2026", importe: '-30,000', descripcion: 'Sonia', categoria: 'Tejedoras:Sonia' }),
        bloque({ fecha: "5/2'2026", importe: '-9,000', descripcion: 'Bolsas', categoria: 'Packaging' })
    ]);

    assert.strictEqual(filas.length, 0);
    assert.strictEqual(descartados.textil, 4);
});

test('solo entra el anio pedido', () => {
    const { filas, descartados } = traducirQIF([
        bloque({ fecha: "1/9'2021", importe: '-470', descripcion: 'Su Pan', categoria: 'Groceries:Panaderia' }),
        bloque({ fecha: "1/9'2025", importe: '-470', descripcion: 'Su Pan', categoria: 'Groceries:Panaderia' }),
        bloque({ fecha: "1/9'2026", importe: '-470', descripcion: 'Su Pan', categoria: 'Groceries:Panaderia' })
    ]);

    assert.strictEqual(filas.length, 1);
    assert.strictEqual(filas[0].fecha, '2026-09-01');
    assert.strictEqual(descartados.otroAnio, 2);
});

test('los movimientos entre cuentas propias no son gastos', () => {
    const { filas, descartados } = traducirQIF([bloque({
        fecha: "1/1'2026", importe: '0.00', descripcion: 'Opening Balance', categoria: '[Contado]'
    })]);

    assert.strictEqual(filas.length, 0);
    // Importe cero: se descarta antes de mirar la categoria.
    assert.strictEqual(descartados.sinDatos, 1);
});

test('una subcategoria poco usada cae al padre y no se pierde', () => {
    // "Reposteria" aparecio una sola vez en 2026, asi que no existe en la app.
    const { filas } = traducirQIF([bloque({
        fecha: "8/5'2026", importe: '-8,800', descripcion: 'Tortas Ana', categoria: 'Groceries:Reposteria'
    })]);

    assert.strictEqual(filas.length, 1);
    assert.strictEqual(filas[0].categoria, 'Alimentación');
    assert.strictEqual(filas[0].subcategoria, null);
});

test('los cuatro reordenamientos respecto de Money', () => {
    const { filas } = traducirQIF([
        // 1. Los articulos de limpieza estaban dentro de la comida.
        bloque({ fecha: "2/1'2026", importe: '-94,864', descripcion: 'Limpieza', categoria: 'Groceries:Art. Limpieza' }),
        // 2. El auto estaba partido: nafta por un lado, taller por otro.
        bloque({ fecha: "3/3'2026", importe: '-600,000', descripcion: 'Chapista FIND', categoria: 'Automobile:Chapa y Pintura' }),
        bloque({ fecha: "4/3'2026", importe: '-823,535', descripcion: 'Estacion de Servicio', categoria: 'NAFTA:2008' }),
        // 3. "Bills" mezclaba consumo del hogar con impuestos.
        bloque({ fecha: "5/3'2026", importe: '-110,150', descripcion: 'Gas NEA', categoria: 'Bills:Gas' }),
        bloque({ fecha: "6/3'2026", importe: '-271,656', descripcion: 'AFIP', categoria: 'Bills:AFIP' }),
        // 4. La jubilacion figuraba como si fuera un cliente del estudio.
        bloque({ fecha: "7/3'2026", importe: '2,872,000', descripcion: 'ANSES', categoria: 'Diseño&Marketing:Jubilación' })
    ]);

    assert.deepStrictEqual(
        filas.map(f => [f.categoria, f.subcategoria]),
        [
            ['Casa', 'Limpieza'],
            ['Auto', 'Taller'],
            ['Auto', 'Nafta 2008'],
            ['Servicios', 'Gas'],
            ['Impuestos', 'AFIP'],
            ['Jubilación', null]
        ]
    );
});

test('la jubilacion mal tipeada en Money va al mismo lado', () => {
    // En Money quedaron las dos formas: con ":" y con ";".
    const { filas } = traducirQIF([
        bloque({ fecha: "1/4'2026", importe: '1,500,000', descripcion: 'ANSES', categoria: 'Diseño&Marketing; Jubilacion' })
    ]);

    assert.strictEqual(filas[0].categoria, 'Jubilación');
});

test('la tarjeta se separa por comercio, que es donde Money guarda cual es', () => {
    const { filas } = traducirQIF([
        bloque({ fecha: "4/1'2026", importe: '-316,842', descripcion: 'VISA', categoria: 'Credit Card Payments-Transfers' }),
        bloque({ fecha: "7/2'2026", importe: '-22,479', descripcion: 'MERCADO LIBRE TARJETA CREDITO', categoria: 'Credit Card Payments-Transfers' }),
        bloque({ fecha: "8/2'2026", importe: '-10,000', descripcion: 'Otra', categoria: 'Credit Card Payments-Transfers' })
    ]);

    assert.deepStrictEqual(
        filas.map(f => f.subcategoria),
        ['VISA', 'Mercado Libre', null]
    );
});

test('la nota de Money se conserva pegada al nombre', () => {
    const { filas } = traducirQIF([bloque({
        fecha: "1/9'2026", importe: '-2,700', descripcion: 'Gustavo',
        categoria: 'Miscellaneous', nota: '3 fletes'
    })]);

    assert.strictEqual(filas[0].nombre, 'Gustavo (3 fletes)');
});

test('una categoria desconocida se avisa en vez de perderse', () => {
    const { filas, sinMapear } = traducirQIF([bloque({
        fecha: "1/9'2026", importe: '-1,000', descripcion: 'Algo', categoria: 'Categoria Inventada'
    })]);

    assert.strictEqual(filas[0].categoria, 'Varios');
    assert.strictEqual(sinMapear.get('Categoria Inventada'), 1);
});

test('verificarNombres frena un mapa que apunta a una categoria inexistente', () => {
    assert.throws(
        () => verificarNombres([{ tipo: 'expense', categoria: 'No Existe', subcategoria: null }]),
        /No Existe/
    );
    // Y deja pasar una combinacion real de defaultCategories.js.
    assert.doesNotThrow(
        () => verificarNombres([{ tipo: 'expense', categoria: 'Auto', subcategoria: 'Nafta 307' }])
    );
});

test('el SQL escapa las comillas de los nombres', () => {
    const sql = generarSQL([{
        tipo: 'expense', nombre: "Rotiseria D'Angelo", importe: 1500,
        categoria: 'Salidas', subcategoria: 'Restaurante', fecha: '2026-05-02'
    }], 2026);

    assert.match(sql, /'Rotiseria D''Angelo'/);
    assert.match(sql, /DATE '2026-05-02'/);
    assert.match(sql, /1500\.00/);
});

test('sin subcategoria el SQL manda NULL, no la palabra', () => {
    const sql = generarSQL([{
        tipo: 'expense', nombre: 'Kiosko', importe: 500,
        categoria: 'Varios', subcategoria: null, fecha: '2026-05-02'
    }], 2026);

    assert.match(sql, /'Varios', NULL, DATE/);
});
