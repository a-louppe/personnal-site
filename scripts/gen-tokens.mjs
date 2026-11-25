// Writes the site's colour tokens from the single source of truth,
// packages/dither/src/palettes.ts (CLAUDE.md rule 3).
// Usage: `pnpm tokens` to write, `pnpm tokens:check` to fail when the file is stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cssTokens } from '../packages/dither/src/palettes.ts';

const target = fileURLToPath(new URL('../apps/site/src/tokens.css', import.meta.url));
const css = cssTokens();

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    // Missing file counts as stale.
  }
  if (current !== css) {
    console.error('apps/site/src/tokens.css is out of date. Run `pnpm tokens`.');
    process.exit(1);
  }
  console.log('tokens.css is up to date.');
} else {
  writeFileSync(target, css);
  console.log('Wrote apps/site/src/tokens.css');
}
