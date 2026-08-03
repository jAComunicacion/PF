function setupFormListeners() {
    const form = document.getElementById('transaction-form');
    if (form) {
        form.addEventListener('submit', addTransaction);
    }
}

window.setupFormListeners = setupFormListeners;
