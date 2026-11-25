import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

for (const name of ['pages', 'pages-da', 'stylesheets']) {
  const snapshot = new URL('../content/' + name + '.json.gz', import.meta.url);
  const output = new URL('../content/' + name + '.json', import.meta.url);
  writeFileSync(output, gunzipSync(readFileSync(snapshot)));
}
