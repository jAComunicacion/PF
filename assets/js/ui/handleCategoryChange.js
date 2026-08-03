async function handleCategoryChange(categoryName) {
    const subGroup = document.getElementById('subcategory-group');
    const subSelect = document.getElementById('transaction-subcategory');

    if (!subGroup || !subSelect) return;

    // Find parent category to get its ID
    const parentCategory = await window.categoryService.getCategoryByName(categoryName);

    if (!parentCategory) {
        subGroup.style.display = 'none';
        subSelect.innerHTML = '';
        return;
    }

    // Fetch subs
    const subcategories = await window.categoryService.getSubcategories(parentCategory.id);

    subSelect.innerHTML = '';

    if (subcategories && subcategories.length > 0) {
        subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.name;
            option.textContent = sub.name;
            subSelect.appendChild(option);
        });
        subGroup.style.display = 'block';
    } else {
        subGroup.style.display = 'none';
    }
}

window.handleCategoryChange = handleCategoryChange;
