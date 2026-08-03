async function addTransaction(event) {
    event.preventDefault();

    const form = document.getElementById('transaction-form');
    const editingId = form && form.dataset.editingId ? parseInt(form.dataset.editingId, 10) : null;
    const type = document.getElementById('transaction-type').value;
    const name = document.getElementById('transaction-name').value;
    const amount = document.getElementById('transaction-amount').value;
    const category = document.getElementById('transaction-category').value;
    const subcategory = document.getElementById('subcategory-group').style.display !== 'none'
        ? document.getElementById('transaction-subcategory').value
        : null;
    const date = document.getElementById('transaction-date').value;

    const parsedAmount = parseFloat(amount);
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
        showToast('Por favor, complete todos los campos.', 'error');
        return;
    }

    const transaction = window.buildTransactionPayload ? window.buildTransactionPayload({
        type,
        name,
        amount,
        category,
        subcategory,
        date,
        userId: window.auth.currentUser ? window.auth.currentUser.uid : 'anonymous'
    }) : {
        type,
        name: normalizedName,
        amount: parsedAmount,
        category,
        subcategory,
        date,
        userId: window.auth.currentUser ? window.auth.currentUser.uid : 'anonymous',
        createdAt: new Date().toISOString()
    };

    try {
        if (window.db) {
            if (editingId) {
                const updated = window.updateTransaction ? await window.updateTransaction(editingId, transaction) : false;
                if (updated) {
                    closeTransactionModal();
                }
            } else {
                await window.db.transactions.add(transaction);
                closeTransactionModal();
                if (window.refreshData) window.refreshData();
                showToast('Transacción agregada correctamente', 'success');
            }
        }
    } catch (e) {
        console.error("Error adding document: ", e);
        showToast("Error al guardar la transacción.", 'error');
    }
}

window.addTransaction = addTransaction;
