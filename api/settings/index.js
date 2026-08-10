const { sql } = require('../_lib/db.js');
const { isAuthenticated } = require('../_lib/auth.js');

// Ajustes de la app como clave/valor. Hoy guarda un solo dato -el presupuesto
// mensual- pero es el lugar donde van a caer los proximos.
module.exports = async function handler(req, res) {
    if (!isAuthenticated(req)) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }

    if (req.method === 'GET') {
        const rows = await sql`SELECT key, value FROM settings`;

        // Se devuelve un objeto plano ({ monthlyBudget: "450000" }) y no un
        // array: el cliente busca ajustes por nombre, nunca los recorre.
        const settings = {};
        for (const row of rows) settings[row.key] = row.value;

        res.status(200).json(settings);
        return;
    }

    if (req.method === 'PUT') {
        const { key, value } = req.body || {};

        if (!key || typeof key !== 'string' || !key.trim()) {
            res.status(400).json({ error: 'key es obligatorio' });
            return;
        }
        if (value === null || value === undefined) {
            res.status(400).json({ error: 'value es obligatorio' });
            return;
        }

        const rows = await sql`
            INSERT INTO settings (key, value)
            VALUES (${key.trim()}, ${String(value)})
            ON CONFLICT (key) DO UPDATE
                SET value = EXCLUDED.value, updated_at = now()
            RETURNING key, value
        `;

        res.status(200).json(rows[0]);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
