const { sql } = require('../_lib/db.js');
const { isAuthenticated } = require('../_lib/auth.js');

module.exports = async function handler(req, res) {
    if (!isAuthenticated(req)) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }

    if (req.method === 'GET') {
        const rows = await sql`
            SELECT id, name, type, parent_id AS "parentId"
            FROM categories
            ORDER BY name
        `;
        res.status(200).json(rows);
        return;
    }

    if (req.method === 'POST') {
        const { name, type, parentId } = req.body || {};

        if (!name || typeof name !== 'string' || !name.trim()) {
            res.status(400).json({ error: 'name es obligatorio' });
            return;
        }
        if (type !== 'income' && type !== 'expense') {
            res.status(400).json({ error: 'type debe ser "income" o "expense"' });
            return;
        }

        const parsedParentId = parentId ? Number.parseInt(parentId, 10) : null;
        const trimmedName = name.trim();

        // ON CONFLICT DO NOTHING contra los indices unicos parciales de
        // db/001_init.sql - evita la condicion de carrera de "buscar si
        // existe -> insertar" que tenia categoryService.js en IndexedDB.
        const inserted = await sql`
            INSERT INTO categories (name, type, parent_id)
            VALUES (${trimmedName}, ${type}, ${parsedParentId})
            ON CONFLICT DO NOTHING
            RETURNING id, name, type, parent_id AS "parentId"
        `;

        if (inserted.length > 0) {
            res.status(201).json(inserted[0]);
            return;
        }

        // Ya existia - devolver la fila existente en vez de un error.
        const existing = await sql`
            SELECT id, name, type, parent_id AS "parentId"
            FROM categories
            WHERE name = ${trimmedName} AND type = ${type}
              AND parent_id IS NOT DISTINCT FROM ${parsedParentId}
        `;
        res.status(200).json(existing[0]);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
