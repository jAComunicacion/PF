const crypto = require('crypto');

const COOKIE_NAME = 'pc_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function getSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error('SESSION_SECRET no esta configurada (ver README/env de Vercel)');
    }
    return secret;
}

function sign(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
    return `${body}.${signature}`;
}

function verify(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
    }

    let payload;
    try {
        payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
        return null;
    }

    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
}

function parseCookies(cookieHeader) {
    const out = {};
    if (!cookieHeader) return out;
    for (const part of cookieHeader.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key) out[key] = decodeURIComponent(rest.join('='));
    }
    return out;
}

function checkPassword(candidate) {
    const expected = process.env.APP_PASSWORD;
    if (!expected) {
        throw new Error('APP_PASSWORD no esta configurada (ver README/env de Vercel)');
    }
    const candidateBuf = Buffer.from(String(candidate || ''));
    const expectedBuf = Buffer.from(expected);
    if (candidateBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

function issueSessionCookie() {
    const token = sign({ exp: Date.now() + SESSION_TTL_MS });
    const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
    return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

// Middleware: devuelve true si el request trae una sesion valida.
// No lanza ni escribe la respuesta - el caller decide como responder al 401.
function isAuthenticated(req) {
    const cookies = parseCookies(req.headers.cookie);
    return verify(cookies[COOKIE_NAME]) !== null;
}

module.exports = { checkPassword, issueSessionCookie, isAuthenticated, COOKIE_NAME };
