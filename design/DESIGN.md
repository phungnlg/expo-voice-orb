# Lumen Orb Lab - Design System

Dark-first premium demo app for an animated voice-assistant orb. Calm, sophisticated,
Gemini-Live-inspired fluid motion. Frame 393x852 (iPhone 16/17), top inset ~59px, bottom
inset ~34px, no tappable content under status bar or home indicator.

## Theme: DARK (mandatory on every screen)

Do NOT render light surfaces. Every screen uses these exact hexes:

- Page background: #0E0E16 (hue-tinted near-black, never pure #000)
- Card / sheet surface: #171722
- Inset / grouped rows: #20202E
- Hairline border / divider: #2A2A3A
- Text primary: #EAEAF5 (never pure #FFF), secondary: #A0A0B4, hint: #6E6E82

## Color

- Accent (brand): #4361EE indigo. Large fills, hero orb core.
- Accent-fill (buttons with WHITE label, >=4.5:1): #2E45B8
- Accent-dark (icons, active states, key text on dark, >=4.5:1 on #0E0E16): #93A6FF
- Accent tint (selected chips/badges): #93A6FF at 14% over surface
- Support: #14B8A6 aqua. Secondary data, waveform highlights, charts. Dark text on it, never a white-label primary button.
- Semantic: success #34D98A, warning #FFC53D, danger #FF6369. Never use brand accent for states.
- Do not use generic violet #6366F1/#8B5CF6 or flat grey #6B7280.

## Gradient + focal rules

- Soft indigo->aqua gradient (#4361EE -> #14B8A6, subtle 2-stop, low contrast) allowed ONLY
  on the orb glow, onboarding hero, and the primary CTA. Tab bar stays flat.
- ONE bold focal element per screen: the orb itself on Orb screens; the live waveform
  preview on amplitude-lab; the state grid's active button on state-lab. Everything else quiet.
- The orb: a circular field of small glowing particles (indigo #93A6FF, some aqua #14B8A6)
  surrounding a central fluid waveform RING (not bars) - soft glow, premium, restrained.

## Typography

- Primary UI + body: Plus Jakarta Sans
- Display / hero titles / numerals: Space Grotesk
- display 32/700 -0.02em, title 20/600, body 16/400, label 14/500, caption 13/500
- Amplitude / ms / fps numerals in Space Grotesk.

## Shape, elevation, icons

- Radius: card 20, control 14, input 12, pill 999
- Elevation: NO hard shadows. Cards are flat #171722 with 1px #2A2A3A border. The only
  glow is the orb's soft accent glow.
- Icons: ONE set - rounded outline (Lucide style), 24px, ~1.75 stroke. Never mix filled + outline.
- Spacing: 8pt scale, screen edge padding 20px, generous vertical rhythm.

## Controls (one spec, reused everywhere)

- Primary button: pill, fill #2E45B8, white label, pressed #24378F, disabled 40% opacity
- Secondary button: pill, transparent, 1px #2A2A3A border, #EAEAF5 label
- Chip: pill, #20202E fill, #A0A0B4 label; selected = #93A6FF text on 14% accent tint fill
- Slider: track #20202E, filled portion #93A6FF, round thumb #EAEAF5
- Text input: 12px radius, #171722 fill, 1px #2A2A3A border, focus = #93A6FF ring
- State chip (top bar): pill, accent tint fill, #93A6FF label, caption size

## Shared components (exact, every screen)

- Bottom tab bar: EXACTLY these 3 tabs in this order: Orb (circle-dot icon), Lab (sliders
  icon), Settings (gear icon). Active tab icon+label #93A6FF, inactive #A0A0B4. Flat bar on
  #171722 with 1px top border #2A2A3A. Do not rename, reorder, add, or remove tabs.
- Top bar: small 'LUMEN' wordmark left (Space Grotesk, caps, 14px, letterspaced, #EAEAF5),
  current orb state chip right.
- Screens marked no-nav render NO bottom tab bar.

## A11y

- #EAEAF5 on #0E0E16/#171722 passes >=4.5:1. White labels only on #2E45B8.
- #93A6FF for icons/active/key text on dark. Text over the orb glow still passes 4.5:1.
- All tap targets >=44x44pt.
