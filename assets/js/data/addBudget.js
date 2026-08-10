async function addBudget(event) {
    event.preventDefault();

    const input = document.getElementById('monthly-budget-input');
    const amount = parseFloat(input.value);

    if (isNaN(amount) || amount < 0) {
        showToast('Ingresá un monto válido.', 'error');
        return;
    }

    try {
        // El presupuesto vivía en la tabla `settings` de IndexedDB, o sea que
        // cada dispositivo tenía el suyo. Ahora es uno solo, en el servidor.
        await window.api.putSetting('monthlyBudget', amount);

        window.monthlyBudget = amount;
        updateMetas();
        closeMetasModal();
        showToast('Meta mensual actualizada', 'success');
    } catch (e) {
        console.error('Error al guardar el presupuesto:', e);
        showToast(e.message || 'Error al guardar el presupuesto.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('metas-form');
    if (form) {
        form.addEventListener('submit', addBudget);
    }
});

window.addBudget = addBudget;
