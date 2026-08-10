async function updateTransaction(id, payload) {
    if (!id) return false;

    try {
        await window.api.updateTransaction(id, payload);
        await window.refreshData();
        showToast('Transacción actualizada', 'success');
        return true;
    } catch (e) {
        console.error('Error al actualizar la transacción:', e);
        showToast(e.message || 'No se pudo actualizar la transacción.', 'error');
        return false;
    }
}

window.updateTransaction = updateTransaction;
