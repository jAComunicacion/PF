const { parseEmail } = require('../email/mime.js');
const { aFechaArgentina } = require('../fechaArgentina.js');

// Parser de las notificaciones de Mercado Pago.
//
// Alcance real, confirmado con Julio el 11-ago-2026: Mercado Pago NO manda
// email por transferencia recibida - solo notifica los cobros con link o QR,
// que el no usa. Asi que esta fuente cubre GASTOS unicamente; los ingresos se
// cargan a mano o entran por el banco. No tiene sentido escribir a ciegas un
// caso "cobro" que nunca va a llegar.

const REMITENTES = /(^|[@.])mercadopago\.com>?\s*$|@mercadopago\.com/i;

// Cada patron sale de un email real. NO agregar de memoria: un patron
// inventado que no matchea es indistinguible de uno que matchea mal.
const PATRONES = [
    {
        // "Pago aprobado en X" - compra con dinero en cuenta o tarjeta.
        // Verificado contra la muestra del 30-jun-2026 (AUTOVIA DEL MERCOSUR).
        tipo: 'expense',
        verbo: 'Pagaste',
        concepto: /Le compraste a\s*([^<]+?)\s*</i
    }
];

// El monto sale del aria-label, no del texto visible.
//
// Mercado Pago muestra "$ 4.078,22" - formato argentino, punto de miles y
// coma decimal - pero deja el numero crudo en el atributo de accesibilidad:
// aria-label="Pagaste 4078.22 pesos". Ese viene en formato maquina y no
// depende de como se renderice el mail. Parsear el texto visible obligaria a
// adivinar si el punto separa miles o decimales.
function montoDesdeAriaLabel(html, verbo) {
    const match = new RegExp(`aria-label="${verbo}\\s+([0-9]+(?:\\.[0-9]+)?)\\s+pesos"`, 'i').exec(html);
    return match ? Number.parseFloat(match[1]) : null;
}

// El link "detalle de operacion" lleva el id de la operacion en la query.
// Es la clave de deduplicacion fuerte: si el mismo mail llega dos veces
// (reenvio duplicado, reintento del cron), este id lo delata con certeza, sin
// depender de la regla difusa de monto + fecha que el spec usa entre fuentes
// distintas.
function idDeOperacion(html) {
    const match = /activities\?q=([0-9]+)/i.exec(html);
    return match ? match[1] : null;
}

// Mercado Pago intercala comentarios HTML vacios en medio de las frases
// ("Le compraste a<!-- --> <!-- -->AUTOVIA DEL MERCOSUR"), presumiblemente
// por el framework con el que arman la plantilla. Sin sacarlos, el nombre del
// comercio nunca matchea.
function limpiarComentarios(html) {
    return html.replace(/<!--[\s\S]*?-->/g, '');
}

function esDeMercadoPago(headers) {
    return REMITENTES.test(headers.from || '');
}

// Devuelve el movimiento, o null si el mail no se pudo interpretar.
//
// null NO significa "descartar": el spec pide que todo mail no parseable
// quede visible en el panel de no procesados para cargarlo a mano y detectar
// el patron roto. Fallar en silencio seria perder plata sin enterarse.
function parseMercadoPago(raw) {
    const { headers, html } = parseEmail(raw);
    if (!esDeMercadoPago(headers)) return null;

    const limpio = limpiarComentarios(html);
    const fecha = aFechaArgentina(headers.date);
    if (!fecha) return null;

    for (const patron of PATRONES) {
        const amount = montoDesdeAriaLabel(limpio, patron.verbo);
        if (amount === null || !(amount > 0)) continue;

        const concepto = patron.concepto.exec(limpio);
        if (!concepto) continue;

        return {
            fuente: 'mercadopago',
            tipo: patron.tipo,
            name: concepto[1].trim(),
            amount,
            date: fecha,
            idExterno: idDeOperacion(limpio)
        };
    }

    return null;
}

module.exports = { parseMercadoPago, esDeMercadoPago };
