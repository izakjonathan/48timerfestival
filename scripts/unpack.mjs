import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const snapshot = new URL('../content/pages.json.gz', import.meta.url);
const output = new URL('../content/pages.json', import.meta.url);
writeFileSync(output, gunzipSync(readFileSync(snapshot)));
