# 002 — Make "ผู้ชนะได้แก่…" a one-shot reveal (no pin, no scrub, no clipping masks)

- **Status**: DONE
- **Commit**: 7149db9
- **Severity**: HIGH
- **Category**: Purpose & frequency (+ Physicality: clipped Thai glyphs)
- **Estimated scope**: 1 file, ~40 lines

## Problem

`SplitHeading` renders "สัปดาห์นี้ ผู้ชนะได้แก่…" between the filters and the podium. Two
things make it look broken:

1. **Reading text is scrubbed + pinned.** The section is pinned for a full viewport of
   scrolling and the characters reveal proportionally to scroll position. If the user stops
   halfway, the heading freezes half-built: "สัปดาห์นี้" sits off to the left (the invisible
   gold half still occupies its width, so the visible half looks off-centre), fragments of
   half-risen glyphs peek out, and the user scrolls through a whole screen of almost-empty
   space. Text that people must read should never be parked in an intermediate state.
2. **Clipping masks cut Thai vowels/tone marks.** Each half is wrapped in an
   `overflow-hidden` span and the glyphs slide up from `yPercent: 115`. Upper marks
   (ั ี ้ ่ ์) and lower vowels (ู) cross the mask edge during the move, so letters look
   chopped.

```tsx
// apps/frontend/src/modules/ranking/components/splitHeading.tsx:1 — current
import { EASE_IN_OUT, EASE_OUT, MOTION_OK, MOTION_REDUCE, gsap, useGSAP } from '../utils/gsap';
```

```tsx
// apps/frontend/src/modules/ranking/components/splitHeading.tsx:25-56 — current
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=100%',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
        });
        tl.from('[data-lead]', {
          yPercent: 110,
          opacity: 0,
          duration: 0.7,
          ease: EASE_OUT,
        }).from(
          '[data-char]',
          {
            yPercent: 115,
            opacity: 0,
            duration: 1,
            ease: EASE_IN_OUT,
            stagger: 0.04,
          },
          '+=0.12',
        );
      });
```

```tsx
// apps/frontend/src/modules/ranking/components/splitHeading.tsx:64-97 — current markup
    <section
      ref={root}
      className="flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <h2 … className="max-w-full text-center text-5xl font-bold leading-[1.2] sm:text-7xl lg:text-8xl">
        <span aria-hidden className="-mt-[0.3em] inline-block overflow-hidden align-bottom pb-[0.16em] pt-[0.3em]">
          <span data-lead className="inline-block text-muted">{lead}{' '}</span>
        </span>
        <span aria-hidden className="-mt-[0.3em] inline-block overflow-hidden align-bottom pb-[0.16em] pt-[0.3em]">
          <span className="inline-flex text-gold"> …chars… </span>
        </span>
      </h2>
    </section>
```

## Target

Play once when the heading scrolls into view; nothing is pinned or scrubbed; nothing clips.

```tsx
// target — animation
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
        });
        tl.from('[data-lead]', {
          opacity: 0,
          y: 24,
          filter: 'blur(6px)',
          duration: 0.5,
          ease: EASE_OUT,
        }).from(
          '[data-char]',
          {
            opacity: 0,
            yPercent: 40,
            filter: 'blur(4px)',
            duration: 0.6,
            ease: EASE_OUT,
            stagger: 0.03,
          },
          '-=0.25',
        );
      });
```

- `EASE_OUT` is `'expo.out'` (≈ `cubic-bezier(0.23, 1, 0.32, 1)`), exported from `../utils/gsap`.
- Stagger 0.03 s per grapheme (inside the 30–80 ms band); total ≈ 0.5 + 12×0.03 + 0.6 − 0.25 ≈ 1.2 s — acceptable for a once-per-visit section heading.
- `once: true` → after playing, the trigger is killed; scrolling back up does not replay.
- When the period changes (`key={period}` remounts the component) and the heading is already
  on screen, the trigger fires immediately on creation, so the new text plays in — this is
  the desired "data changed" feedback.

```tsx
// target — markup (no pin height, no clipping wrappers)
    <section ref={root} className="flex items-center justify-center py-16 sm:py-24">
      <h2
        aria-label={`${lead} ${text}…`}
        className="max-w-full text-center text-5xl font-bold leading-[1.3] sm:text-7xl lg:text-8xl"
      >
        <span aria-hidden data-lead className="inline-block text-muted">
          {lead}{' '}
        </span>
        <span aria-hidden className="inline-flex text-gold">
          {chars.map((c, i) => (
            <span key={i} data-char className="inline-block whitespace-pre">
              {c}
            </span>
          ))}
          <span data-char className="inline-block">…</span>
        </span>
      </h2>
    </section>
```

- `leading-[1.3]` (was 1.2) gives Thai upper/lower marks room now that nothing clips.
- The `style={{ transformOrigin: '50% 100%' }}` on chars is no longer needed (no scale/rotate) — remove it.

## Repo conventions to follow

- All ranking motion uses GSAP via `../utils/gsap` and `gsap.matchMedia()` with
  `MOTION_OK` / `MOTION_REDUCE` — keep that structure.
- One-shot (non-scrubbed) trigger already exists in this module as an exemplar:
  `apps/frontend/src/modules/ranking/components/podium.tsx` — the vote counter uses
  `scrollTrigger: { trigger: root.current, start: 'top 45%', once: true }` with the comment
  "ตัวเลขที่คนอ่านต้องนิ่ง". Same principle applies to this heading.
- Keep the `graphemes()` helper (Intl.Segmenter) unchanged — it keeps Thai marks attached to
  their consonant.

## Steps

1. Line 1: change the import to
   `import { EASE_OUT, MOTION_OK, MOTION_REDUCE, gsap, useGSAP } from '../utils/gsap';`
   (`EASE_IN_OUT` becomes unused).
2. Replace the body of `mm.add(MOTION_OK, () => { … })` with the "target — animation" code above.
3. Leave the `mm.add(MOTION_REDUCE, …)` block (`gsap.set('[data-lead], [data-char]', { clearProps: 'all' })`)
   and `return () => mm.revert();` as they are. Leave the `useGSAP` options
   (`{ scope: root, dependencies: [lead, text], revertOnUpdate: true }`) as they are.
4. Replace the returned JSX with the "target — markup" above. Note `data-lead` moves onto the
   outer span itself (the extra wrapper span is gone).
5. Update the JSDoc above `SplitHeading` to:
   `/** หัวข้อ "สัปดาห์นี้ ผู้ชนะได้แก่…" — เล่นครั้งเดียวเมื่อเลื่อนมาถึง (ไม่ pin / ไม่ scrub — ข้อความที่ต้องอ่านไม่ควรค้างครึ่งทาง) */`

## Boundaries

- Only edit `apps/frontend/src/modules/ranking/components/splitHeading.tsx`.
- Do NOT change `page.tsx` (the `mt-14 sm:mt-20` wrapper and `key={period}` stay).
- Do NOT use `overflow-hidden`, `clip-path`, or pin anywhere in this component.
- Do NOT add dependencies (no GSAP SplitText).

## Verification

- **Mechanical**: `pnpm --filter @nightout/frontend typecheck` and
  `pnpm --filter @nightout/frontend lint` — no new errors/warnings (in particular no unused `EASE_IN_OUT`).
- **Feel check** (`/ranking`, widths 375 and 1440, dark and light theme):
  - Scroll down slowly: when the heading's top reaches ~75% of the viewport, "สัปดาห์นี้"
    blurs-in, then the gold graphemes rise in left→right. Stop scrolling mid-way — the
    animation still completes on its own.
  - The heading is centred as a whole at all times; there is never a lone "สัปดาห์นี้" pushed to one side.
  - No scroll "dead zone": the podium follows the heading within normal spacing (~16–24 units).
  - Slow animations to 10% in DevTools (Animations panel): ั ี ้ ่ ์ ู are never cut by an edge.
  - Toggle รายสัปดาห์ ↔ รายเดือน while the heading is on screen: the new lead plays in once.
  - Scroll up and back down: it does not replay.
  - Enable `prefers-reduced-motion: reduce` (Rendering panel): text is shown immediately, no motion.
- **Done when**: no pin-spacer element is created for this section (search the DOM for
  `.pin-spacer` — none around the heading), and the heading never appears half-built when idle.
