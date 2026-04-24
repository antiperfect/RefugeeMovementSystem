# Indigo Archive Design System

### 1. Overview & Creative North Star
**Creative North Star: The Sovereign Intelligence**
Indigo Archive is a design system built for high-stakes data analysis and humanitarian observation. It moves away from generic "SaaS Blue" aesthetics toward a sophisticated, editorial intelligence platform. By leveraging high-contrast typography and a "canvas-first" mentality, the system prioritizes clarity and density without sacrificing the visual gravitas required for predictive modeling and international reporting.

The system breaks standard grid expectations through **Bento-style layouts**, where importance is signified by scale and tonal depth rather than heavy outlines.

### 2. Colors
The palette is rooted in deep naval indigos and crisp arctic whites, accented by emerald teals and amber earth tones for semantic meaning.

- **The "No-Line" Rule:** Sectioning is achieved through the transition of surface tones (e.g., a `surface-container-low` sidebar against a `surface` main canvas). 1px solid borders are strictly prohibited for layout containment, except where used at reduced opacity (15%) for subtle decorative framing.
- **Surface Hierarchy & Nesting:** 
    - `surface-container-lowest` (#FFFFFF): Primary card backgrounds and high-focus content.
    - `surface-container-low` (#EFF4FF): Background for navigation elements and secondary sidebars.
    - `surface` (#F8F9FF): The base application canvas.
- **The "Glass & Gradient" Rule:** Use `rgba(255, 255, 255, 0.7)` with a `12px` backdrop blur for floating headers and contextual overlays to maintain a sense of environmental depth.
- **Signature Textures:** Main CTA buttons must use a linear gradient from `primary` to `primary-container` to provide a subtle "tactile" pop against flat UI elements.

### 3. Typography
The system uses a pairing of **Public Sans** for authoritative headers and **Inter** for high-legibility data density.

- **Display & Headline:** Public Sans (Heavy weights: 800, 900). 
    - *Large Display:* 2.25rem (36px) with -0.05em tracking for a "newspaper masthead" feel.
    - *Section Headers:* 1.125rem to 1.25rem (18px-20px).
- **Body & Data:** Inter (Weights: 400, 500, 600).
    - *Standard Body:* 0.875rem (14px).
    - *Compact Sidebar/Labels:* 13px (0.8125rem).
    - *Micro-Labels:* 10px bold caps for legends and status indicators.
- **Typographic Rhythm:** The system utilizes a tight, "Swiss-style" vertical rhythm where line heights are kept compact (1.2 to 1.4) to maximize information density on single-page dashboards.

### 4. Elevation & Depth
Hierarchy is communicated through **Tonal Layering** and "soft-shadow" physics.

- **The Layering Principle:** Rather than using shadows for everything, "stack" colors. A white card sits on a `surface-container-low` background to create natural separation.
- **Editorial Shadows:** For primary dashboard cards, use a custom ultra-diffused shadow: `0 24px 32px -8px rgba(13, 28, 46, 0.06)`. This mimics the look of a printed report resting on a desk.
- **Glassmorphism:** Elements like the Top Navigation must utilize `backdrop-filter: blur(12px)` with an 90% opacity white background to stay distinct during scroll.

### 5. Components
- **Dashboard Cards:** Must use `surface-container-lowest` with the `editorial-shadow`. No borders.
- **Primary Buttons:** High-contrast blue gradients with subtle `0.5rem` (xl) or `0.75rem` (full) rounding.
- **Status Chips:** Pill-shaped, using container colors (e.g., `secondary-container` for active status) with bold, 10px all-caps text.
- **Navigation Links:** Use active-state indicators such as a 2px bottom border in `primary` blue or subtle background shifts to `white` for sidebar items.
- **Input Fields:** Search bars should be `rounded-full` with a transparent background and a 1px `outline-variant` that only activates on focus.

### 6. Do's and Don'ts
- **Do:** Use intentional asymmetry in your dashboard grids to guide the eye toward the "Hero" metric.
- **Do:** Use high-contrast color pairings for accessibility (e.g., `on-primary` white on `primary` blue).
- **Don't:** Use black (#000000) for text. Always use `on-surface` (#0D1C2E) to maintain the "Indigo" tonal consistency.
- **Don't:** Overuse shadows. If more than three elements on a screen have shadows, the "Editorial" effect is lost. Use background color shifts instead.
- **Do:** Maintain a strict 8px/4px spacing grid to ensure the compact "Intelligence" feel remains organized.