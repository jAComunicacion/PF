const { isAuthenticated } = require('../_lib/auth.js');

// Consulta liviana de estado de sesión. La usa login.html para no mostrar el
// formulario a alguien que ya tiene sesión abierta, y la app para detectar
// que la sesión venció mientras la pestaña estaba abierta.
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    let authenticated = false;
    try {
        authenticated = isAuthenticated(req);
    } catch {
        // isAuthenticated lanza si falta SESSION_SECRET. Para esta consulta
        // eso equivale a "no hay sesión": no se filtra el detalle del entorno.
        authenticated = false;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ authenticated });
};
