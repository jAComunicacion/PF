// Middleware de borde (Vercel Edge): candado de la aplicación.
//
// Sin esto, index.html es un archivo estático servido por la CDN y cualquiera
// que escriba finanzas.jacomunicacion.com.ar lo descarga. El middleware corre
// ANTES de entregar el archivo y redirige a /login.html si no hay sesión.
//
// Ojo: esto corre en Edge Runtime, no en Node. No hay `require('crypto')`,
// así que la verificación del HMAC se rehace con Web Crypto. La firma que
// valida acá es exactamente la misma que emite api/_lib/auth.js.

const COOKIE_NAME = 'pc_session';

function base64urlToBytes(value) {
    let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    while (normalized.length % 4 !== 0) normalized += '=';
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function verifySession(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return false;

    const [body, signature] = token.split('.');
    if (!body || !signature) return false;

    let key;
    try {
        key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
    } catch {
        return false;
    }

    let valid;
    try {
        valid = await crypto.subtle.verify(
            'HMAC',
            key,
            base64urlToBytes(signature),
            new TextEncoder().encode(body)
        );
    } catch {
        return false;
    }
    if (!valid) return false;

    // Firma válida no alcanza: el token también tiene que estar vigente.
    let payload;
    try {
        payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(body)));
    } catch {
        return false;
    }

    return Boolean(payload && payload.exp && Date.now() <= payload.exp);
}

function readCookie(cookieHeader, name) {
    if (!cookieHeader) return null;
    for (const part of cookieHeader.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) return decodeURIComponent(rest.join('='));
    }
    return null;
}

export default async function middleware(request) {
    const secret = process.env.SESSION_SECRET;

    // Si falta el secreto no podemos validar nada. Se falla cerrado: es
    // preferible una pantalla de login que no deja pasar, a una app abierta.
    const token = readCookie(request.headers.get('cookie'), COOKIE_NAME);
    const authenticated = secret ? await verifySession(token, secret) : false;

    if (authenticated) return;

    const url = new URL(request.url);
    const destination = new URL('/login.html', url.origin);

    // Se recuerda a dónde quería ir para devolverlo ahí después de entrar.
    const wanted = url.pathname + url.search;
    if (wanted && wanted !== '/' && !wanted.startsWith('/login.html')) {
        destination.searchParams.set('next', wanted);
    }

    return Response.redirect(destination, 302);
}

export const config = {
    // Todo queda protegido salvo: la propia pantalla de ingreso, los endpoints
    // que esa pantalla necesita para poder autenticar, y los estáticos que la
    // pantalla carga (CSS, el isotipo, la tipografía local).
    matcher: [
        '/((?!login\\.html|api/auth/login|api/auth/session|assets/|favicon\\.ico).*)'
    ]
};
