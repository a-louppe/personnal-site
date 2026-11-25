# Deployment: Cloudflare Workers Static Assets

The site is a prerendered static folder (`apps/site/dist/site/browser`). Cloudflare serves it with
**Workers Static Assets** (no Worker script), built by **Workers Builds** from the GitHub repo.
Cloudflare now recommends this over Pages for new projects. `_headers` works the same on both.

Cloudflare builds separately from the GitHub Actions `ci` job. A red PR can still get a preview, so
the required-check branch protection on `main` (phase 2) is what stops it from merging.

## What the repo configures

| File                               | Purpose                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wrangler.jsonc`                   | Worker name `personal-site`, assets directory, `not_found_handling: "404-page"`. No `main`, so no Worker runs.                                                           |
| `apps/site/public/_headers`        | Security headers, long-lived cache on hashed JS/CSS/fonts, `no-cache` on HTML, `X-Robots-Tag: noindex` on `*.workers.dev` / `*.pages.dev`.                               |
| `apps/site/src/app/not-found`      | The 404 page. Angular does not prerender `**` routes, so a real `/404` route is prerendered and `scripts/postbuild.mjs` moves it to `404.html`.                         |
| `apps/site/site.config.json`       | The one place for the production origin. Feeds canonical, `og:url`, `sitemap.xml` and `robots.txt`. **Currently `https://example.com`: change it once the URL is known.** |
| `scripts/postbuild.mjs`            | Runs after `ng build` (part of `pnpm build`): `404.html`, `robots.txt`, `sitemap.xml`.                                                                                   |
| `lighthouserc.remote.json`          | Same assertions as `lighthouserc.json`, but for a deployed URL (no `staticDistDir`).                                                                                     |
| `scripts/check-headers.mjs`        | `pnpm check:headers` (also in CI): checks `_headers`, `404.html`, `robots.txt`, `sitemap.xml`, and that `_redirects` has no catch-all rewrite.                           |

Decisions:

- **`! Cache-Control` in `_headers`.** Matching rules merge, and the same header is comma-joined. Without
  detaching the `no-cache` from `/*`, hashed files would get `no-cache, public, max-age=..., immutable`.
- **No `_redirects`.** A catch-all rewrite to `index.html` would make unknown URLs return 200. Unknown
  URLs must return 404 with the 404 page.
- **CSP uses `'unsafe-inline'` for scripts and styles.** The prerendered HTML has inline critical CSS
  and Angular's inline hydration scripts, and per-build hashes cannot be set in a static `_headers`
  file. Revisit with hashes generated in `postbuild.mjs` if a stricter CSP is wanted. `worker-src blob:`
  is there for the later game and canvas work; tighten the CSP when the game lands.
- **Wrangler is not a dependency.** Workers Builds runs `npx wrangler deploy`, which downloads wrangler
  at build time. To pin it, add `wrangler` as a devDependency (Workers Builds then uses that version).
- **Rules that need a dashboard cannot be tested in CI.** The local Playwright server ignores `_headers`,
  so real header checks are the curl commands below.

## What you click (Cloudflare dashboard)

1. Sign in at dash.cloudflare.com. Go to **Workers & Pages → Create → Import a repository** (Workers).
2. Connect GitHub if asked and pick the `personal-site` repository.
3. Project name: `personal-site` (must match `name` in `wrangler.jsonc`).
4. Production branch: `main`.
5. Build command: `pnpm install --frozen-lockfile && pnpm build`
6. Deploy command: `npx wrangler deploy` (the default).
7. Root directory: `/` (leave empty).
8. **Build variables** (Settings → Build → Variables): set `NODE_VERSION` = `26` and `PNPM_VERSION` = `12.23.0`.
   Cloudflare's build image defaults to older versions (Node 22–24, pnpm 10). If the first build fails
   on the Node or pnpm version, this is the cause. The values are untested until the first build.
9. Save and deploy. Wait for the first build on `main`.
10. Go to **Settings → Build → Branch control** and make sure **Enable Preview Builds** is on, with the
    preview command `npx wrangler preview`. Every push to a non-production branch then builds a preview
    and gets a branch preview URL under the Worker's **Previews** section.
11. Open the live `*.workers.dev` URL. Put it in `apps/site/site.config.json` (`origin`) and merge that
    change. (A custom domain later: Settings → Domains & Routes, then update `origin` again.)
12. In GitHub: **Settings → Branches → protect `main`** and mark the `ci` check as required (see phase 2).

Notes:

- Pull requests from forks get no preview (Cloudflare does not expose build secrets to forks).
- Pushes to `main` deploy to production.
- The build does not need Git LFS content from `art/`. If the build ever needs files from there,
  enable LFS fetching in the Cloudflare build settings first.

## Checks after the first deploy

Replace `$URL` with the live URL, then with a PR preview URL.

```bash
curl -sI "$URL/" | grep -iE 'content-security|strict-transport|x-content-type|referrer|permissions|x-robots|cache-control'
curl -sI "$URL/does-not-exist" | head -1          # expect HTTP/2 404
curl -s  "$URL/does-not-exist" | grep -c 'Page not found'   # expect 1 or more
curl -sI "$URL/$(curl -s "$URL/" | grep -o 'main-[A-Z0-9]*\.js' | head -1)" | grep -i cache-control   # expect immutable
curl -s  "$URL/robots.txt"; curl -s "$URL/sitemap.xml"
```

Lighthouse on a preview URL (same assertions as CI, 0.95 or above on performance, accessibility,
best practices and SEO). Not part of `ci.yml`:

```bash
pnpm exec lhci collect --config=lighthouserc.remote.json --url="$URL/" && pnpm exec lhci assert --config=lighthouserc.remote.json
```

Note that SEO may drop below 0.95 on `*.workers.dev` because of the intentional `noindex`. If so, that
is expected there; check SEO again on the custom domain.
