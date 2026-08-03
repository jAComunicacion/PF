// assets/js/data/categoryService.js

// Fetch categories by type (income/expense)
async function getCategoriesByType(type) {
    if (!window.db) return [];
    // Get top-level categories of the specific type (parentId is null/undefined)
    return await window.db.categories
        .where('type').equals(type)
        .filter(c => !c.parentId)
        .toArray();
}

// Fetch subcategories for a given parent category ID
async function getSubcategories(parentId) {
    if (!window.db) return [];
    return await window.db.categories
        .where('parentId').equals(parentId)
        .toArray();
}

// Fetch a single category by name (helper)
async function getCategoryByName(name) {
    if (!window.db) return null;
    return await window.db.categories.get({ name: name });
}

// Add a new category or subcategory
async function addCategory(name, type, parentId = null) {
    if (!window.db) return;

    // Check for duplicate
    const existing = await window.db.categories
        .where({ name: name, type: type })
        .filter(c => c.parentId === parentId)
        .first();

    if (existing) return existing.id;

    return await window.db.categories.add({
        name,
        type,
        parentId
    });
}

window.categoryService = {
    getCategoriesByType,
    getSubcategories,
    getCategoryByName,
    addCategory
};
