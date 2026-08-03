const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTransaction } = require('../api/_lib/validateTransaction.js');

test('validateTransaction accepts a valid payload and normalizes it', () => {
    const result = validateTransaction({
        type: 'expense',
        name: '  Supermercado  ',
        amount: '1250.5',
        date: '2026-08-03',
        categoryId: '3',
        subcategoryId: ''
    });

    assert.equal(result.name, 'Supermercado');
    assert.equal(result.amount, 1250.5);
    assert.equal(result.categoryId, 3);
    assert.equal(result.subcategoryId, null);
});

test('validateTransaction rejects a missing categoryId (bypassing the client form)', () => {
    assert.throws(
        () => validateTransaction({
            type: 'expense',
            name: 'Gasto sin categoria',
            amount: '100',
            date: '2026-08-03'
        }),
        /categoryId/
    );
});

test('validateTransaction rejects a non-positive amount', () => {
    assert.throws(
        () => validateTransaction({
            type: 'expense',
            name: 'Gasto invalido',
            amount: '0',
            date: '2026-08-03',
            categoryId: '1'
        }),
        /amount/
    );
});

test('validateTransaction rejects an invalid type', () => {
    assert.throws(
        () => validateTransaction({
            type: 'transfer',
            name: 'Tipo invalido',
            amount: '100',
            date: '2026-08-03',
            categoryId: '1'
        }),
        /type/
    );
});

test('validateTransaction accepts a valid subcategoryId', () => {
    const result = validateTransaction({
        type: 'income',
        name: 'Sueldo',
        amount: '500000',
        date: '2026-08-03',
        categoryId: '2',
        subcategoryId: '5'
    });

    assert.equal(result.subcategoryId, 5);
});
