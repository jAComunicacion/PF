const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTransactionPayload, buildTransactionUpdatePayload } = require('../assets/js/data/transactionPayload.js');

test('buildTransactionPayload trims values and defaults the timestamp', () => {
  const payload = buildTransactionPayload({
    type: 'expense',
    name: '  Supermercado  ',
    amount: '1250.5',
    category: 'Alimentación',
    subcategory: '  ',
    date: '2026-08-03',
    userId: 'local-user-v1'
  });

  assert.equal(payload.name, 'Supermercado');
  assert.equal(payload.amount, 1250.5);
  assert.equal(payload.subcategory, null);
  assert.match(payload.createdAt, /T/);
});

test('buildTransactionUpdatePayload preserves identity and normalizes edits', () => {
  const payload = buildTransactionUpdatePayload(
    { id: 7, createdAt: '2026-01-01T00:00:00.000Z' },
    {
      type: 'income',
      name: '  Salario  ',
      amount: '1800',
      category: 'Salario',
      subcategory: '  ',
      date: '2026-08-03',
      userId: 'local-user-v1'
    }
  );

  assert.equal(payload.id, 7);
  assert.equal(payload.name, 'Salario');
  assert.equal(payload.amount, 1800);
  assert.equal(payload.subcategory, null);
  assert.equal(payload.createdAt, '2026-01-01T00:00:00.000Z');
});
