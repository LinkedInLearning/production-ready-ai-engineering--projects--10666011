# Evidence library (reference captures)

These frames are **checked in on purpose**. They are the before/after visuals for each quality
episode, captured once during production so you can see what "wrong" and "right" look like
without spending the time to generate them yourself.

**You do not need to reproduce these to do the course.** Each episode's default path measures
before/after with a fast automated tool and prints the numbers in the terminal - that is the
verification that matters, and it takes seconds. Capturing annotated screenshots takes minutes,
which is why it is an opt-in add-on at the bottom of each script rather than the default.

If you *do* want to regenerate them, every script ends with an **Optional: capture visual
evidence** section containing a ready-to-paste prompt. Frames you generate land in these same
folders and will show up as local modifications - `git restore demos/helpdesk-ai/evidence` puts
the reference set back.

## What is here

| Folder | Ep | Format | The story it tells |
| --- | --- | --- | --- |
| `ux-states/` | 02 | 15 screenshots | Silent failed submit and missing states → visible error + retry, loading, empty |
| `a11y/` | 06 | 8 screenshots + axe output | Low-contrast badges zoomed with their ratios, axe overlay → fixed |
| `perf/` | 03 | 4 screenshots + 2 Lighthouse reports | Oversized hero and a poor Lighthouse score → optimized, LCP far lower |
| `mutation/` | 07 | 2 screenshots + scores | Stryker report, surviving mutants → killed |
| `injection/` | 09 | 2 screenshots | Leaked customer email list in the reply box → safe reply |
| `reliability/` | 12 | 2 screenshots + metrics | Hung UI and flat metrics → fast fallback + telemetry |
| `fitness/` | 01 | terminal output + 1 report | Gate red → green on the illegal `apps/web -> apps/api` edge |
| `perf-budget/` | 04 | terminal output | Bundle over budget → under |
| `perf-challenge/` | 05 | terminal output + summary | Budget and API p95 before/after |

The last three are terminal captures rather than screenshots - that episode's proof is a number,
not a picture. Episodes 08, 10, 11, 13, 14 and 15 have no folder at all for the same reason:
their evidence is eval results, security findings, CI checks, canary metrics and a module map.

## Naming

`before-*.png` / `after-*.png` within a topic folder. Numbered prefixes (`before-1-badges.png`)
keep a multi-frame sequence in reading order.
