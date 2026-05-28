# YouTube Sensitive Scope Verification — Checklist

> **Runbook operatorski + tracking dokument.** Krytyczna ścieżka MVP. Submit ASAP po ukończeniu [`gcp-setup.md`](./gcp-setup.md) Sekcji 1–8. Verification trwa **2–6 tygodni** (bywa dłużej). Bez verification publiczny launch jest praktycznie niemożliwy — userzy zobaczą "unverified app" warning screen.

---

## Status (operator aktualizuje)

| Pole | Wartość |
|---|---|
| Status | `[ ] Not submitted` / `[ ] Submitted` / `[ ] In review` / `[ ] Approved` / `[ ] Rejected` |
| Data submission | _(YYYY-MM-DD)_ |
| Case ID Google | _(z maila confirmation)_ |
| Data approval | _(YYYY-MM-DD jeśli approved)_ |
| Powód rejekcji | _(jeśli rejected)_ |
| Wybrany plan po rejekcji | `[ ] Re-submit z poprawkami` / `[ ] Plan B (Testing mode)` / `[ ] Plan C (drop upload)` |

---

## Dlaczego submit ASAP

Sensitive scope `https://www.googleapis.com/auth/youtube.upload` wymaga **OAuth verification** przez Google Trust & Safety. Bez verification:

- Aplikacja jest w trybie **Testing** → tylko 100 test users (manualnie dodanych) widzi normalny consent screen
- Inni userzy widzą **"This app isn't verified"** warning → trzeba kliknąć "Advanced → Go to bachatanapoli.pl (unsafe)" — **conversion kill** dla publicznego launchu

Verification trwa zwykle 2–6 tyg., czasem dłużej (3 mies. nie jest rzadkie). **Im wcześniej submit, tym wcześniej publiczny launch nie jest zablokowany.**

Verification **NIE blokuje** development ani internal testowanie — możesz pisać kod IU-4..IU-12 paralelnie. Blokuje **wyłącznie** publiczny launch z `youtube.upload`.

---

## Wymagania Google przed submission (checklist)

### A. Webowe artefakty

- [ ] **Privacy Policy URL** — działa publicznie, status 200, dostępne bez logowania
  - URL: `https://bachatanapoli.pl/privacy`
  - Akceptowalny placeholder na start: strona z tytułem "Privacy Policy" + krótkim opisem typu danych zbieranych + kontaktem + "Last updated" (~200 słów). IU-11 dostarczy realny content.
  - **Krytyczne:** Privacy policy MUSI explicite wymieniać Google API services + YouTube API. Wymagana fraza w stylu: _"Bachata Napoli uses YouTube API Services to allow users to upload personal videos to their own YouTube account as unlisted. We do not share user data with third parties. Users can revoke access at [security settings link]."_
  - Link do [Google's Limited Use disclosure requirements](https://developers.google.com/terms/api-services-user-data-policy#limited-use)
- [ ] **Terms of Service URL** — działa publicznie, status 200
  - URL: `https://bachatanapoli.pl/regulamin`
  - Placeholder OK; finalna wersja od prawnika w IU-11
- [ ] **Homepage URL** — `https://bachatanapoli.pl` działa publicznie
- [ ] **Domain ownership verified** — Search Console verification ukończony (patrz `gcp-setup.md` Sekcja 6)

### B. Wizualne

- [ ] **App logo** — 256×256 PNG, najlepiej z białym lub neutralnym tłem. Wgrane w OAuth Consent Screen → App information (patrz `gcp-setup.md` Sekcja 3.1)
- [ ] **Brand visual consistency** — strona główna (`bachatanapoli.pl`) ma tę samą nazwę "Bachata Napoli" i ten sam logo co consent screen. Google sprawdza wizualnie.

### C. Demo video (najważniejsze!)

Demo video to **najczęstszy powód rejekcji**. Musi precyzyjnie pokazać użycie scope `youtube.upload`.

- [ ] **Format:** YouTube unlisted lub Google Drive video link (preferowany YouTube unlisted dla łatwego embed)
- [ ] **Długość:** 3–5 min
- [ ] **Voiceover w angielskim** (preferowany) lub polski z angielskimi napisami
- [ ] **Scenariusz nagrania (operator wykonuje, screen recording + voiceover):**

```
[0:00–0:30] Intro
  - "Bachata Napoli is a personal dance video library for bachata dancers in Naples, Italy."
  - "Users record practice videos on their phones and upload them to their own YouTube account as unlisted via our app."
  - "Our app indexes video metadata in a personal library, but the actual video file is hosted on the user's YouTube account."

[0:30–1:00] User loguje się przez Google OAuth
  - Pokaż landing page bachatanapoli.pl
  - Klik "Zaloguj się przez Google"
  - **POKAŻ EKRAN CONSENT SCREEN** — wyraźnie widoczny scope "Manage your YouTube videos" (youtube.upload)
  - User akceptuje, redirect do biblioteki

[1:00–2:00] Upload flow
  - Klik "Dodaj film" → wybór "Wgraj z dysku"
  - File picker, wybór pliku .mp4
  - **POKAŻ EKRAN CONSENT SCREEN** ponownie (incremental scope dla youtube.upload, jeśli scope nie był jeszcze dany)
  - Progress bar — pokaż realny upload (resumable, 30–60s)
  - Toast "Film wgrany pomyślnie"

[2:00–2:45] Verification w YT Studio
  - Otwórz w nowej karcie studio.youtube.com (zalogowany na to samo konto)
  - Pokaż film jest tam, **status: Unlisted**
  - Pokaż że tytuł i metadata pochodzą z formularza w naszej aplikacji
  - Wróć do bachatanapoli.pl → film widoczny w bibliotece

[2:45–3:30] Justification narration
  - "We use youtube.upload because users want zero-hosting infrastructure — their videos stay on their own YouTube account, which they fully control."
  - "We only store video ID and metadata in our database. We never download or re-host video bytes."
  - "Users can optionally share videos with read-only links, but sharing does not republish the video — it only embeds the YouTube player."

[3:30–4:00] Outro + data handling summary
  - Pokaż privacy policy URL
  - Pokaż jak user może revoke access (Google Account → Security → Third-party access)
  - "Thank you for reviewing Bachata Napoli."
```

- [ ] Video uploaded jako **Unlisted** na operator-owned YouTube → zapisz URL: `_(do uzupełnienia)_`
- [ ] _(Opcjonalnie)_ Drugi take jeśli pierwszy ma problemy z audio/visibility

### D. Justification text (~200 słów, ANG)

Wpisywany w formularzu submission. Przykład:

```
Bachata Napoli is a personal video library platform for bachata dancers
in Naples, Italy, helping them organize practice recordings and shared
moments from social dancing events.

We require the youtube.upload scope so users can upload their personal
practice videos to their own YouTube account as unlisted. This approach
eliminates the need for our application to host video bytes, reducing
infrastructure cost and respecting users' full ownership of their content
on a platform they already trust.

Data handling:
- We only store video metadata (YouTube video ID, title, duration,
  thumbnail URL) in our database.
- We never download, re-host, or modify video files.
- Videos remain owned by the user on their YouTube account and can be
  managed via YouTube Studio independently of our app.
- Optional sharing creates a read-only token that embeds the YouTube
  player; sharing does not republish or duplicate the video.

Users can revoke our app's access at any time via their Google Account
security settings or by deleting their account in our app, which removes
all our database records but leaves their YouTube videos intact.

We comply with Google's Limited Use policy for sensitive scopes:
youtube.upload data is used solely to provide the upload feature
requested by the user, and is not used for advertising or sold to
third parties.
```

- [ ] Przeczytaj dokładnie [Google API Services User Data Policy — Limited Use](https://developers.google.com/terms/api-services-user-data-policy#limited-use) → upewnij się że justification jest spójne z polityką
- [ ] **Critical phrase do uwzględnienia w tekście:** "We comply with Limited Use requirements" + krótkie wymienienie czterech zasad (only requested feature, no advertising, no human reading, no transfer to third parties)

### E. Compliance checks

- [ ] [Google API Services Terms of Service](https://developers.google.com/terms) — przeczytaj, zrozum, zgódź się w formularzu
- [ ] [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service) — przeczytaj, zaakceptuj
- [ ] [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies) — szczególnie sekcja II (Data Handling) i sekcja III (User Authentication)

---

## Submission process

- [ ] Wejdź na GCP Console (projekt **`bachatanapoli-prod`**) → APIs & Services → **OAuth consent screen**
- [ ] W sekcji **Scopes for Google APIs** powinien być widoczny `https://www.googleapis.com/auth/youtube.upload` z notatką "Requires verification"
- [ ] Kliknij **Prepare for verification** lub **Submit for verification** (przycisk pojawia się po dodaniu sensitive scope i wypełnieniu wszystkich pól)
- [ ] Wypełnij formularz Google:
  - [ ] Krótki opis aplikacji (przekleić z justification text powyżej)
  - [ ] Demo video URL (z sekcji C powyżej)
  - [ ] Privacy Policy URL
  - [ ] Terms of Service URL
  - [ ] Nazwa firmy/operatora + dane kontaktowe
  - [ ] Szczegóły o scope `youtube.upload` — dlaczego, jaki use case, jakie dane są przetwarzane
- [ ] Zaznacz wszystkie compliance checkboxes
- [ ] Submit
- [ ] Otrzymasz **email confirmation z Case ID** → wpisz Case ID w sekcji Status na górze tego dokumentu

---

## Po submission — co dalej

### Pierwsze 24h

- [ ] Email z Case ID otrzymany → status zmieniony na `Submitted`
- [ ] Sprawdź spam folder w razie braku potwierdzenia

### 7–10 dni

- [ ] Jeśli brak żadnej odpowiedzi po 7–10 dniach (poza confirmation): odpowiedz na thread w mailu z pytaniem o status, podając Case ID
- [ ] Alternatywa (paid): skontaktować się przez Cloud Console Support → wymaga aktywnego support plan (paid)

### 2–6 tyg.

- [ ] Status `In review` zwykle pojawia się w consent screen GUI po 1–2 tyg.
- [ ] Google może poprosić o dodatkowe info (np. update demo video, doprecyzowanie justification) — odpowiedz w wątku ASAP, każda runda wymiany ~7 dni
- [ ] **Approved:** zmień status na `Approved`, data, zaktualizuj `gcp-setup.md` (przełącz consent screen z Testing na Production)
- [ ] **Rejected:** Google podaje konkretny powód → patrz sekcja "Częste przyczyny rejekcji" → poprawki → re-submit w tym samym wątku

---

## Częste przyczyny rejekcji (sprawdź PRZED submission)

1. **Demo video nie pokazuje pełnego flow** — brak consent screen widocznego, brak weryfikacji w YT Studio, brak narracji o data handling
2. **Justification text generyczny** — pisanie "we need YouTube features" zamiast precyzyjnego "youtube.upload allows users to upload to their own YouTube channel as unlisted"
3. **Privacy policy nie wymienia YouTube API** — Google wymaga explicit disclosure. Brak frazy o YouTube API services → automatyczny reject
4. **Brand verification mismatch** — domain w consent screen ≠ domain w Search Console
5. **App logo placeholder zbyt generyczny** — Google odrzuca pusty fioletowy kwadrat. Wstaw realistyczne logo (nawet proste, byle rozpoznawalne)
6. **Test users wciąż obecni** — Google sprawdza czy app jest production-ready. Test users można zostawić, ale upewnij się że publishing status jest `In production` nie `Testing` przed submission
7. **Justification mówi że "we will store videos on our servers"** — to **explicit policy violation**. Zachowaj treść z naszego justification ("we never download or re-host video bytes")
8. **Demo video pokazuje access do innych scope (np. youtube.readonly)** — pokazuj WYŁĄCZNIE youtube.upload flow

---

## Plan B — Invite-only launch (jeśli verification w toku)

Sytuacja: chcesz launchować publicznie, ale verification jeszcze nie approved. Plan B pozwala uruchomić MVP dla wąskiej grupy bez verification.

- [ ] W GCP Console → OAuth consent screen → **Publishing status: Testing**
- [ ] Test users: dodaj do 100 maili zaufanych userów (operator + pierwsza fala social Bachata Rebel)
- [ ] Marketing/komunikacja: "Beta zamknięta — wpisz email by dołączyć" (zbieraj emaile → manualne dodawanie do test users)
- [ ] Limity:
  - Max 100 test users — twardy limit Google
  - Każdy user musi być dodany manualnie przez operatora w GCP Console
  - Tokeny OAuth wygasają co **7 dni** w Testing mode (vs 6 mies. w Production mode) — user musi re-login co tydzień (UX cost)
- [ ] Plan B → A: gdy verification przyjdzie, przełącz Publishing status na `In production`, wszystkie tokeny re-issue z 6-miesięcznym okresem ważności

---

## Plan C — Drop upload feature z MVP

Sytuacja: verification rejected wielokrotnie lub timeline >3 mies. nieakceptowalny biznesowo. Plan C usuwa potrzebę sensitive scope.

- [ ] W IU-9 (AddVideoDialog) **usuń tab "Upload z dysku"** — zostają tylko:
  - YouTube link (paste public YT URL → fetch metadata, scope NIE wymagany, używamy server-side API key)
  - Meta link (FB/IG, jeśli Plan A dla Meta wybrany)
- [ ] W OAuth Consent Screen **usuń sensitive scope `youtube.upload`** — zostają tylko non-sensitive (`openid`, `email`, `profile`)
- [ ] **Automatic approval** — non-sensitive scopes nie wymagają verification, działają od razu
- [ ] Komunikacja do userów: "Wgrywanie z dysku jest dostępne w v1.1 — w MVP wklejaj linki YouTube swoich praktyk"
- [ ] User instructions: "Nagraj film → wgraj ręcznie do YouTube jako unlisted → wklej link YouTube w bachatanapoli.pl" (extra step, ale działa bez verification)

> **Decyzja Plan B vs Plan C:** Plan B daje pełny UX dla wąskiej grupy, Plan C daje publiczny launch z gorszym UX. Wybór operatora — zależy od priorytetu: scale vs UX.

---

## Po approval

- [ ] Status `Approved` + data wpisana
- [ ] W GCP Console → OAuth consent screen → **Publishing status: In production**
- [ ] Test users mogą zostać (nie blokują production users) lub można ich usunąć (już niepotrzebni)
- [ ] Operator komunikuje IU-9 builderowi: "verification approved — public launch unblocked"
- [ ] Operator przegląda quota status (Sekcja 7 w `gcp-setup.md`) — czy quota extension też approved
- [ ] Dokument zarchiwizowany w `docs/operations/` jako reference dla v1.1 (gdy będziemy dodawać dodatkowe scopes)
