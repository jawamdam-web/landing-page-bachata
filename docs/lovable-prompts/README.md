# Lovable Prompts — Bachata Napoli MVP

Chunked prompts do copy-paste do Lovable na bazie:
- **Plan techniczny:** `docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md`
- **Design system:** `docs/DESIGN.md`
- **Brainstorm:** `docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md`

## Filozofia chunkingu

Lovable (jak każdy AI builder) działa najlepiej na **focused, atomic prompts** — 1 vertical slice na raz, ~500-1500 słów. Wrzucenie całego planu (1300 linii) w jeden prompt = drift kontekstu, generic output.

Dlatego ten folder dzieli plan na 8 chunked promptów po fazach/IU, z explicit:
- **Context block** — co już istnieje (Lovable może o tym założyć)
- **Spec** — co budujemy
- **Constraints** — explicit DO/DON'T (kluczowe — bez tego halucynuje)
- **Acceptance criteria** — gating
- **Anti-hallucination guards** — typy, schemas, gotchas

## Kolejność wykonania

```
00-foundation         (raz, init projektu)
  ↓
01-auth               (foundation gotowy)
  ↓
02-landing            (auth gotowy — CTA linkują do /signup)
  ↓
03-library            (auth gotowy — protected route)
  ↓
04-video-sources-yt-link   (library schema gotowy)
  ↓
05-meta-embed         (po YT link — analogiczny pattern)
  ↓
06-share-tokens       (videos schema gotowy)
  ↓
07-legal              (landing gotowy — footer links)
  ↓
08-launch-prep        (wszystko gotowe — prerender + observability)
```

## Co tu **CELOWO** nie ma

| IU planu | Powód braku promptu |
|---|---|
| **IU-3** (GCP/YT/Meta operator setup) | Nie kod — operator runbook. Wykonujesz w GCP Console + Meta Dashboard ręcznie. Zob. plan techniczny IU-3 sekcja "Operator checklist". |
| **IU-9** (YouTube resumable upload) | **Custom protocol implementation** (chunking 308/401/5xx + refresh token + abort). Lovable PRAWIE NA PEWNO to schrzani lub uprości w niebezpieczny sposób. To 600+ linii security-sensitive logiki. Rekomendacja: ręcznie, test-first w eksportowanym repo. Zob. plan IU-9. |

## Tips dla pracy z Lovable

1. **GitHub sync od początku** — Lovable wspiera połączenie z GitHub repo. Włącz przed `00-foundation`. To pozwala wyeksportować kod do "prawdziwego" repo i kontynuować ręcznie w IU-9.
2. **Iteruj na małych krokach** — po każdym prompcie sprawdź wynik wizualnie + testuj. Nie wrzucaj kolejnego prompta jeśli poprzedni jest broken.
3. **Pin Tailwind v4 + DESIGN.md tokens** — Lovable może domyślnie startować z Tailwind v3. Foundation prompt explicite spec'uje v4 + `@theme` block. Jeśli Lovable się sprzeciwi — naciskaj.
4. **Polski UI copy** — każdy prompt mówi że labelki/komunikaty są PO POLSKU z voice "ty/ciepło". Lovable czasem domyśla się angielskiego — koryguj.
5. **Supabase integration** — Lovable ma native Supabase integration. Połącz swój staging Supabase project w settings Lovable PRZED `01-auth`. Schema SQL z promptów = wklejasz w Supabase SQL Editor + Lovable wyczyta types.
6. **RLS policies test po każdej migracji** — Lovable może wygenerować RLS ale nie testuje cross-user access. Po każdym prompcie z migracją: zaloguj się jako user A, sprawdź że nie widzisz danych usera B (przez Supabase Studio impersonation).
7. **Jeśli Lovable proponuje deviation od planu** — przeczytaj uzasadnienie, ale **default = trzymać się planu**. Plan był skrupulatnie przemyślany (decyzje w `docs/plans/...md`), Lovable często optuje za łatwiejszą ścieżką która później kosztuje.
8. **Bezpieczeństwo IU-10 share tokens** — jeśli mimo wszystko używasz Lovable do IU-10, ABSOLUTELY WERYFIKUJ że `get_shared_content` to SECURITY DEFINER function + RLS na `share_tokens` blokuje anon SELECT. Halucynacja tu = leak prywatnych filmów.

## Hybrid workflow rekomendowany

```
Lovable    →  Foundation, Auth, Landing, Library, YT link, Legal, Launch prep
              (Fazy 1-3, 5 + część 4)
                                ↓
                       GitHub export
                                ↓
Manual     →  Meta embed (security), Resumable upload (IU-9), Share tokens (IU-10)
              w eksportowanym repo, test-first dla każdego
```

To daje szybki demo (Lovable) + bezpieczeństwo (manual dla critical paths).

## Format każdego promptu

```markdown
# <Phase title>

**Z planu:** IU-N
**Wymaga:** poprzednie prompty zrealizowane
**Output Lovable:** ~ile plików/komponentów

---

## Context (Lovable zakłada że istnieje)
...

## Build

<--- PASTE FROM HERE TO LOVABLE --->

[Sam prompt — copy-paste]

<--- END PASTE --->

## Acceptance — sprawdź zanim przejdziesz do następnego promptu

- [ ] ...

## Common gotchas

- ...
```

## Status

| Prompt | Status | Output |
|---|---|---|
| 00-foundation | gotowy | Vite + React + TS + Tailwind v4 + shadcn + Supabase init |
| 01-auth | gotowy | Login/signup/forgot/reset + profiles trigger |
| 02-landing | gotowy | 6 sekcji + mobile responsive + SEO |
| 03-library | gotowy | Schema + dashboard + foldery + m:n |
| 04-video-sources-yt-link | gotowy | YT link paste + AddVideoDialog + VideoPlayer |
| 05-meta-embed | gotowy | Meta embed (z security warnings) |
| 06-share-tokens | gotowy | Share tokens + SECURITY DEFINER + public view |
| 07-legal | gotowy | Privacy + regulamin + cookie consent |
| 08-launch-prep | gotowy | Prerender + Sentry + Plausible + sitemap |
