# Meta Developer Setup — Bachata Napoli

> **Runbook operatorski.** Konfiguracja Meta for Developers do embedowania publicznych Facebook Reels + Instagram Reels w bibliotece userów (R11). Mniej krytyczna niż GCP — IU-8 ma fallback Plan B (manual entry embed code) i Plan C (skip R11 w MVP).

**Status:** `[ ] Not started` / `[ ] Plan A — Meta App in setup` / `[ ] Plan A — App Review submitted` / `[ ] Plan A — Approved` / `[ ] Plan B — manual entry chosen` / `[ ] Plan C — R11 dropped from MVP`

**Wybrany plan:** _(operator wypełnia po pre-flight check: A / B / C + data + powód)_

**Ostatnia aktualizacja:** _(YYYY-MM-DD)_

---

## Wstęp

Meta (Facebook + Instagram) embedding wymaga teoretycznie produktu **oEmbed Read** w Meta App. **Ale:** Meta zmieniała politykę embed API wielokrotnie (2020, 2021, 2024 — deprecation oEmbed dla anonimowego dostępu, wymóg App Token, ograniczenie dla Business apps). **Przed kodowaniem IU-8 musisz zweryfikować AKTUALNY stan w 2026.**

Trzy ścieżki implementacji:

- **Plan A:** Pełny oEmbed flow przez Meta App → najlepszy UX, ale wymaga App Review (~tygodnie) + ryzyko że produkt zostanie zdeprekowany ponownie
- **Plan B:** Manual entry — user wkleja embed code z Facebook/Instagram → MVP-ready bez Meta App, gorszy UX
- **Plan C:** Drop R11 (FB/IG embed) z MVP → najprostszy, akceptowalny jeśli operator zdecyduje że to nie blocker biznesowy

**Czas:**
- Plan A: ~30 min setup + 1–4 tyg. App Review
- Plan B: 0 min po stronie Meta (zmiany tylko w IU-8 code)
- Plan C: 0 min (usunięcie taba z UI w IU-8)

---

## Sekcja 0: Pre-flight check (OBOWIĄZKOWO przed wyborem planu)

Meta API zmienia się szybko — informacje z planu z maja 2026 mogą być nieaktualne. **Operator MUSI sprawdzić aktualny stan ZANIM zacznie wykonywać Plan A.**

- [ ] Otwórz [Meta for Developers — Documentation](https://developers.facebook.com/docs/)
- [ ] Wyszukaj sekcję dotyczącą `oEmbed` lub `Embedded Posts`:
  - Czy produkt **oEmbed Read** nadal istnieje?
  - Jeśli nie — czym został zastąpiony? (np. Instagram Embedding Plugin, Facebook Embedded Posts API)
- [ ] Sprawdź wymagania dostępu:
  - Czy wymaga **App Review**?
  - Czy potrzebny **App Token** (server-side, w Edge Functions)?
  - Czy Instagram wymaga osobnego produktu (Instagram Basic Display / Instagram Graph API)?
  - Czy są **ograniczenia per-app** (tylko Business apps, weryfikacja firmy)?
- [ ] Sprawdź **dostępność dla naszego use case:**
  - Use case: third-party app pozwalający userom dodawać publiczne FB/IG Reels do swojej osobistej biblioteki tańca
  - Czy Meta pozwala na third-party embed publicznych postów bez OAuth flow usera Meta? (W 2024 wymagało App Token + business verification)
- [ ] Sprawdź **wymagania compliance:**
  - Czy istnieje [Meta Platform Terms](https://developers.facebook.com/terms) → sekcje o data retention, branding, attribution
  - Czy embed musi pokazywać Meta branding (logo Facebook/Instagram)?

### Wybór planu (po pre-flight check)

Wpisz tutaj decyzję:

```
Plan: ___ (A / B / C)
Data decyzji: ___
Powód:
  -
  -
  -
Linki referencyjne do aktualnej dokumentacji Meta:
  -
  -
```

---

## Plan A — Meta App + oEmbed Read (warunkowy)

Wykonaj **tylko jeśli** Sekcja 0 potwierdziła że Plan A jest realny i operator wybrał A.

### A.1. Stwórz Meta App

- [ ] Wejdź na [Meta for Developers → My Apps](https://developers.facebook.com/apps)
- [ ] **Create App**
- [ ] Use case: wybierz najbliższy temat z listy 2026 _(w 2024 było "Other"; w 2026 może być "Consumer" lub "Web Content")_
- [ ] App Type: **Business** _(wymagane dla większości produktów embed)_
- [ ] App name: `Bachata Napoli`
- [ ] App contact email: email operatora
- [ ] Business account: link do Meta Business Account _(utwórz jeśli nie masz — wymaga weryfikacji firmy w niektórych przypadkach)_

### A.2. Add Product

- [ ] Dashboard nowej Meta App → **Add a Product**
- [ ] Wybierz **oEmbed Read** _(lub aktualny equivalent z 2026 — patrz Sekcja 0)_
- [ ] Skonfiguruj produkt zgodnie z instrukcjami Meta

> **Uwaga:** Jeśli produkt nie jest dostępny od razu, najczęściej wymaga App Review (sekcja A.4). W trybie Development app może działać tylko dla developer roles + test users.

### A.3. Pobierz credentials

- [ ] Dashboard → Settings → Basic
- [ ] Skopiuj **App ID**
- [ ] Skopiuj **App Secret** _(kliknij Show — wymaga ponownego podania hasła Meta)_
- [ ] Wgraj do sekretów Supabase Edge Functions:
  ```
  bunx supabase secrets set META_APP_ID=<app id> --project-ref <prod-ref>
  bunx supabase secrets set META_APP_SECRET=<app secret> --project-ref <prod-ref>
  ```
  _(powtórz dla stagingu jeśli używamy osobnej Meta App dla stagingu — rekomendacja: tak, izolacja)_
- [ ] **App Secret NIGDY** w kodzie frontendu ani w `VITE_*` env vars
- [ ] **App Token** (App ID + App Secret combined, format `<app-id>|<app-secret>`) używany do server-to-server requests w Edge Functions IU-8

### A.4. App Review (warunkowy)

W zależności od polityki Meta 2026, dostęp do oEmbed Read może wymagać App Review:

- [ ] Dashboard → App Review → Permissions and Features
- [ ] Sprawdź czy `oembed_read` (lub aktualny permission name) wymaga **Advanced Access** review
- [ ] Jeśli tak — wypełnij formularz App Review:
  - [ ] Privacy Policy URL: `https://bachatanapoli.pl/privacy`
  - [ ] Terms of Service URL: `https://bachatanapoli.pl/regulamin`
  - [ ] Data Deletion URL: `https://bachatanapoli.pl/contact` _(zgodnie z IU-11, użytkownik prosi o usunięcie via formularz kontaktowy)_
  - [ ] App icon: 1024×1024 PNG
  - [ ] Business verification: jeśli Meta poprosi (może wymagać dokumentów firmy)
  - [ ] Demo video / screencast pokazujący jak app używa oEmbed
  - [ ] Justification text: dlaczego potrzebujemy embed dla naszego use case
- [ ] Submit → czekaj na review (~dni do tygodni, Meta nie podaje wiążących SLA)
- [ ] **Email notification** po review → status `Approved` lub `Needs Info`

### A.5. Test

- [ ] Dashboard → App Mode: **Development** (testy z developer roles)
- [ ] Test request do oEmbed endpoint z Edge Function używając App Token
- [ ] Sprawdź response (HTML embed code)
- [ ] Po App Review approval → Dashboard → App Mode: **Live**

---

## Plan B — Manual entry fallback

**Operator nie wykonuje żadnych kroków po stronie Meta.** Cała implementacja w IU-8 (kod aplikacji):

- W IU-8 `MetaLinkForm` zmienia się: zamiast wysyłać URL do Edge Function `validate-meta-embed`, użytkownik **wkleja embed code** z FB/IG
- User instructions w UI: "Otwórz post FB/IG → kliknij ⋯ → **Embed** → kopiuj kod → wklej tutaj"
- Sanitizacja embed code w aplikacji (DOMPurify allowlist tylko `<iframe>` + `<blockquote>` z konkretnymi atrybutami) — zapobiega XSS via złośliwy embed
- UX cost: dodatkowy klik dla usera, ale działa **bez** App Review, **bez** Meta credentials, **bez** ryzyka deprecation

> **Decyzja Plan B:** Operator nie konfiguruje nic w Meta for Developers. Sekretów Meta nie wgrywa się do Supabase (`.env.example` ma `META_APP_ID` i `META_APP_SECRET` jako puste placeholder — zostają puste).

---

## Plan C — Drop R11 z MVP

**Operator nie wykonuje żadnych kroków po stronie Meta.** Zmiana wyłącznie w IU-8:

- W IU-9 (AddVideoDialog) — usuń tab "Facebook" i "Instagram", zostają tylko: "YouTube link" + "Wgraj z dysku"
- Update copy w landing page (IU-5) — nie obiecuj FB/IG support jeśli nie ma
- Update requirements doc (z `docs/dev-brainstorms/`) — zaznacz R11 jako "deferred to v1.1"
- Komunikacja do userów: "Wsparcie dla FB/IG Reels planowane w v1.1"

> **Decyzja Plan C:** Zerowa praca operatora, zerowa praca developera nad Meta. Plan B i C są decyzjami biznesowymi — Plan C jest tańszy, Plan B daje pełne R11 w MVP (gorszy UX).

---

## Troubleshooting

### `Invalid OAuth access token` przy wywołaniu oEmbed
- App Token poprawnie wygenerowany? Format: `<APP_ID>|<APP_SECRET>` (pipe między, brak spacji)
- App jest w trybie **Development** ale request z innego konta niż developer/test user → Meta odrzuci
- → Sprawdź Dashboard → Roles — czy konto operatora ma rolę Developer/Admin

### `Application does not have permission for this action`
- Permission `oembed_read` (lub aktualny equivalent) nie ma Advanced Access
- → App Review submit (Sekcja A.4)
- Workaround: użyj Standard Access (limited rate, ale działa bez review) — sprawdź w 2026 czy nadal istnieje

### Embed code z FB/IG nie renderuje się w aplikacji (Plan B)
- CSP headers blokują `<iframe>` z domeny `facebook.com` / `instagram.com`
- → Dodaj w CSP: `frame-src https://www.facebook.com https://www.instagram.com`
- Embed code wymaga załadowania `<script src="https://connect.facebook.net/...">` — w SPA może wymagać manualnego wstrzyknięcia
- → Implementuj w IU-8: po wkleju embed parsuj URL z embed code → renderuj iframe z whitelisted attrs (bez external script)

### Meta zmienia politykę w trakcie projektu
- Status do weryfikacji co kilka miesięcy — Meta deprekuje produkty bez ostrzeżenia
- → Plan B jest **najbezpieczniejszy długoterminowo** bo nie zależy od Meta App
- → Plan C eliminuje ryzyko całkowicie kosztem feature

### oEmbed zwraca 410 Gone albo 404 dla niektórych URL
- Post jest prywatny / page deleted / region locked
- → W Edge Function `validate-meta-embed` (IU-8) handle te przypadki gracefully → user error "Ten post nie jest publicznie dostępny"

---

## Załącznik: Mapa zmiennych środowiskowych

| Zmienna | Plan A | Plan B | Plan C |
|---|---|---|---|
| `META_APP_ID` | Meta Dashboard → Settings → Basic → App ID | _(puste)_ | _(puste)_ |
| `META_APP_SECRET` | Meta Dashboard → Settings → Basic → App Secret | _(puste)_ | _(puste)_ |

Wszystkie zmienne **server-side only** (Supabase Edge Functions secrets), nigdy w `VITE_*` ani w kodzie frontendu.

---

## Po wykonaniu

- [ ] Status na górze dokumentu zaktualizowany
- [ ] Wybrany plan + data + powód wypełnione
- [ ] Jeśli Plan A — App Review status śledzony w mailu, każda runda update wpisana w status
- [ ] Operator komunikuje do IU-8 buildera wybrany plan ("Meta: Plan A approved" / "Meta: Plan B — manual entry" / "Meta: Plan C — skip")
- [ ] Jeśli Plan A approved → przed launchem przetestuj embed flow z realnymi userami (nie tylko developer accounts)
