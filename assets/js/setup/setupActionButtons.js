function setupActionButtons() {
    const btnPagar = document.getElementById('btn-pagar');
    const btnIngresos = document.getElementById('btn-ingresos');
    const btnInvertir = document.getElementById('btn-invertir');

    if (btnPagar) btnPagar.addEventListener('click', () => openTransactionModal('expense', 'Pago'));
    if (btnIngresos) btnIngresos.addEventListener('click', () => openTransactionModal('income', 'Ingreso'));
    if (btnInvertir) btnInvertir.addEventListener('click', () => openTransactionModal('expense', 'Inversión'));
}

window.setupActionButtons = setupActionButtons;
