const { checkPassword, issueSessionCookie } = require('../_lib/auth.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { password } = req.body || {};

    let valid;
    try {
        valid = checkPassword(password);
    } catch (e) {
        res.status(500).json({ error: e.message });
        return;
    }

    if (!valid) {
        res.status(401).json({ error: 'Contrasena incorrecta' });
        return;
    }

    res.setHeader('Set-Cookie', issueSessionCookie());
    res.status(200).json({ ok: true });
};
