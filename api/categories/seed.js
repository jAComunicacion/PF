const { sql } = require('../_lib/db.js');
const { isAuthenticated } = require('../_lib/auth.js');
const { DEFAULT_CATEGORIES } = require('../_lib/defaultCategories.js');

// Siembra las categorias por defecto la primera vez. Antes esto lo hacia cada
// navegador contra su propio IndexedDB; ahora corre una sola vez contra
// Postgres y sirve a todos los dispositivos.
module.exports = async function handler(req, res) {
    if (!isAuthenticated(req)) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM categories`;
    if (count > 0) {
        res.status(200).json({ seeded: false, reason: 'ya hay categorias' });
        return;
    }

    // Se insertan por lote con UNNEST en vez de una query por categoria: el
    // driver HTTP de Neon abre una conexion por query, y 40 categorias serian
    // 40 viajes de ida y vuelta.
    const parentNames = [];
    const parentTypes = [];
    for (const type of Object.keys(DEFAULT_CATEGORIES)) {
        for (const cat of DEFAULT_CATEGORIES[type]) {
            parentNames.push(cat.name);
            parentTypes.push(type);
        }
    }

    const parents = await sql`
        INSERT INTO categories (name, type, parent_id)
        SELECT n, t, NULL
        FROM UNNEST(${parentNames}::text[], ${parentTypes}::text[]) AS x(n, t)
        RETURNING id, name, type
    `;

    const parentIdByKey = new Map();
    for (const row of parents) parentIdByKey.set(`${row.type}:${row.name}`, row.id);

    const subNames = [];
    const subTypes = [];
    const subParents = [];
    for (const type of Object.keys(DEFAULT_CATEGORIES)) {
        for (const cat of DEFAULT_CATEGORIES[type]) {
            const parentId = parentIdByKey.get(`${type}:${cat.name}`);
            if (!parentId) continue;
            for (const sub of cat.subs) {
                subNames.push(sub);
                subTypes.push(type);
                subParents.push(parentId);
            }
        }
    }

    if (subNames.length > 0) {
        await sql`
            INSERT INTO categories (name, type, parent_id)
            SELECT n, t, p
            FROM UNNEST(${subNames}::text[], ${subTypes}::text[], ${subParents}::int[]) AS x(n, t, p)
        `;
    }

    res.status(201).json({
        seeded: true,
        categories: parents.length,
        subcategories: subNames.length
    });
};
