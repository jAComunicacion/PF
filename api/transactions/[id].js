const { sql } = require('../_lib/db.js');
const { isAuthenticated } = require('../_lib/auth.js');
const { validateTransaction } = require('../_lib/validateTransaction.js');

// Editar y borrar una transaccion. La Fase 0 solo tenia GET y POST en
// api/transactions/index.js, pero la app ya ofrecia los botones de editar y
// borrar: sin este archivo, esos dos botones quedaban muertos al pasar la
// fuente de verdad a Postgres.
module.exports = async function handler(req, res) {
    if (!isAuthenticated(req)) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }

    const id = Number.parseInt(req.query.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'id invalido' });
        return;
    }

    if (req.method === 'PUT') {
        let payload;
        try {
            // Misma validacion que el alta: no hay una puerta trasera con
            // reglas mas flojas para editar.
            payload = validateTransaction(req.body || {});
        } catch (e) {
            res.status(400).json({ error: e.message, details: e.validationErrors });
            return;
        }

        const rows = await sql`
            UPDATE transactions SET
                type = ${payload.type},
                name = ${payload.name},
                amount = ${payload.amount},
                category_id = ${payload.categoryId},
                subcategory_id = ${payload.subcategoryId},
                date = ${payload.date}
            WHERE id = ${id}
            RETURNING id, type, name, amount, date, created_at AS "createdAt"
        `;

        if (rows.length === 0) {
            res.status(404).json({ error: 'La transaccion no existe' });
            return;
        }

        res.status(200).json(rows[0]);
        return;
    }

    if (req.method === 'DELETE') {
        const rows = await sql`
            DELETE FROM transactions WHERE id = ${id} RETURNING id
        `;

        if (rows.length === 0) {
            res.status(404).json({ error: 'La transaccion no existe' });
            return;
        }

        res.status(200).json({ ok: true, id });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
