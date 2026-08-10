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

    // Las categorías vienen del servidor (cacheadas en categoryService)
    let categories = [];
    try {
        categories = await window.categoryService.getCategoriesByType(type);
    } catch (e) {
        console.error('No se pudieron cargar las categorías:', e);
        showToast(e.message || 'No se pudieron cargar las categorías.', 'error');
    }

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
            option.value = cat.name; // El nombre es lo que se muestra
            option.textContent = cat.name;
            option.dataset.id = cat.id; // El id es lo que se guarda
            categorySelect.appendChild(option);
        });
    }

    // Selección inicial
    if (categories.length > 0) {
        // Al editar se preselecciona por id, no por nombre: es lo único que
        // identifica sin ambigüedad a la categoría.
        let index = -1;
        if (transactionToEdit && transactionToEdit.categoryId) {
            index = categories.findIndex(c => Number(c.id) === Number(transactionToEdit.categoryId));
        } else {
            const fallback = type === 'income' ? 'Otros ingresos' : 'Alimentación';
            index = categories.findIndex(c => c.name === fallback);
        }
        categorySelect.selectedIndex = index >= 0 ? index : 0;

        await handleCategoryChange();

        // Ya cargadas las subcategorías, se marca la que tenía la transacción.
        if (transactionToEdit && transactionToEdit.subcategoryId && subcategorySelect) {
            const subOption = Array.from(subcategorySelect.options)
                .find(o => Number(o.dataset.id) === Number(transactionToEdit.subcategoryId));
            if (subOption) subcategorySelect.value = subOption.value;
        }
    }

    modal.classList.add('active');
}

window.openTransactionModal = openTransactionModal;
