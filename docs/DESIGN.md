---
project: Bachata Napoli
domain: bachatanapoli.pl
last_updated: 2026-05-27
status: living-document
audience_locale: pl-PL
spec_format: google-labs/design.md

# =============================================================================
# BRAND
# =============================================================================
brand:
  name: Bachata Napoli
  tagline_placeholder: "Twoja biblioteka tańca + spotkania w Lubinie"
  vibe: editorial (Apple/Notion-style) + ciepły akcent włoski (terracotta)
  personality:
    - warm
    - editorial
    - mobile-first
    - lokalny ale aspiracyjnie globalny
  voice: ty, ciepło-społecznościowy
  voice_reference: Slack PL, Notion PL, Linear PL — partnerski, naturalny

# =============================================================================
# COLOR TOKENS (OKLCH — perceptual uniform, WCAG-friendly)
# =============================================================================
# Filozofia: warm-neutral jako PRIMARY system (background + text + border).
# Terracotta używana OSZCZĘDNIE jako akcent (CTA, focus, link, hover).
# Nie wypełniamy hero/sekcji solid terracotta — zostaje editorial.
# =============================================================================
colors:
  # --- ACCENT (terracotta przygaszony — używane <10% powierzchni)
  # L=0.55 (nie 0.62): biały tekst na accent = 4.99:1 WCAG 2 AA (review-faza-2 P2-5)
  accent:
    DEFAULT:         "oklch(0.55 0.13 38)"   # primary CTA bg, focus ring color
    hover:           "oklch(0.48 0.14 38)"   # CTA hover, active link
    pressed:         "oklch(0.42 0.14 38)"   # active/pressed state
    foreground:      "oklch(0.99 0 0)"       # text/icon on accent bg (white)
    soft:            "oklch(0.96 0.03 38)"   # bg dla banner/badge/highlight
    soft_foreground: "oklch(0.45 0.13 38)"   # tekst na soft + samodzielny link color

  # --- BACKGROUND (warm-neutral, cream-tinged white)
  bg:
    DEFAULT:  "oklch(0.99 0.004 70)"   # main page bg, cream-white
    subtle:   "oklch(0.97 0.006 70)"   # cards, secondary panels
    muted:    "oklch(0.94 0.008 70)"   # tertiary surfaces (hover bg, code blocks)
    inverse:  "oklch(0.18 0.01 70)"    # ciemne sekcje (footer, dark mode bg)

  # --- FOREGROUND (text / icons)
  fg:
    DEFAULT:  "oklch(0.22 0.01 70)"    # body text — WCAG AAA on bg.DEFAULT
    muted:    "oklch(0.50 0.01 70)"    # secondary text, meta, captions
    subtle:   "oklch(0.68 0.01 70)"    # placeholders, disabled, tertiary
    inverse:  "oklch(0.97 0.004 70)"   # text na inverse bg

  # --- BORDER
  border:
    DEFAULT:  "oklch(0.90 0.008 70)"   # divider, default border
    strong:   "oklch(0.82 0.01 70)"    # input border, focused subtle elements
    focus:    "oklch(0.55 0.13 38)"    # focus ring (lustro accent.DEFAULT)
    inverse:  "oklch(0.30 0.01 70)"    # border na inverse bg

  # --- SEMANTIC (oszczędnie, tylko dla feedback systemowego)
  semantic:
    success:            "oklch(0.62 0.13 145)"
    success_foreground: "oklch(0.99 0 0)"
    warning:            "oklch(0.74 0.14 78)"
    warning_foreground: "oklch(0.22 0.01 70)"
    error:              "oklch(0.58 0.20 25)"
    error_foreground:   "oklch(0.99 0 0)"
    info:               "oklch(0.62 0.11 230)"
    info_foreground:    "oklch(0.99 0 0)"

  # --- DARK MODE (deferred — opt-in v1.1)
  # Mapowanie 1:1 z systemem light przez @media (prefers-color-scheme: dark).
  # Nie implementujemy w MVP — placeholder dla v1.1.
  dark_mode_status: deferred-v1.1

# =============================================================================
# TYPOGRAPHY (sans-only, modern editorial przez skalę i rytm)
# =============================================================================
typography:
  font_family:
    sans: "'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace"
  font_load_strategy:
    primary: variable font (Geist Variable woff2, subset latin + latin-ext)
    display: swap
    preload: true   # link rel=preload dla Geist Variable

  # Mobile-first scale (rem-based; root = 16px)
  scale_mobile:
    display:    { size: "2.5rem",    line: 1.05, weight: 600, tracking: "-0.025em" }
    h1:         { size: "2rem",      line: 1.1,  weight: 600, tracking: "-0.02em" }
    h2:         { size: "1.5rem",    line: 1.2,  weight: 600, tracking: "-0.015em" }
    h3:         { size: "1.25rem",   line: 1.3,  weight: 600, tracking: "-0.01em" }
    h4:         { size: "1.125rem",  line: 1.35, weight: 600, tracking: "-0.005em" }
    body_lg:    { size: "1.125rem",  line: 1.55, weight: 400, tracking: "0" }
    body:       { size: "1rem",      line: 1.55, weight: 400, tracking: "0" }
    small:      { size: "0.875rem",  line: 1.5,  weight: 400, tracking: "0" }
    meta:       { size: "0.8125rem", line: 1.45, weight: 500, tracking: "0.02em" }
    mono:       { size: "0.875rem",  line: 1.5,  weight: 400, tracking: "0" }

  # Desktop step-up od md (>=768px) — tylko display/h1/h2 rosną
  scale_desktop_overrides:
    display:    { size: "4rem",     line: 1.0  }
    h1:         { size: "2.75rem",  line: 1.08 }
    h2:         { size: "2rem",     line: 1.15 }

  # Numeric features (Geist supports OpenType)
  font_features:
    body:     "'cv11', 'ss01'"     # nicer 1/4/6
    numeric:  "'tnum', 'lnum'"     # tabular + lining figures dla liczb (czas, video duration)
    headings: "'ss01', 'cv11'"

# =============================================================================
# SPACING (4px base, exponential scale)
# =============================================================================
spacing:
  base: "0.25rem"   # 4px
  scale:
    "0":    "0"
    "px":   "1px"
    "2xs":  "0.25rem"   # 4px
    "xs":   "0.5rem"    # 8px
    "sm":   "0.75rem"   # 12px
    "md":   "1rem"      # 16px
    "lg":   "1.5rem"    # 24px
    "xl":   "2rem"      # 32px
    "2xl":  "3rem"      # 48px
    "3xl":  "4rem"      # 64px
    "4xl":  "6rem"      # 96px  — section padding desktop
    "5xl":  "8rem"      # 128px — hero padding desktop
    "6xl":  "10rem"     # 160px — extra-large section breaks

  container:
    max:        "72rem"    # 1152px — main editorial column
    prose:      "42rem"    # 672px  — long-form readable text
    narrow:     "32rem"    # 512px  — forms, dialogs
    page_px_mobile:  "1.25rem"   # 20px — page horizontal padding mobile
    page_px_tablet:  "2rem"      # 32px — page horizontal padding md+
    page_px_desktop: "2.5rem"    # 40px — page horizontal padding xl+

  section_rhythm:
    mobile:  "3rem"     # py-12 — vertical between sections
    tablet:  "4rem"     # py-16
    desktop: "6rem"     # py-24

# =============================================================================
# RADII (concentric scale — nested elementy mają mniejszy radius o ~4px)
# =============================================================================
radius:
  none: "0"
  xs:   "0.25rem"     # 4px  — chips, small badges, inputs sm
  sm:   "0.5rem"      # 8px  — buttons sm, inputs
  md:   "0.75rem"     # 12px — buttons md/lg, cards inner
  lg:   "1rem"        # 16px — cards
  xl:   "1.5rem"      # 24px — hero cards, modals, panels
  "2xl":"2rem"        # 32px — extra-large containers
  full: "9999px"      # pills, avatars

  # CONCENTRIC RULE: nested radius = parent_radius - parent_padding
  # Example: card radius=lg (16px), padding=md (16px) → inner element radius=xs/none
  concentric_rule: "child_radius = parent_radius - parent_padding (min 0)"

# =============================================================================
# SHADOWS / ELEVATION (warm-tinted, oszczędnie)
# =============================================================================
# Filozofia: editorial = minimalne cienie. Preferuj hairline border nad shadow
# dla flat cards. Shadow tylko dla LIFTED elementów (modal, popover, toast).
# =============================================================================
shadow:
  none:  "none"
  xs:    "0 1px 2px 0 oklch(0.20 0.01 70 / 0.04)"
  sm:    "0 1px 3px 0 oklch(0.20 0.01 70 / 0.06), 0 1px 2px -1px oklch(0.20 0.01 70 / 0.04)"
  md:    "0 4px 6px -2px oklch(0.20 0.01 70 / 0.06), 0 2px 4px -2px oklch(0.20 0.01 70 / 0.04)"
  lg:    "0 10px 15px -3px oklch(0.20 0.01 70 / 0.08), 0 4px 6px -4px oklch(0.20 0.01 70 / 0.04)"
  xl:    "0 20px 25px -5px oklch(0.20 0.01 70 / 0.10), 0 8px 10px -6px oklch(0.20 0.01 70 / 0.04)"

  focus:        "0 0 0 3px oklch(0.55 0.13 38 / 0.32)"   # focus-visible ring
  focus_inset:  "inset 0 0 0 2px oklch(0.55 0.13 38)"    # focus dla custom inputs
  hairline:     "inset 0 0 0 1px oklch(0.90 0.008 70)"   # shadow-as-border (image outline)

# =============================================================================
# MOTION (delikatne, krótkie, respect reduced motion)
# =============================================================================
motion:
  duration:
    instant: "0ms"
    fast:    "120ms"     # hover, focus, micro-interactions
    normal:  "180ms"     # most UI transitions
    slow:    "240ms"     # page enter, sheet open
    slower:  "320ms"     # rare — large layout shifts
  easing:
    standard: "cubic-bezier(0.2, 0.0, 0.0, 1.0)"     # default UI ease (Material-like)
    enter:    "cubic-bezier(0.0, 0.0, 0.2, 1.0)"     # ease-out, fade/slide IN
    exit:     "cubic-bezier(0.4, 0.0, 1.0, 1.0)"     # ease-in, fade/slide OUT
    bounce:   "cubic-bezier(0.34, 1.56, 0.64, 1.0)"  # playful — sparingly (heart-react itp.)
  press_scale:    "0.96"      # active:scale-[0.96] na primary buttons + cards tappable
  press_duration: "fast"      # 120ms
  respect_reduced_motion: true    # @media (prefers-reduced-motion: reduce) → wszystko duration 0 lub minimal

# =============================================================================
# BREAKPOINTS (mobile-first, Tailwind v4 default + xs custom)
# =============================================================================
breakpoints:
  xs: "23.4375rem"   # 375px — iPhone SE, najmniejszy supported
  sm: "40rem"        # 640px
  md: "48rem"        # 768px — landing przełącza się na 2-col grid
  lg: "64rem"        # 1024px — dashboard sidebar pojawia się
  xl: "80rem"        # 1280px — max editorial width hits
  "2xl": "96rem"     # 1536px — wide displays (content max-width nie rośnie)

  primary_target: "mobile (375-640px) — główny use case to nagrywanie po zajęciach"

# =============================================================================
# Z-INDEX SCALE
# =============================================================================
z_index:
  base:      0
  raised:    10    # cards hover, focused
  dropdown:  20
  sticky:    30    # sticky header/footer
  overlay:   40    # modal backdrop, sheet backdrop
  modal:     50    # dialog, sheet content
  popover:   60    # popover, command menu
  toast:     70    # toast notifications (Sonner)
  tooltip:   80    # tooltips (top of stack)

# =============================================================================
# ICONOGRAFIA
# =============================================================================
iconography:
  library: "lucide-react"         # spójna z shadcn/ui
  size_scale:
    xs: "0.875rem"    # 14px — inside small badges
    sm: "1rem"        # 16px — inline w tekście, inputs
    md: "1.25rem"     # 20px — default UI
    lg: "1.5rem"      # 24px — primary actions, navigation
    xl: "2rem"        # 32px — hero/feature accents
  stroke_width: 1.75   # nieco cieńszy niż default 2 — editorial feel
  color_strategy: "currentColor — ikony dziedziczą kolor tekstu kontekstu"

# =============================================================================
# IMAGES / MEDIA
# =============================================================================
media:
  hero:
    mobile_aspect:  "4/5"      # portrait — pełny ekran telefonu
    desktop_aspect: "16/9"     # landscape — editorial szerokie
    min_width:  "1280px"       # source min
    max_width:  "2560px"       # source max
    format_preference: ["AVIF", "WebP", "JPEG"]   # picture> srcset z fallback
    loading: "eager"           # hero = nie lazy, LCP critical
    fetch_priority: "high"
  thumbnails:
    aspect: "16/9"             # YT default
    radius: "md"
    outline: "hairline"        # shadow-as-border (subtle 1px outline na jasnych obrazkach)
  video_embeds:
    aspect_ratio_wrapper: "aspect-video"   # responsywny 16/9
    poster_required: true                  # YT auto, FB/IG auto przez widget
    youtube_params: "?rel=0&modestbranding=1"
  optimization:
    lazy_load_below_fold: true
    decoding: "async"

# =============================================================================
# FORMS / INPUTS
# =============================================================================
forms:
  input_height:
    sm: "2rem"        # 32px
    md: "2.5rem"      # 40px — default
    lg: "3rem"        # 48px — mobile-friendly tap target
  tap_target_min: "2.75rem"     # 44px — WCAG 2.5.5 minimum
  border_default: "border"
  focus_style: "ring-2 ring-accent/40 + border-accent"
  error_indication: "border-error + helper text below w error_foreground"

# =============================================================================
# ACCESSIBILITY BASELINE
# =============================================================================
accessibility:
  wcag_target: "2.2 AA"
  color_contrast:
    body_text: "≥ 7:1 (AAA)"        # fg.DEFAULT na bg.DEFAULT
    large_text: "≥ 4.5:1 (AA)"
    ui_components: "≥ 3:1"
  focus_indicator: "visible focus ring na wszystkich interaktywnych — never outline:none bez zastąpienia"
  keyboard_navigation: "wszystko dostępne klawiaturą; logiczny tab order; skip-to-content link"
  screen_reader: "aria-label dla icon-only buttons; aria-live dla toast/error; semantic HTML > div soup"
  language: 'html lang="pl"'
  reduced_motion: respected (motion.respect_reduced_motion = true)
---

# Bachata Napoli — Design System

> Living document. Każda zmiana tokenów = uzasadnienie w PR description + update tabeli w `Changelog` na końcu.

## 1. Filozofia

**Editorial Apple/Notion-style + ciepły akcent włoski.**

Layout jest spokojny, oddychający, prowadzi wzrok przez hierarchię typograficzną — nie przez efekciarstwo. Kolor terracotta pojawia się **oszczędnie** — jako CTA, focus ring, link, akcent w hero. Reszta interfejsu to warm-neutral cream/beż.

Dlaczego: bazując na decyzjach z brainstorma:
- **Mobile-first** — główny moment użycia to telefon po zajęciach tańca
- **Privacy first** — interfejs nie krzyczy, nie nagabuje
- **Włoski akcent jako conversation starter** — terracotta jako "dlaczego Napoli?" w pixelach, nie jako brand overload
- **Dojrzały, partnerski ton** — Slack/Notion PL, nie casual chat ani korporacyjny formal

**Czego unikamy:**
- Gradientów neonowych, mocnych saturacji, jaskrawego designu fitness-app
- Stocków pizza/Italia (autentyczne foto > stock)
- Animacji popis (motion = mniej, krócej, z `prefers-reduced-motion`)
- Modali na każdym kroku (preferuj inline + sheets mobile)

---

## 2. Voice & tone — copy PL

**Ty, ciepło-społecznościowy.** Naturalny, partnerski, niezbyt formalny.

### Reguły praktyczne

| Sytuacja | ✅ Tak | ❌ Nie |
|---|---|---|
| CTA primary | "Załóż konto", "Zapisz film", "Udostępnij" | "Zarejestruj się teraz!", "ROZPOCZNIJ TERAZ" |
| Empty state | "Twoja biblioteka czeka na pierwszy film." | "Brak danych do wyświetlenia." |
| Success toast | "Film zapisany." | "Operacja zakończona pomyślnie." |
| Error | "Nie udało się zapisać. Spróbuj jeszcze raz." | "Wystąpił błąd. Skontaktuj się z administratorem." |
| Confirm destructive | "Usunąć folder? Filmy w środku zostają w bibliotece." | "Czy na pewno chcesz wykonać tę akcję?" |
| Auth | "Zaloguj się przez Google", "Albo email i hasło" | "Autoryzacja użytkownika" |
| Help text | "Wklej link do filmu z YouTube" | "Wprowadź adres URL zasobu" |

### Mikro-zasady

- **Przyciski czasownikiem w trybie rozkazującym** ("Zapisz", "Anuluj", "Udostępnij") — nie infinitiwem ("Zapisać")
- **Aktywne strona zamiast biernej** — "Zapisaliśmy film" zamiast "Film został zapisany"
- **Bez wykrzykników** w UI labelach (możliwe w pojedynczych miejscach copy marketing)
- **Liczby cyframi** ("5 filmów" nie "pięć filmów")
- **Konsystentny gender — neutralny gdy się da** ("Twoja biblioteka", "Twoje filmy", nie "Twój folder filmów" → "Twoje foldery")
- **Polski feedback time** — "przed chwilą", "5 min temu", "wczoraj", potem data
- **Bez clickbaitu** ("Zobacz, co się stało!" → nie)

### Tone w marketingowym copy landing

Można pozwolić sobie na więcej charakteru — gra na "dlaczego Napoli?":

> "Zaczęło się od pizzy i bachaty w jednym lokalu. Reszta to historia."

> "Twoje filmy z zajęć — uporządkowane. Bez gubienia w rolce telefonu."

---

## 3. Kolor — reguły użycia

### Hierarchia warstw

1. **Tło systemu** = `bg.DEFAULT` (cream-white). 80%+ powierzchni.
2. **Treść** = `fg.DEFAULT`. Wysokokontrastowa, AAA.
3. **Akcent terracotta** = `accent.DEFAULT`. **Maksymalnie ~10% powierzchni widoku.** Zarezerwowany dla:
   - Primary CTA (button bg)
   - Focus ring (focus-visible state)
   - Linki w prose
   - Aktywny stan w nawigacji (indicator dot/line)
   - Subtle hero accent (np. nadkreślenie pod kluczowym słowem)

### Co NIE robić

- ❌ Hero section z solid terracotta tłem → traci editorial
- ❌ Wszystkie ikony w terracotta → wizualny szum
- ❌ Border domyślny w terracotta → przesadny akcent
- ❌ Headings w terracotta → odbiera hierarchii

### Soft akcent (banner, badge, callout)

Dla kontekstualnych highlightów: `accent.soft` jako bg + `accent.soft_foreground` jako tekst. Przykład: badge "Nowy" przy świeżo dodanym filmie, callout "Najbliższe spotkanie" na landing.

### Semantic

- Używaj `success/warning/error/info` **tylko** dla feedback systemowego (toasts, inline errors, banner status)
- Nie używaj jako dekoracji ("ten przycisk zielony bo wesoły" → nie)

---

## 4. Typografia — hierarchia i rytm

### Skala — kiedy używać

| Token | Mobile | Desktop | Użycie |
|---|---|---|---|
| `display` | 2.5rem | 4rem | Hero h1 jedyne na stronie |
| `h1` | 2rem | 2.75rem | Sekcja-level heading |
| `h2` | 1.5rem | 2rem | Podsekcja |
| `h3` | 1.25rem | (=mobile) | Card title, dialog title |
| `h4` | 1.125rem | (=mobile) | Group label |
| `body_lg` | 1.125rem | (=mobile) | Lead paragraph (pierwszy w prose) |
| `body` | 1rem | (=mobile) | Default text |
| `small` | 0.875rem | (=mobile) | Secondary info, help text |
| `meta` | 0.8125rem | (=mobile) | Eyebrows ("INSTRUKTORZY"), timestamps, captions |
| `mono` | 0.875rem | (=mobile) | Kod, technical ID (np. share token preview) |

### Reguły

- **Jedna `display` na stronę** — hero h1
- **Tracking ujemny dla dużych** (`display`, `h1`, `h2`) — wyrównuje optyczny luz między literami
- **Tabular numbers** (`font-feature-settings: 'tnum'`) dla wszystkiego co liczbowe: video duration, view count, timestamp, daty
- **Line height inversed do rozmiaru** — duży tekst = ciasne `line: 1.05-1.1`; body = luźne `line: 1.55`
- **Max prose width = `container.prose` (672px)** — dłuższy tekst niż to traci czytelność
- **Eyebrows w `meta` + uppercase + `tracking: 0.02em`** — etykiety sekcji
- **Font smoothing** — `-webkit-font-smoothing: antialiased` + `-moz-osx-font-smoothing: grayscale` globally

### Antypatterny

- ❌ 5 różnych weightów na stronie → wybierz 2 (np. 400 + 600)
- ❌ Italic dla emphasis → użyj `body` font-weight 500 lub `accent.soft` highlight
- ❌ Text-decoration underline na headings
- ❌ Justify (text-align: justify) — preferuj left-align (PL diakrytyki + Geist nie radzą sobie dobrze z justify)

---

## 5. Spacing & layout

### Wertikalny rytm sekcji

```
mobile:   py-12  (48px)
tablet:   py-16  (64px)
desktop:  py-24  (96px)
```

Hero ma 1.5x:
```
mobile:   py-20  (80px)
desktop:  py-32  (128px)
```

### Container

- **Strony landing** — `max-w-6xl mx-auto px-5 md:px-8 xl:px-10` (max 1152px)
- **Long-form prose** (About, Polityka prywatności) — `max-w-[42rem]`
- **Forms / dialogs** — `max-w-[32rem]`

### Mobile padding

Wszystkie strony zaczynają od `px-5` (20px). Mniej = treść wręcz nakleja się na brzeg (źle na telefonach z zakrzywionym ekranem); więcej = traci powierzchni.

---

## 6. Radius — concentric rule

**Reguła:** dziecko ma radius mniejszy o ~`padding` od rodzica. Inaczej rogi wyglądają "skręcone".

Przykład:
```
Card:    radius=lg (16px),  padding=md (16px)
  └ inner element (button, badge): radius=xs (4px)
```

```
Hero card: radius=xl (24px), padding=lg (24px)
  └ inner CTA: radius=sm (8px)
```

Mała różnica — gigantyczny zysk wizualny. Bez tego rogi są "wgięte" optycznie.

### Skala radius — kiedy używać

| Token | Element |
|---|---|
| `xs` 4px | chips, badges sm, inputs sm wewnątrz card |
| `sm` 8px | buttons sm, inputs default |
| `md` 12px | buttons md/lg, inner card elements |
| `lg` 16px | cards |
| `xl` 24px | hero cards, modals, sheets |
| `2xl` 32px | XL feature cards, dashboard panels |
| `full` | pills, avatars, status dots |

---

## 7. Shadow / elevation

**Filozofia:** editorial = mało cieni. Preferuj **hairline border** zamiast shadow dla flat cards.

- **Flat card** (default w bibliotece) — `border border-border` + `bg.subtle`. ZERO shadow.
- **Hover card** (interactive) — `border-border-strong` na hover, optional `shadow-xs`
- **Lifted card** (modal, popover) — `shadow-lg` + `border-border`
- **Modal/Sheet** — `shadow-xl`
- **Toast** — `shadow-md`

**Image outline** — wszystkie thumbnaile/zdjęcia dostają `inset shadow-hairline` żeby uniknąć zlewania się z bg gdy obraz jest bardzo jasny (zwłaszcza thumbnaile YT).

---

## 8. Motion

### Default rules

- **Duration** — 120-240ms większość. 320ms tylko gdy duża zmiana layoutu.
- **Easing** — `standard` dla większości; `enter`/`exit` rozróżnione dla fade in/out
- **Press feedback** — `active:scale-[0.96]` na primary buttons i interactive cards (`fast` duration)
- **Interruptible** — animacje muszą obsłużyć przerwanie (Motion's `layout`/`AnimatePresence` propagują to)
- **No spinners < 500ms** — dla szybkich akcji preferuj optimistic update

### Respect prefers-reduced-motion

**Obowiązkowe globally:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Wyjątki (gdzie animacja niesie informację) — pozwól, ale instant (`fast` → `instant`).

### Patterns

- **Page transition** — `fade + 8px translateY` slide, duration `slow`, ease `enter`
- **Modal open** — backdrop fade (`fast`), content scale 0.96→1 + fade (`normal`)
- **Sheet (mobile)** — translateY from bottom, duration `slow`, ease `enter`
- **Stagger lists** — children delay `30ms * index`, max 6 elementów (potem instant)
- **Hover** — opacity/color transition `fast`, scale tylko na press

### Antypatterny

- ❌ Parallax scroll → mobile-killer, accessibility nightmare
- ❌ Auto-rotating hero → narusza control + reduced-motion
- ❌ Bouncy easing wszędzie → tani efekt; tylko sparingly dla playful moments
- ❌ Loading skeleton dłuższy niż 1.5s → coś nie tak z backendem, nie z UI

---

## 9. Polish — micro-details (z `ux-ui-guidelines`)

Te detale decydują o "feels right" vs "feels off":

1. **Concentric radius** — sekcja 6
2. **Optical alignment** — ikony i tekst wyrównane przez środek glifu, nie pixel-bounding-box. Dla custom icons sprawdzić w design tool czy ikona jest optycznie wyśrodkowana.
3. **Tabular numbers** — `font-feature-settings: 'tnum'` dla liczb (czasy filmów, timestamps, counts). Bez tego cyfry skaczą szerokością.
4. **Scale 0.96 on press** — primary buttons + tappable cards. Mobile-feel.
5. **Font smoothing** — antialiased global (sekcja 4 antypatterny)
6. **Image outline** — sekcja 7
7. **Shadow-as-border** — flat surfaces dostają hairline `inset shadow` zamiast `border` jeśli sąsiadują z innym bg colorem (cleaner antialiasing)
8. **Interruptible animations** — sekcja 8
9. **Loading states for async** — nigdy ekran nie powinien być "dead" >100ms po user action. Spinner / skeleton / optimistic.
10. **Empty states z personalitą** — sekcja 2 voice table

---

## 10. Komponenty — patterns

### Button

| Variant | Bg | Border | Tekst | Użycie |
|---|---|---|---|---|
| `primary` | `accent.DEFAULT` | none | `accent.foreground` | Main CTA na widoku (max 1) |
| `secondary` | `bg.subtle` | `border-strong` | `fg.DEFAULT` | Alternative actions |
| `ghost` | transparent | none | `fg.DEFAULT` | Tertiary actions, navigation |
| `outline` | transparent | `border-strong` | `fg.DEFAULT` | Secondary form actions |
| `destructive` | `error` | none | `error_foreground` | Delete, revoke |
| `link` | transparent | none | `accent.soft_foreground` + underline on hover | Inline w prose |

**Sizes:** `sm` h-8, `md` h-10 (default), `lg` h-12 (mobile-friendly primary).
**Tap target** — primary CTA mobile = lg. Min 44px wszędzie.
**Loading state** — spinner ikona + disabled + zachowuje szerokość (bez "skakania" layoutu).

### Card (film thumbnail)

```
border border-border          → hairline outline
bg-bg.subtle                  → distinguishable od page bg
rounded-lg                    → 16px
overflow-hidden               → image clip do radius
hover: border-border-strong + translate-y-[-2px] (gdy interactive)
active: scale-[0.98]
```

### Input

```
h-10 (md) / h-12 (lg mobile)
border border-border / focus: border-accent + ring-2 ring-accent/32
bg-bg.DEFAULT
rounded-sm
px-3
text-base (16px) na mobile → BEZ tego iOS Safari zoomuje przy focusie
```

### Modal vs Sheet (mobile)

- **Desktop >= md** — modal centered, `max-w-narrow`, backdrop blur subtle
- **Mobile < md** — bottom sheet, drag-to-dismiss, full-width, max-h 90vh

### Navigation

- **Mobile** — bottom tab bar (4 ikony max) gdy zalogowany; sticky top header z logo + menu trigger gdy guest
- **Desktop** — top header + sidebar w dashboard (>=lg)
- **Active indicator** — `accent.DEFAULT` 2px underline (header) lub left-bar (sidebar). Nie wypełnij całego tła.

### Toast (Sonner)

- Position: bottom-center (mobile), bottom-right (desktop)
- Duration: 4s default, 6s dla errors
- Max 3 visible — kolejne queue'owane

---

## 11. Mobile-specific

Primary use case: **user kończy zajęcia, otwiera aplikację na telefonie, wkleja link YT lub uploaduje plik**.

### Reguły

- **Tap targets ≥ 44px** wszędzie (WCAG 2.5.5)
- **Input font-size ≥ 16px** — inaczej iOS Safari zoomuje na focus
- **Bottom sheet > modal** dla actions z formularzami (kciuk dosięga)
- **Sticky CTA na dole** dla flow "zapisz film" — primary action zawsze w zasięgu kciuka
- **Safe area** — `env(safe-area-inset-bottom)` w paddingu dla devices z home indicator (iPhone X+)
- **Loading states obowiązkowe** — telefony mają gorsze sieci, każda async akcja = visual feedback ≤ 100ms
- **Pull-to-refresh** w bibliotece (`use-pull-to-refresh` lub native przez `overscroll-behavior`)
- **Camera-friendly upload** — `<input type="file" accept="video/*" capture="environment">` żeby otworzyć directly aparat z back camera

### Co odraczamy do PWA (v1.1)

- Installable manifest
- Push notifications
- Offline cache biblioteki
- Background sync uploadu

---

## 12. Accessibility checklist (WCAG 2.2 AA)

- [ ] `<html lang="pl">`
- [ ] Skip-to-content link jako pierwszy focusable
- [ ] Wszystkie images mają `alt` (lub `alt=""` jeśli dekoracyjne)
- [ ] Icon-only buttons mają `aria-label`
- [ ] Form inputs mają `<label>` (lub `aria-label` jako fallback)
- [ ] Focus indicator widoczny (≥ 3:1 contrast) na **wszystkim**
- [ ] Color nie jest jedynym wskaźnikiem (error = czerwony + ikona + tekst)
- [ ] Live regions dla toastów (`role="status"` lub `aria-live="polite"`)
- [ ] Modal trap focus + ESC zamyka + restore focus po close
- [ ] Wszystkie interakcje dostępne klawiaturą
- [ ] `prefers-reduced-motion` respektowane (sekcja 8)
- [ ] Tab order logiczny (DOM order == visual order — unikaj `tabindex > 0`)
- [ ] Video embeds: caption gdy dostępny (YT auto, FB/IG przez widget)
- [ ] Heading hierarchy nie pomija poziomów (h1 → h2 → h3, bez h1 → h3)

---

## 13. Implementation mapping (Tailwind v4 + shadcn/ui)

Tokeny powyżej mapujemy 1:1 na CSS custom properties w `src/global.css` z dyrektywą `@theme`:

```css
@theme {
  --color-bg: oklch(0.99 0.004 70);
  --color-bg-subtle: oklch(0.97 0.006 70);
  --color-fg: oklch(0.22 0.01 70);
  --color-accent: oklch(0.55 0.13 38);
  --color-accent-hover: oklch(0.48 0.14 38);
  /* ... reszta z YAML powyżej */

  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  --shadow-focus: 0 0 0 3px oklch(0.55 0.13 38 / 0.32);

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  /* ... */
}
```

**shadcn/ui** — komponenty bazują na CSS variables z `@theme`. Override default `tailwind.config` colors NIE jest potrzebny — Tailwind v4 czyta `@theme`.

**Font loading** — Geist Variable jako `<link rel="preload" as="font" type="font/woff2" crossorigin>` + `font-display: swap`. Subset: latin + latin-ext (polski).

---

## 14. Changelog

| Data | Zmiana | Powód |
|---|---|---|
| 2026-05-27 | Wersja inicjalna | Foundational design system na bazie brainstorma + decyzji w `/dev-plan` (terracotta przygaszony + Geist sans + voice "ty") |

---

## Open items (do dopracowania)

- **Dark mode** — odroczone do v1.1, ale planowane mapowanie tokenów już w komentarzu
- **Tagline finalne** — `Twoja biblioteka tańca + spotkania w Lubinie` to placeholder; do dopracowania w fazie copy z partnerem
- **Logo / wordmark** — DESIGN.md nie obejmuje brand identity (logo, sygnet) — wymaga osobnej iteracji
- **Hero photoshoot direction** — szczegółowy brief (kompozycja, oświetlenie, props) — do dopracowania w fazie produkcji content
- **Print/social card templates** — odroczone do post-MVP
