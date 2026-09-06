import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

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

const sourceMap = JSON.parse(readFileSync(new URL('SOURCE-MAP.json', root), 'utf8'));
const assets = sourceMap.files.filter((file) => /\.(pdf|png|jpe?g|mp4|zip|xlsx)$/.test(file.path));
for (const asset of assets) {
  const original = readFileSync(new URL(asset.path, root));
  const built = readFileSync(new URL('dist/client/' + asset.path.replace(/^public\//, ''), root));
  assert.equal(createHash('sha256').update(original).digest('hex'), asset.origin_sha256, `${asset.path} changed from the supplied original`);
  assert.ok(original.equals(built), `${asset.path} changed during the build`);
}
console.log(`All ${assets.length} document and media assets retain their original bytes.`);
