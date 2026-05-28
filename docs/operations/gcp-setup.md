# GCP Setup — Bachata Napoli

> **Runbook operatorski.** Step-by-step konfiguracja Google Cloud Platform, YouTube Data API v3, OAuth 2.0 Client + Consent Screen + API keys dla projektów staging i prod.

**Status:** `[ ] Not started` | `[ ] In progress` | `[ ] Done`

**Ostatnia aktualizacja:** _(operator wypełnia datą każdej zmiany statusu)_

---

## Wstęp

Ten dokument prowadzi krok po kroku przez konfigurację Google Cloud po stronie operatora. Po wykonaniu wszystkich sekcji:

- masz dwa projekty GCP (`bachatanapoli-staging`, `bachatanapoli-prod`),
- YouTube Data API v3 + People API włączone w obu,
- OAuth 2.0 Web client z poprawnymi redirect URIs,
- OAuth Consent Screen wypełniony i gotowy do submission verification,
- API key serwerowy do Edge Functions zapisany w sekretach Supabase,
- domena `bachatanapoli.pl` zweryfikowana w Search Console.

**Czas:** ~1–2h aktywnej pracy operatora. **Po tym czeka cię 2–6 tyg. oczekiwania na YT sensitive scope verification** — odpalamy ją w osobnym dokumencie `youtube-scope-verification-checklist.md` (link na końcu).

**Kiedy wracać:** Po każdym kroku który prosi o "Submit" lub "Wait for review" zaznacz checkbox + datę. Sekcje są sekwencyjne — nie pomijaj.

---

## Wymagania wstępne

- [ ] Konto Google (Workspace lub prywatne Gmail) z dostępem do [Google Cloud Console](https://console.cloud.google.com)
- [ ] Karta płatnicza dodana do GCP (Free tier wystarcza dla MVP, ale GCP wymaga billing account nawet dla bezpłatnego użycia API)
- [ ] Domena `bachatanapoli.pl` zarejestrowana i kontrolujesz DNS (do verification w Search Console)
- [ ] URL produkcyjnego projektu Supabase (z IU-2; format `https://<projectref>.supabase.co`). Jeśli jeszcze go nie masz — wykonaj IU-2 najpierw.
- [ ] URL stagingowego projektu Supabase (jeśli używamy osobnego stagingu; jeśli nie — pomiń wszystkie kroki dotyczące staging redirect URI).

---

## Sekcja 1: GCP Projects

Tworzymy dwa osobne projekty — staging i prod. Izolacja kwot, kluczy i quoty rejection nie wpływa na drugi env.

- [ ] Wejdź na [Google Cloud Console → Manage Resources](https://console.cloud.google.com/cloud-resource-manager)
- [ ] **Create Project** → name: `bachatanapoli-staging` → organization: brak (osobiste) lub Workspace org → **Create**
- [ ] **Create Project** → name: `bachatanapoli-prod` → **Create**
- [ ] **Billing** → Link a billing account dla obu projektów (Settings & Administration → Billing). Nawet jeśli nie planujesz wydawać — GCP wymaga billing account aktywnego do enable APIs.

**Konwencja:** Wszystkie kolejne kroki wykonujesz najpierw dla `bachatanapoli-staging`, potem dla `bachatanapoli-prod`. Przełącznik projektu jest w górnym pasku (dropdown obok logo Google Cloud).

---

## Sekcja 2: APIs enablement

Wykonaj **dla każdego projektu osobno** (staging i prod).

- [ ] APIs & Services → **Library** → wyszukaj `YouTube Data API v3` → **Enable**
- [ ] Wyszukaj `People API` → **Enable** (potrzebne do `userinfo` scope w OAuth)
- [ ] _(Opcjonalnie)_ Jeśli przy późniejszym OAuth Consent Screen pojawi się błąd o brakującym Google+ API — wróć tutaj i enable `Google+ API` (deprecated, ale niektóre legacy scopes wciąż go wymagają)

**Weryfikacja:** APIs & Services → **Enabled APIs & services** — widzisz YouTube Data API v3 + People API na liście.

---

## Sekcja 3: OAuth Consent Screen

To **najbardziej krytyczna sekcja** — od tego zależy verification YT sensitive scope. Wypełniamy raz, **dla projektu prod** (staging jest wyłącznie do testów developmenta). Staging może mieć osobny consent screen w trybie `Testing` jeśli operator chce odseparować.

> **Uwaga:** Jeśli twoje konto należy do Workspace org, masz dodatkową opcję `Internal` (tylko users w org). Wybieramy **External** bo aplikacja jest publiczna.

- [ ] **Projekt: `bachatanapoli-prod`** → APIs & Services → **OAuth consent screen**
- [ ] User Type: **External** → **Create**

### 3.1. App information

- [ ] App name: `Bachata Napoli`
- [ ] User support email: _(operator email — będzie widoczny na consent screen dla userów)_
- [ ] App logo: 256x256 PNG, white background. Placeholder na start jest OK (możesz wstawić finalne logo później, ale **przed submission verification**).

### 3.2. App domain

- [ ] Application home page: `https://bachatanapoli.pl`
- [ ] Application privacy policy link: `https://bachatanapoli.pl/privacy` _(URL musi działać — placeholder "Coming soon" wystarcza na start; IU-11 dostarczy realny content)_
- [ ] Application terms of service link: `https://bachatanapoli.pl/regulamin`

### 3.3. Authorized domains

Dodaj domeny, dla których wolno serwować redirect URIs i którym Google ufa:

- [ ] `bachatanapoli.pl`
- [ ] `supabase.co` _(Supabase Auth callback)_

### 3.4. Developer contact information

- [ ] Email operatora _(otrzymasz tu komunikację od Google Trust & Safety)_

### 3.5. Scopes — sekcja krytyczna

Kliknij **Add or Remove Scopes**. Dodaj:

**Non-sensitive (automatyczna approval, działają od razu):**

- [ ] `openid`
- [ ] `https://www.googleapis.com/auth/userinfo.email`
- [ ] `https://www.googleapis.com/auth/userinfo.profile`

**Sensitive — wymaga verification, ~2–6 tyg.:**

- [ ] `https://www.googleapis.com/auth/youtube.upload`

**Restricted:** brak (nie potrzebujemy `youtube.readonly` ani innych restricted scopes — `youtube.upload` jest sensitive, nie restricted).

### 3.6. Test users (PRZED verification)

Dopóki sensitive scope `youtube.upload` nie jest verified, OAuth flow działa **tylko dla emaili dodanych jako test users**. Inni userzy zobaczą "unverified app" warning screen.

- [ ] Dodaj 5–10 emaili zaufanych testerów (operator + zaufani znajomi + maile dwóch nauczycieli Bachata Rebel)
- [ ] Limit: max 100 test users w trybie Testing

### 3.7. Submit (po wypełnieniu wszystkich pól)

- [ ] Sprawdź wszystkie sekcje (Summary view) — wszystko zielone / wypełnione
- [ ] Save and Continue → **Back to Dashboard**

> **Submission verification jest w osobnym runbooku** — patrz [`youtube-scope-verification-checklist.md`](./youtube-scope-verification-checklist.md). Zacznij go wypełniać **dopiero gdy** OAuth Client (Sekcja 4) i domain verification (Sekcja 6) są gotowe — wymagania Google muszą być spełnione PRZED submission.

---

## Sekcja 4: OAuth 2.0 Client ID

Tworzymy **osobny Client ID dla staging i osobny dla prod** (bezpieczeństwo: gdy compromise staging credentials, prod jest nadal bezpieczny).

### 4.1. Staging — `bachatanapoli-staging`

- [ ] Przełącz projekt na `bachatanapoli-staging` (dropdown w pasku)
- [ ] APIs & Services → **Credentials** → **Create Credentials** → **OAuth client ID**
- [ ] Application type: **Web application**
- [ ] Name: `Bachata Napoli — Staging Web Client`
- [ ] **Authorized JavaScript origins** — dodaj:
  - `https://staging.bachatanapoli.pl` _(lub inna stagingowa domena, jeśli ustalona — w razie braku użyj prod domain w staging tylko gdy są oddzielne tożsamości userów; w MVP staging może być pominięty)_
  - `http://localhost:5173` _(Vite dev server)_
  - `http://localhost:54323` _(Supabase Studio — local dev)_
- [ ] **Authorized redirect URIs** — dodaj:
  - `https://<staging-supabase-project-ref>.supabase.co/auth/v1/callback` _(zastąp `<staging-supabase-project-ref>` realnym ref z Supabase Dashboard)_
  - `http://localhost:54321/auth/v1/callback` _(Supabase CLI local stack)_
- [ ] **Create** → **zapisz Client ID i Client Secret** w bezpiecznym miejscu (1Password / Bitwarden) → potem wpisz do `.env.local` na maszynie deweloperskiej:
  ```
  SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<staging client id>
  SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<staging client secret>
  ```
- [ ] **W Supabase Dashboard staging projektu** → Authentication → Providers → Google → enable → wklej Client ID + Client Secret → Save

### 4.2. Production — `bachatanapoli-prod`

- [ ] Przełącz projekt na `bachatanapoli-prod`
- [ ] APIs & Services → **Credentials** → **Create Credentials** → **OAuth client ID**
- [ ] Application type: **Web application**
- [ ] Name: `Bachata Napoli — Production Web Client`
- [ ] **Authorized JavaScript origins** — dodaj:
  - `https://bachatanapoli.pl`
  - `https://www.bachatanapoli.pl` _(jeśli używamy www jako canonical lub redirect — bezpieczna nadmiarowość)_
- [ ] **Authorized redirect URIs** — dodaj:
  - `https://<prod-supabase-project-ref>.supabase.co/auth/v1/callback` _(zastąp `<prod-supabase-project-ref>`)_
- [ ] **Create** → **zapisz Client ID i Client Secret** osobno od stagingowych
- [ ] **W Supabase Dashboard prod projektu** → Authentication → Providers → Google → enable → wklej Client ID + Client Secret → Save

> **Bezpieczeństwo:** Client Secret NIGDY nie trafia do kodu frontendu ani do zmiennych prefiksowanych `VITE_*`. Trafia wyłącznie do Supabase Dashboard (server-side) i ewentualnie do `.env.local` operatora dla CLI local dev (czytane przez `supabase/config.toml`).

---

## Sekcja 5: YouTube Data API key (server-side, do Edge Functions)

Ten klucz służy do **niezautoryzowanych zapytań** (`videos.list` po public video ID — fetch metadata bez OAuth usera). Wykorzysta go Edge Function `fetch-youtube-metadata` z IU-8.

### 5.1. Staging

- [ ] Projekt `bachatanapoli-staging` → APIs & Services → **Credentials** → **Create Credentials** → **API key**
- [ ] Po utworzeniu: **Restrict key**:
  - **Application restrictions**: `None` _(Edge Functions to server-side; HTTP referrers/IP restrictions powodują problemy bo Supabase Edge runtime nie ma stabilnego źródła IP)_
  - **API restrictions**: `Restrict key` → wybierz `YouTube Data API v3` z listy
- [ ] Save → skopiuj wartość klucza
- [ ] Wgraj do sekretów Supabase Edge Functions stagingu:
  ```
  bunx supabase secrets set YOUTUBE_API_KEY=<staging key> --project-ref <staging-ref>
  ```
  _(lub przez Supabase Dashboard → Edge Functions → Secrets)_

### 5.2. Production

- [ ] Projekt `bachatanapoli-prod` → ten sam proces → zapisz osobny klucz
- [ ] `bunx supabase secrets set YOUTUBE_API_KEY=<prod key> --project-ref <prod-ref>`

> **Rotacja:** Jeśli któryś klucz wycieknie (np. trafi do public repo) — natychmiast wróć do Credentials → wybierz klucz → **Regenerate**. Stary klucz przestaje działać; aktualizuj sekret w Supabase.

---

## Sekcja 6: Domain verification (wymagana dla OAuth verification)

Google wymaga potwierdzenia własności domeny `bachatanapoli.pl` zanim zaakceptuje aplikację z sensitive scope `youtube.upload`.

- [ ] Wejdź na [Google Search Console](https://search.google.com/search-console)
- [ ] **Add property** → typ: **Domain** (preferowany — pokrywa wszystkie subdomeny i protocols) → wpisz `bachatanapoli.pl`
- [ ] Google poda TXT record do dodania w DNS twojego rejestratora (np. `google-site-verification=<hash>`)
- [ ] Dodaj record w panelu DNS → poczekaj 5–30 min na propagację → kliknij **Verify** w Search Console
- [ ] **Zweryfikuj że konto Google używane w GCP (Sekcja 1) jest właścicielem property w Search Console** — to ta sama tożsamość musi być w obu miejscach, inaczej OAuth verification odrzuci submission z błędem "domain not verified"

**Alternatywa (jeśli DNS niedostępny):** HTML file upload — Google daje plik typu `google<hash>.html` do umieszczenia w roocie `https://bachatanapoli.pl/`. Mniej preferowane (vendor lock-in na hosting), ale działa.

---

## Sekcja 7: Quota extension request (długi proces, submit razem ze scope verification)

Default quota YouTube Data API v3: **10 000 jednostek/dzień**. Upload kosztuje **1 600 jednostek** = ~6 uploadów na dzień globalnie. Dla MVP to za mało gdy będą realni userzy.

**Target:** 100 000+ jednostek/dzień = ~60+ uploadów/dzień.

- [ ] [YouTube API Services — Audit and Quota Extension Form](https://support.google.com/youtube/contact/yt_api_form) (link może się zmienić — wyszukaj `youtube api quota extension` w razie 404)
- [ ] Wypełnij formularz (wymaga: link do aplikacji, opis use case, oczekiwana liczba użytkowników, justification dla quoty)
- [ ] Submit i zapisz Case ID — śledzisz status w mailu od Google
- [ ] **Synergia ze scope verification:** Google wymaga **App Audit** zanim zaakceptuje quota extension. Audit to ta sama procedura co OAuth verification dla sensitive scope. Submit obu razem — quota extension request często linkuje do tej samej dokumentacji (privacy policy, demo video).

> **Realny timeline:** Quota extension często ~1–3 tyg., bywa szybsze niż scope verification. Bez extension MVP działa, ale tylko ~6 uploadów/dzień globalnie — przy publicznym launchu szybko hit kwoty.

---

## Sekcja 8: Aktualizacja `.env.example` i Supabase config po stronie repo

Repository ma już placeholdery przygotowane przez IU-2 + IU-3 (`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, `YOUTUBE_API_KEY`, `META_*` — patrz `.env.example`).

- [ ] Skopiuj `.env.example` → `.env.local` na lokalnej maszynie
- [ ] Wypełnij wartościami **stagingowymi** w `.env.local` _(NIE commituj — `.env.local` jest w `.gitignore`)_
- [ ] Sprawdź że `supabase/config.toml` ma w sekcji `[auth.external.google]`:
  ```
  enabled = false  # toggle na true PO wgraniu credentials do Supabase Dashboard
  ```
  → po wgraniu credentials w Supabase Dashboard zmień flagę na `true` w **prod** projekcie (Supabase CLI auto-reloads config przy `supabase db push` lub przez Dashboard ręcznie)

---

## Sekcja 9: Submit OAuth verification (kickoff krytycznej ścieżki)

Wszystko gotowe? Idź na osobny runbook:

> **[`youtube-scope-verification-checklist.md`](./youtube-scope-verification-checklist.md)** — wymagania Google przed submission, demo video, justification text, śledzenie statusu, plany B i C.

To **krytyczna ścieżka 2–6 tyg.** — submit ASAP po wykonaniu Sekcji 1–8.

---

## Troubleshooting

### `invalid_client`
- Client ID lub Secret źle skopiowany (whitespace, brakujący znak)
- Client ID z innego projektu niż obecny env (staging vs prod pomieszane)
- → Sprawdź w Supabase Dashboard → Authentication → Providers → Google czy Client ID matchuje wartość w GCP Console → Credentials

### `redirect_uri_mismatch`
- Redirect URI w żądaniu OAuth nie jest na liście **Authorized redirect URIs** w GCP OAuth Client
- Najczęściej: zapomniany staging callback URL albo localhost callback z innym portem
- → Wróć do Sekcja 4 → Edit Client → dodaj brakujący URI

### `unverified app` warning screen mimo dodania test users
- Email userów nie jest na liście **Test users** w OAuth Consent Screen (Sekcja 3.6)
- Sensitive scope nie ma jeszcze verification approved
- → Sprawdź czy email logującego się usera jest dokładnie tym samym (case-sensitive, trim whitespace) co na liście test users

### Scope verification rejected
- Najczęstsze powody w `youtube-scope-verification-checklist.md` → sekcja "Częste przyczyny rejekcji"
- → Po rejekcji Google daje konkretny powód w mailu → adres + odpowiedz w tym samym wątku z poprawkami → ponowna review trwa krócej niż pierwsza

### Domain not verified błąd przy submission verification
- Konto Google używane w GCP ≠ konto w Search Console
- → Search Console → Settings → Users and permissions → dodaj konto GCP jako Owner property `bachatanapoli.pl`

### Quota exceeded (10 000 units/day) podczas testów
- Każde wywołanie `videos.list` (metadata fetch) = 1 unit
- Upload (resumable session) = 1 600 units
- → W trakcie developmentu spróbuj rzadziej wywoływać API; do testów upload używaj jednego konta i nie usuwaj/uploaduj wielokrotnie
- → Quota reset codziennie o północy Pacific Time (US/PT)

---

## Załącznik: Mapa zmiennych środowiskowych

| Zmienna | Wartość źródło | Gdzie wpisać |
|---|---|---|
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | GCP Credentials → OAuth Client (Web) → Client ID | `.env.local` (local dev) + Supabase Dashboard → Auth → Providers → Google |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | GCP Credentials → OAuth Client (Web) → Client Secret | `.env.local` (local dev) + Supabase Dashboard → Auth → Providers → Google |
| `YOUTUBE_API_KEY` | GCP Credentials → API key (restricted to YouTube Data API v3) | Supabase secrets (`bunx supabase secrets set YOUTUBE_API_KEY=...`) — server-side, Edge Functions only |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | _(nie używane w MVP — Supabase Auth zarządza OAuth flow bez ekspozycji Client ID we frontendzie)_ | Pozostaw puste |

---

## Po wykonaniu

- [ ] Status na górze dokumentu zmieniony na `Done`
- [ ] Data ostatniej aktualizacji wypełniona
- [ ] Operator otwiera [`youtube-scope-verification-checklist.md`](./youtube-scope-verification-checklist.md) i wykonuje submission
- [ ] Operator otwiera [`meta-developer-setup.md`](./meta-developer-setup.md) i wykonuje pre-flight check + plan A/B/C
