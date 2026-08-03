function openMetasModal() {
    const modal = document.getElementById('metas-modal');
    if (!modal) return;

    // Pre-llenar con el presupuesto actual si existe
    const currentBudget = window.monthlyBudget || 0;
    const input = document.getElementById('monthly-budget-input');
    if (input) input.value = currentBudget;

    modal.classList.add('active');
}

window.openMetasModal = openMetasModal;
