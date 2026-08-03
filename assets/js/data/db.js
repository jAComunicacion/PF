/* assets/js/data/db.js */
const db = new Dexie("PersonalFinanceDB");

db.version(2).stores({
    transactions: '++id, type, category, subCategory, amount, date, userId, createdAt',
    settings: 'key',
    categories: '++id, name, type, parentId' // parentId is for subcategories
});

window.db = db; // Make it globally available like the previous Firebase instance
