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

## Saves and compatibility

Completed-level checkmarks and the selected level are stored locally. Mid-level pixel collection is not saved yet. Each level has a permanent ID; changing its title or display position must not change its ID. Adding a level must not renumber existing IDs. Save schema changes need explicit migrations, not an automatic reset.

The hosted live game migrates the original `pixel-collect-v1` index-based save to stable level IDs without deleting the original. Production and preview use separate localStorage keys even though they share a website origin. Preview never imports production progress automatically. Service-worker caches are also scoped independently. Preview saves persist across preview branch switches, so test branches must maintain save compatibility too.

Progress is not synced across devices/browser contexts; downloaded HTML has a separate save from the website. Use the Home Screen app consistently after installing. Clearing website data or removing the app may erase saves. Avoid private browsing for persistent saves. There are no reset buttons yet; replay/reset/export controls are future features, not implemented here.

## Files and tests

- `pixel-collect.html`: self-contained downloadable preview and gameplay source.
- `docs/`: generated hosted HTML, manifest, PNG icons, and maintained network-first offline service worker.
- `prepare-site.py`: regenerate hosted HTML/icons (requires Pillow); does not change the save key on every release.
- `test.cjs`: simulate completion of all five levels and validate script syntax.
- `save-test.cjs`: save migration, stable-ID and isolation regression tests.
- `deployment-test.py`: site assembly and provenance tests.
- `browser-test.cjs`, `live-test.cjs`: browser gameplay and production/offline regression checks.
- `save-browser-test.cjs`: local-only browser tests for legacy migration, level reorder/insertion, bad saves, and unavailable storage.
- `preview-live-test.cjs`: hosted legacy migration, preview save/cache isolation, provenance, and offline checks for both URLs.
- `scripts/assemble-pages.py`: combine the approved and selected branch's `docs/` into a single Pages artifact.
- `scripts/select-preview.py`: choose the development branch without changing production.

Run `node test.cjs`, `node save-test.cjs`, and `python3 deployment-test.py`. For browser checks, install Playwright locally (`npm install --no-save playwright` and `npx playwright install chromium`); its system dependencies must also be available. `browser-test.cjs` uses a local HTTP server on port 8769. `live-test.cjs` targets the actual published production URL.

Keep local browser dependencies, downloaded packages, screenshots, credentials, and personal information out of Git. Actual iPhone installation/storage behavior requires a real device check; Chromium phone emulation is not iOS verification.
