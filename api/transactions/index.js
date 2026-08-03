const { sql } = require('../_lib/db.js');
const { isAuthenticated } = require('../_lib/auth.js');
const { validateTransaction } = require('../_lib/validateTransaction.js');

module.exports = async function handler(req, res) {
    if (!isAuthenticated(req)) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }

    if (req.method === 'GET') {
        const rows = await sql`
            SELECT
                t.id, t.type, t.name, t.amount, t.date, t.created_at AS "createdAt",
                c.id AS "categoryId", c.name AS "categoryName",
                sc.id AS "subcategoryId", sc.name AS "subcategoryName"
            FROM transactions t
            JOIN categories c ON c.id = t.category_id
            LEFT JOIN categories sc ON sc.id = t.subcategory_id
            ORDER BY t.date DESC, t.created_at DESC
        `;
        res.status(200).json(rows);
        return;
    }

    if (req.method === 'POST') {
        let payload;
        try {
            payload = validateTransaction(req.body || {});
        } catch (e) {
            res.status(400).json({ error: e.message, details: e.validationErrors });
            return;
        }

        const rows = await sql`
            INSERT INTO transactions (type, name, amount, category_id, subcategory_id, date)
            VALUES (
                ${payload.type}, ${payload.name}, ${payload.amount},
                ${payload.categoryId}, ${payload.subcategoryId}, ${payload.date}
            )
            RETURNING id, type, name, amount, date, created_at AS "createdAt"
        `;
        res.status(201).json(rows[0]);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
