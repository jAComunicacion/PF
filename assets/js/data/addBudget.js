async function addBudget(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('monthly-budget-input').value);

    if (isNaN(amount) || amount < 0) {
        alert('Por favor, ingrese un monto válido.');
        return;
    }

    try {
        if (window.db) {
            // Store as a setting using the 'key' as primary key
            await window.db.settings.put({ key: 'monthlyBudget', value: amount });

            window.monthlyBudget = amount;
            updateMetas();
            closeMetasModal();
            showToast('Meta mensual actualizada', 'success');
        } else {
            showToast("Error de base de datos.", 'error');
        }
    } catch (e) {
        console.error("Error saving budget: ", e);
        showToast("Error al guardar el presupuesto.", 'error');
    }
}

// Set up listener for the metas form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('metas-form');
    if (form) {
        form.addEventListener('submit', addBudget);
    }
});

window.addBudget = addBudget;
