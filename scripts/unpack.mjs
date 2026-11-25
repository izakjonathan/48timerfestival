import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

for (const name of ['pages', 'pages-da', 'stylesheets']) {
  const snapshot = new URL('../content/' + name + '.json.gz', import.meta.url);
  const output = new URL('../content/' + name + '.json', import.meta.url);
  writeFileSync(output, gunzipSync(readFileSync(snapshot)));
}

const assets = JSON.parse(gunzipSync(readFileSync(new URL('../content/critical-assets.json.gz', import.meta.url))));
for (const [path, data] of Object.entries(assets)) {
  const output = new URL('../public/festival-assets/' + path, import.meta.url);
  mkdirSync(new URL('.', output), { recursive: true });
  writeFileSync(output, Buffer.from(data, 'base64'));
}
