# 001 — Fade the ranking hero wheel out instead of hard-cutting the cards

- **Status**: DONE
- **Commit**: 7149db9 (+ uncommitted working-tree change that made the hero transparent in dark theme — see "Problem")
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, ~6 lines

## Problem

The `/ranking` hero is a rotating wheel of bar-photo cards. The wheel's centre sits
under the title, so the lower half of the wheel is hidden by `overflow-hidden` on the
section. In dark theme the section is now transparent (so the page background image shows
through), which means the cards are sliced by a perfectly straight, invisible line in
mid-air. It reads as a rendering bug ("cards look cut off").

```tsx
// apps/frontend/src/modules/ranking/components/radialCarousel.tsx:51-56 — current
    <section
      ref={root}
      className="relative isolate h-[24rem] overflow-hidden border-b border-border bg-surface dark:border-transparent dark:bg-transparent sm:h-[30rem] lg:h-[35rem]"
    >
      {/* จุดศูนย์กลางวงล้อ = ตำแหน่งหัวข้อ */}
      <div className="absolute left-1/2 top-[70%] size-0 [--radius:10.5rem] sm:[--radius:14rem] lg:top-[72%] lg:[--radius:18rem]">
```

The wheel `<div>` (the one with `top-[70%] size-0`) closes just before the
`<div data-radial-title …>` element.

> If the `dark:border-transparent dark:bg-transparent` classes are NOT present in the file,
> the working-tree change was never committed — STOP and report.

## Target

Wrap the wheel (cards only — NOT the title) in a full-size layer that, in dark theme only,
fades to transparent toward the bottom edge, so cards sink into the background instead of
being cut. Light theme keeps its solid panel and border (no mask there).

```tsx
// target
      <div
        aria-hidden
        className="absolute inset-0 dark:[mask-image:linear-gradient(to_bottom,#000_55%,transparent_92%)]"
      >
        {/* จุดศูนย์กลางวงล้อ = ตำแหน่งหัวข้อ */}
        <div className="absolute left-1/2 top-[70%] size-0 … (unchanged)">
          … (unchanged wheel markup)
        </div>
      </div>
      <div data-radial-title …> (unchanged, stays OUTSIDE the mask layer)
```

- Gradient stops are exactly `#000 55%` → `transparent 92%`.
- The title must stay outside the mask so its text is never dimmed by it.

## Repo conventions to follow

- Tailwind arbitrary properties with underscores for spaces are already used on this page,
  e.g. `apps/frontend/src/modules/ranking/page.tsx` uses
  `[mask-image:linear-gradient(to_bottom,#000_75%,transparent)]` on the background layer —
  copy that syntax.
- Dark-only styling uses the `dark:` variant (`@custom-variant dark (&:where(.dark, .dark *))`
  in `packages/ui/src/theme.css`).

## Steps

1. In `apps/frontend/src/modules/ranking/components/radialCarousel.tsx`, insert the wrapper
   `<div aria-hidden className="absolute inset-0 dark:[mask-image:linear-gradient(to_bottom,#000_55%,transparent_92%)]">`
   immediately after the opening `<section …>` tag, before the `{/* จุดศูนย์กลางวงล้อ … */}` comment.
2. Close that wrapper with `</div>` immediately after the wheel `<div>` closes, i.e. directly
   before `<div data-radial-title`.
3. Re-indent the moved block. Do not change any class or attribute inside it.

## Boundaries

- Do NOT touch the GSAP code in the `useGSAP` block (selectors `[data-radial-intro]`,
  `[data-radial-face]`, `[data-radial-spin]`, `[data-radial-scroll]` still resolve because
  `scope: root` is the section).
- Do NOT change the section's `overflow-hidden`, height, or light-theme classes.
- Do NOT move or wrap `[data-radial-title]`.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `pnpm --filter @nightout/frontend typecheck` and
  `pnpm --filter @nightout/frontend lint` — no new errors.
- **Feel check** (dark theme, `/ranking`, widths 375 / 768 / 1440):
  - The lower cards of the wheel dissolve into the purple/blue background; no straight
    horizontal edge is visible anywhere across the hero.
  - "จัดอันดับร้าน" and its subtitle are fully opaque (compare with DevTools: toggle the mask
    class off/on — title brightness must not change).
  - The wheel still spins and still rotates further on scroll.
  - Switch to light theme: hero looks exactly as before (solid panel + bottom border, cards
    clipped at the panel edge).
- **Done when**: no visible hard cut of cards in dark theme at any width, and the title is unaffected.
