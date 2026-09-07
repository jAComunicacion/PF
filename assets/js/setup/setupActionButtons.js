function setupActionButtons() {
    const btnPagar = document.getElementById('btn-pagar');
    const btnIngresos = document.getElementById('btn-ingresos');

    if (btnPagar) btnPagar.addEventListener('click', () => openTransactionModal('expense', 'Pago'));
    if (btnIngresos) btnIngresos.addEventListener('click', () => openTransactionModal('income', 'Ingreso'));
}

window.setupActionButtons = setupActionButtons;
