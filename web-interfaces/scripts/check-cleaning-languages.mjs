import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const site = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(resolve(site, 'package.json'));
const ts = require('typescript');
const modelUrl = pathToFileURL(resolve(site, 'lib/demo-model.ts')).href;
const source = readFileSync(resolve(site, 'lib/home-care-copy.ts'), 'utf8').replace("'./demo-model'", JSON.stringify(modelUrl));
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { careCopy, careMoney, careRoomCount } = await import('data:text/javascript,' + encodeURIComponent(compiled));
const { cleanEstimate } = await import(modelUrl);
assert.deepEqual(Object.keys(careCopy.en).sort(), Object.keys(careCopy.fr).sort());
assert.deepEqual(careCopy.en.rhythms.map(x => x.value), careCopy.fr.rhythms.map(x => x.value));
assert.deepEqual(careCopy.en.questions.map(x => x[0]), careCopy.fr.questions.map(x => x[0]));
assert.equal(careRoomCount(1, 'baths', 'fr'), '1 salle de bains');
assert.equal(careRoomCount(2, 'baths', 'fr'), '2 salles de bains');
assert.equal(careRoomCount(1, 'beds', 'en'), '1 bedroom');
assert.equal(careRoomCount(3, 'beds', 'fr'), '3 chambres');
let combinations = 0;
for (let beds = 1; beds <= 5; beds++) for (let baths = 1; baths <= 4; baths++) for (const rhythm of careCopy.en.rhythms) for (const deep of [false, true]) {
  const estimate = cleanEstimate(beds, baths, rhythm.value, deep);
  for (const value of [estimate.standard, estimate.extra, estimate.discount, estimate.total]) {
    const en = careMoney(value, 'en');
    const fr = careMoney(value, 'fr');
    assert.ok(en.includes('$') && fr.includes('$'));
    assert.equal(Number(en.replace(/[^0-9.]/g, '')), value);
    assert.equal(Number(fr.replace(/[^0-9,]/g, '').replace(',', '.')), value);
  }
  combinations++;
}
const page = ts.createSourceFile('page.tsx', readFileSync(resolve(site, 'app/home-care/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const literals = [];
function walk(node) {
  if (ts.isJsxText(node) && node.text.trim()) literals.push(node.text.trim());
  ts.forEachChild(node, walk);
}
walk(page);
const allowed = new Set(['English', 'Français', 'sunday home', '/', '·', '−', 'USD', '.', '(', ')', ',']);
assert.deepEqual(literals.filter(value => !allowed.has(value)), [], 'Unexpected untranslated JSX text');
const report = { matchingTranslationKeys: Object.keys(careCopy.en).length, stablePlanAndQuestionIds: true, localizedPricingCombinations: combinations, perCombinationAmounts: 4, roomPluralization: 'passed', remainingLiteralText: [...new Set(literals)], browserInteractionTested: false };
console.log(JSON.stringify(report, null, 2));
