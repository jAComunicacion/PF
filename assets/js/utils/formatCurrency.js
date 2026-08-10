function formatCurrency(amount, type = null) {
    const value = Number(amount);
    const safeValue = Number.isFinite(value) ? value : 0;

    // El valor absoluto sólo corresponde cuando hay un `type`, porque en ese
    // caso el signo lo pone el prefijo "+"/"−". Sin tipo -el saldo total, por
    // ejemplo- hay que conservarlo: aplicar Math.abs siempre hacía que un
    // saldo negativo se mostrara como positivo.
    const formattedAmount = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(type ? Math.abs(safeValue) : safeValue);

    if (type === 'expense') {
        return `- ${formattedAmount}`;
    } else if (type === 'income') {
        return `+ ${formattedAmount}`;
    }
    return formattedAmount;
}

window.formatCurrency = formatCurrency;
