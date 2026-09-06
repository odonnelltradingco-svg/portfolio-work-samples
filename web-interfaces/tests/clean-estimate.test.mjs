import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanEstimate, cleanMoney } from '../lib/demo-model.ts';

test('default two-bedroom fortnightly clean totals $126', () => {
  assert.equal(cleanEstimate(2, 1, 'fortnightly', false).total, 126);
});
test('percentage savings preserve cents, including the deeper clean', () => {
  const result = cleanEstimate(2, 1, 'fortnightly', true);
  assert.equal(result.standard, 140);
  assert.equal(result.extra, 65);
  assert.equal(result.discount, 20.5);
  assert.equal(result.total, 184.5);
  assert.equal(cleanMoney(result.total), '$184.50');
  assert.equal(cleanEstimate(1, 1, 'weekly', false).total, 97.75);
});
test('all 120 supported combinations reconcile and regular visits cost less', () => {
  for (let beds = 1; beds <= 5; beds++)
    for (let baths = 1; baths <= 4; baths++)
      for (const deep of [false, true]) {
        const once = cleanEstimate(beds, baths, 'once', deep);
        const fortnightly = cleanEstimate(beds, baths, 'fortnightly', deep);
        const weekly = cleanEstimate(beds, baths, 'weekly', deep);
        for (const estimate of [once, fortnightly, weekly]) {
          assert.equal(estimate.standard + estimate.extra, estimate.base);
          assert.equal(
            Math.round(estimate.base * 100 - estimate.discount * 100),
            Math.round(estimate.total * 100),
          );
          assert.ok(estimate.total > 0);
        }
        assert.ok(
          weekly.total < fortnightly.total && fortnightly.total < once.total,
        );
      }
});
test('unsupported sizes and frequency cannot produce a misleading quote', () => {
  for (const [beds, baths] of [
    [0, 1],
    [6, 1],
    [1, 0],
    [1, 5],
    [1.5, 1],
    [NaN, 1],
  ]) {
    assert.throws(() => cleanEstimate(beds, baths, 'once', false));
  }
  assert.throws(() => cleanEstimate(2, 1, 'monthly', false));
});
