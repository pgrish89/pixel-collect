const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8769/pixel-collect.html');
assert.equal(await page.locator('.slot.empty').count(),3);assert.equal(await page.locator('#play').textContent(),'Start collecting');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
// A synthetic sealed ring exercises the full-slot deadlock UI deterministically.
await page.evaluate(()=>{window.originalCreate=PixelModel.create;PixelModel.create=i=>{const s=originalCreate(i);s.dots=[];for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(!x||!y||x===6||y===6)s.dots.push({x:142+x*18,y:47+y*18,color:0,state:0});for(let c=1;c<=3;c++)s.dots.push({x:142+c*18,y:47+3*18,color:c,state:0});s.jobs=PixelModel.colors.map(()=>[1]);return s;};});
await page.click('#restart');for(const c of [1,2,3])await page.click(`#fleet [data-color="${c}"]`);
assert.equal(await page.locator('.slot.empty').count(),0);assert.equal(await page.locator('#fleet button:disabled').count(),6);assert.match(await page.locator('#message').textContent(),/Blocked:.*All three slots are full.*Undo/);
await page.click('#play');await page.waitForTimeout(100);assert.match(await page.locator('#message').textContent(),/Blocked/);await page.click('#undo');assert.equal(await page.locator('#play').textContent(),'Resume');assert.equal(await page.locator('.slot.empty').count(),1);
await page.evaluate(()=>PixelModel.create=originalCreate);await page.click('#restart');
// Button identity must survive frames, so focused/clicked controls remain stable.
await page.evaluate(()=>{window.colorButton=document.querySelector('#fleet [data-color="4"]');colorButton.focus();});await page.waitForTimeout(100);assert(await page.evaluate(()=>colorButton===document.querySelector('#fleet [data-color="4"]')&&document.activeElement===colorButton));
await page.click('#fleet [data-color="0"]');assert.equal(await page.locator('.slot.empty').count(),2);assert(await page.locator('#fleet [data-color="0"]').isDisabled());await page.click('#play');await page.waitForTimeout(500);await page.click('#play');let paused=await page.locator('#count').textContent();await page.waitForTimeout(250);assert.equal(await page.locator('#count').textContent(),paused);
await page.click('#play');await page.click('#undo');assert.equal(await page.locator('.slot.empty').count(),3);assert.equal(await page.locator('#play').textContent(),'Resume');assert((await page.locator('#count').textContent()).startsWith('0%'));await page.click('#fleet [data-color="0"]');await page.click('#restart');assert.equal(await page.locator('.slot.empty').count(),3);await page.click('#speed');assert.equal(await page.locator('#speed').textContent(),'Speed: 2×');
// Capture real paused selections before accelerating the model only (no auto-deploy hook).
await page.click('#fleet [data-color="0"]');await page.click('#fleet [data-color="4"]');await page.screenshot({path:__dirname+'/preview-puzzle.png',fullPage:true});await page.click('#restart');
await page.evaluate(()=>{const original=PixelModel.step;PixelModel.step=(s,dt)=>{for(let j=0;j<600&&!s.done;j++)original(s,.05);};});
for(let i=0;i<5;i++){
 await page.click(`[data-level="${i}"]`);const plan=await page.evaluate(i=>PixelModel.solution(i),i);await page.click('#play');
 for(const job of plan){const button=page.locator(`#fleet [data-color="${job.color}"]`);await button.click();await page.waitForFunction(c=>!document.querySelector(`#slots [data-color="${c}"]`),job.color);}
 await page.waitForFunction(()=>document.querySelector('#win').open);assert((await page.locator('#count').textContent()).startsWith('100%'));console.log('Browser level '+(i+1)+' explicit job selections, deliveries, dialog verified');await page.click('#stay');
}
assert.equal(await page.locator('.finished').count(),5);await page.reload();assert.equal(await page.locator('.finished').count(),5);assert((await page.locator('#title').textContent()).startsWith('5.'));await page.click('#restart');assert((await page.locator('#count').textContent()).startsWith('0%'));assert.equal(await page.locator('.slot.empty').count(),3);assert.deepEqual(errors,[]);console.log('Phone overflow, locked slots, pause, undo, speed, restart, five victories, reload/save: passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
