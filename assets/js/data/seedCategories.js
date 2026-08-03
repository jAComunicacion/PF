// assets/js/data/seedCategories.js

const DEFAULT_CATEGORIES = {
    expense: [
        { name: 'Alimentación', subs: ['Supermercado', 'Restaurante', 'Delivery'] },
        { name: 'Transporte', subs: ['Taxi/Uber', 'Transporte Público', 'Combustible', 'Mantenimiento'] },
        { name: 'Entretenimiento', subs: ['Cine', 'Juegos', 'Salidas'] },
        { name: 'Servicios', subs: ['Luz', 'Agua', 'Internet', 'Celular'] },
        { name: 'Salud', subs: ['Farmacia', 'Consulta Médica'] },
        { name: 'Educación', subs: ['Cursos', 'Libros', 'Universidad'] },
        { name: 'Otros', subs: [] }
    ],
    income: [
        { name: 'Ingreso', subs: ['Sueldo', 'Freelance'] },
        { name: 'Clientes', subs: ['Venta Directa', 'Servicios', 'Abono Mensual'] },
        { name: 'Aportes', subs: ['Socio A', 'Socio B', 'Inversión Propia'] },
        { name: 'Otros ingresos', subs: ['Intereses', 'Venta de Activos', 'Reembolsos'] }
    ]
};

async function seedCategories() {
    if (!window.db) return;

    const count = await window.db.categories.count();
    if (count > 0) return; // Already seeded

    console.log("Seeding default categories...");

    for (const type in DEFAULT_CATEGORIES) {
        for (const cat of DEFAULT_CATEGORIES[type]) {
            // Add Parent
            const parentId = await window.db.categories.add({
                name: cat.name,
                type: type, // 'expense' or 'income'
                parentId: null
            });

            // Add Subcategories
            for (const sub of cat.subs) {
                await window.db.categories.add({
                    name: sub,
                    type: type,
                    parentId: parentId
                });
            }
        }
    }
    console.log("Categories seeded successfully.");
}

window.seedCategories = seedCategories;
