function closeTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('transaction-form');
    const submitBtn = document.getElementById('transaction-submit-btn');
    if (!modal) return;

    modal.classList.remove('active');
    if (form) {
        form.reset();
        form.dataset.editingId = '';
    }
    if (submitBtn) submitBtn.textContent = 'Agregar Transacción';
    const dateInput = document.getElementById('transaction-date');
    if (dateInput) dateInput.valueAsDate = new Date();
}

window.closeTransactionModal = closeTransactionModal;

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('transaction-modal');
    if (event.target == modal) {
        closeTransactionModal();
    }
}
