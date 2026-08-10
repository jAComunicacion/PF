function setupFormListeners() {
    const form = document.getElementById('transaction-form');
    if (form) {
        form.addEventListener('submit', addTransaction);
    }

    const nameInput = document.getElementById('transaction-name');
    if (nameInput && window.autofillByName) {
        nameInput.addEventListener('blur', window.autofillByName);
    }
}

window.setupFormListeners = setupFormListeners;
