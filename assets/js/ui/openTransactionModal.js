async function openTransactionModal(type, defaultName = '', transactionToEdit = null) {
    const modal = document.getElementById('transaction-modal');
    if (!modal) return;

    const form = document.getElementById('transaction-form');
    const submitBtn = document.getElementById('transaction-submit-btn');
    const transactionTypeInput = document.getElementById('transaction-type');
    const titleEl = document.getElementById('modal-title');
    const nameInput = document.getElementById('transaction-name');
    const amountInput = document.getElementById('transaction-amount');
    const categorySelect = document.getElementById('transaction-category');
    const subcategorySelect = document.getElementById('transaction-subcategory');
    const dateInput = document.getElementById('transaction-date');
    const subcategoryGroup = document.getElementById('subcategory-group');

    form.dataset.editingId = transactionToEdit ? transactionToEdit.id : '';
    transactionTypeInput.value = type;
    titleEl.textContent = transactionToEdit ? 'Editar Transacción' : (type === 'income' ? 'Nuevo Ingreso' : 'Nuevo Gasto');
    submitBtn.textContent = transactionToEdit ? 'Guardar Cambios' : 'Agregar Transacción';

    if (nameInput) nameInput.value = transactionToEdit ? transactionToEdit.name || '' : defaultName;
    if (amountInput) amountInput.value = transactionToEdit ? transactionToEdit.amount || '' : '';
    if (dateInput) dateInput.value = transactionToEdit ? transactionToEdit.date || '' : '';
    if (subcategoryGroup) subcategoryGroup.style.display = 'none';
    if (subcategorySelect) subcategorySelect.innerHTML = '';

    // Load Categories Dynamically
    if (!categorySelect) return;

    categorySelect.innerHTML = '';
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Cargando...';
    categorySelect.appendChild(loadingOption);

    // Fetch from DB
    const categories = await window.categoryService.getCategoriesByType(type);

    // Populate Select
    categorySelect.innerHTML = '';

    if (categories.length === 0) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Sin categorías';
        categorySelect.appendChild(emptyOption);
    } else {
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name; // We store name for now to keep compatibility
            option.textContent = cat.name;
            option.dataset.id = cat.id;
            categorySelect.appendChild(option);
        });
    }

    // Handle initial selection
    if (categories.length > 0) {
        const defaultCategory = transactionToEdit ? transactionToEdit.category : (type === 'income' ? 'Otros ingresos' : 'Alimentación');
        const exists = categories.find(c => c.name === defaultCategory);
        categorySelect.value = exists ? defaultCategory : categories[0].name;

        if (transactionToEdit && transactionToEdit.subcategory) {
            if (subcategoryGroup) subcategoryGroup.style.display = 'block';
        }

        // Trigger subcategory load
        handleCategoryChange(categorySelect.value);
    }

    modal.classList.add('active');
}

window.openTransactionModal = openTransactionModal;
