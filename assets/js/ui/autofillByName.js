// Autocompletar por nombre repetido, al estilo Microsoft Money: al escribir
// una descripción ya usada antes, se completan categoría, subcategoría y
// monto con los del último movimiento que tenía ese mismo nombre.
//
// Se dispara al salir del campo (blur), no en cada tecla: buscar en cada
// tecla completaría de golpe mientras todavía se está escribiendo "Superm..."
// y sería más molesto que útil.
async function autofillByName() {
    const form = document.getElementById('transaction-form');
    // Sólo para altas nuevas: al editar, los campos ya vienen de la
    // transacción real y no hay que pisarlos con un "último uso" ajeno.
    if (form && form.dataset.editingId) return;

    const nameInput = document.getElementById('transaction-name');
    const type = document.getElementById('transaction-type');
    const categorySelect = document.getElementById('transaction-category');
    const subcategorySelect = document.getElementById('transaction-subcategory');
    const amountInput = document.getElementById('transaction-amount');
    if (!nameInput || !type || !categorySelect) return;

    const match = window.findLastTransactionByName(nameInput.value, type.value);
    if (!match) return;

    if (match.categoryId) {
        const categoryOption = Array.from(categorySelect.options)
            .find(o => Number(o.dataset.id) === Number(match.categoryId));
        if (categoryOption && categorySelect.value !== categoryOption.value) {
            categorySelect.value = categoryOption.value;
            await window.handleCategoryChange();
        }
    }

    if (match.subcategoryId && subcategorySelect) {
        const subOption = Array.from(subcategorySelect.options)
            .find(o => Number(o.dataset.id) === Number(match.subcategoryId));
        if (subOption) subcategorySelect.value = subOption.value;
    }

    // El monto se completa sólo si todavía está vacío: si ya se escribió uno
    // antes de completar el nombre, se respeta lo tipeado.
    if (amountInput && !amountInput.value && match.amount) {
        amountInput.value = match.amount;
    }
}

window.autofillByName = autofillByName;
