function setupActionButtons() {
    const btnTransferir = document.getElementById('btn-transferir');
    const btnPagar = document.getElementById('btn-pagar');
    const btnIngresos = document.getElementById('btn-ingresos');
    const btnInvertir = document.getElementById('btn-invertir');

    if (btnTransferir) btnTransferir.addEventListener('click', () => openTransactionModal('expense', 'Transferencia'));
    if (btnPagar) btnPagar.addEventListener('click', () => openTransactionModal('expense', 'Pago'));
    if (btnIngresos) btnIngresos.addEventListener('click', () => openTransactionModal('income', 'Ingreso'));
    if (btnInvertir) btnInvertir.addEventListener('click', () => openTransactionModal('income', 'Inversión'));
}

window.setupActionButtons = setupActionButtons;
