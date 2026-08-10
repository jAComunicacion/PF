async function handleCategoryChange() {
    const categorySelect = document.getElementById('transaction-category');
    const subGroup = document.getElementById('subcategory-group');
    const subSelect = document.getElementById('transaction-subcategory');

    if (!categorySelect || !subGroup || !subSelect) return;

    // El id sale de la opción seleccionada, no de una búsqueda por nombre:
    // los nombres se repiten entre gastos e ingresos.
    const selected = categorySelect.options[categorySelect.selectedIndex];
    const parentId = selected && selected.dataset.id ? Number(selected.dataset.id) : null;

    subSelect.innerHTML = '';

    if (!parentId) {
        subGroup.style.display = 'none';
        return;
    }

    const subcategories = await window.categoryService.getSubcategories(parentId);

    if (subcategories.length === 0) {
        subGroup.style.display = 'none';
        return;
    }

    subcategories.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.name;
        option.textContent = sub.name;
        option.dataset.id = sub.id;
        subSelect.appendChild(option);
    });
    subGroup.style.display = 'block';
}

window.handleCategoryChange = handleCategoryChange;
