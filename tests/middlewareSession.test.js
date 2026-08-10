const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// El middleware corre en Edge Runtime y verifica la firma con Web Crypto,
// mientras que api/_lib/auth.js la emite con node:crypto. Son dos
// implementaciones distintas del mismo HMAC: si se desincronizan, el login
// emite una cookie que el middleware rechaza y la app queda inaccesible.
// Este test enfrenta a las dos sobre el mismo token.

process.env.SESSION_SECRET = 'secreto-de-prueba-para-los-tests';

const { issueSessionCookie, COOKIE_NAME } = require('../api/_lib/auth.js');

// middleware.js usa sintaxis ESM y el paquete es CommonJS, así que para
// importarlo se copia el archivo tal cual a un .mjs temporal. Se testea el
// código real, no una reescritura.
async function loadMiddleware() {
    const source = fs.readFileSync(path.join(__dirname, '..', 'middleware.js'), 'utf8');
    const tempFile = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), 'pc-mw-')),
        'middleware.mjs'
    );
    fs.writeFileSync(tempFile, source);
    const mod = await import(new URL(`file://${tempFile.replace(/\\/g, '/')}`).href);
    return mod.default;
}

function tokenFromCookie(cookieString) {
    return cookieString.split(';')[0].split('=').slice(1).join('=');
}

function requestWith(cookieHeader, url = 'https://finanzas.jacomunicacion.com.ar/') {
    const headers = new Headers();
    if (cookieHeader) headers.set('cookie', cookieHeader);
    return new Request(url, { headers });
}

test('deja pasar una cookie firmada por api/_lib/auth.js', async () => {
    const middleware = await loadMiddleware();
    const token = tokenFromCookie(issueSessionCookie());

    const result = await middleware(requestWith(`${COOKIE_NAME}=${token}`));

    assert.strictEqual(result, undefined, 'una sesión válida no debe redirigir');
});

test('redirige al login cuando no hay cookie', async () => {
    const middleware = await loadMiddleware();

    const result = await middleware(requestWith(null));

    assert.ok(result instanceof Response);
    assert.strictEqual(result.status, 302);
    assert.strictEqual(
        new URL(result.headers.get('location')).pathname,
        '/login.html'
    );
});

test('rechaza un token con la firma alterada', async () => {
    const middleware = await loadMiddleware();
    const token = tokenFromCookie(issueSessionCookie());
    const [body] = token.split('.');
    const forged = `${body}.${'A'.repeat(43)}`;

    const result = await middleware(requestWith(`${COOKIE_NAME}=${forged}`));

    assert.ok(result instanceof Response, 'una firma inválida debe redirigir');
    assert.strictEqual(result.status, 302);
});

test('rechaza un payload manipulado aunque conserve una firma vieja', async () => {
    const middleware = await loadMiddleware();
    const token = tokenFromCookie(issueSessionCookie());
    const [, signature] = token.split('.');

    // Alguien que intente estirarse la sesión reescribiendo el vencimiento.
    const forgedBody = Buffer
        .from(JSON.stringify({ exp: Date.now() + 999999999 }))
        .toString('base64url');

    const result = await middleware(requestWith(`${COOKIE_NAME}=${forgedBody}.${signature}`));

    assert.ok(result instanceof Response);
    assert.strictEqual(result.status, 302);
});

test('rechaza una sesión vencida aunque la firma sea auténtica', async () => {
    const middleware = await loadMiddleware();

    // Se firma a mano un payload ya vencido, con el mismo secreto real.
    const crypto = require('node:crypto');
    const body = Buffer
        .from(JSON.stringify({ exp: Date.now() - 1000 }))
        .toString('base64url');
    const signature = crypto
        .createHmac('sha256', process.env.SESSION_SECRET)
        .update(body)
        .digest('base64url');

    const result = await middleware(requestWith(`${COOKIE_NAME}=${body}.${signature}`));

    assert.ok(result instanceof Response, 'un token vencido debe redirigir');
    assert.strictEqual(result.status, 302);
});

test('conserva el destino original en ?next para volver después de entrar', async () => {
    const middleware = await loadMiddleware();

    const result = await middleware(
        requestWith(null, 'https://finanzas.jacomunicacion.com.ar/index.html?vista=charts')
    );

    const location = new URL(result.headers.get('location'));
    assert.strictEqual(location.searchParams.get('next'), '/index.html?vista=charts');
});
