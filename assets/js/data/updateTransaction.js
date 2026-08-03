async function updateTransaction(id, input) {
    if (!id) return;

    const existingTransaction = (window.transactions || []).find(transaction => transaction.id === id);
    const payload = window.buildTransactionUpdatePayload
        ? window.buildTransactionUpdatePayload(existingTransaction, input)
        : { ...existingTransaction, ...input };

    try {
        if (window.db) {
            await window.db.transactions.update(id, payload);
            if (window.refreshData) window.refreshData();
            showToast('Transacción actualizada', 'success');
            return true;
        }
    } catch (e) {
        console.error('Error updating transaction:', e);
        showToast('No se pudo actualizar la transacción.', 'error');
    }

    return false;
}

window.updateTransaction = updateTransaction;