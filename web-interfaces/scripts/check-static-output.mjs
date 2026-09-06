import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A successful compiler exit can still skip a route whose server render failed.
// Require a usable static document for every route this demo promises.
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL('dist/server/vinext-prerender.json', root), 'utf8'),
);
const routes = [
  ['/', 'index.html', 'Useful websites.'],
  ['/home-care', 'home-care.html', 'A clean home.'],
  ['/insights', 'insights.html', 'Fieldnote'],
  ['/project-quote', 'project-quote.html', 'Scope Studio'],
  ['/data-cleanup', 'data-cleanup.html', 'Orderly'],
];
for (const [route, file, label] of routes) {
  const result = manifest.routes.find((item) => item.route === route);
  assert.equal(result?.status, 'rendered', `${route} did not render: ${JSON.stringify(result)}`);
  const html = readFileSync(new URL('dist/client/' + file, root), 'utf8');
  assert.ok(html.includes(label), `${route} is missing its expected content`);
  assert.ok(!html.includes('id="__next_error__"'), `${route} contains the error document`);
}
console.log('All five public routes have complete prerendered documents.');
