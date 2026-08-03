async function deleteTransaction(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
        try {
            if (window.db) {
                // Dexie IDs are integers if auto-incremented, but check if we stored strings from legacy Import? 
                // We'll assume new ones are Ints. If passing "5" from HTML attribute, it's a string.
                const numId = parseInt(id);
                await window.db.transactions.delete(isNaN(numId) ? id : numId);
                if (window.refreshData) window.refreshData();
                showToast('Transacción eliminada', 'info');
            }
        } catch (e) {
            console.error("Error deleting document: ", e);
            showToast("Error al eliminar la transacción.", 'error');
        }
    }
}

window.deleteTransaction = deleteTransaction;
