// Lo llama el select de categorías desde el HTML. Vuelve al principio de la
// lista, porque el "ver más" de la categoría anterior ya no aplica.
function filterTransactions() {
    if (window.resetVisibles) window.resetVisibles();
    renderTransactions();
}

window.filterTransactions = filterTransactions;
