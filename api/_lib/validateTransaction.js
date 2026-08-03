const { buildTransactionPayload } = require('../../assets/js/data/transactionPayload.js');

// Unica validacion server-side, reusada por los 3 entry points futuros
// (formulario manual, parser Mercado Pago, parser banco) - decision tomada
// en /plan-eng-review para no triplicar esta logica.
//
// Reusa buildTransactionPayload para normalizar name/amount/date/type (el
// modelo viejo, basado en IndexedDB, ya resolvia esto bien). category_id y
// subcategory_id son nuevos: el modelo viejo guardaba el NOMBRE de la
// categoria como string; el schema de Postgres usa foreign keys, asi que esa
// parte no existia en el codigo original y se valida aca.
function validateTransaction(input) {
    const normalized = buildTransactionPayload(input);

    const errors = [];
    if (!normalized.name) errors.push('name es obligatorio');
    if (!Number.isFinite(normalized.amount) || normalized.amount <= 0) {
        errors.push('amount debe ser un numero mayor a 0');
    }
    if (!normalized.date) errors.push('date es obligatorio');
    if (normalized.type !== 'income' && normalized.type !== 'expense') {
        errors.push('type debe ser "income" o "expense"');
    }

    const categoryId = Number.parseInt(input.categoryId, 10);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        errors.push('categoryId es obligatorio y debe ser un id valido');
    }

    let subcategoryId = null;
    if (input.subcategoryId !== null && input.subcategoryId !== undefined && input.subcategoryId !== '') {
        subcategoryId = Number.parseInt(input.subcategoryId, 10);
        if (!Number.isInteger(subcategoryId) || subcategoryId <= 0) {
            errors.push('subcategoryId debe ser un id valido si se envia');
        }
    }

    if (errors.length > 0) {
        const err = new Error(errors.join('; '));
        err.validationErrors = errors;
        throw err;
    }

    return {
        type: normalized.type,
        name: normalized.name,
        amount: normalized.amount,
        date: normalized.date,
        categoryId,
        subcategoryId
    };
}

module.exports = { validateTransaction };
