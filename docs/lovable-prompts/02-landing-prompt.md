# 02 — Landing page (5 sekcji + SEO + mobile-first)

**Z planu:** IU-5
**Wymaga:** `00-foundation`, `01-auth` (CTA "Załóż konto" → `/signup`)
**Output:** Publiczna landing strona — 6 sekcji + responsywny header/footer + SEO meta

---

## Context

Foundation + auth gotowe. `/` aktualnie ma smoke page — zastępujemy pełną landing.

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Buduję landing page dla **Bachata Napoli** — platforma społecznościowa dla bachateros z Lubina i okolic. Editorial Apple/Notion-style + ciepły akcent włoski (terracotta). Mobile-first. PL audience.

### Layout ogólny

- `PublicHeader` (sticky top) + `<main>` z sekcjami + `PublicFooter`
- Max-width content: `max-w-6xl mx-auto` (1152px) z padding `px-5 md:px-8 xl:px-10`
- Rytm sekcji: mobile `py-12`, tablet `py-16`, desktop `py-24`
- Hero: 1.5× (`py-20 md:py-32`)

### `src/components/layout/PublicHeader.tsx`

- Sticky top z `backdrop-blur-sm bg-bg/80 border-b border-border`
- Lewa: logo text "Bachata Napoli" (font-semibold, link do `/`)
- Prawa (desktop): linki nawigacyjne "Społeczność", "Instruktorzy", "Jak to działa" (scroll do sekcji `#id`) + Button "Zaloguj się" (ghost) + Button "Załóż konto" (primary terracotta)
- Mobile (<md): hamburger ikona → otwiera `<Sheet>` z linkami nawigacyjnymi + CTA na dole
- Auth state aware: gdy zalogowany — zamiast 2 CTA pokazuj "Moja biblioteka" link (→ `/library`)

### `src/components/layout/PublicFooter.tsx`

- 3 kolumny (mobile = stack):
  - "Bachata Napoli — Twoja biblioteka tańca + spotkania w Lubinie"
  - Nawigacja: linki do `/privacy`, `/regulamin`, `/contact`
  - Social (placeholder): Instagram, Facebook (ikony Lucide)
- Bottom: "© 2026 Bachata Napoli. Wszystkie prawa zastrzeżone."

### Sekcje landing — kolejność na `/`

#### 1. `<Hero />` (`src/features/landing/components/Hero.tsx`)

**Mobile** (default):
```
[Foto hero 4:5 aspect ratio]
↓
<h1 display> Twoja biblioteka tańca + spotkania w Lubinie </h1>
<p body_lg muted> Zapisuj filmy z zajęć bachaty z YouTube, Facebooka i własnego telefonu. Lokalna społeczność dancerów w jednym miejscu. </p>
↓
[Button primary "Załóż konto"] (full-width, h-12)
[Button ghost "Zobacz, jak to działa"] → scroll do #jak-to-dziala
```

**Desktop (>=md)** — 2-col grid (60/40):
- Lewa: text content (display heading, tagline, CTAs side-by-side)
- Prawa: foto hero 16:9 aspect

**Foto:**
```html
<picture>
  <source media="(min-width: 768px)" srcSet="/hero-placeholder-desktop.jpg" />
  <img src="/hero-placeholder-mobile.jpg" alt="Para tańcząca bachatę w pizzerii Napoli w Lubinie. W tle widać właściciela z kawałkiem pizzy i telefonem." loading="eager" fetchPriority="high" className="w-full h-full object-cover rounded-2xl" />
</picture>
```

(Placeholder JPEG-i — można na razie stock/unsplash bachata dance; operator wgra docelowe po photoshoot.)

**Display heading rozmiar:**
- Mobile: `text-[2.5rem] leading-[1.05] tracking-[-0.025em] font-semibold`
- Desktop: `text-[4rem] leading-none tracking-[-0.025em]`

#### 2. `<AboutNapoli />` (`#dlaczego-napoli`)

Eyebrow + heading + prose w max-w-prose (672px), centered:

```
<p meta uppercase tracking-wider> DLACZEGO NAPOLI? </p>
<h2> Wszystko zaczęło się od pizzy </h2>
<p body_lg> Bachata Napoli to historia o tym, jak włoska pizzeria w Lubinie stała się miejscem spotkań tancerzy. Właściciel, Jarek, połączył dwie pasje — dobre jedzenie i bachatę — i zaprosił do współpracy instruktorów Bachata Rebel. Tak powstała lokalna społeczność, która spotyka się regularnie na zajęciach, practisach i wspólnej kolacji. </p>
<p body_lg> Platformę, na której teraz jesteś, zbudowaliśmy żeby filmy z naszych zajęć nie gubiły się w rolkach telefonów. Twoja biblioteka — twoje notatki — twój postęp w tańcu. </p>
```

(Placeholder copy — biznes dopracuje. Tone: ciepły, partnerski, opowiedziany historią, nie marketing-speak.)

#### 3. `<HowItWorks />` (`#jak-to-dziala`)

Eyebrow + heading + 3-column grid (mobile = stack):

```
JAK TO DZIAŁA

Trzy sposoby zapisywania filmów

[Karta 1]                    [Karta 2]                    [Karta 3]
<Youtube icon lg>            <Facebook icon lg>           <UploadCloud icon lg>
Wklej link z YouTube          Wklej post z FB/IG          Wgraj plik z telefonu
Wklej URL filmu który już     Publiczne nagrania ze       Wgrywamy bezpośrednio
jest na YouTube — wyświetlamy stron innych — embed         na Twoje konto YouTube
oficjalny embed w bibliotece. działa dopóki autor          jako unlisted. Twoje filmy,
                              nie usunie posta.            Twoja prywatność.
```

Każda karta: `border border-border bg-bg-subtle rounded-lg p-6`, ikona w terracotta circle background.

#### 4. `<BachataSocial />` (`#spotkania`)

Featured card spanning content width:

```
[Eyebrow] SPOŁECZNOŚĆ
<h2> Bachata Napoli — Social & Practise </h2>

[Card z 3 kolumnami (mobile stack):]
  📍 GDZIE          📅 KIEDY          🎯 CO
  Pizzeria Napoli   Czwartki          Krótka lekcja
  ul. [adres],      19:00 – 22:00     z Małgosią i Szymonem
  Lubin             (placeholder)     + practise + integracja

[Body text] Spotykamy się raz w tygodniu w pizzerii Napoli na Starym Mieście w Lubinie. Niezależnie od poziomu — od pierwszych kroków do zaawansowanych kombinacji. Pierwsza godzina to lekcja od Bachata Rebel, potem swobodny practise + kolacja.

[Button outline (NIE primary — primary CTA jest w hero) "Napisz do nas"] → mailto: lub `/contact`
```

(W MVP brak RSVP — statyczne info. Dodanie RSVP odroczone do v1.1.)

#### 5. `<Instructors />` (`#instruktorzy`)

```
[Eyebrow] INSTRUKTORZY

<h2> Małgosia i Szymon Andrzejewscy </h2>
<p body_lg> Para tancerzy i instruktorów Bachata Rebel — szkoły tańca z [miasto]. Prowadzą cykl zajęć w Lubinie w ramach Bachata Napoli. </p>

[Grid 2-col mobile/desktop, stack <md:]
  [Card 1 — Małgosia]                    [Card 2 — Szymon]
  [Foto avatar circular lg]              [Foto avatar circular lg]
  <h3> Małgosia Andrzejewska </h3>       <h3> Szymon Andrzejewski </h3>
  <p body_muted> Bio placeholder...      <p body_muted> Bio placeholder...
  od X lat... </p>                       od X lat... </p>

[Link na dole] Dowiedz się więcej o szkole Bachata Rebel →
```

(Bio + foto placeholder; operator dostarczy realne.)

#### 6. `<FinalCTA />`

Sekcja z terracotta SOFT background (`bg-accent-soft`), centered content:
```
<h2 dark-friendly> Gotowy zacząć? </h2>
<p body_lg> Załóż konto i miej swoje filmy z zajęć w jednym miejscu — bez gubienia w rolce telefonu. </p>
<Button primary "Załóż konto za darmo" lg> → `/signup`
<p meta> Bez karty kredytowej. Bez subskrypcji. </p>
```

### SEO meta — w `src/components/seo/MetaTags.tsx`

Prosty hook bez react-helmet (MVP):
```tsx
import { useEffect } from "react";

interface MetaTagsProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "article";
}

export function MetaTags({ title, description, ogImage = "/og-image.jpg", ogType = "website" }: MetaTagsProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:image", `${window.location.origin}${ogImage}`, true);
    setMeta("og:type", ogType, true);
    setMeta("twitter:card", "summary_large_image");
  }, [title, description, ogImage, ogType]);

  return null;
}
```

Użycie w `src/pages/index.tsx`:
```tsx
<MetaTags
  title="Bachata Napoli — Twoja biblioteka tańca + spotkania w Lubinie"
  description="Zapisuj filmy z zajęć bachaty z YouTube, Facebooka i własnego telefonu. Lokalna społeczność dancerów w Lubinie."
/>
```

### Placeholder assets w `public/`

- `hero-placeholder-mobile.jpg` (1080×1350 4:5, można Unsplash bachata)
- `hero-placeholder-desktop.jpg` (1920×1080 16:9)
- `instruktorzy-malgosia-placeholder.jpg` (square 800×800)
- `instruktorzy-szymon-placeholder.jpg`
- `og-image.jpg` (1200×630, brand)

### Animacje (subtle)

- Sekcje fade-in + slideY 8px on scroll (Intersection Observer, threshold 0.1)
- Stagger max 6 elementów; reszta instant
- Respect `prefers-reduced-motion` (już w `global.css` z prompt 00 — animacje wyłączone gdy reduce)
- Buttons primary: `active:scale-[0.96] transition-all duration-150 ease-out`

### Smooth scroll dla anchor links

W `index.html`:
```html
<html lang="pl" style="scroll-behavior: smooth;">
```

I global override w `global.css` (już dodane w prompt 00):
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }
}
```

## Constraints (DON'T)

- ❌ NIE używaj solid terracotta na hero background — zostaje editorial cream. Terracotta TYLKO na CTA + soft accent w Final CTA + focus ring.
- ❌ NIE dodawaj autoplay video w hero — w MVP statyczna foto (R3 mówi że v2+ może być wideo)
- ❌ NIE używaj parallax scroll — mobile killer + accessibility nightmare
- ❌ NIE rób carousel/slider w sekcji Instructors — 2 osoby, statyczna siatka
- ❌ NIE używaj angielskich copy — wszystko PL, voice "ty/ciepło"
- ❌ NIE dodawaj cookie banner tutaj — to robi prompt 07 (legal). Jeśli Lovable proponuje — odmów.
- ❌ NIE pomijaj `alt` na obrazach (WCAG)
- ❌ NIE pomijaj `lang="pl"` w `<html>`
- ❌ NIE używaj `<div>` zamiast semantic tags — `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 03-library

- [ ] `/` na 375×667 (iPhone SE viewport): wszystkie 6 sekcji widoczne po scroll, brak horizontal scroll
- [ ] `/` na 1280×800 desktop: hero 2-col layout, instruktorzy 2-col grid, header sticky widoczny po scroll
- [ ] Header mobile (<md): hamburger ikona → otwiera Sheet z nawigacją + CTA
- [ ] CTA primary "Załóż konto" → redirect do `/signup`
- [ ] "Zobacz jak to działa" → smooth scroll do `#jak-to-dziala`
- [ ] `document.title` zawiera "Bachata Napoli"; `<meta name="description">` istnieje
- [ ] axe accessibility extension scan na `/` → 0 violations
- [ ] Lighthouse mobile audit `/`: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90
- [ ] Zalogowany user widzi w header "Moja biblioteka" zamiast 2 CTA
- [ ] DevTools `prefers-reduced-motion: reduce` → sekcje pojawiają się instant
- [ ] Tap target check: wszystkie buttons mobile ≥ 44px height
- [ ] Vizualnie: paleta terracotta + cream — NIE niebieski/zielony/szary
- [ ] Final CTA section ma `bg-accent-soft` (jasny terracotta-cream), nie solid

## Common gotchas

- **Lovable proponuje generic stock image z Unsplash** — OK jako placeholder, ale upewnij się że jest tematycznie tancerzy/społeczność, nie generic pizza/restaurant
- **Lovable dodaje "Get Started" zamiast "Załóż konto"** — koryguj copy, PL only
- **Hero text za duży na mobile** — sprawdź breakpoint, mobile `text-[2.5rem]` nie `text-7xl`
- **Sekcja Bachata Social wygląda jak event card z RSVP** — to celowo statyczne info; brak RSVP w MVP
- **Smooth scroll nie działa** — sprawdź `scroll-behavior: smooth` w `<html>` + brak `prefers-reduced-motion` override
- **Picture element `srcSet` nie ładuje desktop variantu** — sprawdź syntax `media="(min-width: 768px)"` + plik istnieje w `public/`
