const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('fs');
// Serve the real standalone source at both paths without touching any deployed site.
const html = fs.readFileSync(__dirname + '/pixel-collect.html', 'utf8');
const {installPuzzleClock,selectJobs}=require('./browser-puzzle-helpers.cjs');
(async () => {
  let servedHTML = html;
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}});
    await context.route('http://pixel.test/**', route => route.fulfill({contentType: 'text/html', body: servedHTML}));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://pixel.test/seed');
    const legacy = JSON.stringify({completed: [0, 3], level: 2});
    await page.evaluate(value => {localStorage.clear(); localStorage.setItem('pixel-collect-v1', value);}, legacy);
    await page.goto('http://pixel.test/pixel-collect/');
    assert.equal(await page.locator('#title').textContent(), '3. Garden visitor');
    assert.equal(await page.locator('.finished').count(), 2);
    assert.equal(await page.locator('[data-level="3"]').getAttribute('class'), 'finished');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('pixel-collect-v2'))),
      {version: 2, completed: ['first-heart', 'tiny-rocket'], level: 'garden-butterfly'});
    // Every authored level must actually deliver its pixels and persist its stable ID.
    await installPuzzleClock(page);
    for (let i = 0; i < 5; i++) {
      await page.click(`[data-level="${i}"]`);
      await page.click('#play');
      await selectJobs(page, i);
      await page.waitForFunction(() => document.querySelector('#win').open);
      assert((await page.locator('#count').textContent()).startsWith('100%'));
      await page.click('#stay');
    }
    await page.reload();
    assert.equal(await page.locator('.finished').count(), 5);
    assert.equal(await page.locator('#title').textContent(), '5. Home sweet home');
    const production = await page.evaluate(() => localStorage.getItem('pixel-collect-v2'));
    await page.goto('http://pixel.test/pixel-collect/preview/');
    assert.equal(await page.locator('.finished').count(), 0);
    assert.equal(await page.locator('#title').textContent(), '1. A little love');
    await page.click('[data-level="1"]');
    await installPuzzleClock(page);
    await page.click('#play');
    await selectJobs(page, 1);
    await page.waitForFunction(() => document.querySelector('#win').open);
    await page.click('#stay');
    await page.reload();
    assert.equal(await page.locator('.finished').count(), 1);
    assert.equal(await page.locator('#title').textContent(), '2. Sunny side up');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('pixel-collect-preview-v2'))),
      {version: 2, completed: ['workshop-sun'], level: 'workshop-sun'});
    assert.equal(await page.evaluate(() => localStorage.getItem('pixel-collect-v2')), production);
    assert.equal(await page.evaluate(() => localStorage.getItem('pixel-collect-v1')), legacy);
    await page.goto('http://pixel.test/pixel-collect/');
    assert.equal(await page.locator('.finished').count(), 5);
    assert.equal(await page.locator('#title').textContent(), '5. Home sweet home');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    // Simulate shipping a reordered catalog with an inserted mission, not a new save.
    servedHTML = html.replace('return {colors,levels,makeDots,pictureDots,create,step,deploy,undo,exposed,blocked,settled,solution};',
      "levels.reverse();levels.unshift({id:'new-mission',name:'New mission',note:'Added later',kind:'heart'});return {colors,levels,makeDots,pictureDots,create,step,deploy,undo,exposed,blocked,settled,solution};");
    await page.reload();
    assert.equal(await page.locator('[data-level]').count(), 6);
    assert.equal(await page.locator('.finished').count(), 5);
    assert.equal(await page.locator('#title').textContent(), '2. Home sweet home');
    assert(!(await page.locator('[data-level="0"]').getAttribute('class')).includes('finished'));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pixel-collect-v2')).level), 'delivery-home');
    // A future schema and malformed JSON are left intact while gameplay stays usable.
    for (const raw of ['{broken', JSON.stringify({version: 99, completed: ['first-heart'], level: 'first-heart'})]) {
      await page.evaluate(value => localStorage.setItem('pixel-collect-v2', value), raw);
      await page.reload();
      await page.click('[data-level="2"]');
      assert.equal(await page.evaluate(() => localStorage.getItem('pixel-collect-v2')), raw);
      assert((await page.locator('#message').textContent()).includes('Saving is unavailable'));
    }
    // Accessing localStorage itself can throw (privacy policies/file contexts).
    const denied = await context.newPage();
    denied.on('pageerror', e => errors.push(e.message));
    await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', {get() {throw Error('blocked');}}));
    await denied.goto('http://pixel.test/pixel-collect/');
    assert.equal(await denied.locator('[data-level]').count(), 6);
    await denied.click('#play');
    assert.equal(await denied.locator('#play').textContent(), 'Pause');
    assert.deepEqual(errors, []);
    console.log('Browser migration, all five victories, reload, preview isolation, and production return passed; no JS errors.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
