# Review Fazy 2 — Auth + landing (IU-4 + IU-5)

**Data:** 2026-05-29
**Branch:** `feature/bachata-napoli-mvp`
**Zakres:** `git diff c6b35b9..HEAD` — 59 plików, ~3924 insertions (IU-4 Supabase Auth + IU-5 publiczny landing)
**Metoda:** 5 agentów równolegle (security, performance, architecture+TS, test-coverage, E2E browser) + konsolidacja.

## Severity gate

> ⚠️ **KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× P1 (blocking), 5× P2 (important), 11× P3 (nit) + 1 przypomnienie deploymentowe. Faza gotowa do kontynuacji; P2 do naprawy (część naturalnie w IU-6 / przed prod).

CLI na żywo: `typecheck` ✓ · `lint` ✓ · `test` **74/74** ✓ · `build` ✓. Eager JS **135.21 KB gzip** (limit 200). Constraint #3 (supabase poza eager landing) zweryfikowany — supabase osobny lazy chunk 210 KB.

---

## 🔴 P1 — blocking

Brak.

---

## 🟠 P2 — important

### P2-1 [perf] react-query w eager chunku, używany dopiero od IU-6
`src/main.tsx:4,24-28,37` — `QueryClientProvider` na root → `@tanstack/react-query` (QueryCache/MutationCache, ~12-15 KB gzip) ląduje w eager chunku ładowanym na `/`. Landing nie ma ani jednego `useQuery`/`useMutation`. Komentarz w pliku sam przyznaje "używany od IU-6+". Naruszenie coding-rules §12 (nie ładuj gdy nie potrzebujesz) + §3 (nie abstrahuj na przyszłość).
**Fix (zalecany):** wprowadź `QueryClientProvider` dopiero w IU-6 (usuń z `main.tsx` teraz) **lub** przenieś do layoutu protected routes (`/library` chain, już lazy). Naturalny moment: start IU-6.

### P2-2 [arch] `AuthProvider` omija warstwę `auth.ts`
`src/features/auth/components/AuthProvider.tsx:44-57` (vs `auth.ts:131-136`) — provider woła `supabase.auth.getSession()` i `supabase.auth.onAuthStateChange()` bezpośrednio, choć `auth.ts` ma `getCurrentSession()`, a docstring `auth.ts` mówi "nigdy `supabase.auth.*` bezpośrednio". Niespójność świadoma (lazy import w useEffect, by nie psuć dev bez `.env.local`), ale `onAuthStateChange` nie ma odpowiednika w warstwie API.
**Fix:** dodać cienki `onAuthStateChange(cb)` + użyć `getCurrentSession()` w providerze (cała wiedza o `supabase.auth.*` w jednym pliku), **lub** dopisać w docstringu `auth.ts` że `AuthProvider` to świadomy drugi konsument (subscription bootstrap).

### P2-3 [test] `AuthProvider` cleanup/unsubscribe nie asertowany
`src/features/auth/components/AuthProvider.tsx:39-66`, test `useAuth.test.tsx` — useEffect ma abort flag `active` + `subscription.unsubscribe()` (wymóg §13), ale test sprawdza tylko że `onAuthStateChange` jest wołany; mock `mockUnsubscribe` (useAuth.test.tsx:18) **nigdy nie asertowany**.
**Fix:** test `unmount()` → `expect(mockUnsubscribe).toHaveBeenCalledOnce()` + brak setState po unmount.

### P2-4 [test] brak testów `useRequireAuth` / `RequireAuth` (protected route guard)
`src/features/auth/hooks/useRequireAuth.ts`, `src/features/auth/components/RequireAuth.tsx` — zero testów dla core security logic (R8). Czysto unit-testowalne (mimo że E2E pokrył Agent 5): (a) `unauthenticated` → `navigate('/login?next=<encoded>')`, (b) `loading` → BRAK redirectu (invariant przeciw fałszywemu redirectowi), (c) loader gdy loading / children gdy authenticated. Naruszenie §2 (nowa funkcja = happy + error case).
**Fix:** dodać `useRequireAuth.test.tsx`.

### P2-5 [a11y] kontrast WCAG 2 AA fail na accent terracotta (E2E axe-core)
Token `accent` (`oklch(0.62 0.13 38)` ≈ `#c76749`) — pełny axe-core 4.10.2 scan: **1 serious violation, 5 nodów**:
- Biały `#fcfcfc` na terracotta → **3.74:1** (wymóg 4.5:1) — primary CTA "Załóż konto" (header, hero, FinalCTA, submit signup)
- Subtekst `text-accent-foreground/85` `#f4e5e1` na terracotta → **3.13:1** — akapit w FinalCTA

Realny fail dostępności na GŁÓWNYM CTA aplikacji. Wcześniejszy "smoke a11y PASS" (IU-5) odłożył pełny axe — ten scan ujawnił naruszenie.
**Fix:** przyciemnić accent (obniżyć L w OKLCH, np. ~0.55) **lub** ciemniejszy foreground na accent. Dotyka `src/global.css` (`@theme`) + `docs/DESIGN.md` + wszystkie primary buttony — decyzja brandowa (lekkie przyciemnienie utrzyma "ciepły, nie krzyczy").

---

## 🟡 P3 — nit (opcjonalne)

- 🟡 [sec/§4] `AuthProvider.tsx:43-60` — `bootstrap()` `void`-owane bez `.catch`; jeśli dynamiczny `import('@/lib/supabase')` rzuci (brak env w runtime) provider zostaje na stałe w `loading` zamiast gracefully → `unauthenticated` (wieczny loader na protected route). Powiązane z P2-2/P2-3 (AuthProvider hotspot). Fix: `try/catch` + `setState(deriveState(null))`.
- 🟡 [arch] `LoginForm.tsx:21-30` + `auth-callback.tsx:18-25` — duplikat `resolveNextPath` (open-redirect guard `/` ale nie `//`). To **security logic** z ryzykiem rozjazdu (poprawka w jednym miejscu pominie drugie). Wyciągnąć do `src/features/auth/lib/resolve-next-path.ts` + test (§2, §3).
- 🟡 [test] `auth.test.ts` — brak error-case dla `getCurrentSession` i `linkGoogleIdentity` (happy-only). §2 wymaga happy + error.
- 🟡 [test] brak testów `ForgotPasswordForm` / `ResetPasswordForm` (logika: "ten sam komunikat niezależnie od wyniku" + redirect po sukcesie). Luka spójności względem LoginForm/SignupForm.
- 🟡 [test] `GoogleSignInButton` bez własnego testu (error-handling `isPending` reset + toast nietestowane; w formularzach stubowany).
- 🟡 [test] `MetaTags.test.tsx` — brak asercji na `og:description`, `twitter:title/description/image` (komponent ustawia 9 tagów, test sprawdza 6).
- 🟡 [perf] `PublicHeader.tsx:5-12,90-152` — radix Dialog (Sheet) w eager; kandydat na `React.lazy` montowany przy otwarciu menu. Zostaw do momentu gdy eager zbliży się do limitu.
- 🟡 [perf] `Reveal.tsx:32-37,52-59` — `prefersReducedMotion()` (matchMedia) wołane per-instancja (~8-10× na landingu). Policz raz (module-level/useMemo). Mikro-opt, bezpiecznie zostawić.
- 🟡 [sec] `src/pages/library/index.tsx:20` — `user.email` renderowany w UI (PII; React escape'uje, walidowane). Informacyjne, bez akcji dla MVP.
- 🟡 [arch] `Instructors.tsx:58` — kolejność `rel="noreferrer noopener"` (konwencja: `noopener noreferrer`). Funkcjonalnie identyczne.
- 🔵 [deployment] `auth.ts:98-103` resetPassword — anti-enumeration na poziomie kodu OK; realna ochrona (timing/rate) zależy od rate limiting w Supabase Dashboard → Auth. Potwierdzić przed prod.

---

## Wyniki E2E (Agent 5) — 11/12 passed

| Scenariusz | Wynik |
|---|---|
| `/` 375×667: hero, h1 ≤3 linijki, CTA ≥44px, brak horizontal scroll (375=375) | ✅ passed |
| `/` 1280×800: hero 2-col, Instructors 2-col, header sticky top:0 po scroll | ✅ passed |
| CTA "Załóż konto" → `/signup` | ✅ passed |
| "Dowiedz się więcej" → smooth scroll `#jak-to-dziala` (top:80px offset) | ✅ passed |
| title + description + og:image/title/type + twitter:card + lang=pl | ✅ passed |
| Mobile hamburger → Sheet otwiera/zamyka | ✅ passed |
| Pełny axe-core scan landing + /signup | 🟠 failed (P2-5 kontrast) |
| `/signup` render (h1, Google, email/hasło, submit, link) | ✅ passed |
| `/login` render (h1, Google, email/hasło, forgot, submit, link) | ✅ passed |
| `/forgot-password` render | ✅ passed |
| Bez sesji `/library` → `/login?next=%2Flibrary` | ✅ passed |
| "Zaloguj się przez Google" → inicjuje OAuth (→ supabase auth/authorize) | ✅ passed* |

\* zatrzymuje się na endpoincie Supabase (Google provider credentials = pending operator step z IU-3); sama inicjacja OAuth poprawna.

Screenshoty: `/tmp/bachata-review-e2e/` (01-landing-mobile, 02-landing-desktop, 06-mobile-sheet-open, 07-contrast-evidence-finalcta, 08-signup, 09-login, 10-forgot-password).

**Ocena UX:** editorial layout, ciepła paleta terracotta na off-white, split-layout (ciemny brand panel + jasny formularz) na auth. Mood "nie krzyczy" trafiony. Jedyna rysa: kontrast accent (P2-5).

---

## Odchylenia od planu

1. **`src/App.tsx` usunięty zamiast modyfikowany** (plan IU-4: "Modify App.tsx") — `AuthProvider` osadzony bezpośrednio w `main.tsx`, protected wrapper w `router.tsx`. Lepsze (App.tsx byłby zbędną warstwą). Zero dangling refs. Odchylenie pozytywne.
2. **`RequireAuth.tsx` jako osobny komponent** — plan listował hook `useRequireAuth` + wzorzec `<RequireAuth>`, nie listował pliku jawnie. Naturalne dopełnienie.
3. **`Reveal.tsx`, `radix-ui` umbrella, placeholdery SVG, ręczny `database.types.ts`** — znane odchylenia (zalogowane w kontekście), nie raportowane jako nowe. `<picture>` bez AVIF/WebP srcset (plan wspominał) — dojdzie z docelowymi zdjęciami (operator).

---

## Mocne strony (warte utrzymania)

- **Security wzorcowy:** RLS z `(select auth.uid())` (cache per-statement), SECURITY DEFINER + `search_path=''` + fully-qualified, open-redirect guard (`//` blokowane), email enumeration zaadresowane, zero sekretów/console.log/XSS sinków, pełna walidacja Zod na granicy.
- **`AuthState` dyskryminowana unia** — `status` single source of truth; race przy bootstrapie poprawnie rozwiązany (brak fałszywego redirectu podczas loading).
- **Cleanupy wzorcowe:** AuthProvider (active flag + unsubscribe), Reveal (observer disconnect), MetaTags (restore meta).
- **Bundle:** constraint #3 spełniony, lazy routing, Hero LCP (`eager`+`fetchpriority=high`+width/height), Instructors `loading=lazy`.
- **Type safety:** zero `any`/`as`/`!`, explicit return types, każdy plik <300 / funkcja <50 linii.
- **Testy:** mockują tylko zewnętrzne granice, testują zachowanie, mocne asercje, zero anty-patternów §2.

---

## Bookkeeping checkboxów Weryfikacja:

Wszystkie automatyzowalne `Weryfikacja:` z IU-4/IU-5 były już rozstrzygnięte podczas wykonania faz (typecheck/lint/test/build/E2E odznaczone z notatkami PASS). Pozostałe niezaznaczone to świadome odłożenia z adnotacjami:

- Odznaczone wcześniej (CLI): typecheck, lint, test (74/74), build — IU-4 + IU-5
- Odznaczone wcześniej (E2E): render stron, guard, CTA, smooth scroll, meta, sticky — IU-4 + IU-5
- Pozostawione (Manual/operator): IU-4 `supabase db reset` migracji 0002 — wymaga Dockera; IU-5 `[Manual]` wizualna akceptacja mood — operator/designer
- Odłożone do IU-12: IU-5 Lighthouse mobile audit (razem z prerender)
- Failujące (nowe P2 z review): axe-core kontrast (P2-5)

Brak nowych CLI/grep FAIL. Severity gate bez zmian po bookkeepingu: ⚠️ 0× P1, 5× P2, 11× P3.
