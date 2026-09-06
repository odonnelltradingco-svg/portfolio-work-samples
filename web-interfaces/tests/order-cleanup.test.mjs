import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  analyzeOrders,
  cleanedOrdersCsv,
  displayUsd,
  parseOrderCsv,
} from '../lib/order-cleanup.ts';

const header = 'order_id,date,customer,quantity,unit_price,status';
const row = (id = 'A1', overrides = {}) =>
  Object.values({
    id,
    date: '2026-08-01',
    customer: 'Customer',
    quantity: '1',
    price: '12.50',
    status: 'paid',
    ...overrides,
  }).join(',');
const analyze = (...rows) => analyzeOrders([header, ...rows].join('\n'));

test('browser review matches every published Python sample output', () => {
  const sample = readFileSync(
    new URL('../samples/csv-cleanup/sample-orders.csv', import.meta.url),
    'utf8',
  );
  const result = analyzeOrders(sample);
  const fixture = (name) =>
    readFileSync(
      new URL(
        '../samples/csv-cleanup/expected-results/' + name,
        import.meta.url,
      ),
      'utf8',
    );
  assert.deepEqual(result.summary, JSON.parse(fixture('summary.json')));
  assert.deepEqual(result.exceptions, JSON.parse(fixture('exceptions.json')));
  assert.equal(
    cleanedOrdersCsv(result.cleaned_rows).replaceAll('\r\n', '\n'),
    fixture('cleaned-orders.csv').replaceAll('\r\n', '\n'),
  );
});

test('BOM, reordered headers, quoted commas and escaped quotes normalize without guessing', () => {
  const result = analyzeOrders(
    '\uFEFF STATUS,unit_price,quantity,customer,date,ORDER_ID\r\n Paid ,0.1,3," Cedar, ""Market"" ",2024-02-29, ORD-1 \r\n',
  );
  assert.equal(result.cleaned_rows[0].customer, 'Cedar, "Market"');
  assert.equal(result.cleaned_rows[0].total_usd, '0.30');
  assert.equal(
    result.summary.accepted_records_with_whitespace_or_case_cleanup,
    1,
  );
  assert.equal(result.cleaned_rows[0].source_line, 2);
});

test('CSV multiline fields and blank records preserve physical starting lines', () => {
  const result = analyzeOrders(
    header +
      '\r\nA,2026-08-01,"Two\r\nlines",1,1.00,paid\r\n\r\n' +
      row('B') +
      '\r\n',
  );
  assert.equal(result.summary.input_records, 3);
  assert.deepEqual(
    result.exceptions.map((value) => value.source_line),
    [2, 4],
  );
  assert.equal(result.exceptions[0].raw_values[2], 'Two\r\nlines');
  assert.equal(result.cleaned_rows[0].source_line, 5);
  assert.equal(result.exceptions[1].reason, 'Empty record');
});

test('malformed input fails as a whole instead of producing partial results', () => {
  for (const value of [
    '',
    header + '\nA,"unclosed',
    header + '\nA,"closed"tail',
    header + '\nA,not"quoted',
    'a,b',
    'order_id,ORDER_ID,date,customer,quantity,unit_price,status',
  ])
    assert.throws(() => analyzeOrders(value));
  assert.deepEqual(analyzeOrders(header + '\n').cleaned_rows, []);
  assert.equal(analyzeOrders(header + '\n').summary.input_records, 0);
});

test('dates honor leap years and never roll an impossible date into another month', () => {
  const valid = ['2024-02-29', '2000-02-29', '0001-01-01', '9999-12-31'];
  const invalid = [
    '1900-02-29',
    '2026-02-29',
    '2026-04-31',
    '0000-01-01',
    '2026-13-01',
    '2026-01-00',
    '2026-1-01',
  ];
  for (const date of valid)
    assert.equal(analyze(row('A', { date })).cleaned_rows.length, 1, date);
  for (const date of invalid)
    assert.equal(analyze(row('A', { date })).exceptions.length, 1, date);
});

test('duplicate IDs remain exceptions even when the first record is invalid', () => {
  const result = analyze(row('A', { customer: '' }), row('A'), row('a'));
  assert.equal(result.cleaned_rows.length, 1);
  assert.equal(result.cleaned_rows[0].order_id, 'a');
  assert.match(result.exceptions[1].reason, /Duplicate order ID/);
});

test('invalid fields collect specific reasons and original values remain intact', () => {
  const original = ' bad id ,2026-02-30,  ,0,NaN,unknown';
  const result = analyze(original);
  assert.equal(result.exceptions[0].reason.split('; ').length, 6);
  assert.deepEqual(result.exceptions[0].raw_values, original.split(','));
  assert.equal(result.summary.collected_revenue_usd, '0.00');
  assert.equal(
    analyze('too,few,columns').exceptions[0].reason,
    'Wrong number of columns',
  );
});

test('formula prefixes and control characters never enter accepted CSV cells', () => {
  for (const customer of [
    '=SUM(A1)',
    '+SUM(A1)',
    '-1',
    '@name',
    '\t=1',
    'A\u0000B',
  ]) {
    const result = analyze(row('A', { customer }));
    assert.equal(result.cleaned_rows.length, 0, JSON.stringify(customer));
    assert.match(result.exceptions[0].reason, /formula or control/);
  }
});

test('large totals stay exact beyond the safe integer range and statuses reconcile separately', () => {
  const result = analyze(
    ...Array.from({ length: 12 }, (_, index) =>
      row('A' + index, { quantity: '999999', price: '9999999.99' }),
    ),
    row('P', { status: 'pending' }),
    row('R', { status: 'refunded' }),
  );
  const expectedCents = BigInt(999999999) * BigInt(999999) * BigInt(12);
  const expected =
    String(expectedCents / BigInt(100)) +
    '.' +
    String(expectedCents % BigInt(100)).padStart(2, '0');
  assert.ok(expectedCents > BigInt(Number.MAX_SAFE_INTEGER));
  assert.equal(result.summary.collected_revenue_usd, expected);
  assert.equal(result.summary.order_value_by_status_usd.pending, '12.50');
  assert.equal(result.summary.order_value_by_status_usd.refunded, '12.50');
  assert.equal(
    result.summary.input_records,
    result.summary.accepted_records + result.summary.rejected_records,
  );
  assert.equal(displayUsd('12000000000.05'), '$12,000,000,000.05');
});

test('negative, exponent, over-precision and oversized numerical fields need review', () => {
  for (const price of ['-1', '1e2', '0.001', '10000000', 'Infinity'])
    assert.equal(analyze(row('A', { price })).exceptions.length, 1);
  for (const quantity of ['0', '-1', '1.5', '1000000', '01'])
    assert.equal(analyze(row('A', { quantity })).exceptions.length, 1);
  assert.equal(
    analyze(row('A', { price: '0', quantity: '1' })).cleaned_rows[0].total_usd,
    '0.00',
  );
});

test('record and UTF-8 byte limits include blank records and multibyte text', () => {
  assert.equal(
    analyzeOrders(header + '\n' + '\n'.repeat(10_000)).summary.rejected_records,
    10_000,
  );
  assert.throws(
    () => analyzeOrders(header + '\n' + '\n'.repeat(10_001)),
    /10,000/,
  );
  assert.throws(() => analyzeOrders('€'.repeat(666_667)), /2 MB/);
});

test('cleaned CSV quotes accepted customer punctuation and includes every row', () => {
  const result = analyze(
    row('A', { customer: '"Cedar, ""Market"""' }),
    ...Array.from({ length: 49 }, (_, index) => row('B' + index)),
  );
  const output = parseOrderCsv(cleanedOrdersCsv(result.cleaned_rows));
  assert.equal(output.length, 51);
  assert.equal(output[1].values[2], 'Cedar, "Market"');
  assert.equal(output[50].values[0], 'B48');
  assert.equal(output[50].values[7], '51');
});
