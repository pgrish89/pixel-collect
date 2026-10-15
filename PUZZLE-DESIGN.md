# Authored puzzle verification

These are developer reproduction notes, **not player hints**. None of these schedules, accessibility results, or color recommendations are displayed by the game.

## Layout and target scheme

The original heart, sun, butterfly, rocket, and house occupancy functions are retained as `pictureDots(index)`. Every occupied coordinate and stable level ID remains unchanged. A fixed unsigned 32-bit LCG (`seed = imul(seed,1664525)+1013904223`, modulo 2^32) adds mosaic accents: for each occupied pixel in row-major order, a draw below .32 replaces its original color with a second draw's `floor(draw*6)`. The fixed per-picture seeds are 1701, 11702, 21701, 31701, 41701. Most original colors remain, with six colors represented in every picture.

`design-levels.cjs` is an **offline authoring tool**, never called by gameplay. It evaluates exterior-connected removal closures for candidate color pairs. The first chosen pair must let *both* colors remove more pixels together than alone. Each pair's removable count becomes that color's exact target; subsequent pairs are evaluated on the remaining occupied cells. Targets are not limited to the former 24 pixels: the authored targets range from 1 to 118. The authoring tool verifies actual model deliveries for both opening orders and requires a progressed three-slot trap before accepting a layout.

The resulting fixed targets and seeds are embedded in the standalone HTML. `authored-levels.json` contains full 24×24 layout fixtures, schedules, and trap counts. Run `node design-levels.cjs` to reproduce the fixtures, then `node nontrivial-test.cjs` to check them against the playable model. Editing the original geometry/palette or generation order requires deliberate reauthoring, not silently changing these targets.

The total of every color's queued targets equals its true pixel count. Reservations still occupy their cells; only pickup opens space. Targets count deliveries home, not pickups, and all active jobs stay locked until their individual targets are delivered.

## Reproducible victories

Color IDs: **0 Rose, 1 Gold, 2 Mint, 3 Blue, 4 Lilac, 5 Peach**. Notation `0:118` means explicitly select Rose's next 118-pixel job. Start collecting and let the model reach **quiescence after each selection** (no current reservation, cargo, or accessible target among active robots). Quiescence may leave a partial robot locked in its slot; select the next helper instead of waiting forever for that slot to empty.

| Stable ID | Original total | Winning explicit selections |
| --- | ---: | --- |
| first-heart | 362 | 0:118 → 4:107 → 2:20 → 5:79 → 1:15 → 3:20 → 0:3 |
| workshop-sun | 196 | 0:4 → 4:9 → 1:89 → 5:71 → 0:5 → 2:11 → 3:4 → 4:3 |
| garden-butterfly | 300 | 3:65 → 4:97 → 0:43 → 1:51 → 2:12 → 5:24 → 3:5 → 4:3 |
| tiny-rocket | 192 | 0:66 → 2:60 → 1:18 → 3:27 → 4:11 → 5:8 → 0:1 → 2:1 |
| delivery-home | 319 | 1:74 → 2:74 → 0:60 → 3:43 → 4:30 → 5:31 → 1:3 → 2:3 → 0:1 |

Every listed schedule was simulated through **all pixels delivered**, with no active robots left. For every picture, swapping its first two selections is also a verified victory. Deploying both opening jobs before collection is verified too. Thus each picture has two useful winning opening colors, not a single signaled first move.

### Why the opening jobs require helpers

Each entry below is the actual **solo delivered/target** count at quiescence on a fresh picture. Both choices make useful progress; neither alone can release its slot. Adding the other opening job supplies missing access and lets both finish.

| Picture | First useful choice | Second useful choice |
| --- | --- | --- |
| Heart | Rose 110/118 | Lilac 102/107 |
| Sun | Rose 3/4 | Lilac 7/9 |
| Butterfly | Blue 36/65 | Lilac 84/97 |
| Rocket | Rose 65/66 | Mint 58/60 |
| Home | Gold 61/74 | Mint 70/74 |

## Reproducible full-slot traps

From a fresh picture, deploy the three colors in the order shown **before starting**, then start and wait for quiescence. Every robot makes nonzero deliveries, remains below its target, and holds its slot. No fourth job can be deployed. Additional simulation cannot progress; Undo restores the complete pre-third-selection state and pauses in the UI.

| Picture | Deploy colors | Actual stalled delivered/target in color order |
| --- | --- | --- |
| Heart | Rose, Gold, Mint | 113/118, 13/15, 12/20 |
| Sun | Rose, Mint, Blue | 3/4, 4/11, 1/4 |
| Butterfly | Rose, Gold, Mint | 38/43, 47/51, 6/12 |
| Rocket | Gold, Mint, Lilac | 15/18, 59/60, 7/11 |
| Home | Rose, Blue, Lilac | 56/60, 37/43, 18/30 |

`nontrivial-test.cjs` enumerates triples until finding each recorded trap and checks exact fixture counts, slot locking, rejection of a fourth selection, additional stalled simulation, and Undo. `browser-test.cjs` explicitly clicks these actual authored combinations on all five pictures and verifies their delivered counts and blocked/Undo UI; it does not substitute synthetic traps.

## Verification and remaining tradeoffs

- `test.cjs`: all five complete schedules with actual deliveries and .05-second substeps; all inline scripts compile.
- `nontrivial-test.cjs`: both winning opening orders, simultaneous opening pair, real helper requirements, preserved geometry/totals, exact authored layouts and quotas, progressed full-slot traps.
- `puzzle-test.cjs`: slot limits, delivery-only release, concurrent quotas, exterior/cavity/reservation rules, Undo while targeting/carrying with older active robots.
- `neutral-ui-test.cjs` and `browser-test.cjs`: no proactive color advice, no exposure-dependent rendering, equal normal picture opacity, every available color enabled regardless of access, phone layout, stable focused buttons, pause, speed, Restart, Undo, actual five victories, persisted checkmarks.
- `save-test.cjs` and `save-browser-test.cjs`: original migration, stable IDs/reordering/insertion, preview isolation, unavailable storage, future-schema protection.
- `deployment-test.py`: unchanged assembly/provenance behavior. `preview-live-test.cjs` is updated for helper schedules but must run **after publication**. Production `live-test.cjs` is intentionally untouched.

The larger targets keep slots meaningfully occupied but also increase collection time and can leave a robot one pixel short of release. This is a deliberate dependency/pacing tradeoff, not a measured claim about player difficulty. Mosaic accents add visual noise while preserving the silhouettes and dominant color bands. The selected schedules prove solutions and traps, not that these are the only solutions or a calibrated difficulty progression. Real iPhone/Safari play and subjective puzzle difficulty still need player review.
