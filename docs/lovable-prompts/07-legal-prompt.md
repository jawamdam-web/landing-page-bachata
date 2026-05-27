# 07 — Legal (privacy policy + regulamin + cookie consent + contact)

**Z planu:** IU-11
**Wymaga:** `02-landing` (footer linki)
**Output:** Strony `/privacy`, `/regulamin`, `/contact` + cookie consent banner + drafty do prawnika

---

## ⚠️ Disclaimer

Lovable wygeneruje **drafty** privacy policy + regulamin. **NIE są to dokumenty produkcyjne.** Operator MUSI:
1. Wynająć prawnika do review przed launch
2. Wypełnić konkretne dane (adres administratora, email kontaktowy, NIP/REGON, etc.)
3. Podpisać DPA z processors (Supabase, Google, Meta, Sentry, Plausible)

Drafty zapisz w `docs/legal/` jako `*-draft.md` — operator wymieni na final po review.

---

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Dodaję strony prawne + cookie consent banner — minimum GDPR/PL dla launchu.

### `src/features/legal/hooks/useCookieConsent.ts`

```ts
import { useEffect, useState } from "react";

interface ConsentState {
  analytics: boolean | null; // null = no decision yet
  timestamp: number | null;
}

const STORAGE_KEY = "bachatanapoli.cookie-consent";

function readStorage(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { analytics: null, timestamp: null };
    return JSON.parse(raw) as ConsentState;
  } catch {
    return { analytics: null, timestamp: null };
  }
}

export function useCookieConsent() {
  const [state, setState] = useState<ConsentState>(readStorage);

  useEffect(() => {
    const handler = () => setState(readStorage());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const persist = (next: ConsentState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
  };

  return {
    analytics: state.analytics,
    timestamp: state.timestamp,
    hasDecided: state.analytics !== null,
    acceptAll: () => persist({ analytics: true, timestamp: Date.now() }),
    acceptEssentialOnly: () => persist({ analytics: false, timestamp: Date.now() }),
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState({ analytics: null, timestamp: null });
    },
  };
}
```

### `src/features/legal/components/CookieConsentBanner.tsx`

```tsx
import { useCookieConsent } from "../hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CookieConsentBanner() {
  const consent = useCookieConsent();
  if (consent.hasDecided) return null;

  return (
    <div
      role="dialog"
      aria-label="Zgoda na cookies"
      className="fixed inset-x-0 bottom-0 z-50 md:bottom-4 md:right-4 md:inset-x-auto md:max-w-md"
    >
      <div className="bg-bg border border-border-strong rounded-lg shadow-lg p-5 m-3 md:m-0">
        <p className="text-sm text-fg">
          Używamy cookies do działania serwisu. Cookies analityczne (opcjonalne) pomagają nam ulepszyć platformę.{" "}
          <Link to="/privacy#cookies" className="text-accent-soft-foreground underline">
            Dowiedz się więcej
          </Link>
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button variant="ghost" onClick={consent.acceptEssentialOnly} className="flex-1">
            Tylko niezbędne
          </Button>
          <Button onClick={consent.acceptAll} className="flex-1 bg-accent text-accent-foreground hover:bg-accent-hover">
            Akceptuj wszystkie
          </Button>
        </div>
      </div>
    </div>
  );
}
```

Mount globally w `src/App.tsx`:
```tsx
<CookieConsentBanner />
<Toaster /> {/* already there */}
```

### Strony prawne — `src/pages/privacy.tsx`, `regulamin.tsx`, `contact.tsx`

Każda strona używa `PublicHeader` + `PublicFooter` + treść w `max-w-prose mx-auto py-12 px-5`.

#### `src/pages/privacy.tsx`

```tsx
import { MetaTags } from "@/components/seo/MetaTags";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PrivacyPolicy } from "@/features/legal/components/PrivacyPolicy";

export default function PrivacyPage() {
  return (
    <>
      <MetaTags title="Polityka prywatności — Bachata Napoli" description="Jak chronimy Twoje dane na bachatanapoli.pl" />
      <PublicHeader />
      <main className="container mx-auto max-w-prose px-5 py-12">
        <PrivacyPolicy />
      </main>
      <PublicFooter />
    </>
  );
}
```

#### `src/features/legal/components/PrivacyPolicy.tsx`

Static JSX z draftem (operator zastąpi prawniczą wersją). Sekcje:

```tsx
export function PrivacyPolicy() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Polityka prywatności</h1>
      <p className="text-fg-muted">Ostatnia aktualizacja: 27 maja 2026</p>

      <h2>1. Administrator danych</h2>
      <p>
        Administratorem Twoich danych osobowych jest <strong>[NAZWA FIRMY / OSOBA]</strong>,
        z siedzibą przy <strong>[ADRES]</strong>, NIP <strong>[NIP]</strong>.
        Kontakt w sprawach prywatności: <a href="mailto:[EMAIL]">[EMAIL]</a>.
      </p>

      <h2>2. Jakie dane zbieramy</h2>
      <ul>
        <li><strong>Konto:</strong> email, hasło (zaszyfrowane), opcjonalnie nazwa wyświetlana, avatar (z Google OAuth jeśli wybierzesz tę metodę)</li>
        <li><strong>Biblioteka:</strong> metadata filmów które zapisujesz (tytuł, link, notatki, foldery)</li>
        <li><strong>Techniczne:</strong> adres IP (w logach), informacje o przeglądarce (User-Agent), data ostatniej wizyty</li>
        <li><strong>Opcjonalnie (jeśli wyrazisz zgodę):</strong> dane analityczne (anonimowe — bez identyfikacji osoby) — Plausible Analytics</li>
      </ul>

      <h2>3. Cel i podstawa prawna</h2>
      <ul>
        <li><strong>Świadczenie usługi</strong> — art. 6 ust. 1 lit. b RODO (wykonanie umowy)</li>
        <li><strong>Bezpieczeństwo</strong> — art. 6 ust. 1 lit. f RODO (uzasadniony interes — zapobieganie nadużyciom)</li>
        <li><strong>Analityka</strong> — art. 6 ust. 1 lit. a RODO (zgoda przez cookie consent)</li>
      </ul>

      <h2>4. Okres przechowywania</h2>
      <p>Twoje dane przechowujemy do momentu usunięcia konta + 30 dni (backup retention). Po tym okresie dane są trwale usuwane.</p>

      <h2>5. Odbiorcy danych — z kim współpracujemy</h2>
      <p>Korzystamy z następujących procesorów (każdy ma podpisaną z nami DPA — Data Processing Agreement):</p>
      <ul>
        <li><strong>Supabase</strong> (USA, EU region Frankfurt) — hosting bazy danych, autentykacja</li>
        <li><strong>Google Cloud</strong> (jeśli logujesz się przez Google OAuth lub uploadujesz na YouTube)</li>
        <li><strong>Meta</strong> (jeśli dodajesz embed publicznych postów FB/IG)</li>
        <li><strong>Sentry</strong> (USA) — monitoring błędów aplikacji (anonimizowany)</li>
        <li><strong>Plausible</strong> (Niemcy, EU) — analityka bez cookies (jeśli wyrazisz zgodę)</li>
        <li><strong>[Hosting provider — np. Vercel / Cloudflare Pages / Netlify]</strong> — hosting strony</li>
      </ul>

      <h2>6. Transfer do państw trzecich</h2>
      <p>
        Niektóre procesory (Supabase, Google, Meta, Sentry) mają siedzibę w USA. Transfer danych odbywa się na podstawie
        Standardowych Klauzul Umownych (SCC) zatwierdzonych przez Komisję Europejską.
      </p>

      <h2>7. Twoje prawa</h2>
      <p>Masz prawo do:</p>
      <ul>
        <li>Dostępu do swoich danych</li>
        <li>Sprostowania danych</li>
        <li>Usunięcia danych ("prawo do bycia zapomnianym")</li>
        <li>Ograniczenia przetwarzania</li>
        <li>Przenoszenia danych (portability)</li>
        <li>Sprzeciwu wobec przetwarzania</li>
        <li>Cofnięcia zgody (analityka) w dowolnym momencie</li>
        <li>Wniesienia skargi do Prezesa UODO (uodo.gov.pl)</li>
      </ul>
      <p>Aby skorzystać z praw, napisz na <a href="mailto:[EMAIL]">[EMAIL]</a>.</p>

      <h2 id="cookies">8. Cookies</h2>
      <p>Używamy następujących cookies:</p>
      <ul>
        <li><strong>Niezbędne (zawsze włączone):</strong> session cookie z Supabase Auth — zapewnia że jesteś zalogowany. Bez tego serwis nie działa.</li>
        <li><strong>Analityczne (opcjonalne, za Twoją zgodą):</strong> Plausible — anonimowe zliczanie odsłon strony. NIE używamy cookies do trackingu cross-site.</li>
      </ul>

      <h2>9. Zmiany polityki</h2>
      <p>O istotnych zmianach poinformujemy Cię emailem lub przez powiadomienie w aplikacji.</p>
    </article>
  );
}
```

#### `src/pages/regulamin.tsx` + `src/features/legal/components/Regulamin.tsx`

Analogiczna struktura z sekcjami:
- Definicje (Usługa, Użytkownik, Konto, Treści)
- Świadczone usługi (biblioteka filmów + spotkania społecznościowe)
- Konto (warunki założenia, weryfikacja email, usunięcie konta)
- Treści Użytkownika (filmy, foldery, linki) — user oświadcza że ma prawo publikować
- Licencja udzielona platformie (ograniczona — tylko do hosting metadata + display Twoich treści)
- Ograniczenia (zakaz nielegalnych treści, spam, naruszenia praw autorskich)
- Odpowiedzialność (limity, force majeure)
- Reklamacje (procedura, terminy 30 dni)
- Cross-ref do polityki prywatności
- Postanowienia końcowe (właściwe prawo PL, sąd właściwy dla siedziby administratora)

(Lovable może wygenerować szablon — ale **prawnik musi go zweryfikować przed launch**.)

#### `src/pages/contact.tsx` + `src/features/legal/components/ContactInfo.tsx`

MVP: prosta strona kontaktowa z danymi (brak form z backendem — `mailto:` link):

```tsx
export function ContactInfo() {
  return (
    <article className="prose max-w-none">
      <h1>Kontakt</h1>
      <p>Chcesz porozmawiać o platformie, spotkaniach, albo masz uwagi? Napisz do nas.</p>

      <h2>Email</h2>
      <p><a href="mailto:kontakt@bachatanapoli.pl">kontakt@bachatanapoli.pl</a></p>

      <h2>Bachata Napoli — spotkania społeczności</h2>
      <p>📍 Pizzeria Napoli<br />ul. [adres]<br />59-300 Lubin</p>
      <p>📅 Czwartki, 19:00 – 22:00 (placeholder — sprawdź aktualny harmonogram na landing)</p>

      <h2>W sprawach prywatności / RODO</h2>
      <p>Pisz na ten sam adres email z dopiskiem "RODO" w temacie.</p>
    </article>
  );
}
```

### Drafty w `docs/legal/`

**`docs/legal/privacy-policy-draft.md`** — markdown version powyższego JSX, do review przez prawnika

**`docs/legal/regulamin-draft.md`** — analogicznie

### Update `PublicFooter` (z prompt 02) — wire-up linki

W `PublicFooter.tsx`:
```tsx
<nav>
  <ul>
    <li><Link to="/privacy">Polityka prywatności</Link></li>
    <li><Link to="/regulamin">Regulamin</Link></li>
    <li><Link to="/contact">Kontakt</Link></li>
  </ul>
</nav>
```

### Routing

W `src/router.tsx` — public routes (no auth guard):
- `/privacy` → `PrivacyPage`
- `/regulamin` → `RegulaminPage`
- `/contact` → `ContactPage`

## Constraints (DON'T)

- ❌ NIE skip cookie consent banner — wymóg GDPR dla analityki
- ❌ NIE ustaw cookies analityczne PRZED zgodą usera — analytics tylko po `consent.analytics === true`
- ❌ NIE używaj generic English templates — wszystko PL, dostosowane do polskiego prawa (RODO, UODO)
- ❌ NIE pomijaj sekcji "Twoje prawa" — fundamentalna dla RODO compliance
- ❌ NIE używaj `<a href="#">` placeholderów — wszystkie linki muszą być działające (do `/privacy#cookies` etc.)
- ❌ NIE rób cookie banner blokującego content (modal overlay) — too aggressive, zła UX. Bottom banner OK.
- ❌ NIE używaj słowa "Pliki cookies" (formalny ton) — voice "ty/ciepło" → "Używamy cookies" (krótkie, naturalne)
- ❌ NIE dodawaj newslettera w `/contact` — out of scope MVP
- ❌ NIE rób contact form z backend — `mailto:` wystarczy w MVP (mniej infrastruktury)

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 08

- [ ] Otwórz `/` w incognito → cookie banner pojawia się na dole ekranu (mobile bottom, desktop bottom-right)
- [ ] Klik "Tylko niezbędne" → banner znika; localStorage zawiera `bachatanapoli.cookie-consent` z `analytics: false`
- [ ] Reload `/` → banner NIE pokazuje się (consent zapamiętany)
- [ ] Klik "Akceptuj wszystkie" w nowym incognito → consent zapisany z `analytics: true`
- [ ] `/privacy` renderuje pełną politykę prywatności z sekcjami 1-9
- [ ] `/regulamin` renderuje regulamin
- [ ] `/contact` renderuje dane kontaktowe + email mailto link działa
- [ ] Footer wszystkich publicznych stron ma działające linki (`/privacy`, `/regulamin`, `/contact` — no 404)
- [ ] `/privacy#cookies` scroll'uje do sekcji "Cookies" (anchor link)
- [ ] axe accessibility scan na `/privacy`, `/regulamin`, `/contact` → 0 violations
- [ ] Typo readable: `max-w-prose` (672px) — linijki nie za szerokie
- [ ] Mobile: cookie banner nie zakrywa głównego content (sticky bottom OK; opcjonalnie dodaj `padding-bottom` do main jeśli przeszkadza)
- [ ] DevTools console: zero errors/warnings

## Common gotchas

- **localStorage SecurityError w incognito** — Safari incognito blokuje localStorage. Fallback: in-memory state (consent banner pokaże się każdorazowo). Dla MVP akceptowalne.
- **Cookie banner overflowy mobile-portrait** — sprawdź `max-h-[80vh] overflow-y-auto` na content; rzadko ale możliwe gdy content długi
- **Lovable proponuje GDPR consent z Sentry-style detailed checkbox list (Marketing, Functional, Analytics, Targeting)** — overkill dla MVP; wystarczą 2 opcje (akceptuj wszystkie / tylko niezbędne)
- **Lovable generuje english regulamin** — odmów, popraw na PL
- **Prawnik powie że draft jest niepełny** — to oczekiwane; draft to STARTING POINT, nie finalny dokument
- **Brak DPA z hostingiem (Vercel/CFP/Netlify)** — operator musi sprawdzić ich DPA terms; wszyscy major providers oferują DPA on request
