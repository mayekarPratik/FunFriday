# Wope Design System & UI Guidelines

## 1. Design Philosophy
- **Aesthetic:** Clean, high-performance, modern developer/SaaS tool. Dark-mode first with sharp contrast, precise typography, and data-dense layouts.
- **Tone:** Professional, technical, authoritative, and frictionless.

## 2. Color Palette
- **Background (Canvas):** `#090A0F` (Deep dark obsidian/navy base)
- **Surfaces (Cards/Containers):** `#12141C` with subtle 1px borders (`#1F2430`)
- **Primary Text:** `#F8FAFC` (High-contrast crisp white)
- **Muted Text:** `#94A3B8` (Slate grey for secondary details)
- **Accent/Brand:** `#3B82F6` (Vibrant electric blue for primary actions and highlights)
- **Status Indicators:** 
  - Success: `#22C55E`
  - Warning: `#EAB308`
  - Error: `#EF4444`

## 3. Typography
- **Font Family:** Inter, Geist, or system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- **Scale:**
  - **H1 (Page Titles):** 32px / Line height 1.2 / Bold (`font-bold`)
  - **H2 (Section Headers):** 24px / Line height 1.3 / Semi-bold
  - **Body Text:** 14px to 15px / Line height 1.5 / Regular
  - **Captions / Badges:** 12px / Medium / Monospace accents where applicable

## 4. UI Components & Layout Rules
- **Cards & Containers:** Soft rounded corners (`rounded-xl` or `border-radius: 12px`), minimal drop shadows, relying mostly on 1px crisp borders for structural separation.
- **Buttons:**
  - *Primary:* Solid accent fill (`#3B82F6`) with white text, subtle hover brightness shift.
  - *Secondary / Ghost:* Transparent background with a 1px border and smooth hover state (`bg-white/5`).
- **Data Tables & Metrics:** Clean tabular layouts with high-density spacing, distinct column headers in muted text, and numeric alignment to the right.