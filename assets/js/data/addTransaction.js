// Lee el id de la categoría desde la opción seleccionada, no desde su nombre.
// Los nombres se repiten entre los dos árboles ("Servicios" es categoría de
// gasto y subcategoría de "Clientes" en ingresos), así que buscar por nombre
// puede resolver a la categoría equivocada.
function selectedOptionId(selectEl) {
    if (!selectEl || selectEl.selectedIndex < 0) return null;
    const option = selectEl.options[selectEl.selectedIndex];
    const id = option ? option.dataset.id : null;
    return id ? Number(id) : null;
}

async function addTransaction(event) {
    event.preventDefault();

    const form = document.getElementById('transaction-form');
    const submitBtn = document.getElementById('transaction-submit-btn');
    const editingId = form && form.dataset.editingId ? parseInt(form.dataset.editingId, 10) : null;

    const type = document.getElementById('transaction-type').value;
    const name = document.getElementById('transaction-name').value;
    const amount = document.getElementById('transaction-amount').value;
    const categorySelect = document.getElementById('transaction-category');
    const subcategorySelect = document.getElementById('transaction-subcategory');
    const subcategoryVisible = document.getElementById('subcategory-group').style.display !== 'none';
    const date = document.getElementById('transaction-date').value;

    const parsedAmount = parseFloat(amount);
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
        showToast('Por favor, complete todos los campos.', 'error');
        return;
    }

    const categoryId = selectedOptionId(categorySelect);
    if (!categoryId) {
        showToast('Elegí una categoría.', 'error');
        return;
    }

    const payload = {
        type,
        name: normalizedName,
        amount: parsedAmount,
        date,
        categoryId,
        subcategoryId: subcategoryVisible ? selectedOptionId(subcategorySelect) : null
    };

    // Se bloquea el botón: sin esto, un doble toque en el celular manda dos
    // altas y quedan duplicadas en el servidor.
    if (submitBtn) submitBtn.disabled = true;

    try {
        if (editingId) {
            const updated = await window.updateTransaction(editingId, payload);
            if (updated) closeTransactionModal();
        } else {
            await window.api.createTransaction(payload);
            closeTransactionModal();
            await window.refreshData();
            showToast('Transacción agregada correctamente', 'success');
        }
    } catch (e) {
        console.error('Error al guardar la transacción:', e);
        showToast(e.message || 'Error al guardar la transacción.', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

window.addTransaction = addTransaction;
