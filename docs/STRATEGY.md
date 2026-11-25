# HealYaar Landing Page Design & Motion Strategy

## 1. Creative Direction & Numerical Design System
- **3-Adjective Mood:** *Tactile, Clinical, Serene*
- **Color Palette (Daylight-First + Dark Mode):**
  - Studio Ground / Canvas: `#F5F5F7` (light) / `#0B0F17` (dark)
  - Warm Surface: `#FAFAFA` (light) / `#0D1119` (dark)
  - Elevated Surface: `#FFFFFF` (light) / `#111827` (dark)
  - Hairline Borders: `rgba(15, 23, 42, 0.06)` (light) / `rgba(255, 255, 255, 0.08)` (dark)
  - Primary Ink: `#0F172A` (light, `>15:1`) / `#F8FAFC` (dark)
  - Secondary Ink: `#475569` (light, `>7:1`) / `#CBD5E1` (dark)
  - Clinical Action Accent: `#0D9488` / `#0F766E`
  - Healयार Brand & 108/112 SOS Accent: `#E11D48` / `#BE123C`
- **Typography (Smooth, Zero Monospace on Consumer UI):**
  - Display & Headings: `Plus Jakarta Sans`, `Noto Sans Devanagari` (`600/700`, `-0.025em` to `-0.03em` tracking)
  - Body & Controls: `DM Sans`, `Noto Sans Devanagari`, `Noto Sans` (`antialiased`)
  - Type Scale:
    - Hero H1: `clamp(2.5rem, 5.2vw, 4.6rem)`, `line-height: 1.02`
    - Section H2: `clamp(1.875rem, 3.4vw, 2.85rem)`, `line-height: 1.1`
    - Card / Feature H3: `clamp(1.125rem, 1.5vw, 1.375rem)`, `line-height: 1.25`
    - Body: `clamp(0.95rem, 1.05vw, 1.0625rem)`, `line-height: 1.6`
- **Motion Curves & Physics:**
  - Micro-interactions: `cubic-bezier(0.22, 1, 0.36, 1)` (`150ms–300ms`)
  - Interactive UI springs (`motion/react`): `type: "spring", stiffness: 380, damping: 30`
  - Scroll choreography: `lenis` smooth wheel + `gsap` ScrollTrigger (`scrub: 0.8`) + `requestAnimationFrame` frame lerping (`0.14`)
  - Strict `prefers-reduced-motion` static fallback

## 2. Signature Motion Motifs
1. **Full-Bleed Scroll-Scrubbed Stethoscope Cinema (`100vw × 100svh` pinned canvas):**
   - 3-Act choreography inspired by frame-by-frame scroll morphing:
     - **Act I (`0%–30%`):** Diagonal brushed-titanium stethoscope poised in studio air + H1 + Get Started / Live Demo CTAs.
     - **Act II (`35%–70%`):** Act I copy exits cleanly; stethoscope rotates chestpiece toward lens; Dual-Layer RAG & English/हिन्दी/मराठी clarity block appears.
     - **Act III (`72%–100%`):** Stethoscope curls into a centered symmetrical circular silhouette above the private-by-architecture CTA settle.
2. **Tactile Spring Controls & Clip-Path Reveals:**
   - `layoutId` shared tab indicator in Workspace Preview, `whileTap={{ scale: 0.98 }}`, and `clip-path` image reveal in Care Flow.

## 3. 5-Section Structure
1. **Pinned Full-Bleed Stethoscope Scroll Cinema Stage** (3-Act scroll choreography + persistent minimal header)
2. **Interactive Workspace Preview + Privacy Ledger** (`Dual-Layer RAG`, `Clinician SOAP`, `108/112 Guard` + DPDP/RLS architecture)
3. **3-Step Private Care Flow** (Studio still + 01/02/03 sequential progression)
4. **Core Care Suite** (2 featured white panels + 3-column typographic row)
5. **Private Vault Commitment, Compact FAQ Accordion & Legal Footer**

## 4. Google Flow Asset Pack
- `stethoscope-scroll.mp4` -> `public/frames/stethoscope-scroll/frame_%04d.webp` + `public/videos/stethoscope-scroll.mp4`
- `clinical-instruments-still.webp` -> `public/images/clinical-instruments-still.webp`
