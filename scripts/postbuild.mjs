// Post-build step for the static output:
// 1. Moves the prerendered /404 page to 404.html (the file Cloudflare serves, with a 404 status,
//    for unknown URLs). Angular skips catch-all routes when prerendering, hence the real /404 route.
// 2. Writes robots.txt and sitemap.xml from apps/site/site.config.json.
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(repo, 'apps/site/dist/site/browser');
const origin = JSON.parse(
  readFileSync(join(repo, 'apps/site/site.config.json'), 'utf8'),
).origin.replace(/\/$/, '');

const notFoundDir = join(out, '404');
if (!existsSync(join(notFoundDir, 'index.html'))) {
  console.error('FAIL: the /404 route was not prerendered (expected 404/index.html).');
  process.exit(1);
}
renameSync(join(notFoundDir, 'index.html'), join(out, '404.html'));
rmSync(notFoundDir, { recursive: true, force: true });

if (/^https:\/\/example\.com$/.test(origin)) {
  console.warn(
    'WARN: apps/site/site.config.json still has the placeholder origin https://example.com.',
  );
}

// Add each new prerendered route here.
const routes = ['/'];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${origin}${r}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(out, 'sitemap.xml'), sitemap);
writeFileSync(
  join(out, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
);
console.log(`Wrote robots.txt and sitemap.xml for ${origin}`);
