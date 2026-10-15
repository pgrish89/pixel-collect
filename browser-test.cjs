const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {installPuzzleClock,waitForSettled,selectJobs}=require('./browser-puzzle-helpers.cjs');
const authored=require('./authored-levels.json');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.pictureAlphas=[];const arc=CanvasRenderingContext2D.prototype.arc;
  CanvasRenderingContext2D.prototype.arc=function(x,y,r,...rest){if(r===6.5)pictureAlphas.push(this.globalAlpha);return arc.call(this,x,y,r,...rest);};
 });
 await page.goto('http://127.0.0.1:8769/pixel-collect.html');
 assert.equal(await page.locator('.slot.empty').count(),3);assert.equal(await page.locator('#play').textContent(),'Start collecting');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert(!/bright|dim|exposed|try.*color/i.test(await page.locator('.instructions').textContent()));
 assert(await page.evaluate(()=>pictureAlphas.length>300&&pictureAlphas.every(a=>a===1)),'all remaining pixels have normal opacity');
 // Button identity and focus survive both idle and collecting frames.
 await page.evaluate(()=>{window.colorButton=document.querySelector('#fleet [data-color="4"]');colorButton.focus();});await page.waitForTimeout(100);
 assert(await page.evaluate(()=>colorButton===document.querySelector('#fleet [data-color="4"]')&&document.activeElement===colorButton));
 await page.click('#fleet [data-color="0"]');assert.equal(await page.locator('.slot.empty').count(),2);assert(await page.locator('#fleet [data-color="0"]').isDisabled());
 await page.click('#play');await page.waitForTimeout(500);await page.click('#play');const paused=await page.locator('#count').textContent();await page.waitForTimeout(250);assert.equal(await page.locator('#count').textContent(),paused);
 assert(await page.evaluate(()=>colorButton===document.querySelector('#fleet [data-color="4"]')));
 await page.click('#undo');assert.equal(await page.locator('.slot.empty').count(),3);assert.equal(await page.locator('#play').textContent(),'Resume');assert((await page.locator('#count').textContent()).startsWith('0%'));
 await page.click('#fleet [data-color="0"]');await page.click('#restart');assert.equal(await page.locator('.slot.empty').count(),3);
 await page.click('#speed');assert.equal(await page.locator('#speed').textContent(),'Speed: 2×');
 await page.click('#fleet [data-color="0"]');await page.click('#fleet [data-color="4"]');await page.screenshot({path:__dirname+'/preview-puzzle.png',fullPage:true});
 await installPuzzleClock(page);
 // Real authored pictures, not a synthetic deadlock: all three jobs progress then lock.
 for(let i=0;i<5;i++){
  await page.click(`[data-level="${i}"]`);
  const kind=await page.evaluate(i=>PixelModel.levels[i].kind,i),trap=authored[kind].trap;
  assert.equal(await page.locator('#fleet button:enabled').count(),6,'accessibility never disables an available job');
  for(const c of trap.colors)await page.click(`#fleet [data-color="${c}"]`);
  assert(!/Blocked/.test(await page.locator('#message').textContent()),'no pre-start accessibility hint');
  await page.click('#play');await waitForSettled(page);
  assert.equal(await page.locator('.slot.active').count(),3);assert.equal(await page.locator('#fleet button:disabled').count(),6);
  assert.match(await page.locator('#message').textContent(),/Blocked:.*All three slots are full.*Undo/);
  const progress=await page.evaluate(()=>__puzzleState.robots.filter(r=>r.active).map(r=>r.delivered));assert.deepEqual(progress,trap.counts);assert(progress.every(n=>n>0));
  assert(!/exposed|bright|dim|Rose|Gold|Mint|Blue|Lilac|Peach/.test(await page.locator('#message').textContent()));
  await page.click('#undo');assert.equal(await page.locator('#play').textContent(),'Resume');assert.equal(await page.locator('.slot.empty').count(),1);
  await page.click('#restart');assert.equal(await page.locator('.slot.empty').count(),3);
 }
 for(let i=0;i<5;i++){
  await page.click(`[data-level="${i}"]`);await page.click('#play');await selectJobs(page,i);
  await page.waitForFunction(()=>document.querySelector('#win').open);
  assert((await page.locator('#count').textContent()).startsWith('100%'));
  assert(await page.evaluate(()=>__puzzleState.done&&__puzzleState.dots.every(d=>d.state===2)&&!__puzzleState.robots.some(r=>r.active)));
  console.log('Browser level '+(i+1)+': actual helper-job victory and progressed trap verified');await page.click('#stay');
 }
 assert.equal(await page.locator('.finished').count(),5);await page.reload();assert.equal(await page.locator('.finished').count(),5);assert((await page.locator('#title').textContent()).startsWith('5.'));
 await page.click('#restart');assert((await page.locator('#count').textContent()).startsWith('0%'));assert.equal(await page.locator('.slot.empty').count(),3);
 assert(await page.evaluate(()=>pictureAlphas.length>300&&pictureAlphas.every(a=>a===1)));
 assert.deepEqual(errors,[]);console.log('Phone overflow, equal opacity, no hints, stable buttons, locked slots, pause, undo, speed, restart, five victories and reload/save: passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
