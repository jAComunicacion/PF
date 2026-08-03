function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(window.transactions));
}

window.saveTransactions = saveTransactions;
