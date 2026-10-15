# Pixel Collect

Five-level robot pixel-collection prototype. No ads, analytics, accounts, or remote gameplay services.

## Play

Hosted at https://pgrish89.github.io/pixel-collect/ . On iPhone, open in Safari, choose Share → Add to Home Screen, and enable Open as Web App if offered. Open the Home Screen app online once before testing offline.

## Saves

Completed-level checkmarks and the selected level are stored locally under `pixel-collect-v1`. Mid-level pixel collection is not saved in this first prototype. Progress is not synced between devices or browser contexts; the downloaded HTML preview has a separate save from the website. Use the Home Screen app consistently after installing. Clearing website data or removing the app may erase saves. Avoid private browsing for persistent saves.

## Structure

- `pixel-collect.html`: self-contained downloadable preview, source of gameplay.
- `docs/`: GitHub Pages site, manifest, icons, and network-first offline service worker.
- `prepare-site.py`: regenerate hosted HTML and icons from the standalone preview (requires Pillow).
- `test.cjs`: run `node test.cjs` to simulate completion of all five levels and validate script syntax.
- `browser-test.cjs`: Playwright checks for the original preview, using a local server on port 8769.
- `live-test.cjs`: Playwright checks against the actual HTTPS Pages site, verifying touch interaction, completion saves, selected-level restoration, manifest/icons, and service-worker offline play. Install Playwright locally (`npm install --no-save playwright` and `npx playwright install chromium`) and run `node live-test.cjs`; browser system dependencies must also be available.

GitHub Pages publishes only `docs/` on `main`. To update, edit the standalone HTML, run `python3 prepare-site.py`, test, and push reviewed changes. Keep the storage key stable to retain completion saves. Bump the service-worker cache version when changing the offline shell file list.

The public game and repository must contain no secrets or personal information. Browser-downloaded game assets are public. Adding to Home Screen and storage behavior require a real iPhone check; desktop browser emulation does not prove iOS behavior.
