# Animation plans

Written by `improve-animations` for the `/ranking` page (commit 7149db9). Each plan is
self-contained; run them with any agent or via `improve-animations execute <plan>`.

| # | Plan | Severity | Status |
|---|---|---|---|
| 001 | [Fade the hero wheel out instead of hard-cutting cards](001-ranking-hero-fade-cards.md) | HIGH | DONE |
| 002 | [One-shot reveal for "ผู้ชนะได้แก่…" (no pin/scrub/clipping)](002-ranking-winner-heading-one-shot.md) | HIGH | DONE |
| 003 | [Narrow the podium fan on phones](003-ranking-podium-mobile-spread.md) | MEDIUM | DONE |

## Recommended order

1. **002** first — removing the pin changes the page's scroll length, which shifts where the
   podium's scroll trigger fires. Feel-check 003 after this lands.
2. **003** — podium spread on mobile.
3. **001** — independent (hero only); can run in parallel with either.

## Dependencies

- 001 depends on the uncommitted dark-theme change in `radialCarousel.tsx`
  (`dark:border-transparent dark:bg-transparent`) being committed first.
- 003 should be feel-checked after 002 (trigger positions move once the pin is gone).
