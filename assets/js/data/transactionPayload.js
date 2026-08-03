function normalizeText(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function buildTransactionPayload(input) {
    const amount = Number(input.amount);
    const normalizedName = normalizeText(input.name);
    const normalizedSubcategory = normalizeText(input.subcategory);

    return {
        type: input.type,
        name: normalizedName,
        amount: Number.isFinite(amount) ? amount : 0,
        category: normalizeText(input.category) || input.category,
        subcategory: normalizedSubcategory,
        date: input.date,
        userId: input.userId || 'anonymous',
        createdAt: new Date().toISOString()
    };
}

function buildTransactionUpdatePayload(existingTransaction, input) {
    const payload = buildTransactionPayload(input);
    return {
        ...payload,
        id: existingTransaction && existingTransaction.id != null ? existingTransaction.id : input.id,
        createdAt: existingTransaction && existingTransaction.createdAt ? existingTransaction.createdAt : payload.createdAt
    };
}

if (typeof window !== 'undefined') {
    window.buildTransactionPayload = buildTransactionPayload;
    window.buildTransactionUpdatePayload = buildTransactionUpdatePayload;
}

if (typeof module !== 'undefined') {
    module.exports = { buildTransactionPayload, buildTransactionUpdatePayload };
}
