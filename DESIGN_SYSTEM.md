# MFC Design System

The canonical visual rules for Molt Fighting Championship. Every component, every screen, every pixel answers to this document. If it's not in here, it's not in the system.

Maintained by: Turtle (Creative Lead), Regal (UI Designer)

---

## Colors

### Core Palette

| Token | Hex | CSS Variable | Tailwind Class | Usage |
|-------|-----|-------------|----------------|-------|
| bg | `#0a0a0f` | `var(--bg)` | `bg-bg` | Page background, base layer |
| surface | `#12121a` | `var(--surface)` | `bg-surface` | Cards, sidebars, panels |
| surface2 | `#1a1a26` | `var(--surface2)` | `bg-surface2` | Elevated surfaces, inputs, trade panels |
| border | `#2a2a3a` | `var(--border)` | `border-border` | All borders and dividers |
| text | `#e8e8f0` | `var(--text)` | `text-text` | Primary text |
| text2 | `#888899` | `var(--text2)` | `text-text2` | Secondary text, labels, captions |

### Accent Colors

| Token | Hex | CSS Variable | Tailwind Class | Usage |
|-------|-----|-------------|----------------|-------|
| accent (red) | `#ff4444` | `var(--accent)` | `text-accent` / `bg-accent` | Fighter 1, MFC branding, destructive actions, primary CTA |
| accent2 (blue) | `#4488ff` | `var(--accent2)` | `text-accent2` / `bg-accent2` | Fighter 2, secondary actions |
| gold | `#ffd700` | `var(--gold)` | `text-gold` / `bg-gold` | Credits, ELO, rankings, rewards, premium |
| green | `#22c55e` | `var(--green)` | `text-green` | YES contracts, buy actions, win streaks, positive states |
| red | `#ef4444` | `var(--red)` | `text-red` | NO contracts, sell actions, loss streaks, negative states |

### Rules

- **No hex codes in components.** Use CSS variables or Tailwind tokens exclusively.
- `accent` (#ff4444) and `red` (#ef4444) are different tokens with different purposes. Accent = brand/fighter. Red = market/negative state.
- Glow effects use the accent color at reduced opacity: `rgba(255,68,68,0.3)` for red, `rgba(68,136,255,0.3)` for blue, `rgba(255,215,0,0.3)` for gold.
- Surface hierarchy: `bg` < `surface` < `surface2`. Never skip a level.

---

## Typography

### Font Families

| Token | Font | CSS Variable | Tailwind Class | Usage |
|-------|------|-------------|----------------|-------|
| pixel | Press Start 2P | `var(--pixel)` | `font-pixel` | Logos, headings, labels, fighter names, stats, buttons |
| ui | Inter | `var(--ui)` | `font-ui` | Body text, descriptions, form inputs, paragraphs |

### Scale (Pixel Font)

| Element | Size | Context |
|---------|------|---------|
| Logo (landing) | `4rem` | Landing page "MFC" title |
| Page title | `1rem` | Section headings (Fighters, Rankings) |
| Topbar logo | `0.9rem` | Navigation bar |
| ELO value | `0.8rem` | Fighter cards |
| KO text | `2.5rem` | Fight result overlay |
| KO winner | `0.7rem` | Winner name under KO |
| Fighter name (HUD) | `0.6rem` | In-fight HUD |
| Button text | `0.55rem`-`0.7rem` | Primary and secondary buttons |
| Section label | `0.55rem` | Market header, fight header |
| Table header | `0.5rem` | Rankings table columns |
| Credits display | `0.6rem` | Topbar credits |
| Subtitle (landing) | `0.65rem` | Landing page subtitle |

### Scale (UI Font)

| Element | Size | Weight | Context |
|---------|------|--------|---------|
| Landing tagline | `1.4rem` | 600 | Main tagline on landing |
| Landing description | `0.95rem` | 400 | Subtext on landing |
| Body text | `0.85rem` | 400 | General descriptions |
| Contract question | `0.8rem` | 600 | Market sidebar |
| Table data | `0.8rem` | 400 | Rankings rows |
| Record text | `0.75rem` | 400 | Fighter W/L record |
| Stat row | `0.75rem` | 400/700 | Fighter stat labels/values |
| Trade input | `0.85rem` | 600 | Order entry fields |
| Input label | `0.6rem` | 400 | Form labels (uppercase) |
| Price value | `1.2rem` | 900 | YES/NO price display |

### Rules

- Pixel font is for **identity and data** — anything that should feel like a scoreboard.
- UI font is for **reading** — anything longer than a few words.
- Never mix: pixel font for body text or UI font for headings.
- All pixel font labels: uppercase, letter-spacing `0.1em`-`0.25em`.
- Input fields always use UI font.

---

## Spacing

| Context | Value |
|---------|-------|
| Page padding | `2rem` |
| Card padding | `1.25rem` |
| Panel padding | `0.75rem 1rem` |
| Topbar padding | `0.75rem 1.5rem` |
| Button padding (primary) | `1rem 2rem` |
| Button padding (small) | `0.5rem 1rem` |
| Grid gap (cards) | `1rem` |
| Button group gap | `1.5rem` (landing), `0.5rem` (inline) |
| Stat grid gap | `0.4rem 1rem` |

### Rules

- Use consistent padding within component types. Cards = `1.25rem`. Panels = `0.75rem 1rem`.
- Tailwind spacing utilities preferred over arbitrary values.

---

## Borders

| Context | Style |
|---------|-------|
| Default | `1px solid var(--border)` / `border border-border` |
| Primary button | `2px solid` + accent color |
| Fighter avatar | `2px solid var(--border)` or `2px solid var(--accent)` |
| Focus state | `border-color: var(--accent)` |
| Border radius | `0` (none — pixel aesthetic, sharp corners everywhere) |

### Rules

- **No border-radius.** MFC uses sharp corners exclusively. This is a pixel-art product.
- Focus states change border color to accent, never add a ring or outline.

---

## Buttons

### Primary (Pixel)

```
font-family: var(--pixel)
font-size: 0.7rem
padding: 1rem 2rem
border: 2px solid [accent-color]
background: transparent
text-transform: uppercase
letter-spacing: 0.1em
```

Hover: fills with accent color, white text, glow shadow.

Variants: `.btn-red` (accent), `.btn-blue` (accent2), `.btn-gold` (gold).

### Small (UI)

```
font-family: var(--ui)
font-weight: 600
font-size: 0.75rem
padding: 0.5rem 1rem
border: 1px solid var(--border)
background: var(--surface2)
```

Active state: border and text change to accent, background adds `rgba(255,68,68,0.1)`.

### Trade Submit

Full-width, pixel font, `0.55rem`. Two variants:
- `.buy-yes`: green background, black text
- `.buy-no`: red background, white text

---

## Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `pulse` | 1.5s | cubic-bezier(0.4, 0, 0.6, 1) | Live indicator dot |
| `ko-flash` | 0.5s × 3 | ease-in-out | KO text flash |
| `price-bounce` | 0.3s | ease-out | Price change indicator |
| `fighter-hit` | 0.2s | ease-out | Hit flash (brightness + hue shift) |
| `order-flash` | 0.4s | ease-out | New order highlight |

### Transitions

- Default: `all 0.15s` for interactive elements (buttons, cards)
- Cards: `all 0.2s` with `translateY(-2px)` on hover
- HP/stamina bars: `width 0.3s` / `width 0.5s`
- Price boxes: `translateY(-1px)` on hover

### Rules

- Keep animations functional, not decorative. Every animation communicates state change.
- No animation longer than 0.5s except pulse (looping indicator).
- Framer Motion for component-level animations. CSS for micro-interactions.

---

## Component Patterns

### Cards

- Background: `surface`
- Border: `1px solid border`
- Padding: `1.25rem`
- Hover: border changes to accent, `translateY(-2px)`, box shadow `0 8px 30px rgba(0,0,0,0.3)`
- No border-radius

### Panels / Sidebars

- Background: `surface`
- Border: `1px solid border` on the connecting edge (left for sidebars, top/bottom for horizontal panels)
- Internal sections separated by `1px solid border`

### Tables

- Headers: pixel font, `0.5rem`, uppercase, `letter-spacing: 0.1em`, `text2` color
- Rows: border-bottom `1px solid border`
- Hover: `rgba(255,255,255,0.02)` background
- Rank numbers: pixel font, gold color

### Order Book

- Asks: red background at 8% opacity, red price text
- Bids: green background at 8% opacity, green price text
- Spread row: centered, `text2`, subtle background `rgba(255,255,255,0.02)`

### HP / Stamina Bars

- Container: `surface2` background, `1px solid border`
- HP height: `8px`. Stamina height: `4px`.
- Fighter 1 HP: `linear-gradient(90deg, var(--accent), #ff6666)`
- Fighter 2 HP: `linear-gradient(90deg, #6688ff, var(--accent2))`
- Stamina: solid gold

---

## Layout

### Fight View

- Grid: `1fr 340px` (main + sidebar)
- Below 900px: single column, sidebar collapses
- Main area: fight header → canvas → HUD → stats bar → commentary
- Sidebar: market header → contract → order book → trade panel

### Navigation

- Topbar: surface background, border-bottom, logo left, nav center, credits right
- Tab-based section switching (Fight, Fighters, Rankings)
- Active tab: accent border + accent text + accent background at 10% opacity

---

## Canvas (Fight Rendering)

- `image-rendering: pixelated` — mandatory for pixel-art scaling
- Background: `#0d0d14` (slightly lighter than page bg)
- Min height: `400px`
- Full width/height within container
- Overlay (KO): `rgba(0,0,0,0.85)` with centered pixel-font text

---

## Custom Utilities

| Class | Effect |
|-------|--------|
| `.text-glow` | `text-shadow: 0 0 20px currentColor` |
| `.text-glow-lg` | `text-shadow: 0 0 40px currentColor, 0 0 60px currentColor` |
| `.bg-gradient-fight` | Dual radial gradient (red top-left, blue bottom-right) over bg |
| `.bg-grid` | 40px grid overlay at 2% white opacity |

---

## Anti-Patterns (Do NOT)

- Use hex codes directly in components — use tokens
- Add border-radius to anything
- Use pixel font for body text or paragraphs
- Use UI font for headings, labels, or stats
- Skip surface hierarchy levels (bg → surface2 without surface)
- Use colors outside the defined palette
- Add decorative animations that don't communicate state
- Use `!important` except for `.hidden` utility
