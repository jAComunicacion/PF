function renderTransactions() {
    const listEl = document.querySelector('.transactions-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const categoryFilterEl = document.getElementById('category-filter');
    const categoryFilter = categoryFilterEl ? categoryFilterEl.value : 'all';

    const filteredTransactions = (window.transactions || []).filter(t => {
        if (categoryFilter === 'all') return true;
        return t.category === categoryFilter;
    });

    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredTransactions.forEach(transaction => {
        const transactionCard = document.createElement('div');
        transactionCard.classList.add('transaction-card');

        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'transaction-icon';
        iconWrapper.innerHTML = getCategoryIcon(transaction.category);

        const infoWrapper = document.createElement('div');
        infoWrapper.className = 'transaction-info';

        const nameEl = document.createElement('p');
        nameEl.className = 'transaction-name';
        nameEl.textContent = transaction.name;

        const detailsEl = document.createElement('p');
        detailsEl.className = 'transaction-details';
        detailsEl.textContent = `${transaction.category}${transaction.subcategory ? ` (${transaction.subcategory})` : ''} - ${new Date(transaction.date).toLocaleDateString('es-AR')}`;

        infoWrapper.appendChild(nameEl);
        infoWrapper.appendChild(detailsEl);

        const amountEl = document.createElement('div');
        amountEl.className = `transaction-amount ${transaction.type}`;
        amountEl.textContent = formatCurrency(transaction.amount, transaction.type);

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'transaction-actions';

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn-inline';
        editButton.type = 'button';
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => openTransactionModal(transaction.type, transaction.name, transaction));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.type = 'button';
        deleteButton.textContent = '×';
        deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));

        actionsWrapper.appendChild(editButton);
        actionsWrapper.appendChild(deleteButton);

        transactionCard.appendChild(iconWrapper);
        transactionCard.appendChild(infoWrapper);
        transactionCard.appendChild(amountEl);
        transactionCard.appendChild(actionsWrapper);
        listEl.appendChild(transactionCard);
    });
}

window.renderTransactions = renderTransactions;
