function formatCurrency(amount, type = null) {
    const formattedAmount = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(Math.abs(amount));

    if (type === 'expense') {
        return `- ${formattedAmount}`;
    } else if (type === 'income') {
        return `+ ${formattedAmount}`;
    }
    return formattedAmount;
}

window.formatCurrency = formatCurrency;
