// Traduce un export QIF de Microsoft Money al SQL de importacion de Personal Count.
//
// Uso:
//   node scripts/qif-a-sql.js <archivo.qif> <salida.sql> [anio]
//
// El SQL que sale tiene los movimientos financieros reales: NO se commitea.
// Este script si, porque lo unico que contiene es la tabla de equivalencias.
//
// Money guarda 273 combinaciones de categoria acumuladas en cinco anios.
// Personal Count tiene 17 (api/_lib/defaultCategories.js). La traduccion entre
// ambas vive aca abajo, explicita, para que se pueda auditar linea por linea.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_CATEGORIES } = require('../api/_lib/defaultCategories.js');

// El negocio textil de la familia. Julio pidio dejarlo afuera: esta app es
// para el estudio de diseno y la casa. Se descarta el movimiento entero, no se
// reasigna a "Varios", porque no es plata de este circuito.
const TEXTIL = new Set([
    'Clientas', 'Clienta', 'Proveedores', 'Tejedoras', 'Packaging',
    'COTERIE NY', 'COTERIE', 'Puntos de Venta', 'Campañas'
]);

// Equivalencias. La clave es la categoria de Money tal cual aparece en el QIF
// ("Padre" o "Padre:Sub"); el valor es [categoria, subcategoria] de la app.
//
// Se busca primero la clave completa y despues solo el padre, asi que solo hay
// que listar las subcategorias que van a algun lado distinto que su padre.
//
// Hay dos mapas porque una misma categoria de Money aparece de los dos lados:
// "Prestamo" es gasto cuando se paga la cuota e ingreso cuando entra la plata.
const MAP_GASTOS = {
    // Comida. Las de 1-3 usos en 2026 caen al padre: el movimiento no se
    // pierde, pierde el detalle fino.
    'Groceries': ['Alimentación', null],
    'Groceries:Supermercado': ['Alimentación', 'Supermercado'],
    'Groceries:Verduras': ['Alimentación', 'Verduras'],
    'Groceries:Carnes': ['Alimentación', 'Carnes'],
    'Groceries:Fiambres': ['Alimentación', 'Fiambres'],
    'Groceries:Panaderia': ['Alimentación', 'Panadería'],
    'Groceries:Desayuno': ['Alimentación', null],
    'Groceries:Kiosko': ['Alimentación', null],
    'Groceries:Dietetica': ['Alimentación', null],
    'Groceries:Reposteria': ['Alimentación', null],
    // Estas dos no eran comida aunque Money las tuviera adentro de Groceries.
    'Groceries:Art. Limpieza': ['Casa', 'Limpieza'],
    'Groceries:Perfumeria': ['Casa', null],
    'Groceries:Leña': ['Casa', null],

    'Dining Out': ['Salidas', 'Restaurante'],
    'Dining Out:HELADO': ['Salidas', 'Helado'],
    'Entertainment': ['Salidas', 'Entretenimiento'],
    'Hobbies-Leisure': ['Salidas', 'Entretenimiento'],

    // El auto estaba partido en tres lugares distintos. En la vida real es un
    // solo gasto, asi que se unifica.
    'NAFTA': ['Auto', null],
    'NAFTA:2008': ['Auto', 'Nafta 2008'],
    'NAFTA:307': ['Auto', 'Nafta 307'],
    'NAFTA:Twister': ['Auto', null],
    'Automobile': ['Auto', 'Taller'],
    'Automobile:Chapa y Pintura': ['Auto', 'Taller'],
    'Automobile:mecanico': ['Auto', 'Taller'],
    'Peajes': ['Auto', null],

    'Household': ['Casa', null],
    'Household:Julia': ['Casa', 'Julia'],
    'Household:Limpieza': ['Casa', 'Limpieza'],
    'Household:ART': ['Casa', null],
    'Home Improvement': ['Casa', null],
    'Home Improvement:Instalaciones': ['Casa', 'Instalaciones'],
    'Home Improvement:Obra fondo': ['Casa', 'Obra fondo'],

    'Healthcare': ['Salud', null],
    'Healthcare:Farmacia': ['Salud', 'Farmacia'],
    'Healthcare:Psicologa': ['Salud', 'Psicóloga'],
    'Healthcare:Dentista': ['Salud', 'Dentista'],
    // Cuatro consultas sueltas de 1-3 usos que juntas si son una categoria.
    'Healthcare:Kinesiologia': ['Salud', 'Consultas'],
    'Healthcare:Médico': ['Salud', 'Consultas'],
    'Healthcare:Laboratorio': ['Salud', 'Consultas'],
    'Healthcare:Masaje': ['Salud', 'Consultas'],

    'Gastos Personales': ['Gastos personales', null],
    'Gastos Personales:Isa': ['Gastos personales', 'Isa'],
    'Gastos Personales:Ale': ['Gastos personales', 'Ale'],
    'Gastos Personales:Isabela': ['Gastos personales', 'Isabela'],
    'Personal Care': ['Gastos personales', null],
    'Mama': ['Gastos personales', null],

    // "Bills" mezclaba consumo del hogar con obligacion fiscal. Se separan
    // porque no se leen igual: la luz varia todos los meses, AFIP no.
    'Bills': ['Servicios', null],
    'Bills:Gas': ['Servicios', 'Gas'],
    'Bills:Electricidad': ['Servicios', 'Electricidad'],
    'Phone-Wireless': ['Servicios', 'Celular'],
    'Phone-Wireless:Celular': ['Servicios', 'Celular'],
    'Bills:AFIP': ['Impuestos', 'AFIP'],
    'Bills:Inmobiliario': ['Impuestos', null],
    'Bills:Terreno': ['Impuestos', null],
    'Bills:Patente 2008': ['Impuestos', null],
    'Bills:Patente 307': ['Impuestos', null],
    'Bills:Twister': ['Impuestos', null],
    'Taxes': ['Impuestos', null],

    // La subcategoria de la tarjeta sale del comercio, no de Money: ver
    // subcategoriaDeTarjeta().
    'Credit Card Payments-Transfers': ['Tarjeta de crédito', null],

    'Loan': ['Préstamo', null],
    'Loan:Hipotecario': ['Préstamo', null],
    'Prestamo': ['Préstamo', null],

    'Education': ['Educación', null],
    'Clothing': ['Ropa', null],
    'Pet Care': ['Mascotas', null],

    // Cajon de sastre. Van explicitas igual, para distinguir "esto va a Varios
    // porque asi se decidio" de "esto cayo en Varios porque nadie lo mapeo".
    'Miscellaneous': ['Varios', null],
    'Transporte': ['Varios', null],
    'Travel-Vacation': ['Varios', null],
    'Hoteleria': ['Varios', null],
    'Children-Toys': ['Varios', null],
    'Fees': ['Varios', null],
    'Bills:Cuotas': ['Varios', null]
};

const MAP_INGRESOS = {
    'Diseño&Marketing': ['Estudio', null],
    'Diseño&Marketing:Miriam Schild': ['Estudio', 'Miriam Schild'],
    'Diseño&Marketing:Karina Petelin': ['Estudio', 'Karina Petelin'],
    'Diseño&Marketing:Ruta J': ['Estudio', 'Ruta J'],
    'Diseño&Marketing:PECARI': ['Estudio', 'PECARI'],
    'Diseño&Marketing:Danza Flex': ['Estudio', 'Danza Flex'],
    // La jubilacion estaba colgada del estudio como si fuera un cliente mas.
    // No lo es, y mientras estuvo ahi inflaba lo facturado. La segunda clave es
    // el mismo movimiento mal tipeado en Money (";" en vez de ":").
    'Diseño&Marketing:Jubilación': ['Jubilación', null],
    'Diseño&Marketing; Jubilacion': ['Jubilación', null],

    'Wages & Salary': ['Otros ingresos', null],
    'Prestamo': ['Otros ingresos', null],
    'Loan': ['Otros ingresos', null],
    'CAMBIO': ['Otros ingresos', null],
    'Mama': ['Otros ingresos', null]
};

// Lo que no figura en ningun mapa cae aca. Preferible a perderlo en silencio.
const DEFECTO = { expense: ['Varios', null], income: ['Otros ingresos', null] };

// Money registra el pago de la tarjeta sin decir de que tarjeta se trata: eso
// esta en el comercio. Son dos y bien distintas, asi que vale la subcategoria.
function subcategoriaDeTarjeta(descripcion) {
    const d = (descripcion || '').toUpperCase();
    if (d.includes('VISA')) return 'VISA';
    if (d.includes('MERCADO LIBRE')) return 'Mercado Libre';
    return null;
}

// --- Lectura del QIF ---------------------------------------------------------

// Money exporta en la codificacion vieja de Windows, no en UTF-8. Leerlo como
// UTF-8 rompe cada palabra con acento: "Diseño&Marketing" llega como
// "Dise?o&Marketing", no coincide con ninguna clave del mapa y TODOS los
// ingresos terminan en el cajon por defecto. Se detecta en vez de asumir,
// porque otro export podria venir en UTF-8.
function decodificar(buffer) {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
        return new TextDecoder('windows-1252').decode(buffer);
    }
}

// Money escribe las fechas como  D 1/ 9'2021  o  D12/11'21 .
function parsearFecha(valor) {
    const m = /(\d{1,2})\s*\/\s*(\d{1,2})\s*'\s*(\d{2,4})/.exec(valor);
    if (!m) return null;
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    let anio = Number(m[3]);
    if (anio < 100) anio += anio < 70 ? 2000 : 1900;
    // Mediodia UTC: evita que el movimiento se corra un dia al pasar por la
    // zona horaria de Argentina (UTC-3).
    const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12));
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function parsearQIF(texto) {
    const movimientos = [];
    let actual = {};

    for (const linea of texto.split(/\r?\n/)) {
        if (linea.startsWith('!')) continue;
        if (linea.trim() === '^') {
            if (Object.keys(actual).length > 0) movimientos.push(actual);
            actual = {};
            continue;
        }
        if (linea.length === 0) continue;

        const codigo = linea[0];
        const valor = linea.slice(1).trim();
        if (codigo === 'D') actual.fecha = parsearFecha(valor);
        else if (codigo === 'T' || codigo === 'U') actual.importe = Number(valor.replace(/,/g, ''));
        else if (codigo === 'P') actual.descripcion = valor;
        else if (codigo === 'L') actual.categoria = valor;
        else if (codigo === 'M') actual.nota = valor;
    }
    if (Object.keys(actual).length > 0) movimientos.push(actual);

    return movimientos;
}

// --- Traduccion --------------------------------------------------------------

function traducir(movimientos, anio) {
    const filas = [];
    const descartados = { textil: 0, otroAnio: 0, sinDatos: 0, transferencia: 0 };
    const sinMapear = new Map();

    for (const mov of movimientos) {
        if (!mov.categoria || !mov.fecha || !Number.isFinite(mov.importe) || mov.importe === 0) {
            descartados.sinDatos++;
            continue;
        }
        // "L[Cuenta]" es un movimiento entre cuentas propias, no un gasto.
        if (mov.categoria.startsWith('[')) {
            descartados.transferencia++;
            continue;
        }

        const padre = mov.categoria.split(':')[0];
        if (TEXTIL.has(padre)) {
            descartados.textil++;
            continue;
        }
        if (mov.fecha.getUTCFullYear() !== anio) {
            descartados.otroAnio++;
            continue;
        }

        const tipo = mov.importe < 0 ? 'expense' : 'income';
        const mapa = tipo === 'expense' ? MAP_GASTOS : MAP_INGRESOS;

        let destino = mapa[mov.categoria] || mapa[padre];
        if (!destino) {
            destino = DEFECTO[tipo];
            sinMapear.set(mov.categoria, (sinMapear.get(mov.categoria) || 0) + 1);
        }

        let [categoria, subcategoria] = destino;
        if (categoria === 'Tarjeta de crédito') {
            subcategoria = subcategoriaDeTarjeta(mov.descripcion);
        }

        // La nota de Money suele tener el detalle que falta en el comercio
        // ("3 fletes"). Se pega al nombre en vez de tirarla.
        let nombre = mov.descripcion || categoria;
        if (mov.nota) nombre = `${nombre} (${mov.nota})`;

        filas.push({
            tipo,
            nombre,
            // La app guarda importes positivos: el signo lo lleva el tipo.
            // validateTransaction rechaza cualquier amount <= 0.
            importe: Math.abs(mov.importe),
            categoria,
            subcategoria,
            fecha: mov.fecha.toISOString().slice(0, 10)
        });
    }

    return { filas, descartados, sinMapear };
}

// El INSERT resuelve las categorias por nombre. Si un nombre del mapa no existe
// en la lista oficial, el JOIN se come la fila sin avisar y el import queda
// corto. Mejor reventar aca.
function verificarNombres(filas) {
    const validas = new Set();
    for (const tipo of Object.keys(DEFAULT_CATEGORIES)) {
        for (const cat of DEFAULT_CATEGORIES[tipo]) {
            validas.add(`${tipo}|${cat.name}|`);
            for (const sub of cat.subs) validas.add(`${tipo}|${cat.name}|${sub}`);
        }
    }

    const rotas = new Set();
    for (const f of filas) {
        const clave = `${f.tipo}|${f.categoria}|${f.subcategoria || ''}`;
        if (!validas.has(clave)) rotas.add(clave);
    }
    if (rotas.size > 0) {
        throw new Error(
            'Estas categorias del mapa no existen en defaultCategories.js:\n  ' +
            [...rotas].join('\n  ')
        );
    }
}

// --- Salida ------------------------------------------------------------------

function comilla(texto) {
    return `'${String(texto).replace(/'/g, "''")}'`;
}

function generarSQL(filas, anio) {
    const valores = filas.map(f => (
        `    (${comilla(f.tipo)}, ${comilla(f.nombre)}, ${f.importe.toFixed(2)}, ` +
        `${comilla(f.categoria)}, ${f.subcategoria ? comilla(f.subcategoria) : 'NULL'}, ` +
        `DATE '${f.fecha}')`
    )).join(',\n');

    const total = filas.reduce((suma, f) => suma + (f.tipo === 'expense' ? -f.importe : f.importe), 0);

    return `-- Personal Count - importacion del historial ${anio} desde Microsoft Money
-- Generado por scripts/qif-a-sql.js. NO COMMITEAR: son datos financieros reales.
--
-- Correr DESPUES de que la app haya sembrado las categorias nuevas, porque el
-- INSERT las busca por nombre. Si el resultado dice menos de ${filas.length} filas,
-- falta sembrar.
--
-- Movimientos: ${filas.length}   Balance del periodo: ${total.toFixed(2)}

WITH nuevos (tipo, descripcion, importe, cat, subcat, fecha) AS (
  VALUES
${valores}
)
INSERT INTO transactions (type, name, amount, category_id, subcategory_id, date)
SELECT n.tipo, n.descripcion, n.importe, c.id, s.id, n.fecha
FROM nuevos n
JOIN categories c
  ON c.name = n.cat AND c.type = n.tipo AND c.parent_id IS NULL
LEFT JOIN categories s
  ON s.name = n.subcat AND s.parent_id = c.id;
`;
}

// --- Main --------------------------------------------------------------------

function main() {
    const [entrada, salida, anioTexto] = process.argv.slice(2);
    if (!entrada || !salida) {
        console.error('Uso: node scripts/qif-a-sql.js <archivo.qif> <salida.sql> [anio]');
        process.exit(1);
    }
    const anio = anioTexto ? Number(anioTexto) : new Date().getFullYear();

    const movimientos = parsearQIF(decodificar(fs.readFileSync(entrada)));
    const { filas, descartados, sinMapear } = traducir(movimientos, anio);
    verificarNombres(filas);

    fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
    fs.writeFileSync(salida, generarSQL(filas, anio), 'utf8');

    const gastos = filas.filter(f => f.tipo === 'expense');
    const ingresos = filas.filter(f => f.tipo === 'income');
    const sumar = arr => arr.reduce((s, f) => s + f.importe, 0);

    console.log(`Leidos del QIF:       ${movimientos.length}`);
    console.log(`  descartados textil: ${descartados.textil}`);
    console.log(`  otro anio:          ${descartados.otroAnio}`);
    console.log(`  transferencias:     ${descartados.transferencia}`);
    console.log(`  sin datos:          ${descartados.sinDatos}`);
    console.log(`Importados (${anio}):    ${filas.length}`);
    console.log(`  gastos:   ${gastos.length} por ${sumar(gastos).toFixed(2)}`);
    console.log(`  ingresos: ${ingresos.length} por ${sumar(ingresos).toFixed(2)}`);
    if (sinMapear.size > 0) {
        // Revisar SIEMPRE esta lista antes de pegar el SQL en Neon. Una
        // categoria muy usada aca adentro no es un caso raro: es un sintoma
        // (asi se descubrio que el archivo no venia en UTF-8).
        console.log('\nOJO - categorias sin equivalencia, fueron al cajon por defecto:');
        for (const [cat, n] of sinMapear) console.log(`  ${n}x ${cat}`);
    } else {
        console.log('Todas las categorias tuvieron equivalencia.');
    }
    console.log(`\nSQL escrito en ${salida}`);
}

if (require.main === module) main();

module.exports = { decodificar, parsearQIF, parsearFecha, traducir, verificarNombres, generarSQL };
