---
name: Jetxia Design System
description: Applies the Jetxia design system and component patterns to UI development. Follows token-first styling, specific typography, spacing, and strict Tailwind rules.
---

# Jetxia Design System

You are building UI for the Jetxia Wholesaler Dashboard (or applying its design system). Adhere strictly to the following visual language, component behavior, spacing, and styling rules. 

## 1. Product Identity and Design Philosophy
- **Vibe:** B2B wholesaler travel dashboard: professional, navy-tinted, premium but restrained.
- **Token-First Styling:** Never use arbitrary Tailwind colors (e.g., `text-blue-400`). Always use semantic tokens.
- **Light Default:** Soft blue-gray background (`#F6F9FD`), navy primary (`#223F80`).
- **Dark Mode:** Deep navy (`#0C1630`) surfaces, lighter primary (`#4A73C0`).
- **Theming:** Wholesaler branding can override the palette at runtime (6 accent palettes available).

## 2. Typography
- **Primary Font:** Stack Sans Text (via `--font-geist-sans`).
- **Mono Font:** Geist Mono for kbd/technical hints.
- **Body Default:** `text-sm` (14px) with antialiased and optimizeLegibility.
- **Title Hierarchy:** 
  - Page titles: `text-lg sm:text-xl font-semibold tracking-tight`
  - Section titles: `text-base font-semibold`
  - Kickers: `text-sm uppercase tracking-wide text-muted-foreground`
- **Labels:** `text-sm font-medium`.
- **Detail Row Labels:** `text-sm font-semibold uppercase tracking-wide text-muted-foreground`.

## 3. Color System (Semantic Tokens Only)
- **Base Tokens:** `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`.
- **Sidebar Tokens:** `sidebar`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring`.
- **Chart Scale:** `chart-1` through `chart-5`.
- **Status Mapping:** 
  - `success` = confirmed/paid
  - `destructive` = cancelled/error
  - `primary` = pending
  - `chart-4` = partial states

## 4. Spacing, Radius, and Layout Grid
- **Base Radius:** `0.75rem` (`--radius`); scale: `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`.
- **Page Padding:** `px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8`.
- **Dashboard Shell Gap:** `gap-5 sm:gap-6`.
- **Form Grid:** 12 columns, `gap-1rem`. Fields default to full-width mobile, configurable `sm:col-span-*`.
- **Desktop Content Grid:** 12 cols, 20px gutter, 80px margin (Jetxia tokens).

## 5. Elevation and Shadows
- **Navy-Tinted Shadows:** `shadow-jetixia-shd-1` (rest), `shadow-jetixia-hovered` (hover), `shadow-select-shd` (dropdowns/modals).
- **Cards:** `ring-1 ring-border/50` + subtle shadow. Hover lifts with stronger shadow (no heavy drop shadows).
- **Modal Overlay:** `bg-black/10` + light backdrop blur.

## 6. Gradients
- **Theme-Aware:** Never use hardcoded hex values.
- **Primary Gradient:** `--primary-gradient` (135deg primary → chart-3 mix).
- **Modal/Card Headers:** `color-mix(primary 7–9%, card)` → card fade.
- **Left Accent Bar:** `1px/w-1` vertical strip using `primary-gradient`.
- **Underline Tabs Shell:** `--underline-tabs-gradient` with chart SVG background.

## 7. Component Patterns
- **Buttons:** `rounded-lg`, `h-8` default, `text-sm font-medium`, `transition-all`. 
  - Variants: `default` (primary fill), `outline` (border-border), `secondary`, `ghost`, `destructive` (10% bg + destructive text), `link`.
  - Focus: `ring-2 ring-ring/50`; disabled: `opacity-50`.
  - Gradient CTA: `.btn-gradient` (primary gradient + `shadow-jetixia-shd-1`, hover brightens).
- **Inputs / Selects:** `h-10`, `rounded-lg`, `border-input`, focus `ring-ring/50`. Placeholder `text-muted-foreground`. Invalid `border-destructive ring-destructive/20`. Login inputs `h-12` with icon addons.
- **Cards:** `rounded-xl bg-card shadow`, hover `shadow-jetixia-hovered`.
  - `.card-modern`: `rounded-3xl border shadow-lg`, hover `-translate-y-0.5 shadow-2xl`.
  - Dashboard surface: `rounded-xl border border-border bg-card shadow-jetixia-shd-1`.
- **Badges / Pills:** 
  - Status pills: `rounded-full px-3 py-1 text-sm font-semibold ring-1` + semantic 10% bg.
  - Count badges: `rounded-full bg-primary/10 text-primary ring-1 ring-primary/15`.
  - Badge component: `rounded-4xl h-5 text-sm font-medium`.
- **Tables:** `text-sm`, header `font-medium`, rows `hover:bg-muted/50`, footer `bg-muted/50`.
- **Dialogs / Modals:** `rounded-2xl border bg-card shadow-jetixia-shd-1 ring-1 ring-border/50`. Header gets gradient bg + left primary accent bar + border-b. Content sections `rounded-xl border border-border/70 bg-muted/15 ring-1 ring-border/40`.
- **Tabs (Underline):** Gradient shell, active tab = white card pill with shadow; inactive = translucent on gradient.
- **Sidebar:** Width 16rem (collapsed 3rem). Nav items `rounded-lg text-[13px]`, active = `bg-primary/10 ring-1 shadow-jetixia-shd-1` + left primary bar. Section labels uppercase tracking-[0.16em].
- **Header:** Sticky, `bg-card/85 backdrop-blur-xl border-b border-border/60`.
- **Toasts:** Sonner, top-right, uses popover tokens + Lucide icons.
- **Loading:** Spinner is Lucide Loader2 `animate-spin size-4`. Skeleton is `animate-pulse rounded-md bg-foreground/10`.

## 8. Motion and Micro-interactions
- **Default Transitions:** `transition-all duration-200` or `duration-300 ease-out`.
- **Hover Effects:** Shadow upgrade, slight translate on `.card-modern`, `brightness(1.03)` on gradient buttons.
- **Collapse Panels:** `grid-template-rows` + opacity 320ms ease.
- **Dialog Open:** Fade + zoom-in-95 (100ms).
- **Tab Indicator:** `duration-300 ease-out`.
- **Rule:** Never jarring; prefer subtle elevation and color shifts.

## 9. Responsive Behavior
- **Mobile-first:** Sidebar becomes sheet on mobile.
- **Grids:** 1 col → `sm:2` → `xl:4` for stat cards; `lg:2`-col for sections.
- **Modal Max-Widths:** `sm:max-w-sm`, booking modals wider.
- **Overflow:** Truncate long text in headers; `min-w-0` on flex children.

## 10. Iconography
- **Icons:** Use Lucide React exclusively. Default `size-4` in buttons, `size-5` in tiles.
- **Icon Containers:** `size-11 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15`.

## 11. Accessibility and HTML
- **Semantic HTML:** Use `<header>`, `<main>`, `<label>`, `<button>`.
- **Focus Rings:** `focus-visible` rings on all interactive elements.
- **Screen Readers:** `sr-only` for icon-only buttons, `aria-hidden` on decorative icons.

## 12. Hard Rules (Must Follow)
- **NEVER** hardcode colors when semantic tokens exist.
- **NEVER** use arbitrary Tailwind palette colors (like `text-blue-400`, `bg-blue-200`). **Always** use semantic variables like `text-primary`, `bg-success/10`, `text-destructive`.
- Use `color-mix()` and CSS variables for gradients.
- Preserve responsiveness and design consistency.
- Match existing component class naming (`.booking-*`, `DASHBOARD_*` tokens).

## 13. Domain-Specific UI Recipes
- **Booking Reservation Card:** Accent bar, gradient header, sell price pill, detail panels, rooms sidebar.
- **Pay Now / Cancellation Modals:** Table-in-modal pattern, method selection cards with active ring.
- **Voucher Preview:** Wide panel, room selector dropdown, action icon buttons.
- **Status Colors:** confirmed=`success`, cancelled=`destructive`, pending=`primary`, partial=`chart-4`.
