function calculateBalance() {
    return (window.transactions || []).reduce((total, transaction) => {
        const amount = parseFloat(transaction.amount);
        return transaction.type === 'income'
            ? total + amount
            : total - amount;
    }, 0);
}

window.calculateBalance = calculateBalance;
