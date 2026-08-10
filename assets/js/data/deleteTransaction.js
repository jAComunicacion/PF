async function deleteTransaction(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;

    try {
        await window.api.deleteTransaction(id);
        await window.refreshData();
        showToast('Transacción eliminada', 'info');
    } catch (e) {
        console.error('Error al eliminar la transacción:', e);
        showToast(e.message || 'Error al eliminar la transacción.', 'error');
    }
}

window.deleteTransaction = deleteTransaction;
