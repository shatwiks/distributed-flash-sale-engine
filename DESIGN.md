---
name: Distributed Flash Sale Engine
description: High-concurrency ticket reservation engine with zero overbooking and tactile 3D physics
colors:
  warm-canvas: "#f5f4f2"
  surface-card: "#ffffff"
  pitch-card: "#111111"
  text-primary: "#0a0a0a"
  text-secondary: "#616160"
  text-muted: "#767676"
  border-subtle: "#e5e3df"
  border-dark: "#222222"
  badge-dark: "#292929"
  status-success: "#10b981"
  status-danger: "#e11d48"
typography:
  display:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(2.5rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.surface-card}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.badge-dark}"
    textColor: "{colors.surface-card}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  card-surface:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-featured:
    backgroundColor: "{colors.pitch-card}"
    textColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    padding: "32px"
---

# Design System: Distributed Flash Sale Engine

## Overview

**Creative North Star: "The Precision Avionics Terminal"**

The visual language of the Distributed Flash Sale Engine fuses gallery-grade warm paper minimalism with the surgical restraint of high-performance avionics telemetry. Built for engineers, system architects, and technical evaluators who demand empirical rigor, the interface treats every pixel as a functional instrument rather than decorative theater. Zero room is granted to generic artificial box shadows, gradient fills, or decorative clutter.

The experience relies on high-contrast black-and-white tonal layering anchored on a warm paper ground (`#f5f4f2`). In place of synthetic skeuomorphism, the system employs physical mechanics: interactive 3D perspective tilt (`Card3D`), spring-based shared layout morphing on toggle pills, and haptic button press depression. The aesthetic communicates calm authority under peak load, proving that a system operating at 10,000+ requests per second can maintain immaculate composure.

**Key Characteristics:**
- **Warm Paper Ground (`#f5f4f2`)**: A tactile, unbleached physical canvas that rejects harsh stark whites and synthetic neon dark modes.
- **Pitch-Black Featured Accents (`#111111`)**: High-density featured cards, boarding passes, and primary buttons that anchor visual weight.
- **Physics-Driven Motion**: Springs, inertia, and 3D coordinate tilt on cursor interaction; zero linear or synthetic easing curves.
- **Radical Mechanical Truth**: Pure functional telemetry—Redis gate latency, PostgreSQL pool saturation, and saga rollbacks—presented with surgical clarity.

## Colors

The palette is strictly calibrated to warm monochrome tonal layering, accented only by semantic feedback signals.

### Primary
- **Pitch Black** (`#0a0a0a` / `#111111`): The primary anchor of authority. Used for primary headlines, featured hero cards, active pill buttons, and dominant interactive states.

### Secondary
- **Warm Paper Base** (`#f5f4f2`): The continuous background canvas across all viewports.
- **Pure Surface White** (`#ffffff`): The primary container color for interactive and secondary cards (`card-light`).

### Neutral
- **Stone Gray** (`#616160`): Body prose, explanatory subtext, and inactive UI iconography. Passes WCAG AA contrast (5.4:1) on white and warm paper grounds.
- **Muted Stone** (`#767676`): Large display secondary headlines and subtle metadata.
- **Subtle Border** (`#e5e3df`): Structural boundary lines for white cards and insets.
- **Charcoal Badge** (`#292929`): Inset badge pills within dark containers.

### Semantic
- **Acquired Emerald** (`#10b981`): Used exclusively for successful atomic reservations (HTTP 201 Created) and system health confirmations.
- **Contested Ruby** (`#e11d48`): Used exclusively for race-condition collision blocks (HTTP 409 Conflict) and simulated crash states.

### Named Rules
**The Zero-Gradient Doctrine.** Gradients in backgrounds, text, and borders are strictly prohibited. Surfaces achieve distinction solely through solid tone shifts and spatial geometry.
**The Rarity of Red Rule.** Crimson accent (`#e11d48`) is reserved entirely for contested collisions and fault injection. It never appears on static navigational or decorative elements.

## Typography

**Display & Body Font:** Inter / System Sans (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
**Code & Monospace Font:** System Monospace (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`)

**Character:** Clean, rational Swiss typographic hierarchy with OpenType features (`cv02, cv03, cv04, cv11`) active for optical clarity. Headings use balanced wrapping (`text-wrap: balance`), while body copy enforces pretty wrapping (`text-wrap: pretty`) to banish stragglers and orphaned words.

### Hierarchy
- **Display** (Bold 700, `clamp(2.5rem, 5vw, 3.75rem)`, line-height 1.08, letter-spacing -0.025em): Primary landing hero headline ("Zero overbooking").
- **Headline** (Extra-Bold 800, `clamp(1.75rem, 3vw, 2.25rem)`, line-height 1.15, letter-spacing -0.02em): Section headers (Live Arena, Architecture Blueprint, Benchmarks).
- **Title** (Bold 700, `1.125rem` / `18px`, line-height 1.35): Card titles and modal dialog headings.
- **Body** (Regular 400, `0.875rem` / `14px`, line-height 1.6): Explanatory architecture prose and descriptions. Max measure 65ch.
- **Label** (Semi-Bold 600, `0.75rem` / `12px`, letter-spacing 0.01em): Micro-telemetry labels, button text, and filter pill tags.

### Named Rules
**The Literal Code Rule.** Monospace typography is permitted strictly within literal code blocks (`<pre>`, `<code>`), idempotency hashes, and raw wire commands. It is banned on regular UI labels, section titles, and status tags.

## Layout

- **Max Container Width:** `80rem` (`1280px` / `max-w-7xl`), centered with responsive padding (`px-4 sm:px-6 lg:px-8`).
- **Spatial Rhythm:** Based on an 8px grid (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Section Spacing:** Generous vertical breathing room (`py-16 md:py-24`) between discrete engineering concepts.
- **Bento & Split Grid Systems:**
  - Hero: 7-column primary headline + 5-column architectural explanation.
  - Duel Console: 2-column symmetric device terminal deck.
  - Interactive Arena: 7-column seating matrix + 5-column telemetry stream.
  - Benchmarks: 2-column comparative bar visualization.

## Elevation & Depth

Depth is established primarily through **tonal layering** and **interactive 3D coordinate motion**, not synthetic drop shadows.

### Depth Vocabulary
- **At Rest:** Pure flat planar surfaces. No blur shadows at rest; cards sit flush upon the `#f5f4f2` ground, delineated by `#e5e3df` borders.
- **Active 3D Coordinate Motion (`Card3D`):** Cursor interaction calculates relative coordinate deltas, rotating the card on `rotateX` and `rotateY` axes with physical spring damping (`stiffness: 220, damping: 22`).
- **Z-Space Floating:** Child elements within 3D cards project forward along the z-axis (`translateZ(20px)` to `translateZ(30px)`), creating genuine parallax depth on hover.
- **Interactive Depressed State:** Active mouse/touch press physically lowers the component (`scale: 0.95, y: 1`), simulating mechanical tactile switches.

### Named Rules
**The Flat-at-Rest Rule.** Drop shadows at rest are forbidden. Elements achieve layer separation through surface contrast (`#f5f4f2` -> `#ffffff` -> `#f5f4f2` insets). Elevation responds only to active user motion.

## Shapes

- **Pill Silhouette (`rounded-full` / `9999px`):** Reserved for actions, filter triggers, status tags, and navigation toggles. Creates an approachable, tactile touch target.
- **Card Radius (`rounded-2xl` / `16px`):** Standard container curvature for all interactive and secondary cards.
- **Featured Radius (`rounded-[1.25rem]` / `20px`):** Prominent hero card and modal container curvature.
- **Inset Radius (`rounded-xl` / `12px`):** Subsurface containers, input fields, and telemetry groupings.
- **Tile Radius (`rounded-lg` / `8px`):** 2D seat matrix units and table row highlights.

## Components

### Buttons
- **Primary Pill (`.btn-black`):** Solid `#0a0a0a` fill, white text, `rounded-full`, padding `10px 20px`. Lifts on hover (`y: -1px, scale: 1.02`), depresses on click (`scale: 0.95, y: 1px`).
- **Secondary Pill (`.btn-white`):** Solid `#ffffff` fill, `#0a0a0a` text, border `1px solid #e5e3df`, `rounded-full`. Shifts to `#edebe7` on hover with identical tactile depression.

### Filter & Segmented Pills
- **Style:** Pill containers with shared spring layout indicators (`layoutId`). Switching tabs slides the solid black active indicator with spring dynamics (`stiffness: 450, damping: 32`), eliminating jumpy state cuts.

### Cards / Containers
- **Surface Card (`card-light`):** `#ffffff` background, `1px solid #e5e3df` border, `16px` border-radius, `24px` internal padding.
- **Featured Card (`card-dark`):** `#111111` background, `1px solid #222222` border, `20px` border-radius, `32px` internal padding, white text.

### Seating Matrix Tiles
- **Available:** `#f5f4f2` surface, `#0a0a0a` text, `1px solid #e5e3df` border. Lifts on hover (`scale: 1.14, y: -2px`).
- **Selected:** Solid `#0a0a0a` fill, white text, bold font, instant visual commitment.
- **Reserved / Locked:** `#edebe7` fill, muted lock icon (`#a1a1a1`), cursor-not-allowed.
- **Contested (409):** `#e11d48` crimson fill, multi-cycle horizontal shake animation (`x: [-6, 6, -5, 5, -2, 2, 0]`).

### Modals & Drawers
- **Flyout Transition:** Center scaling with spring physics (`scale: 0.92 -> 1.0, y: 20px -> 0px`).
- **Wire Inspector Drawer:** Fixed bottom drawer in `#111111` with smooth slide-up animation (`height: 0 -> auto`).

## Do's and Don'ts

### Do:
- **Do** anchor every new screen on the `#f5f4f2` warm paper background.
- **Do** wrap prominent interactive cards with `Card3D` to maintain responsive perspective tilt.
- **Do** use `layoutId` on segmented controls, tabs, and filter pills for fluid layout morphing.
- **Do** enforce `text-wrap: balance` on headlines and `text-wrap: pretty` on paragraphs.
- **Do** reserve monospace strictly for code snippets, idempotency keys, and telemetry values.
- **Do** pair every database decrement failure with an automatic compensating rollback (`INCRBY +1`).

### Don't:
- **Don't** apply synthetic blur shadows at rest; rely on `#f5f4f2` / `#ffffff` / `#111111` tonal separation.
- **Don't** use gradient text fills, glowing borders, or neon cyberpunk accents.
- **Don't** introduce decorative hairline dividers where spatial padding or surface tone achieves separation.
- **Don't** combine multi-keyframe arrays with `type: "spring"` in Motion (use `ease: "easeOut"` for >2 keyframes).
- **Don't** use monospace on standard prose, navigation links, or section headings.
