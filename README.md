# Pixel Collect

Five-level robot pixel-collection prototype. No ads, analytics, accounts, or remote gameplay services.

## Live and preview

- Approved game: https://pgrish89.github.io/pixel-collect/
- Development preview: https://pgrish89.github.io/pixel-collect/preview/
- Provenance: append `build-info.json` to either URL to see the branch and exact commit being served.

The live game always builds from `main`. The preview builds from the branch selected by the repository Actions variable `PREVIEW_BRANCH` (initially `develop`). Both are deployed together by `.github/workflows/pages.yml`. A preview banner identifies test builds. These remain public URLs.

### Normal change workflow

1. Create a feature branch from current `main`, for example `feat/robot-upgrades`.
2. Edit `pixel-collect.html`, run `python3 prepare-site.py`, and run the tests. Commit and push the feature branch.
3. Select that branch for the stable preview URL: `python3 scripts/select-preview.py feat/robot-upgrades`. This checks the branch exists, changes and reads back `PREVIEW_BRANCH`, then requests a deployment. Alternatively set `PREVIEW_BRANCH` in repository Settings → Secrets and variables → Actions → Variables and run the Pages workflow from `main`.
4. Wait for a successful Pages Actions run and inspect preview `build-info.json`. Further pushes to the selected branch republish it automatically. Pushing another branch does not publish it.
5. After review, merge the feature branch into `main`. That updates the existing live URL. There is no need to switch the live site's source branch.
6. Tags mark code milestones. Reverting code does not roll back browser save data. Prefer a forward-compatible fix over reverting to code that cannot read newer saves.

Do not change Settings → Pages back to branch publishing; the Actions workflow assembles both sites. Workflow dispatches should run from `main`. A failed preview build fails the combined deployment and leaves the last successful live site online. Preview branches must contain the save-isolation baseline; old pre-isolation branches are not safe previews.

## iPhone setup

Open the live URL in Safari, choose Share → Add to Home Screen, and enable Open as Web App if offered. Open the Home Screen app online once before testing offline. The preview has its own manifest and Home Screen identity if installed separately. Closing and reopening after an update lets a waiting service worker activate.

## Puzzle mechanics

Each mission starts paused with three empty active slots. Choose a color to deploy its next fixed-quota job, then press **Start collecting**. Each color button shows its next target and remaining jobs; active or exhausted colors cannot be selected. Up to three jobs may run together. A slot unlocks only when its full target has been **delivered home**, not on pickup; robots cannot be freely parked or swapped.

Robots collect only matching pixels adjacent through four-way empty space to the outside of the picture. They travel around intact pixels on both the outbound and home trips, stopping in a neighboring empty cell for a short claw-grab animation. Their compact working form fits the 18px cleared corridors; the larger portrait stays at the dock. Cleared areas are usable only through an outside-connected open route. Sealed holes do not count as outside, and reserving a pixel does not open a passage—picking it up does. Every remaining pixel is drawn at normal opacity: there are no exposure highlights, dimmed inner pixels, suggested colors, or accessibility-based button restrictions. A blocked message appears only after collection has run; it offers **Undo** or **Restart**, without naming a color. There is no automatic deployment or timeout.

All five original silhouettes now use six-color mosaics and fixed authored targets, rather than solo-solvable 24-pixel peeling batches. Each opening helper pair has two independently useful choices: either robot delivers some pixels but cannot meet its target without the other. Both opening orders win, as does deploying the pair together. Every picture also has a tested three-slot combination in which **all three robots deliver pixels and then stall below quota**. Quotas range from 1 to 118; each color's job targets sum exactly to its true pixel count. See [PUZZLE-DESIGN.md](PUZZLE-DESIGN.md) for reproducible schedules, traps, authoring details, and pacing tradeoffs. Stable IDs, silhouettes, pixel totals, and save keys are unchanged.

**Undo** restores the entire state immediately before the last successful selection, including earlier robots, reservations, carried pixels, deliveries, and job counts, then pauses with **Resume**. **Restart** resets the current puzzle to empty slots without clearing completed-level checkmarks. Speed cycles through 1×, 2×, and 4×. All five missions have verified winning selection sequences. This puzzle feature batch is a candidate for a minor 0.x release; save schema and keys remain unchanged.

## Saves and compatibility

Completed-level checkmarks and the selected level are stored locally. Mid-level pixel collection is not saved yet. Each level has a permanent ID; changing its title or display position must not change its ID. Adding a level must not renumber existing IDs. Save schema changes need explicit migrations, not an automatic reset.

The hosted live game migrates the original `pixel-collect-v1` index-based save to stable level IDs without deleting the original. Production and preview use separate localStorage keys even though they share a website origin. Preview never imports production progress automatically. Service-worker caches are also scoped independently. Preview saves persist across preview branch switches, so test branches must maintain save compatibility too.

Progress is not synced across devices/browser contexts; downloaded HTML has a separate save from the website. Use the Home Screen app consistently after installing. Clearing website data or removing the app may erase saves. Avoid private browsing for persistent saves. Restart replays only the current puzzle; it does not erase saved checkmarks. Saved-progress reset/export/import controls are not implemented.

## Files and tests

- `pixel-collect.html`: self-contained downloadable preview and gameplay source.
- `docs/`: generated hosted HTML, manifest, PNG icons, and maintained network-first offline service worker.
- `prepare-site.py`: regenerate hosted HTML/icons (requires Pillow); does not change the save key on every release.
- `test.cjs`: simulate completion of all five levels and validate script syntax.
- `movement-test.cjs`: swept 8px working-body clearance, outbound/home routes, reserved gates and narrow cavities, concurrent helpers, stationary grab, deep Undo mid-route/grab/return, and all five complete deliveries.
- `puzzle-test.cjs`: slot limits, exact concurrent quotas, outside/cavity exposure, blocked states, and full-snapshot Undo regressions.
- `nontrivial-test.cjs`: preserved silhouettes, authored layout fixtures, both helper opening orders and concurrent starts, exact quotas, complete deliveries, and progressed three-slot traps for every picture.
- `neutral-ui-test.cjs`: neutral copy and rendering independent of exposure.
- `authored-levels.json`, `design-levels.cjs`: offline authoring fixtures and deterministic reproduction tool; not loaded by the game.
- `movement-browser-test.cjs`: local rendered outside grab, paused animation, Undo during grab, and complete home delivery; writes its review screenshot to `/tmp/pixel-collect-outside-grab.png`.
- `browser-puzzle-helpers.cjs`: test-only bounded clock and explicit-click schedule interpreter; waits for model quiescence, not individual slot disappearance.
- `save-test.cjs`: save migration, stable-ID and isolation regression tests.
- `deployment-test.py`: site assembly and provenance tests.
- `browser-test.cjs`, `live-test.cjs`: browser gameplay and production/offline regression checks.
- `save-browser-test.cjs`: local-only browser tests for legacy migration, level reorder/insertion, bad saves, and unavailable storage.
- `preview-live-test.cjs`: hosted legacy migration, preview save/cache isolation, provenance, and offline checks for both URLs.
- `scripts/assemble-pages.py`: combine the approved and selected branch's `docs/` into a single Pages artifact.
- `scripts/select-preview.py`: choose the development branch without changing production.

Run `node test.cjs`, `node puzzle-test.cjs`, `node nontrivial-test.cjs`, `node neutral-ui-test.cjs`, `node save-test.cjs`, and `python3 deployment-test.py`. For browser checks, install Playwright locally (`npm install --no-save playwright` and `npx playwright install chromium`); its system dependencies must also be available. Serve this directory with `python3 -m http.server 8769 --bind 127.0.0.1`, then run `node browser-test.cjs`, `node movement-browser-test.cjs`, and `node save-browser-test.cjs`. On this WSL install, prefix browser commands with `LD_LIBRARY_PATH=/home/pgrish/pixel-collect/browser-libs/extracted/usr/lib/x86_64-linux-gnu`. `preview-live-test.cjs` must run after publishing; `live-test.cjs` intentionally remains the legacy production smoke test, targeting the still-approved main game.

Keep local browser dependencies, downloaded packages, screenshots, credentials, and personal information out of Git. Actual iPhone installation/storage behavior requires a real device check; Chromium phone emulation is not iOS verification.
