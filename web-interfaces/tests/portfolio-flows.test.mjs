import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projectEstimate,
  validateProjectGoal,
  filterOrders,
  revenueBuckets,
  summarizeOrders,
  csvForOrders,
  orders,
} from '../lib/demo-model.ts';

test('quote components reconcile and repeated features do not change time or price', () => {
  const quote = projectEstimate('website', 3, ['forms']);
  assert.deepEqual(quote, {
    basePrice: 550,
    pageCost: 190,
    featureCost: 120,
    low: 860,
    high: 1075,
    days: 9,
  });
  assert.deepEqual(projectEstimate('website', 3, ['forms', 'forms']), quote);
  for (const kind of ['website', 'dashboard'])
    for (let pages = 1; pages <= 8; pages++)
      for (let mask = 0; mask < 8; mask++) {
        const features = ['forms', 'reporting', 'content'].filter(
          (_, index) => mask & (1 << index),
        );
        const value = projectEstimate(kind, pages, features);
        assert.equal(
          value.basePrice + value.pageCost + value.featureCost,
          value.low,
        );
        assert.ok(value.high >= value.low);
        assert.ok(value.days > 0);
      }
});
test('unsupported project kinds, sizes and features are rejected', () => {
  for (const kind of ['unknown', 'toString', '__proto__'])
    assert.throws(() => projectEstimate(kind, 1, []));
  for (const pages of [0, 9, 1.5, NaN])
    assert.throws(() => projectEstimate('website', pages, []));
  assert.throws(() => projectEstimate('website', 1, ['unknown']));
});
test('project goal validation ignores outer spaces and identifies each field', () => {
  assert.ok(validateProjectGoal('  ', 'valid description here').name);
  assert.ok(validateProjectGoal('Valid name', '               ').brief);
  assert.ok(validateProjectGoal('A', 'too short').name);
  assert.ok(validateProjectGoal('Valid name', '12345678901234').brief);
  assert.deepEqual(
    validateProjectGoal('  Northstar  ', '  123456789012345  '),
    { name: '', brief: '' },
  );
  assert.ok(validateProjectGoal('x'.repeat(81), 'valid description here').name);
  assert.ok(validateProjectGoal('Northstar', 'x'.repeat(601)).brief);
});
test('reporting metrics and period buckets agree on which money is collected', () => {
  const all = summarizeOrders(orders);
  assert.equal(all.count, 9);
  assert.equal(all.revenue, 6595);
  assert.equal(all.pending, 1035);
  assert.equal(
    revenueBuckets(orders).reduce((sum, bucket) => sum + bucket.value, 0),
    all.revenue,
  );
  assert.equal(revenueBuckets(orders).length, 5);
  const notPaid = orders.filter((row) => row.status !== 'Paid');
  assert.equal(summarizeOrders(notPaid).revenue, 0);
  assert.equal(summarizeOrders(notPaid).profit, 0);
  assert.equal(
    revenueBuckets(notPaid).reduce((sum, bucket) => sum + bucket.value, 0),
    0,
  );
});
test('filters combine, trim searches and honor both date boundaries', () => {
  const rows = filterOrders(orders, {
    period: 'month',
    channel: 'Website',
    status: 'Paid',
    search: '  MARA  ',
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'FN-1080');
  assert.equal(
    filterOrders(orders, {
      period: 'week',
      channel: 'all',
      status: 'all',
      search: '',
    }).length,
    4,
  );
  assert.equal(
    filterOrders([...orders, { ...orders[0], date: '2026-09-01' }], {
      period: 'week',
      channel: 'all',
      status: 'all',
      search: '',
    }).length,
    4,
  );
  assert.deepEqual(
    filterOrders(orders, {
      period: 'month',
      channel: 'all',
      status: 'all',
      search: 'no match',
    }),
    [],
  );
});
test('CSV preserves filtered row order, quotes and line breaks', () => {
  const row = { ...orders[0], customer: 'Northstar, "Studio"\nTeam' };
  const csv = csvForOrders([row, orders[1]]);
  assert.ok(
    csv.startsWith(
      'Order,Date,Customer,Channel,Status,Amount USD,Cost USD\r\n',
    ),
  );
  assert.ok(csv.includes('"Northstar, ""Studio""\nTeam"'));
  assert.ok(csv.indexOf('FN-1081') < csv.indexOf('FN-1080'));
  assert.equal(
    csvForOrders([]),
    'Order,Date,Customer,Channel,Status,Amount USD,Cost USD',
  );
});
