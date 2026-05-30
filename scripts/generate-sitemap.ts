/**
 * generate-sitemap.ts — build-time script generujący dist/sitemap.xml
 *
 * Uruchomienie: bun run scripts/generate-sitemap.ts
 * Dodaj po buildzie: bun run build && bun run generate-sitemap
 *
 * Zasady:
 * - Static routes publiczne: /, /privacy, /regulamin, /contact, /signup, /login
 * - Exclude: /library*, /settings*, /s/* (auth-only, bez wartości SEO)
 * - Lastmod: data buildu (ISO 8601 date only)
 * - Wymaga że dist/ już istnieje (po `bun run build`)
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '../dist');
const SITEMAP_PATH = resolve(DIST_DIR, 'sitemap.xml');

const SITE_URL = 'https://bachatanapoli.pl';

const STATIC_ROUTES = [
  '/',
  '/privacy',
  '/regulamin',
  '/contact',
  '/signup',
  '/login',
] as const;

const lastmod = new Date().toISOString().split('T')[0];

function generateSitemapXml(): string {
  const urls = STATIC_ROUTES.map((route) => {
    const loc = route === '/' ? SITE_URL : `${SITE_URL}${route}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function main(): void {
  if (!existsSync(DIST_DIR)) {
    console.warn(
      `[generate-sitemap] dist/ nie istnieje — uruchom najpierw 'bun run build'`,
    );
    mkdirSync(DIST_DIR, { recursive: true });
    console.log('[generate-sitemap] Utworzono dist/ (dla testów lokalnych)');
  }

  const xml = generateSitemapXml();
  writeFileSync(SITEMAP_PATH, xml, 'utf-8');
  console.log(`[generate-sitemap] Wygenerowano: ${SITEMAP_PATH}`);
  console.log(`[generate-sitemap] Routes: ${STATIC_ROUTES.join(', ')}`);
  console.log(`[generate-sitemap] Lastmod: ${lastmod}`);
}

main();
