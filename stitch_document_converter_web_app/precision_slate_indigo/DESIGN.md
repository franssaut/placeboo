---
name: Precision Slate & Indigo
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#005338'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system targets professionals, knowledge workers, and enterprise teams who demand zero-friction, ultra-reliable document transformation. The brand identity balances the surgical precision of an engineering utility with the frictionless polish of modern high-productivity SaaS.

### Emotional Resonance
Interactions must instill confidence, velocity, and uncompromised data integrity. The visual weight is deliberate, calm, and uncluttered, removing cognitive overhead during high-volume document workflows.

### Visual Style
- **Philosophy:** Modern Corporate Utility with architectural precision.
- **Surface Strategy:** Layered slate canvases punctuated by structured, translucent borders and soft atmospheric indigo shadows.
- **Visual Rhythm:** Crisp, low-noise informational hierarchy using high-contrast metadata, sharp contextual badges, and dynamic progress instrumentation.

## Colors

The palette establishes an immediate sense of enterprise stability and operational speed. 

- **Primary (`#4F46E5` - Electric Indigo):** Anchors primary calls-to-action, active batch operations, and system highlights.
- **Secondary (`#06B6D4` - Cyber Cyan):** Denotes conversion in flight, processing telemetry, and dynamic data metrics.
- **Tertiary (`#10B981` - Emerald Green):** Signals complete conversions, system health, and cryptographic integrity verification.
- **Neutral (`#64748B` - Slate):** Forms the foundational background architecture, borders, secondary typography, and muted controls.

### Semantic & Format Tokens
- **Background Root:** `#F8FAFC`
- **Surface Raised:** `#FFFFFF`
- **Border Default:** `#E2E8F0`
- **Border Focus/Active:** `#4F46E5`
- **Format Badges:**
  - PDF: Red-tinted slate (`#DC2626` text, `#FEF2F2` background)
  - DOCX: Royal indigo (`#2563EB` text, `#EFF6FF` background)
  - XLSX: Emerald tint (`#059669` text, `#ECFDF5` background)
  - PPTX: Amber-orange (`#EA580C` text, `#FFF7ED` background)
  - Raster (JPG/PNG): Cyan-slate (`#0891B2` text, `#ECFEFF` background)

## Typography

The typography pairs the structured geometry of **Plus Jakarta Sans** for structural orientation and high-impact headlines with the mechanical legibility of **Inter** for data tables, form structures, and workflow telemetry. 

- **JetBrains Mono** is introduced for file sizes, conversion hashes, bitrates, and execution times to enforce structural data alignment across queues.
- Headings use negative tracking to maintain punch and compactness in compact SaaS navigation patterns.

## Layout & Spacing

The layout is built on a rigid 8pt baseline grid nested inside a dynamic 12-column system.

### Responsive Breakpoints
- **Desktop (≥ 1280px):** 12-column layout, max-width 1440px centered, 2rem margins, 1.5rem gutters. Dedicated conversion workspace with persistent side drawer parameters.
- **Tablet (768px – 1279px):** 8-column fluid layout, 1.5rem margins, 1rem gutters. Workspace collapses settings drawers into overlay sheets.
- **Mobile (< 768px):** 4-column fluid layout, 1rem margins, 0.75rem gutters. Batch conversion queues stack vertically into single-column card flows.

## Elevation & Depth

This system avoids heavy drop shadows, instead using translucent borders and diffused ambient illumination tinted with subtle cool slate.

### Depth Hierarchy
- **Level 0 (Canvas Base):** Flat `#F8FAFC`, zero shadow.
- **Level 1 (Cards, Workspaces, Upload Zone Default):** Background `#FFFFFF`, 1px solid `#E2E8F0`, shadow `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Active Dropzone, Hovered File Rows, Dropdowns):** Background `#FFFFFF`, 1px solid `#CBD5E1`, shadow `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals, Global Conversion Overlays):** Background `#FFFFFF`, 1px solid `#E2E8F0`, shadow `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.
- **Drag-and-Drop Active Halo:** When dragging over an upload target, the border switches to 2px dashed `#4F46E5` accompanied by an ambient indigo glow `0 0 0 4px rgba(79, 70, 229, 0.12)`.

## Shapes

The design uses balanced, modern radii (0.5rem base) to maintain crisp software professionalism without sharp or brittle edges.

- **Badges, Format Chips, and Inline Tags:** Fully pill-shaped (`9999px`) to immediately distinguish contextual metadata from interactive square-corner controls.
- **Inputs, Buttons, and Conversion Rows:** 0.5rem (`rounded-md`).
- **Cards, Upload Containers, Modal Enclosures:** 1rem (`rounded-lg`).

## Components

### Buttons
- **Primary:** Solid `#4F46E5`, text `#FFFFFF`, font `label-md`. Subtle hover transition to `#4338CA`. Active state scales to `0.98`.
- **Secondary / Ghost:** Transparent background, 1px solid `#E2E8F0`, text `#1E293B`. Hover activates `#F8FAFC` background with `#0F172A` text.
- **Conversion Batch Trigger:** Primary gradient from `#4F46E5` to `#4338CA` with an inset highlight line at the top border (`rgba(255, 255, 255, 0.2)`).

### Format Badges & Chips
- **Format Badges:** Monospaced, uppercase, font `code-mono`. Height 22px, padding 2px 8px. Border radius `4px`. Color-coded per format (e.g., PDF, DOCX, XLSX).
- **Tool Filter Chips:** 32px height, `rounded-full`, 1px solid `#E2E8F0`, background `#FFFFFF`. Selected state shifts to `#EEF2FF` border `#6366F1` text `#4F46E5`.

### Drag-and-Drop Upload Zone
- A large elevated surface featuring an empty state illustration, supported file indicators, and single-click manual picker action.
- Resting state: 2px dashed `#CBD5E1` on `#FFFFFF`.
- Hover/Drag-over state: 2px dashed `#4F46E5` on `#F5F3FF` with a smooth SVG expand animation.

### Conversion Progress Bar
- **Track:** 6px height, background `#E2E8F0`, radius `9999px`.
- **Fill:** Gradient from `#06B6D4` to `#10B981`.
- **Status Metadata:** Left-aligned file title (`body-md`), right-aligned numeric percentage + ETA (`code-mono`).

### Input Fields & Selects
- Height 40px, padding `0 12px`, background `#FFFFFF`, border 1px solid `#CBD5E1`, text `#0F172A`.
- Focus: Border `#4F46E5`, outline ring `2px solid rgba(79, 70, 229, 0.2)`.

### Batch Conversion Queue Card
- Structured table/card list item with 5 discrete zones: 
  1. Drag handle & format badge
  2. File title & uncompressed file size
  3. Format output dropdown target
  4. Real-time conversion state (Progress bar / Success tick / Error retry)
  5. Quick-action delete / download trigger buttons.