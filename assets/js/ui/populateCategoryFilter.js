// Llena el filtro "Todas las categorías" de la lista de movimientos.
//
// Estas opciones estaban escritas a mano en index.html y quedaron desfasadas:
// ofrecían Ahorro, Inversión, Pago y Transferencia, que no existen como
// categorías en ningún lado, y no ofrecían la mitad de las que sí existen.
// Filtrar por Casa o Auto era imposible.
//
// renderTransactions compara el valor del filtro contra t.category, que es el
// NOMBRE de la categoría, así que eso es lo que va en value.
async function populateCategoryFilter() {
    const filterEl = document.getElementById('category-filter');
    if (!filterEl) return;

    let categories = [];
    try {
        categories = await window.categoryService.getParentCategories();
    } catch (e) {
        // Si falla, se deja la opción "Todas" y la lista sigue siendo usable.
        console.error('No se pudo armar el filtro de categorías:', e);
        return;
    }

    const previous = filterEl.value;
    filterEl.innerHTML = '';

    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'Todas las categorías';
    filterEl.appendChild(all);

    // Gastos primero, que son la enorme mayoría de los movimientos.
    const ordered = [
        ...categories.filter(c => c.type === 'expense'),
        ...categories.filter(c => c.type === 'income')
    ];

    for (const cat of ordered) {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        filterEl.appendChild(option);
    }

    // Si el usuario ya tenía algo elegido, se respeta.
    if (previous && Array.from(filterEl.options).some(o => o.value === previous)) {
        filterEl.value = previous;
    }
}

window.populateCategoryFilter = populateCategoryFilter;
