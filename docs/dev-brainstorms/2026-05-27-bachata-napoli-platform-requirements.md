---
date: 2026-05-27
topic: bachata-napoli-platform
---

# Bachata Napoli — platforma społeczności tanecznej + biblioteka filmów

## Problem

**Główny pain point użytkownika:** Osoby uczęszczające na zajęcia bachaty nagrywają telefonem nowe figury i kombinacje pokazane przez instruktorów. Te filmy gubią się w rolce telefonu razem z setkami innych zdjęć — ciężko wrócić do figury sprzed tygodnia, brakuje organizacji, brak powiązania z grupą zajęć/instruktorem/poziomem.

**Drugi cel — biznesowy/społeczny:** Właściciel pizzerii Napoli w Lubinie (Jarek) chce zbudować lokalną społeczność dancerów Bachaty z Lubina i okolic (Legnica, Polkowice, Głogów). Cykliczne spotkania w lokalu ("Bachata Napoli - Social & Practise") + darmowe lekcje od instruktorów Małgosi i Szymona Andrzejewskich (szkoła Bachata Rebel) mają być seedem społeczności.

**Strategiczna ambicja:** Po udanej walidacji w Polsce — platforma globalna dla bachateros (i potencjalnie innych styli tanecznych) jako miejsce zapisu i organizacji filmów instruktarzowych z różnych źródeł.

## Wymagania

### Landing page i społeczność

- **R1.** Landing page promujący platformę z **głównym CTA = rejestracja konta** na bibliotekę filmów. Lokalne spotkania w pizzerii Napoli są wymienione jako jeden z benefitów społecznościowych, ale nie są głównym CTA.
- **R2.** Hero section to FOTO opowiadające oba wątki produktu w jednej klatce: właściciel (Jarek) z boku — w jednej ręce telefon do nagrywania, w drugiej kawałek pizzy, w głównym kadrze para instruktorów (Małgosia + Szymon) wykonująca figurę bachaty.
- **R3.** Hero musi być wymienialny przez admina — w MVP zdjęcie, w v2+ także wideo (autoplay muted loop).
- **R4.** Sekcja "Dlaczego Napoli?" / About — opowieść o związku z pizzerią w Lubinie. Element marketingowy, conversation starter.
- **R5.** Sekcja "Bachata Napoli - Social & Practise" — informacja o cyklicznych spotkaniach (gdzie: pizzeria Napoli w Lubinie; kiedy: docelowo raz w tygodniu; co: integracja + lekcja z instruktorami + wspólny practise).
- **R6.** Sekcja "Instruktorzy" — profile Małgosi i Szymona Andrzejewskich z linkiem/wzmianką szkoły Bachata Rebel.

### Rejestracja i konto użytkownika

- **R7.** Logowanie/rejestracja dwoma metodami: **Google OAuth** ORAZ **email + hasło**. User wybiera jedną. Konto utworzone z email/hasłem może później dolinkować Google (wymagane do uploadu YT).
- **R8.** Profil użytkownika z osobistą biblioteką filmów. Domyślnie wszystkie filmy są **prywatne** (widoczne tylko dla właściciela konta).

### Biblioteka filmów — źródła

W MVP wspierane są **3 źródła**:

- **R9.** **Link YouTube (paste + embed)** — user wkleja URL filmu z YouTube, film wyświetla się jako oficjalny YT embed w bibliotece.
- **R10.** **Upload pliku wideo z urządzenia → konto YouTube usera (OAuth)** — user (zalogowany Google + autoryzowany scope `youtube.upload`) wybiera plik z telefonu/komputera → backend uploaduje na jego osobiste konto YT jako **unlisted** → film automatycznie pojawia się w bibliotece na bachatanapoli.pl. To rozwiązuje główny pain point (zachowanie nagrań z zajęć).
- **R11.** **Link do publicznego posta Facebook/Instagram (embed Meta widget)** — user wkleja URL publicznego posta z filmem, używamy **oficjalnego embed widgetu Meta** (iframe). Bez kopiowania pliku. Embed przestaje działać, gdy autor usunie post — to akceptowalne ograniczenie.

### Biblioteka filmów — organizacja

- **R12.** User tworzy **własne, dowolne grupy/foldery** (np. "Zajęcia poniedziałkowe z Andrzejewskimi", "Practisy w plenerze", "Trudne kombinacje", "Warsztaty Daniel & Desiree").
- **R13.** Jeden film może być **w wielu folderach naraz** (tag-like). User może tworzyć/edytować/usuwać foldery dowolnie.
- **R14.** Film ma minimum: tytuł (auto z YT lub user-edytowalny), link/embed, datę dodania, opcjonalne notatki/opis usera (krótkie pole tekstowe).

### Udostępnianie

- **R15.** User może wygenerować **publiczny link z tokenem** (np. `bachatanapoli.pl/s/abc123`) dla pojedynczego filmu lub całej grupy. Każdy z linkiem widzi treść w trybie read-only, bez konieczności posiadania konta.
- **R16.** User może w każdej chwili **cofnąć (revoke) link** — istniejące linki przestają działać.
- **R17.** Brak listy "znajomych" / follow / publicznego feedu / przeglądania cudzych bibliotek w MVP.

### Doświadczenie mobilne

- **R18.** Strona musi być w pełni responsywna i działać dobrze na telefonie. Główny use case (nagrywanie + zapis filmu) zaczyna się na telefonie tuż po zajęciach.

## Kryteria sukcesu

Pomiar w pierwszych 3 miesiącach po publicznym starcie MVP:

- **Główny (north star):** Engagement — **średnia liczba zapisanych filmów na aktywnego usera ≥ 5**. (Aktywny = user, który zapisał min. 1 film). To najtwardszy sygnał, że produkt rozwiązuje realny pain point.
- **Wspierający 1 — Rejestracje:** min. 50 zarejestrowanych użytkowników.
- **Wspierający 2 — Retencja:** ≥ 30% userów wraca na stronę w tygodniach 2-4 po rejestracji.
- **Wspierający 3 — Frekwencja lokalna:** średnio ≥ 10 osób na cyklicznym spotkaniu Bachata Napoli w Lubinie.

## Granice scope'u (świadome non-goals w MVP)

- **NIE w MVP:** Auto-import/auto-download filmów z Facebook/Instagram (problem prawny, ToS, niestabilność). Akceptowalna alternatywa: user pobiera własny film ręcznie i używa funkcji R10 (upload na YT).
- **NIE w MVP:** Integracja z Google Drive.
- **NIE w MVP:** Publiczne profile, discovery, feed innych userów, follow/friends, lajki, komentarze.
- **NIE w MVP:** Tagi predefiniowane (poziom, styl, kategoria ruchu) — tylko własne foldery usera.
- **NIE w MVP:** Aplikacja natywna (iOS/Android) — tylko web responsywny.
- **NIE w MVP:** Wielojęzyczne UI — tylko polski (audience polski).
- **NIE w MVP:** System płatności, premium, ticketing na spotkania.
- **NIE w MVP:** Weryfikacja/certyfikacja instruktorów.

## Kluczowe decyzje

- **Branding "Bachata Napoli" zostaje** mimo lokalnego charakteru "Napoli". Uzasadnienie: domena bachatanapoli.pl, polski audience jako primary, a pytanie "dlaczego Napoli?" jest świadomie wykorzystywane jako conversation starter i marketing dla pizzerii.
- **Polski audience first, globalność jako aspiracja.** Polskie UI, polski content, polska społeczność. Globalność = oddzielna decyzja po walidacji.
- **YouTube jako de facto backend storage filmów (przez upload na konto usera).** Nie hostujemy własnych plików wideo — to ogromna oszczędność infrastrukturalna i ucieczka przed odpowiedzialnością za copyright. Backend trzyma metadata + linki.
- **Privacy first** — filmy domyślnie prywatne, share tylko przez świadomą akcję (token link).
- **Identity model: Google OAuth + email/hasło**, z możliwością połączenia kont (link Google later dla YT upload).
- **Wizualnie:** editorial layout (Apple/Notion-style) + ciepły akcent włoski (terracotta / pomidor / oliwa — wybór konkretnego koloru w fazie designu). Hero photo (z opcją wymiany na wideo przez admina) opowiada obie warstwy produktu.

## Zależności / Założenia

- **YouTube API:** scope `youtube.upload` jest "sensitive scope" Google i wymaga **weryfikacji aplikacji** (security review). Process trwa ~2-6 tygodni i wymaga publikacji privacy policy, homepage, demo video itp. To krytyczna ścieżka, którą trzeba uruchomić wcześnie w timeline'ie.
- **Quota YouTube Data API:** domyślny limit 10,000 jednostek/dzień; każdy upload to ~1600 jednostek (~6 uploadów/dzień globalnie na cały projekt). Wymaga **quota extension request** przed launchem.
- **Hero photo:** wymaga realnej sesji zdjęciowej z właścicielem + instruktorami w pizzerii. To produkcyjna zależność, nie techniczna.
- **Partnerstwo z Bachata Rebel:** istnieje (Małgosia + Szymon zaakceptowali). Treści marketingowe (zdjęcia, bio) wymagają zebrania w produkcji.
- **Google Cloud project + OAuth client + Facebook embed config:** standardowa konfiguracja, do uruchomienia w planowaniu.
- **GDPR/PL prywatność:** wymagana polityka prywatności, regulamin, cookie consent. Standard EU.

## Otwarte pytania

### Do rozwiązania przed planowaniem

(Brak — wszystkie krytyczne decyzje produktowe są podjęte.)

### Odroczone do planowania

- **[Dotyczy R3][Techniczne]** Jakie ograniczenia rozmiaru/typu pliku akceptujemy przy upload na YT (R10)? YT przyjmuje ~256 GB, ale UX musi obsłużyć długi upload z telefonu (estymacja postępu, retry, background upload).
- **[Dotyczy R10][Wymaga researchu]** Kiedy prosić o scope `youtube.upload` — przy rejestracji Google OAuth, czy incremental authorization przy pierwszej próbie uploadu? (Best practice: incremental, ale wymaga sprawdzenia UX trade-offs.)
- **[Dotyczy R10][Techniczne]** Czy upload idzie bezpośrednio z przeglądarki do YT (resumable upload), czy przez nasz backend jako proxy? Direct = niższe koszty + szybciej, ale bardziej skomplikowany flow tokenów.
- **[Dotyczy R5][Decyzja produktowa]** Czy spotkania mają RSVP (formularz "zapisuję się na czwartek") w MVP czy tylko informacja statyczna z datą? Sugestia: zacząć od statycznego info + przekierowania do grupy FB/Messenger.
- **[Dotyczy R11][Techniczne]** Embed FB/IG widget wymaga konfiguracji App ID w Meta. Sprawdzić aktualne wymagania Meta Developer (po ostatnich zmianach w polityce).
- **[Dotyczy R7][Techniczne]** Recovery hasła, weryfikacja emaila — standardowy mailing flow, wybór provider (Resend/Postmark/Mailgun) na fazę planowania.
- **[Dotyczy R2/R3][Produkcyjne]** Sesja zdjęciowa hero — zorganizować (data, lokalizacja w pizzerii, fotograf, zgody na wizerunek).
- **[Wymaga researchu]** Wybór stacku technicznego (frontend framework, backend, baza, hosting). Sugestia: Next.js + Supabase albo Next.js + własne API — do rozstrzygnięcia w `/dev-plan`.
- **[Dotyczy R18][Techniczne]** Czy PWA z installable manifest + camera access dla łatwiejszego nagrywania w MVP, czy tylko responsive web? Sugestia: zacząć od responsive, PWA w v1.1.
- **[Decyzja produktowa]** Tagline/hasło reklamowe pod nazwą "Bachata Napoli" (np. "Twoja biblioteka tańca + spotkania w Lubinie") — do dopracowania w fazie copy.

## Następne kroki

→ `/dev-plan` do planowania technicznego implementacji
