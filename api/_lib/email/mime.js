// Lectura minima de un email crudo (RFC 822 + MIME), sin dependencias.
//
// No es un parser MIME completo ni pretende serlo: cubre lo que mandan
// Mercado Pago y los bancos, que es siempre la misma forma - un multipart
// simple con una parte text/html en quoted-printable. Se prefirio esto a
// sumar mailparser porque son ~80 lineas y la dependencia habria entrado al
// bundle de todas las Vercel Functions.

// Deshace quoted-printable. Dos pasos, y el orden importa: primero se sacan
// los saltos de linea "blandos" (un '=' al final de linea, que el emisor mete
// para no pasar los 76 caracteres y no significa nada), y recien despues se
// traducen los =XX.
//
// La traduccion pasa por bytes y no por String.fromCharCode porque el cuerpo
// viene en UTF-8: un acento son DOS bytes (=C3=B3 es "o" con tilde) y
// convertir cada uno por separado a caracter los rompe.
function decodeQuotedPrintable(text) {
    const sinSaltosBlandos = text.replace(/=\r?\n/g, '');
    const bytes = [];

    for (let i = 0; i < sinSaltosBlandos.length; i++) {
        const char = sinSaltosBlandos[i];
        const hex = sinSaltosBlandos.slice(i + 1, i + 3);

        if (char === '=' && /^[0-9A-Fa-f]{2}$/.test(hex)) {
            bytes.push(Number.parseInt(hex, 16));
            i += 2;
        } else {
            bytes.push(...Buffer.from(char, 'utf8'));
        }
    }

    return Buffer.from(bytes).toString('utf8');
}

// Separa cabeceras de cuerpo. El corte es la primera linea vacia.
function separarCabecerasYCuerpo(raw) {
    const corte = raw.search(/\r?\n\r?\n/);
    if (corte === -1) return { crudo: raw, cuerpo: '' };

    const finDelCorte = raw.indexOf('\n', raw.indexOf('\n', corte) ) + 1;
    return { crudo: raw.slice(0, corte), cuerpo: raw.slice(finDelCorte) };
}

// Las cabeceras largas vienen "plegadas": siguen en la linea de abajo, que
// arranca con espacio o tab. Sin desplegarlas, un Subject largo se lee cortado.
function parseCabeceras(crudo) {
    const desplegado = crudo.replace(/\r?\n[ \t]+/g, ' ');
    const headers = {};

    for (const linea of desplegado.split(/\r?\n/)) {
        const separador = linea.indexOf(':');
        if (separador === -1) continue;

        const nombre = linea.slice(0, separador).trim().toLowerCase();
        const valor = linea.slice(separador + 1).trim();

        // Received: aparece muchas veces; solo interesa la primera aparicion
        // de cada cabecera, que es la del emisor original.
        if (!(nombre in headers)) headers[nombre] = valor;
    }

    return headers;
}

function valorDeParametro(contentType, parametro) {
    const match = new RegExp(`${parametro}="?([^";]+)"?`, 'i').exec(contentType || '');
    return match ? match[1] : null;
}

// Devuelve la parte text/html ya decodificada. Si el mail no es multipart,
// el cuerpo entero es la parte.
function extraerHtml(headers, cuerpo) {
    const contentType = headers['content-type'] || '';
    const boundary = valorDeParametro(contentType, 'boundary');

    if (!boundary) {
        return /quoted-printable/i.test(headers['content-transfer-encoding'] || '')
            ? decodeQuotedPrintable(cuerpo)
            : cuerpo;
    }

    // El delimitador se compara contra la linea COMPLETA, no con startsWith:
    // el cuerpo de Mercado Pago tiene lineas partidas que empiezan con "--"
    // (ej. "--b635c570.png" de un nombre de imagen cortado al medio) y con
    // startsWith se tomarian por delimitador, truncando el HTML.
    const lineas = cuerpo.split(/\r?\n/);
    const partes = [];
    let actual = null;

    for (const linea of lineas) {
        if (linea.trimEnd() === `--${boundary}`) {
            actual = [];
            partes.push(actual);
        } else if (linea.trimEnd() === `--${boundary}--`) {
            actual = null;
        } else if (actual) {
            actual.push(linea);
        }
    }

    for (const parte of partes) {
        const { crudo, cuerpo: cuerpoParte } = separarCabecerasYCuerpo(parte.join('\n'));
        const cabecerasParte = parseCabeceras(crudo);

        if (/text\/html/i.test(cabecerasParte['content-type'] || '')) {
            return /quoted-printable/i.test(cabecerasParte['content-transfer-encoding'] || '')
                ? decodeQuotedPrintable(cuerpoParte)
                : cuerpoParte;
        }
    }

    return '';
}

function parseEmail(raw) {
    const { crudo, cuerpo } = separarCabecerasYCuerpo(String(raw));
    const headers = parseCabeceras(crudo);

    return { headers, html: extraerHtml(headers, cuerpo) };
}

module.exports = { parseEmail, decodeQuotedPrintable, parseCabeceras };
