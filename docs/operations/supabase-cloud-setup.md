# Supabase Cloud — przewodnik uruchomienia (Bachata Napoli)

Krok po kroku: od pustego konta Supabase do działającego backendu (baza + logowanie
+ Edge Functions). Pisane dla osoby nietechnicznej — wykonujesz po kolei.

> **Co tu uzyskasz:** 2 klucze do wklejenia w Netlify, wgraną strukturę bazy (5 migracji),
> wgrane 2 Edge Functions i skonfigurowane logowanie.

---

## Słowniczek (1 zdanie każdy)

- **Projekt Supabase** — Twój „serwer" w chmurze: baza danych + system logowania.
- **Migracje** — pliki SQL, które budują tabele i reguły bezpieczeństwa. Mamy 5 (`0001`–`0005`).
- **Edge Functions** — mini-programy serwerowe (pobieranie danych z YouTube/Facebooka).
- **anon key** — klucz publiczny, bezpieczny do przeglądarki. **service_role key** — tajny, NIGDY go nie używamy w stronie.

---

## Co jest potrzebne dla „miękkiego startu" vs „pełnego"

| Element | Miękki start (landing + e-mail + biblioteka + linki YT) | Pełny (Google + upload) |
|---|---|---|
| Faza 1 — projekt | ✅ wymagane | ✅ |
| Faza 2 — klucze do Netlify | ✅ wymagane | ✅ |
| Faza 3 — migracje bazy | ✅ wymagane | ✅ |
| Faza 4 — Edge Functions + `YOUTUBE_API_KEY` | ✅ (żeby wklejanie linku YT pobierało tytuł/miniaturę) | ✅ |
| Faza 5 — logowanie e-mail + URL-e | ✅ wymagane | ✅ |
| Faza 5 — logowanie Google | ❌ pomijasz | ✅ wymaga GCP |
| Upload plików na YouTube | ❌ | ✅ wymaga weryfikacji Google (2–6 tyg.) |

> **Ważne rozróżnienie:** `YOUTUBE_API_KEY` (zwykły klucz API) wystarcza, by **wklejanie linku
> YouTube** pobierało tytuł i miniaturę — dostajesz go w minutę w Google Cloud.
> To NIE to samo co weryfikacja OAuth dla **uploadu** (ta trwa 2–6 tygodni).

---

## Faza 1 — Utwórz projekt

1. Wejdź na **supabase.com** → zaloguj się (można przez GitHub).
2. **New project**:
   - **Name:** `bachatanapoli-prod`
   - **Database Password:** wygeneruj mocne hasło i **zapisz je w menedżerze haseł** (będzie potrzebne).
   - **Region:** **Central EU (Frankfurt)** — wymóg RODO (dane użytkowników w UE).
3. Kliknij **Create new project** i poczekaj ~2 minuty, aż projekt wstanie.

---

## Faza 2 — Skopiuj 2 klucze (do Netlify)

1. W projekcie: **Project Settings** (ikona zębatki) → **API Keys** (lub **API**).
2. Skopiuj dwie wartości:
   - **Project URL** → to jest `VITE_SUPABASE_URL`
   - **anon / public / publishable key** (ten oznaczony jako bezpieczny do przeglądarki) → to jest `VITE_SUPABASE_ANON_KEY`
3. Zapisz je — wklejasz je w **Netlify → Site settings → Environment variables**.

> ⚠️ Nie używaj klucza **service_role / secret** — on jest tajny i nie wchodzi do strony.
> Bezpieczeństwo danych zapewniają reguły RLS w bazie (klucz anon jest celowo publiczny).

---

## Faza 3 — Wgraj strukturę bazy (5 migracji)

Robimy to przez Supabase CLI. **Nie wymaga Dockera** (`db push` aplikuje migracje prosto do chmury).
Komendy uruchamiasz w terminalu w katalogu projektu (albo poproś mnie — wykonam je po Twoim zalogowaniu).

```bash
# 1. Zaloguj się do Supabase (otworzy przeglądarkę po token)
bunx supabase login

# 2. Połącz lokalny projekt z Twoim projektem w chmurze.
#    REF znajdziesz w adresie panelu: supabase.com/dashboard/project/<REF>
#    (albo Project Settings → General → Reference ID)
bunx supabase link --project-ref <TWÓJ_REF>

# 3. Wgraj wszystkie migracje (0001–0005)
bunx supabase db push
```

Po tym kroku w bazie są tabele: `profiles`, `videos`, `folders`, `video_folders`,
`share_tokens` + funkcja `get_shared_content` + reguły bezpieczeństwa RLS.

---

## Faza 4 — Wgraj Edge Functions (2 sztuki)

```bash
# Pobieranie metadanych z YouTube (potrzebne przy wklejaniu linku YT)
bunx supabase functions deploy fetch-youtube-metadata

# Walidacja embedów Facebook/Instagram (potrzebne tylko jeśli chcesz embedy FB/IG)
bunx supabase functions deploy validate-meta-embed
```

Następnie ustaw „sekrety" (tajne klucze) — tylko te, które masz:

```bash
# Zwykły klucz YouTube Data API v3 (z Google Cloud → APIs & Services → Credentials → API key)
bunx supabase secrets set YOUTUBE_API_KEY=twoj_klucz

# (Opcjonalnie) Facebook/Instagram — tylko jeśli chcesz embedy FB/IG
bunx supabase secrets set META_APP_ID=... META_APP_SECRET=...

# (Opcjonalnie) Sentry — śledzenie błędów w Edge Functions
bunx supabase secrets set SENTRY_DSN=...
```

> Sekrety można też wpisać klikalnie: **Edge Functions → Secrets** w panelu Supabase.
> Bez `YOUTUBE_API_KEY` wklejanie linku YouTube nie pobierze tytułu (funkcja zwróci błąd).

---

## Faza 5 — Skonfiguruj logowanie (panel Supabase)

### 5a. Adresy URL (wymagane — inaczej logowanie/reset hasła nie zadziała)

**Authentication → URL Configuration:**
- **Site URL:** `https://bachatanapoli.pl` (albo na start adres `https://twoja-strona.netlify.app`)
- **Redirect URLs** (dodaj wszystkie, których używasz):
  - `https://bachatanapoli.pl/**`
  - `https://twoja-strona.netlify.app/**` (adres z Netlify, na czas testów)
  - `http://localhost:5173/**` (do lokalnych testów)

### 5b. Logowanie e-mailem (wymagane dla miękkiego startu)

**Authentication → Providers → Email:** powinno być **włączone** (domyślnie jest).
- Domyślnie Supabase Cloud ma **„Confirm email" włączone** — to dobrze: po rejestracji
  użytkownik dostaje e-mail z linkiem (strona pokazuje „Wysłaliśmy email z linkiem").
- **Authentication → Email Templates:** (opcjonalnie) przetłumacz szablony na polski,
  ton „ty" — Confirm signup, Reset password.

### 5c. Logowanie przez Google (TYLKO dla pełnego startu — można pominąć)

**Authentication → Providers → Google:** włącz i wklej **Client ID** + **Client Secret**
z Google Cloud. Pełna instrukcja: `docs/operations/gcp-setup.md`.
W miękkim starcie zostaw wyłączone.

---

## Faza 6 — Połącz z Netlify

W Netlify (**Site settings → Environment variables**) wklej:

```
VITE_SUPABASE_URL = (Project URL z Fazy 2)
VITE_SUPABASE_ANON_KEY = (anon key z Fazy 2)
```

(opcjonalnie, jeśli masz:) `VITE_SENTRY_DSN`, `VITE_PLAUSIBLE_DOMAIN=bachatanapoli.pl`

Następnie w Netlify uruchom **redeploy** (Trigger deploy) — strona zbuduje się z kluczami
i połączy z Supabase.

> Bez tych kluczy: landing się pokaże, ale **logowanie i biblioteka nie zadziałają**.

---

## Szybka checklista (miękki start)

- [ ] Faza 1: projekt `bachatanapoli-prod` w regionie Frankfurt
- [ ] Faza 2: skopiowane Project URL + anon key
- [ ] Faza 3: `supabase login` → `link` → `db push` (5 migracji wgranych)
- [ ] Faza 4: deploy `fetch-youtube-metadata` + `YOUTUBE_API_KEY` ustawiony
- [ ] Faza 5a: Site URL + Redirect URLs ustawione
- [ ] Faza 5b: logowanie e-mail włączone (+ ew. polskie szablony)
- [ ] Faza 6: klucze wklejone w Netlify + redeploy
- [ ] Test: rejestracja e-mailem → mail z linkiem → logowanie → biblioteka działa

---

## Co dalej (pełny start)

1. `docs/operations/gcp-setup.md` — Google Cloud: OAuth client + YouTube API + **weryfikacja
   scope `youtube.upload`** (złóż wniosek ASAP — trwa 2–6 tygodni).
2. `docs/operations/meta-developer-setup.md` — Facebook/Instagram (jeśli chcesz embedy).
3. Prawnik: zatwierdzenie `docs/legal/privacy-policy-draft.md` i `regulamin-draft.md`.
