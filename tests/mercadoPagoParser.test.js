const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { parseMercadoPago } = require('../api/_lib/parsers/mercadoPago.js');
const { decodeQuotedPrintable, parseEmail } = require('../api/_lib/email/mime.js');
const { aFechaArgentina } = require('../api/_lib/fechaArgentina.js');

// Email real de Mercado Pago con los datos cambiados (comercio, monto, id de
// operacion, destinatario). El HTML es el original byte por byte, que es lo
// que importa: si Mercado Pago cambia la plantilla, este test tiene que
// romperse.
const emailPagoAprobado = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'mp-pago-aprobado.eml'),
    'utf8'
);

test('parseMercadoPago extrae un pago aprobado de un email real', () => {
    const movimiento = parseMercadoPago(emailPagoAprobado);

    assert.ok(movimiento, 'el email de muestra tiene que parsearse');
    assert.equal(movimiento.fuente, 'mercadopago');
    assert.equal(movimiento.tipo, 'expense');
    assert.equal(movimiento.name, 'COMERCIO DE PRUEBA');
    assert.equal(movimiento.amount, 1234.56);
    assert.equal(movimiento.idExterno, '999999999999');
});

// El caso que motiva toda la conversion de zona horaria: la cabecera Date dice
// "Wed, 1 Jul 2026 02:14:54 +0000", pero en Argentina ese pago es del 30 de
// junio a las 23:14. Sin convertir, el movimiento se contabiliza en julio.
test('parseMercadoPago fecha el movimiento en el dia argentino, no en el UTC', () => {
    const movimiento = parseMercadoPago(emailPagoAprobado);

    assert.equal(movimiento.date, '2026-06-30');
    assert.notEqual(movimiento.date, '2026-07-01');
});

test('parseMercadoPago devuelve null si el remitente no es Mercado Pago', () => {
    const ajeno = emailPagoAprobado.replace(
        'From: Mercado Pago <info@mercadopago.com>',
        'From: Alguien <no-soy@otrodominio.com>'
    );

    assert.equal(parseMercadoPago(ajeno), null);
});

// Un null no se descarta: alimenta el panel de no procesados. Lo que este test
// protege es que un cambio de plantilla devuelva null en vez de un movimiento
// a medio armar (monto en 0, nombre vacio) que se guardaria como bueno.
test('parseMercadoPago devuelve null si la plantilla cambia y ya no hay monto', () => {
    const sinMonto = emailPagoAprobado.replace(/aria-label=3D"Pagaste[^"]*"/, 'aria-label=3D"Pagaste"');

    assert.equal(parseMercadoPago(sinMonto), null);
});

test('decodeQuotedPrintable reconstruye los acentos, que ocupan dos bytes', () => {
    assert.equal(decodeQuotedPrintable('Comunicaci=C3=B3n'), 'Comunicación');
    assert.equal(decodeQuotedPrintable('Dise=C3=B1o'), 'Diseño');
});

test('decodeQuotedPrintable une las lineas partidas con = al final', () => {
    assert.equal(decodeQuotedPrintable('Pago apro=\r\nbado'), 'Pago aprobado');
});

// El cuerpo del mail tiene lineas que empiezan con "--" porque un nombre de
// imagen quedo cortado al medio ("--b635c570.png"). Un separador de partes
// buscado con startsWith las confunde con el delimitador y corta el HTML antes
// del monto.
test('parseEmail no confunde una linea que arranca con -- con el delimitador', () => {
    const { html } = parseEmail(emailPagoAprobado);

    assert.match(html, /aria-label="Pagaste 1234\.56 pesos"/);
    assert.ok(html.length > 10000, 'el HTML no tiene que venir truncado');
});

test('aFechaArgentina corre al dia anterior lo que en UTC ya es el dia siguiente', () => {
    assert.equal(aFechaArgentina('Wed, 1 Jul 2026 02:14:54 +0000'), '2026-06-30');
    assert.equal(aFechaArgentina('Wed, 1 Jul 2026 03:00:00 +0000'), '2026-07-01');
});

test('aFechaArgentina devuelve null ante una fecha ilegible', () => {
    assert.equal(aFechaArgentina('no es una fecha'), null);
    assert.equal(aFechaArgentina(undefined), null);
});
