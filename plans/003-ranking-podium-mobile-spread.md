# 003 — Narrow the podium fan on phones so side cards stay on screen

- **Status**: DONE
- **Commit**: 7149db9
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, ~25 lines

## Problem

The top-3 podium fans out cards 2 and 3 to the sides: each side card is shifted by 78% of
its own width and rotated ±9° around its bottom-centre. On a 375px phone the side wrapper
is ~128px wide and ~232px tall (label + `h-48` card):

- shift 0.78 × 128 ≈ 100px → side card spans roughly x = 23…151 (left) / 223…351 (right)
- a 9° rotation around the bottom pushes the top outer corner out by ≈ 232 × sin 9° ≈ 36px

So the outer top corners land around x ≈ −13 and x ≈ 387 — past the 375px viewport, and the
cards look cut off. (Computed from the code — the executor must confirm on a real 375px viewport.)

```tsx
// apps/frontend/src/modules/ranking/components/podium.tsx:19-24 — current
/** ลำดับบนจอ: ที่ 2 · ที่ 1 · ที่ 3 · มุมเอียงและระยะตอนกางเต็ม (Figma) */
const SLOTS = [
  { idx: 1, rotate: -9, x: -78, y: 5 },
  { idx: 0, rotate: 0, x: 0, y: 0 },
  { idx: 2, rotate: 9, x: 78, y: 5 },
] as const;
```

The values are read back from `data-x` / `data-rotate` / `data-y` inside both
`mm.add(MOTION_OK, …)` (the scrubbed `fromTo` target) and `mm.add(MOTION_REDUCE, …)` (`gsap.set`).

## Target

Below 640px (Tailwind `sm`) use a tighter fan: **x = ±60, rotate = ±6°**, y unchanged (5).
At ≥640px keep the Figma values (±78, ±9°). Check: 0.60 × 128 ≈ 77px shift → outer edge at
x ≈ 46 / 329; rotation adds ≈ 232 × sin 6° ≈ 24px → corners at ≈ 22 / 353, inside 375px with
~22px margin. The centre card (z-10) still overlaps the side cards, as in Figma.

```ts
// target — slots
const SLOTS = [
  { idx: 1, rotate: -9, x: -78, y: 5, rotateSm: -6, xSm: -60 },
  { idx: 0, rotate: 0, x: 0, y: 0, rotateSm: 0, xSm: 0 },
  { idx: 2, rotate: 9, x: 78, y: 5, rotateSm: 6, xSm: 60 },
] as const;
```

```ts
// target — read the right pair per breakpoint
const NARROW = '(max-width: 639px)';

/** ค่ากางเต็มของการ์ด — จอแคบ (< sm) กางแคบลงไม่ให้มุมการ์ดล้นขอบจอ */
function spread(el: HTMLElement, narrow: boolean) {
  return {
    xPercent: Number(narrow ? el.dataset.xSm : el.dataset.x),
    yPercent: Number(el.dataset.y),
    rotation: Number(narrow ? el.dataset.rotateSm : el.dataset.rotate),
  };
}
```

```ts
// target — matchMedia with conditions (replaces the two separate mm.add calls)
      const mm = gsap.matchMedia();
      mm.add({ ok: MOTION_OK, reduce: MOTION_REDUCE, narrow: NARROW }, (ctx) => {
        const { ok, narrow } = ctx.conditions as { ok: boolean; reduce: boolean; narrow: boolean };
        const cards = gsap.utils.toArray<HTMLElement>('[data-podium-card]');
        if (ok) {
          … existing timeline code, but the fromTo "to" object becomes:
              { ...spread(el, narrow), opacity: 1, scale: 1, ease: EASE_OUT }
          … label tween and vote counter unchanged
        } else {
          cards.forEach((el) => gsap.set(el, spread(el, narrow)));
          gsap.from(cards, { opacity: 0, duration: 0.3 });
        }
      });
      return () => mm.revert();
```

`gsap.matchMedia` re-runs the callback (and reverts the previous one) when any condition
flips, so rotating the phone / resizing across 640px re-lays out the fan correctly.

## Repo conventions to follow

- GSAP helpers come from `apps/frontend/src/modules/ranking/utils/gsap.ts`
  (`EASE_OUT`, `MOTION_OK`, `MOTION_REDUCE`, `gsap`, `useGSAP`). Put the new `NARROW`
  constant at the top of `podium.tsx` (it is local to this component), not in `utils/gsap.ts`.
- Comments in this codebase are Thai, short, and explain *why*.

## Steps

1. In `apps/frontend/src/modules/ranking/components/podium.tsx`, replace `SLOTS` with the
   "target — slots" array.
2. Below `SLOTS`, add the `NARROW` constant and the `spread()` function exactly as in
   "target — read the right pair per breakpoint".
3. In the JSX `SLOTS.map(({ idx, rotate, x, y }) => …)`, destructure
   `({ idx, rotate, x, y, rotateSm, xSm })` and add two attributes to the
   `[data-podium-card]` div: `data-rotate-sm={rotateSm}` and `data-x-sm={xSm}`
   (React maps these to `dataset.rotateSm` / `dataset.xSm`).
4. Replace the two `mm.add(MOTION_OK, …)` / `mm.add(MOTION_REDUCE, …)` calls with the single
   conditions-based `mm.add` shown in "target — matchMedia with conditions". Inside the `ok`
   branch keep the existing code verbatim (timeline with
   `scrollTrigger: { trigger: root.current, start: 'top 95%', end: 'top 30%', scrub: 0.8 }`,
   the `fromTo` start values `{ xPercent: 0, yPercent: 45, rotation: 0, opacity: 0, scale: 0.9 }`,
   the `[data-podium-label]` tween, and the vote-counter loop) — only the `fromTo` target
   object changes to use `spread(el, narrow)`.
5. Keep the `useGSAP` options
   (`{ scope: root, dependencies: [top3.map((b) => b.id).join()], revertOnUpdate: true }`) unchanged.

## Boundaries

- Only edit `podium.tsx`.
- Do NOT change card sizes, border colours, the ≥640px values (±78 / ±9), or the scroll
  trigger start/end/scrub values.
- Do NOT add `overflow-hidden` to any ancestor to hide the overflow — the fix is to keep the
  cards inside the viewport.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `pnpm --filter @nightout/frontend typecheck` and
  `pnpm --filter @nightout/frontend lint` — no new errors.
- **Feel check** (`/ranking`, DevTools device toolbar):
  - 375×812: scroll until the podium is fully fanned. Both side cards, including their
    rotated top corners and the "ที่ 2" / "ที่ 3" labels, are fully inside the viewport
    with visible margin. In the console:
    `[...document.querySelectorAll('[data-podium-card]')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.right]; })`
    → every `left ≥ 0` and every `right ≤ 375`.
  - 320px wide: still no corner past the edge (if it is, report the numbers instead of
    inventing new values).
  - 1024 and 1440: the fan looks identical to before (±78 / ±9°).
  - Resize from 1024 down to 375 with the podium on screen: the fan re-settles to the narrow values without a page reload.
  - `prefers-reduced-motion: reduce`: cards appear already fanned (narrow values on phone), fading in only.
- **Done when**: at 375px all three podium cards are fully visible when fanned, and desktop is unchanged.
