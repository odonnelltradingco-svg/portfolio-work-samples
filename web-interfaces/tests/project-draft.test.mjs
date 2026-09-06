import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECT_DRAFT_KEY,
  DRAFT_LIFETIME,
  parseProjectDraft,
  readProjectDraft,
  saveProjectDraft,
  forgetProjectDraft,
  draftMatches,
} from '../lib/project-draft.ts';
import { projectEstimate } from '../lib/demo-model.ts';

const now = 1788690000000;
const draft = {
  kind: 'website',
  pages: 3,
  features: ['forms'],
  name: 'Northstar',
  brief: 'Help homeowners compare services and request a quote.',
  step: 3,
  furthest: 3,
  complete: true,
};
function memoryStorage() {
  const entries = new Map();
  return {
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, value);
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
}
const encode = (overrides = {}, envelope = {}) =>
  JSON.stringify({
    version: 1,
    savedAt: now,
    draft: { ...draft, ...overrides },
    ...envelope,
  });

test('explicit save round-trips choices and does not retain supplied prices or extra fields', () => {
  const storage = memoryStorage();
  assert.deepEqual(readProjectDraft(storage, now), { status: 'empty' });
  const saved = saveProjectDraft(
    storage,
    { ...draft, price: 1, accountId: 'not-stored' },
    now,
  );
  assert.deepEqual(saved, { version: 1, savedAt: now, draft });
  const restored = readProjectDraft(storage, now + 1000);
  assert.equal(restored.status, 'saved');
  assert.deepEqual(restored.saved, saved);
  assert.equal(storage.getItem(PROJECT_DRAFT_KEY).includes('accountId'), false);
  assert.equal(
    projectEstimate(
      restored.saved.draft.kind,
      restored.saved.draft.pages,
      restored.saved.draft.features,
    ).low,
    860,
  );
});

test('incomplete goals are saved but cannot restore a completed or review-only state', () => {
  const value = parseProjectDraft(
    encode({ name: '', brief: 'unfinished' }),
    now,
  );
  assert.equal(value.status, 'saved');
  assert.equal(value.saved.draft.step, 2);
  assert.equal(value.saved.draft.furthest, 2);
  assert.equal(value.saved.draft.complete, false);
  assert.equal(value.saved.draft.brief, 'unfinished');
  const beginning = parseProjectDraft(
    encode({ step: 1, furthest: 1, complete: false, name: '', brief: '' }),
    now,
  );
  assert.equal(beginning.saved.draft.step, 1);
  const unreachedReview = parseProjectDraft(
    encode({ step: 1, furthest: 1, complete: true }),
    now,
  );
  assert.equal(unreachedReview.saved.draft.complete, false);
});

test('invalid structures, unsupported choices and oversized data cannot reach the form', () => {
  for (const raw of [
    '{broken',
    'null',
    '[]',
    '"text"',
    'x'.repeat(12001),
    encode({ kind: '__proto__' }),
    encode({ pages: 9 }),
    encode({ pages: '3' }),
    encode({ pages: 1.5 }),
    encode({ features: ['admin'] }),
    encode({ features: 'forms' }),
    encode({ name: 'x'.repeat(81) }),
    encode({ brief: 'x'.repeat(601) }),
    encode({ step: 0 }),
    encode({ step: 3, furthest: 1 }),
    encode({ complete: 'yes' }),
    encode({}, { version: 2 }),
    encode({}, { savedAt: now + 1 }),
  ])
    assert.equal(
      parseProjectDraft(raw, now).status,
      'invalid',
      raw.slice(0, 80),
    );
});

test('draft expiry has an exact boundary and unrelated storage is preserved on forget', () => {
  const storage = memoryStorage();
  storage.setItem('unrelated-preference', 'keep');
  saveProjectDraft(storage, draft, now);
  assert.equal(
    readProjectDraft(storage, now + DRAFT_LIFETIME - 1).status,
    'saved',
  );
  assert.equal(
    readProjectDraft(storage, now + DRAFT_LIFETIME).status,
    'expired',
  );
  assert.equal(forgetProjectDraft(storage), true);
  assert.equal(readProjectDraft(storage, now).status, 'empty');
  assert.equal(storage.getItem('unrelated-preference'), 'keep');
});

test('blocked or dropped storage operations never claim successful save or removal', () => {
  const blocked = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('quota');
    },
    removeItem() {
      throw Error('blocked');
    },
  };
  assert.equal(readProjectDraft(blocked, now).status, 'unavailable');
  assert.equal(saveProjectDraft(blocked, draft, now), null);
  assert.equal(forgetProjectDraft(blocked), false);
  const dropped = {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  };
  assert.equal(saveProjectDraft(dropped, draft, now), null);
  const retained = {
    getItem() {
      return 'old';
    },
    setItem() {},
    removeItem() {},
  };
  assert.equal(forgetProjectDraft(retained), false);
});

test('saved-state comparison ignores option order but detects goal, scope and progress changes', () => {
  const base = { ...draft, features: ['forms', 'reporting'] };
  assert.equal(
    draftMatches(base, { ...base, features: ['reporting', 'forms'] }),
    true,
  );
  for (const changed of [
    { pages: 4 },
    { name: 'New name' },
    { brief: 'A different outcome' },
    { step: 2 },
    { complete: false },
    { kind: 'dashboard' },
  ]) {
    assert.equal(draftMatches(base, { ...base, ...changed }), false);
  }
});
