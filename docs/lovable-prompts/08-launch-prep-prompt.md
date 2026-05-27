# 08 — Launch readiness (SEO prerender + Sentry + Plausible + sitemap + structured data)

**Z planu:** IU-12
**Wymaga:** wszystkie wcześniejsze prompty (`02-landing`, `07-legal` szczególnie)
**Output:** Production-ready — landing/privacy/regulamin/contact prerendered, Sentry capturje błędy, lekka analityka, sitemap + robots + structured data

---

## Pre-flight

- [ ] Sentry projects utworzone (`bachatanapoli-frontend` + `bachatanapoli-edge`) — DSN-y w env staging + prod
- [ ] Plausible site `bachatanapoli.pl` utworzony (lub Umami instance jeśli self-hosted)
- [ ] DNS `bachatanapoli.pl` → hosting (Vercel / Cloudflare Pages / Netlify) — decyzja operacyjna
- [ ] SSL cert provisioned (auto via hosting)

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Doprowadzam aplikację do production-ready: SEO prerender, error tracking, analytics, structured data, sitemap.

### 1. SEO prerender — `vite-plugin-ssg` lub `vite-plugin-prerender`

**Rekomendacja:** `vite-plugin-prerender` (chrome-headless) — prostszy setup, działa OOTB z React SPA. `vite-ssg` lepszy ale wymaga Vue-style routes (forked dla React istnieje ale less mature).

Install: `npm install -D vite-plugin-prerender`

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import prerender from "vite-plugin-prerender";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    prerender({
      staticDir: path.join(__dirname, "dist"),
      routes: ["/", "/privacy", "/regulamin", "/contact", "/login", "/signup"],
      renderer: "@prerenderer/renderer-puppeteer",
      rendererOptions: {
        renderAfterDocumentEvent: "render-ready",
      },
      postProcess(renderedRoute) {
        // Strip any error overlay or dev artifacts
        renderedRoute.html = renderedRoute.html
          .replace(/<script src="\/@vite\/client".*?<\/script>/, "");
        return renderedRoute;
      },
    }),
  ],
});
```

W `src/main.tsx` — wyemituj event po hydration:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);

// Sygnał dla prerender plugin że strona jest renderowana
requestIdleCallback?.(() => document.dispatchEvent(new Event("render-ready")));
setTimeout(() => document.dispatchEvent(new Event("render-ready")), 1500);
```

**Auth routes NIE prerender'owane** — pozostają SPA-only (`index.html` fallback przez router client-side).

### 2. Sentry React — `src/lib/sentry.ts`

Install: `npm install @sentry/react`

```ts
import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn("Sentry DSN missing — skipping init (dev mode?)");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,           // brak replay dla zwykłych sesji
    replaysOnErrorSampleRate: 1.0,         // 100% replay dla error events
    tracePropagationTargets: [/^https:\/\/.*\.supabase\.co/],
  });
}
```

Init w `src/main.tsx` **PRZED** React render:
```tsx
import { initSentry } from "./lib/sentry";
initSentry();
// ... reszta jak wyżej
```

### 3. Sentry Deno (Edge Functions) — `supabase/functions/_shared/sentry.ts`

```ts
import * as Sentry from "https://deno.land/x/sentry@8.0.0/index.mjs";

const SENTRY_DSN = Deno.env.get("SENTRY_DSN_EDGE");

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: Deno.env.get("ENVIRONMENT") ?? "production",
    tracesSampleRate: 0.1,
  });
}

export function withSentry(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      if (SENTRY_DSN) Sentry.captureException(err);
      console.error("Edge function error:", err);
      throw err;
    }
  };
}

export { Sentry };
```

Update **każdy** Edge Function (`fetch-youtube-metadata`, `validate-meta-embed`):
```ts
import { withSentry } from "../_shared/sentry.ts";

serve(withSentry(async (req) => {
  // ... existing handler
}));
```

### 4. Plausible Analytics — `src/lib/analytics.ts`

Plausible jest cookieless ale w spirit GDPR + nasz cookie consent, gate'ujemy go za `useCookieConsent`.

W `index.html` (po Cookie Consent decyzja — load conditional):

NIE wkładaj `<script defer data-domain="..." src="https://plausible.io/js/script.js">` do `index.html` na sztywno. Zamiast tego — dynamic load:

```ts
// src/lib/analytics.ts
let isLoaded = false;

export function loadPlausible() {
  if (isLoaded || typeof window === "undefined") return;
  if (!import.meta.env.VITE_PLAUSIBLE_DOMAIN) return;

  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
  isLoaded = true;
}

export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  // @ts-expect-error — plausible is globally injected
  window.plausible?.(name, { props });
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}
```

W `App.tsx` — load po consent:
```tsx
import { useEffect } from "react";
import { useCookieConsent } from "@/features/legal/hooks/useCookieConsent";
import { loadPlausible } from "@/lib/analytics";

function App() {
  const { analytics } = useCookieConsent();

  useEffect(() => {
    if (analytics === true) loadPlausible();
  }, [analytics]);

  return (
    <>
      {/* ... reszta App */}
    </>
  );
}
```

**Custom events** w aplikacji (track w stosownych miejscach):
```ts
// Po success signup
trackEvent("signup", { method: "email" }); // lub "google"

// Po success createVideoFromYoutubeLink
trackEvent("video_added", { source: "youtube_link" });

// Po createShareToken
trackEvent("share_created", { target_type: "video" });

// W BachataSocial section onClick CTA
trackEvent("meeting_info_viewed");
```

### 5. Structured Data (JSON-LD) — `src/components/seo/StructuredData.tsx`

```tsx
import { useEffect } from "react";

interface StructuredDataProps {
  data: Record<string, unknown>;
  id?: string;
}

export function StructuredData({ data, id = "structured-data" }: StructuredDataProps) {
  useEffect(() => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [data, id]);

  return null;
}
```

Użycie w `src/pages/index.tsx` (landing):
```tsx
<StructuredData data={{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Bachata Napoli",
  "url": "https://bachatanapoli.pl",
  "description": "Twoja biblioteka tańca + spotkania w Lubinie",
  "inLanguage": "pl",
}} />

<StructuredData id="structured-data-business" data={{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Bachata Napoli — Social & Practise",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[adres pizzerii Napoli]",
    "addressLocality": "Lubin",
    "postalCode": "59-300",
    "addressCountry": "PL",
  },
  "url": "https://bachatanapoli.pl",
  "description": "Cykliczne spotkania bachatowe w Lubinie — lekcje, practise, integracja",
}} />

<StructuredData id="structured-data-org" data={{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Bachata Napoli",
  "url": "https://bachatanapoli.pl",
  "sameAs": [
    "https://www.facebook.com/bachatanapoli",
    "https://www.instagram.com/bachatanapoli",
  ],
}} />
```

### 6. Sitemap — `scripts/generate-sitemap.ts`

```ts
import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://bachatanapoli.pl";
const PUBLIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/login", changefreq: "monthly", priority: 0.5 },
  { path: "/signup", changefreq: "monthly", priority: 0.7 },
  { path: "/privacy", changefreq: "yearly", priority: 0.3 },
  { path: "/regulamin", changefreq: "yearly", priority: 0.3 },
  { path: "/contact", changefreq: "monthly", priority: 0.4 },
];

const today = new Date().toISOString().split("T")[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_ROUTES.map(r => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

fs.writeFileSync(path.join(__dirname, "..", "dist", "sitemap.xml"), xml);
console.log("Sitemap generated.");
```

W `package.json`:
```json
{
  "scripts": {
    "build": "vite build && tsx scripts/generate-sitemap.ts"
  }
}
```

Install: `npm install -D tsx`

### 7. `public/robots.txt`

```
User-agent: *
Allow: /

Disallow: /library
Disallow: /library/*
Disallow: /settings
Disallow: /s/
Disallow: /auth-callback
Disallow: /reset-password

Sitemap: https://bachatanapoli.pl/sitemap.xml
```

### 8. Preconnect hints w `index.html`

```html
<link rel="preconnect" href="https://<your-supabase-project>.supabase.co">
<link rel="preconnect" href="https://i.ytimg.com">
<link rel="dns-prefetch" href="https://plausible.io">
<link rel="dns-prefetch" href="https://o<project>.ingest.sentry.io">
```

## Constraints (DON'T)

- ❌ NIE prerender `/library`, `/settings`, `/s/<token>` — zawierają user content / private; SPA-only
- ❌ NIE prerender'uj z aktywną sesją Sentry replay — replay zniszczy snapshot HTML; pomiń Replay w build mode
- ❌ NIE wklejaj Plausible script bezpośrednio w `index.html` — load po cookie consent
- ❌ NIE pomijaj `tracePropagationTargets` w Sentry — bez tego trace się nie propagują na backend calls
- ❌ NIE używaj `replaysSessionSampleRate: 1.0` — to gigabytes/dzień; tylko `replaysOnErrorSampleRate: 1.0` (sample on errors)
- ❌ NIE skipuj `maskAllText: true` w Replay — privacy: nie chcemy nagrywać user inputs
- ❌ NIE używaj angielskich values w JSON-LD `description` — pl content
- ❌ NIE skipuj `inLanguage: "pl"` w WebSite schema — sygnał dla Google PL audience
- ❌ NIE blokuj `/library` w robots.txt jako "to chronimy" — chronimy auth gate'em; w robots Disallow tylko nie-indeksować
- ❌ NIE pomijaj `prefers-reduced-motion` w analytics tracking — nie trackuj scroll events przy reduce

<!-- ============================ END PASTE ============================ -->

## Acceptance — final pre-launch

- [ ] `npm run build` przechodzi bez błędów
- [ ] `dist/index.html` zawiera prerendered content (curl test: response zawiera "Bachata Napoli" + sekcje hero, NIE pusty SPA shell)
- [ ] `dist/privacy/index.html` zawiera prerendered policy content
- [ ] `dist/regulamin/index.html` zawiera prerendered regulamin
- [ ] `dist/sitemap.xml` istnieje, valid XML z 6 public routes
- [ ] `dist/robots.txt` istnieje z Sitemap directive
- [ ] DevTools view source `/` (po deploy) → znajdź `<script type="application/ld+json">` z LocalBusiness schema
- [ ] Google Rich Results Test (https://search.google.com/test/rich-results) na deployed URL: detect LocalBusiness + WebSite
- [ ] Sentry frontend test: throw new Error w komponencie staging → event pojawia się w Sentry dashboard ~30s
- [ ] Sentry edge test: throw w Edge Function → captureException + event w dashboard
- [ ] Plausible test: po cookie accept → otwórz `/` → event "pageview" w Plausible dashboard ~realtime
- [ ] Custom events: signup → "signup" event w Plausible
- [ ] Lighthouse mobile `/`: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- [ ] Lighthouse mobile `/privacy`: SEO ≥ 95
- [ ] DevTools Network: preconnect hints działają (Supabase + i.ytimg.com pierwsze requests są szybsze niż bez preconnect)
- [ ] `robots.txt` poprawnie blokuje `/library` — verify w Google Search Console "Robots.txt Tester"

## Pre-launch operator checklist (z planu technicznego)

- [ ] YT OAuth verification APPROVED przez Google (KRYTYCZNE dla IU-9 do public users — jeśli IU-9 jeszcze nie zrobione)
- [ ] YT quota extension APPROVED (60+ uploadów/dzień)
- [ ] Privacy policy + regulamin podpisane przez prawnika
- [ ] DPA z wszystkimi processors (Supabase, Google, Meta, Sentry, Plausible, hosting)
- [ ] DNS `bachatanapoli.pl` → hosting + SSL cert active
- [ ] Sentry capturje prod errors (test error sent + visible)
- [ ] Plausible zbiera events (test pageview + signup)
- [ ] Hero photo finalna wgrana (lub akceptowalny placeholder dla soft launch)
- [ ] Final copy w wszystkich landing sekcjach
- [ ] Soft pre-launch (invite kilku userów) → feedback round → fix
- [ ] Google Search Console: verification + sitemap submitted
- [ ] Plausible site verified (DNS lub script check)
- [ ] Backup plan: instant rollback w hosting (Vercel/CFP/Netlify rollback button)
- [ ] Monitoring alerts skonfigurowane (Sentry error rate > 1% w 5min window)
- [ ] Publiczne ogłoszenie (FB, IG, lokalna społeczność)

## Common gotchas

- **Prerender failuje na auth-gated routes** — sprawdź `routes` w vite.config.ts; wyklucz `/library`, `/settings`, `/s/*`
- **Prerender renderuje pusty `<div id="root">` zamiast content** — sprawdź `render-ready` event w `main.tsx`; default puppeteer timeout = 30s, wystarczy
- **Sentry DSN exposed w bundle** — to OK; DSN jest publiczny (rate limited per project). Source maps zalecane uploadować osobno via Sentry CLI w CI.
- **Plausible events się nie pojawiają** — sprawdź `data-domain` matchuje site w Plausible dashboard; verify CORS allow your domain
- **JSON-LD parsuje się 2× w prerender + hydration** — `useEffect` cleanup z `getElementById(id)?.remove()` rozwiązuje
- **Lighthouse SEO score < 90** — najczęściej brak `<title>` lub `<meta description>` na prerendered page; sprawdź czy `MetaTags` component renderuje przed render-ready event
- **Google Search Console: "Discovered — currently not indexed"** — normalne, pierwsze indexing trwa 1-4 tygodnie; submitting sitemap przyspiesza
- **Lovable proponuje Google Analytics zamiast Plausible** — GA wymaga cookies (3 kategorie!) + gigantyczne complexity GDPR. Plausible jest cookieless, MVP-friendly, prywatność-first
- **Vite-plugin-prerender problem z React 19 server components** — używamy SPA mode (no RSC), więc OK; jeśli Lovable próbuje wrzucić RSC pattern — odmów
