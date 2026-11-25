// Gzips the initial JS the browser loads from index.html and enforces a budget.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps/site/dist/site/browser');
const WARN_KB = 100;
const FAIL_KB = 150;

const html = readFileSync(join(root, 'index.html'), 'utf8');
const files = new Set();
for (const tag of html.match(/<(script|link)\b[^>]*>/gi) ?? []) {
  const isScript = /^<script/i.test(tag);
  const isPreload = /\brel=["']?modulepreload/i.test(tag);
  if (!isScript && !isPreload) continue;
  const m = tag.match(/\b(?:src|href)=["']?([^"'\s>]+)/i);
  if (m && /\.m?js$/.test(m[1])) files.add(m[1].replace(/^\//, ''));
}

if (files.size === 0) {
  console.error('No initial JS found in index.html. Did you run pnpm build?');
  process.exit(1);
}

let total = 0;
const rows = [];
for (const file of files) {
  const buf = readFileSync(join(root, file));
  const gz = gzipSync(buf, { level: 9 }).length;
  total += gz;
  rows.push({
    file,
    'raw kB': +(buf.length / 1000).toFixed(2),
    'gzip kB': +(gz / 1000).toFixed(2),
  });
}
console.table(rows);
const totalKb = total / 1000;
console.log(`Initial JS gzip total: ${totalKb.toFixed(2)} kB (warn ${WARN_KB}, fail ${FAIL_KB})`);

if (totalKb > FAIL_KB) {
  console.error(`FAIL: initial JS exceeds ${FAIL_KB} kB gzipped.`);
  process.exit(1);
}
if (totalKb > WARN_KB) console.warn(`WARN: initial JS exceeds ${WARN_KB} kB gzipped.`);
