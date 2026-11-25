// Checks the deploy-related files in the build output: _headers rules, 404.html, robots, sitemap.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps/site/dist/site/browser');
const errors = [];
const need = (file) => {
  const p = join(root, file);
  if (!existsSync(p)) {
    errors.push(`${file} is missing from the build output`);
    return '';
  }
  return readFileSync(p, 'utf8');
};

const headers = need('_headers');
// Parse into blocks: an unindented pattern line, then indented "Name: value" lines.
const blocks = new Map();
let current = null;
for (const [i, raw] of headers.split('\n').entries()) {
  if (raw.trim() === '' || /^\s*#/.test(raw)) continue;
  if (/^\s/.test(raw)) {
    if (!current) errors.push(`_headers line ${i + 1}: header outside a rule`);
    else if (!/^\s+(?:! )?[A-Za-z][\w-]*(?::\s?\S.*)?$/.test(raw)) {
      errors.push(`_headers line ${i + 1} is not a valid header: ${raw.trim()}`);
    } else current.push(raw.trim());
  } else {
    current = [];
    blocks.set(raw.trim(), current);
  }
}
const expectIn = (pattern, needle) => {
  const lines = [...blocks]
    .filter(([p]) => p === pattern || p.includes(pattern))
    .flatMap(([, l]) => l);
  if (!lines.some((l) => l.startsWith(needle)))
    errors.push(`_headers: rule "${pattern}" lacks "${needle}"`);
};
if (headers) {
  for (const h of [
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy:',
    'Permissions-Policy:',
    'Strict-Transport-Security:',
    'Content-Security-Policy:',
    'Cache-Control: no-cache',
  ])
    expectIn('/*', h);
  for (const ext of ['js', 'css', 'woff2']) {
    expectIn(`/*.${ext}`, '! Cache-Control');
    expectIn(`/*.${ext}`, 'Cache-Control: public, max-age=31536000, immutable');
  }
  expectIn('workers.dev', 'X-Robots-Tag: noindex');
  expectIn('pages.dev', 'X-Robots-Tag: noindex');
}

if (need('404.html') && !/Page not found/.test(need('404.html'))) {
  errors.push('404.html does not contain the not-found page');
}
if (!/Sitemap:/.test(need('robots.txt'))) errors.push('robots.txt has no Sitemap line');
if (!/<loc>/.test(need('sitemap.xml'))) errors.push('sitemap.xml has no <loc> entries');

const redirects = join(root, '_redirects');
if (existsSync(redirects) && /^\s*\/\*\s+\/index\.html/m.test(readFileSync(redirects, 'utf8'))) {
  errors.push('_redirects rewrites everything to index.html: unknown URLs must return 404');
}

if (errors.length) {
  console.error(errors.map((e) => `FAIL: ${e}`).join('\n'));
  process.exit(1);
}
console.log('Deploy files OK: _headers, 404.html, robots.txt, sitemap.xml');
