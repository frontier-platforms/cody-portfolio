# Brand Guide: Cody Chandler Portfolio

Version 1.7 (2026-10-07). Single source of truth for how the site looks and sounds. Read this before writing any copy, styles, or components.

## How to use this file

- **Values live in section 10.** That CSS block is the token set. If `tokens.css` doesn't exist, create it from that block verbatim. If it exists and differs, this file wins.
- **Never hardcode** a color, font, size, radius, or spacing value in a component. Use `var(--token-name)`, or add a token to section 10 first.
- **Rules use three levels.** MUST is a hard rule. PREFER is the default unless there's a stated reason. AVOID means don't, unless asked.
- **If a request conflicts with this guide,** follow the request, then say which rule it broke so the guide can be updated.
- **Open decisions (section 11)** are unsettled. Don't invent answers. Ask.
- **This file is generated** from the interactive brand guide. Small edits can be made here directly; bump the version and add a Changelog line.

## 1. Positioning

**Who it's for:** Hiring managers and recruiters (employee track) and prospective clients (consulting track). Both should leave knowing what I do and how to reach me.

**Role line:** Data and product leader who started in sales, marketing and finance. I turn data and product work into measurable revenue.

**Hero line:** I help teams grow revenue with better data and products.

**Breadth:** Data and product lead, but the business side (sales, marketing, operations, finance) is shown as real experience, not a footnote.

**Personality:** Clear, credible, quietly confident. Think good analyst memo, not marketing landing page.

**The 10-second test:** A visitor can answer "what does he do, and what did it change?" within 10 seconds of landing.

| We are | We are not |
|---|---|
| Specific | Vague or buzzword-heavy |
| Outcome-first | Tool-list-first |
| Calm and confident | Loud, hype-driven |
| Editorial, well-spaced | Busy, dashboard-cluttered |
| Human | Corporate or AI-generated |

## 2. Voice and copy

### Rules

- MUST write in first person ("I led", "I built").
- MUST lead with the outcome, then explain how. Numbers first where they exist.
- MUST NOT use em dashes. Use a period, comma, colon, or parentheses.
- MUST keep sentences under 20 words. One idea per sentence.
- PREFER percentages over raw dollar figures for business results.
- PREFER plain verbs: led, built, shipped, cut, grew, replaced, migrated.
- PREFER naming a tool only when it matters to the reader.
- AVOID exclamation marks.
- AVOID rhetorical-question hooks and sales-y closing lines.

### Banned phrases

Do not use: "leverage", "synergy", "passionate about", "delve", "unlock", "empower", "seamless", "robust", "cutting-edge", "game-changer", "journey", "tapestry", "elevate", "harness", "in today's fast-paced world", "not just", "I'm excited to", "results-driven", "thought leader", "at the intersection of". Add to this list whenever a draft sounds off.

### Case study format

Every project page uses these four sections, in this order, with these exact headings:

1. **Problem** (2 to 3 sentences: the business situation and why it mattered)
2. **Role** (1 to 2 sentences: title and what I owned)
3. **Solution** (short paragraphs or 3 to 5 bullets: what was built and key decisions)
4. **Outcome** (lead with 1 to 3 metrics, then one sentence of context)

Each case study also gets a one-line summary (max 140 characters) for cards and meta descriptions.

### Examples

- Good: "Replaced three reporting tools with one Snowflake platform. Teams got answers in minutes instead of days."
- Bad: "Leveraged cutting-edge cloud technology to empower stakeholders on their data journey."

## 3. Color

Light mode is the default. Dark mode follows the system setting.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-bg` | #f5f7f9 | #0d1318 | Page background |
| `--color-surface` | #ffffff | #141c23 | Cards, raised panels. Use sparingly, prefer whitespace |
| `--color-text` | #0f1720 | #e6edf2 | Body and headings. Never pure black |
| `--color-text-muted` | #56616e | #93a2b0 | Meta, captions, labels. Never body paragraphs |
| `--color-border` | #dde3ea | #24303a | Dividers and outlines, 1px only |
| `--color-accent` | #0b6e8a | #5cc2de | Links, primary button, key metric. The only saturated UI color |
| `--color-accent-hover` | #084c5f | #86d2e7 | Hover and active state of accent (derived) |
| `--color-accent-subtle` | #dee9ee | #1d3640 | Tinted backgrounds behind accent content (derived) |
| `--color-on-accent` | #ffffff | #0f1720 | Text on accent backgrounds (derived) |
| `--color-data-1` | #0b6e8a | #5cc2de | Charts only |
| `--color-data-2` | #d9822b | #f0a35e | Charts only |
| `--color-data-3` | #2f9e8f | #5cc7b8 | Charts only |
| `--color-data-4` | #8a8f9c | #9ba1ad | Charts only |

Rules:

- MUST meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text and UI elements).
- MUST use accent for at most one primary action per screen.
- PREFER accent at roughly 5% of any screen.
- AVOID gradients, glows, and shadow-heavy cards.
- Data colors are for charts only, never UI chrome.

Current contrast:

- Text on background: 16.80:1 light, 15.81:1 dark
- Text on surface: 18.05:1 light, 14.56:1 dark
- Muted on background: 5.87:1 light, 7.15:1 dark
- Accent links on background: 5.41:1 light, 9.10:1 dark
- Button text on accent: 5.81:1 light, 8.79:1 dark

## 4. Typography

| Role | Font | Token |
|---|---|---|
| Display (h1, h2, hero) | Fraunces | `--font-display` |
| Body and UI | Geist | `--font-body` |
| Metrics, labels, code | Geist Mono | `--font-mono` |

All fonts load from Google Fonts (URL in section 10).

Scale (1.2 ratio, 16px base):

| Token | Size | Use |
|---|---|---|
| `--text-4xl` | 47.8px | Hero h1 |
| `--text-3xl` | 33.2px | h2 |
| `--text-2xl` | 27.6px | Mobile h1 |
| `--text-xl` | 23px | h3 |
| `--text-lg` | 19.2px | Lead paragraph |
| `--text-base` | 16px | Body |
| `--text-sm` | 14.6px | Meta, captions |
| `--text-xs` | 13.3px | Labels |

Rules:

- MUST use the scale tokens. No one-off font sizes.
- MUST keep body text at `--text-base` or larger with `--leading-normal` (1.5).
- MUST cap paragraph width at `--measure` (68 characters).
- PREFER the display face only for h1 and h2, weight 400. h3 and below use the body face at weight 600.
- PREFER the mono face for big outcome numbers ("+27%") and small uppercase labels with `--tracking-label`.
- AVOID more than two body weights on a page (400 and 600).
- AVOID all caps for anything longer than three words.

## 5. Layout and spacing

- Spacing uses a 4px unit. Use `--space-1` through `--space-24` only.
- Content max width: `--container` (1120px). Text blocks: `--measure`.
- Mobile first. Breakpoints: 640px and 960px. Side gutter on phones: 16px.
- PREFER a steady vertical rhythm between sections: `--space-16` on desktop, `--space-12` on phones. Avoid gaps above `--space-16` between sections.
- PREFER left-aligned text. Center only short hero lines.
- MUST NOT cause horizontal scroll at 360px wide.

## 6. Components

Keep the set small. Add a component here before building it.

- **Nav:** name at left (body face, 600), 5 links at right: Home, Work, Lab, About, Contact. Resume is reached from Contact and About. No hamburger above 640px.
- **Hero:** one h1 line, one supporting sentence, one primary button (Contact) and one text link (View work).
- **Project card:** mono label (industry and company), title, one-line summary, one metric in mono. Whole card is the link. Border, no shadow, `--radius-md`. Border turns accent on hover.
- **Metric:** large mono number in `--color-text`, small muted label underneath. Accent only for the single most important metric on a page.
- **Button:** primary (accent background, `--color-on-accent` text) and secondary (border only). `--radius-md`, min height 44px. No icons unless functional.
- **Link:** accent color, underline offset 3px. Always underlined in body text; underline on hover in nav.

Site-specific components (added in 1.3):

- **Section header:** small mono label (three words or fewer when uppercase) above an h2 in the display face.
- **Theme toggle:** icon button in the nav, 44px target. Follows the system until the visitor chooses.
- **Command menu:** ⌘K / Ctrl+K dialog for jumping between pages. Border, `--radius-md`, no shadow.
- **Data panel:** a chart or table in a bordered `--radius-md` panel with a "Show SQL" disclosure. Chart marks use data colors only.
- **Segmented control:** a row of radio options with `--radius-md` items. The selected item uses `--color-text` as background and `--color-bg` as text.
- **Form field:** input, select or textarea with a 1px border, `--radius-md`, min height 44px.
- **Telemetry panel:** a side sheet listing queries, events and Web Vitals. Text and borders only.
- **Status marker:** test and run results (pass, warn, fail) shown with a symbol and a word, not color. See section 11.

Added in 1.4:

- **Lab header:** h1, one-line lede, three findings computed by the pipeline (mono value, muted label), then the dataset's question bar. Each lab opens on its own numbers.
- **Translation card:** a technique (mono label) and what it does for a sales or marketing team (one sentence).
- **Decision row:** a decision in semibold, then "Why" and "Trade-off" lines. Used to show judgment, not only output.
- **Playbook step:** number, h3, two sentences, and links to proof (a case study and a lab).
- **Architecture diagram:** bordered stage cards with a small data-color marker, left to right on desktop, stacked on phones.

Added in 1.5:

- **Capability card:** where (mono meta), area (h3), one or two sentences of fact, and one proof link. Used for the business side on Home.

## 7. Motion

- Current setting: subtle (120ms fast, 200ms base).
- PREFER no motion over decorative motion.
- Allowed: hover color and underline transitions, subtle fade-in on scroll, using the duration tokens and `--ease-standard`.
- MUST respect `prefers-reduced-motion`.
- AVOID parallax, typing effects, scroll-jacking, and animated gradients.

## 8. Imagery

- One real headshot (natural light, plain background). No illustrations of me.
- Project visuals: real screenshots or simple diagrams in the data colors. Blur or replace any client data.
- AVOID stock photos, AI-generated images, and 3D blobs.
- All images MUST have meaningful alt text.

## 9. Accessibility

- Semantic HTML: one h1 per page, headings in order, `<nav>`, `<main>`, `<footer>`.
- Visible focus states using `--focus-ring`.
- Interactive targets at least 44x44px.
- Content readable without JavaScript.

## 10. Tokens (tokens.css)

```css
/*
  Design tokens: Cody Chandler portfolio
  Generated from BRAND.md v1.3. Single source of truth for every visual value.
  Never hardcode values in components. Use var(--token).
*/

@import url("https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Geist:wght@400;600&family=Geist+Mono:wght@400;500&display=swap");

:root {
  /* ---------- Color: light (default) ---------- */
  --color-bg: #f5f7f9;
  --color-surface: #ffffff;
  --color-text: #0f1720;
  --color-text-muted: #56616e;
  --color-border: #dde3ea;
  --color-accent: #0b6e8a;
  --color-accent-hover: #084c5f;
  --color-accent-subtle: #dee9ee;
  --color-on-accent: #ffffff;

  /* Data visuals only, never UI chrome */
  --color-data-1: #0b6e8a;
  --color-data-2: #d9822b;
  --color-data-3: #2f9e8f;
  --color-data-4: #8a8f9c;

  --focus-ring: 0 0 0 3px color-mix(in srgb, var(--color-accent) 40%, transparent);

  /* ---------- Typography ---------- */
  --font-display: "Fraunces", Georgia, "Times New Roman", serif;
  --font-body: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Scale: 1.2 ratio, 16px base */
  --text-xs: 0.833rem;      /* 13.3px  Labels */
  --text-sm: 0.913rem;      /* 14.6px  Meta, captions */
  --text-base: 1rem;    /* 16px  Body */
  --text-lg: 1.2rem;      /* 19.2px  Lead paragraph */
  --text-xl: 1.44rem;      /* 23px  h3 */
  --text-2xl: 1.728rem;     /* 27.6px  Mobile h1 */
  --text-3xl: 2.074rem;     /* 33.2px  h2 */
  --text-4xl: 2.986rem;     /* 47.8px  Hero h1 */

  --weight-regular: 400;
  --weight-semibold: 600;
  --leading-tight: 1.1;
  --leading-snug: 1.35;
  --leading-normal: 1.5;
  --tracking-label: 0.08em;
  --measure: 68ch;

  /* ---------- Spacing: 4px unit ---------- */
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;    /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;    /* 32px */
  --space-12: 3rem;   /* 48px */
  --space-16: 4rem;   /* 64px */
  --space-20: 5rem;   /* 80px */
  --space-24: 6rem;   /* 96px */

  /* ---------- Layout ---------- */
  --container: 1120px;
  /* Breakpoints (reference only): 640px, 960px */

  /* ---------- Shape ---------- */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  --border-width: 1px;

  /* ---------- Motion ---------- */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

/* ---------- Color: dark (follows system) ---------- */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #0d1318;
    --color-surface: #141c23;
    --color-text: #e6edf2;
    --color-text-muted: #93a2b0;
    --color-border: #24303a;
    --color-accent: #5cc2de;
    --color-accent-hover: #86d2e7;
    --color-accent-subtle: #1d3640;
    --color-on-accent: #0f1720;

    /* Data visuals only, never UI chrome */
    --color-data-1: #5cc2de;
    --color-data-2: #f0a35e;
    --color-data-3: #5cc7b8;
    --color-data-4: #9ba1ad;
  }
}

/* Manual override hook for a theme toggle */
:root[data-theme="dark"] {
  --color-bg: #0d1318;
  --color-surface: #141c23;
  --color-text: #e6edf2;
  --color-text-muted: #93a2b0;
  --color-border: #24303a;
  --color-accent: #5cc2de;
  --color-accent-hover: #86d2e7;
  --color-accent-subtle: #1d3640;
  --color-on-accent: #0f1720;

  /* Data visuals only, never UI chrome */
  --color-data-1: #5cc2de;
  --color-data-2: #f0a35e;
  --color-data-3: #5cc7b8;
  --color-data-4: #9ba1ad;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-base: 0ms;
  }
}
```

## 11. Open decisions

- [ ] Accent color: cobalt or another hue
- [ ] Logo or wordmark (currently plain name)
- [x] Dark mode: keep the toggle. The site follows the system until the visitor chooses. (Decided 2026-10-07.)
- [ ] Domain and contact email
- [ ] Status colors for pass, warn and fail. Until decided, status uses symbols and words only.

## Changelog

- 0.1 (2026-10-05): First draft.
- 0.2 (2026-10-05): Interactive guide with single-file BRAND.md export.
- 1.3 (2026-10-07): Nav set to Work, Lab, About, Contact (Resume moves to Contact and About). Dark mode toggle kept. Added `--radius-full` for dots and pills. Added site-specific components to section 6. Added status colors as an open decision.
- 1.4 (2026-10-07): Section spacing tightened to `--space-16` on desktop at the owner's request (was `--space-20` or more). Added lab header, translation card, decision row, playbook step and architecture diagram components.
- 1.5 (2026-10-07): Role line names the sales, marketing and finance background. Added a breadth note to positioning and the capability card component.
- 1.6 (2026-10-07): New hero and role lines, broader than data platforms: revenue, data and products.
- 1.7 (2026-10-07): Added Home to the nav at the owner's request, so visitors can always get back to it.
