// assets/js/data/seedCategories.js
//
// La lista de categorías por defecto se mudó al servidor
// (api/_lib/defaultCategories.js). Acá sólo queda el disparador: el servidor
// decide si hay que sembrar, así que llamarlo de más no duplica nada.

async function seedCategories() {
    try {
        const result = await window.api.seedCategories();
        if (result && result.seeded) {
            console.log(`Categorías sembradas: ${result.categories} principales, ${result.subcategories} subcategorías.`);
        }
    } catch (e) {
        // No es fatal: la app abre igual, sólo que el selector de categorías
        // va a estar vacío hasta que se resuelva la conexión.
        console.error('No se pudieron sembrar las categorías:', e.message);
    }
}

window.seedCategories = seedCategories;
