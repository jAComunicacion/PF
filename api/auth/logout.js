const { COOKIE_NAME } = require('../_lib/auth.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Max-Age=0 vence la cookie en el navegador. Los atributos tienen que
    // coincidir con los de emisión o el navegador no la reemplaza.
    res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    );
    res.status(200).json({ ok: true });
};
