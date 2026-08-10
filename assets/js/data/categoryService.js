// assets/js/data/categoryService.js
//
// Las categorías ahora viven en Postgres. Se cachean en memoria porque el modal
// las consulta varias veces por apertura (lista principal + subcategorías) y no
// tiene sentido un viaje al servidor por cada select.
//
// La API expone las categorías con `id`; la UI las muestra por `name`. La
// traducción entre las dos vive acá y en ningún otro lado.

let cache = null;

async function loadCategories(force = false) {
    if (cache && !force) return cache;
    cache = await window.api.getCategories();
    return cache;
}

function invalidate() {
    cache = null;
}

async function getCategoriesByType(type) {
    const all = await loadCategories();
    return all.filter(c => c.type === type && !c.parentId);
}

async function getSubcategories(parentId) {
    if (!parentId) return [];
    const all = await loadCategories();
    const numericParentId = Number(parentId);
    return all.filter(c => Number(c.parentId) === numericParentId);
}

// `type` es opcional pero conviene pasarlo: hay nombres repetidos entre los dos
// árboles (por ejemplo "Servicios" es categoría de gasto y también subcategoría
// de "Clientes" en ingresos). Sin el tipo, la búsqueda por nombre es ambigua.
async function getCategoryByName(name, type = null) {
    const all = await loadCategories();
    return all.find(c => c.name === name && (type === null || c.type === type)) || null;
}

async function addCategory(name, type, parentId = null) {
    const created = await window.api.createCategory({ name, type, parentId });
    invalidate();
    return created ? created.id : null;
}

window.categoryService = {
    loadCategories,
    invalidate,
    getCategoriesByType,
    getSubcategories,
    getCategoryByName,
    addCategory
};
