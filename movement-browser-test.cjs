const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1000,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8769/pixel-collect.html');
 await page.evaluate(()=>{const create=PixelModel.create,step=PixelModel.step;window.rawMovementStep=step;PixelModel.create=i=>(window.movementState=create(i));PixelModel.step=(s,dt)=>{for(let n=0;n<100&&!s.robots.some(r=>r.grab);n++)step(s,.025);};});
 await page.click('#restart');await page.click('#fleet [data-color="0"]');await page.click('#play');
 await page.waitForFunction(()=>movementState.robots[0].grab>0);
 await page.click('#play');
 const grab=await page.evaluate(()=>{const r=movementState.robots[0];return {x:r.x,y:r.y,grab:r.grab,distance:Math.hypot(r.x-r.target.x,r.y-r.target.y),state:r.target.state};});
 assert.equal(grab.distance,18);assert.equal(grab.state,1);
 await page.waitForTimeout(120);assert.deepEqual(await page.evaluate(()=>{const r=movementState.robots[0];return {x:r.x,y:r.y,grab:r.grab,distance:Math.hypot(r.x-r.target.x,r.y-r.target.y),state:r.target.state};}),grab,'paused grab is frozen');
 // A second selection captures the first robot during its animation.
 const before=await page.evaluate(()=>JSON.stringify({...movementState,history:[],exterior:undefined,exteriorVersion:undefined}));
 await page.click('#fleet [data-color="4"]');await page.evaluate(()=>rawMovementStep(movementState,.2));await page.click('#undo');
 assert.equal(await page.locator('#play').textContent(),'Resume');
 assert.equal(await page.evaluate(()=>JSON.stringify({...movementState,history:[],exterior:undefined,exteriorVersion:undefined})),before);
 await page.evaluate(()=>{rawMovementStep(movementState,.075);});await page.waitForTimeout(40);
 await page.screenshot({path:'/tmp/pixel-collect-outside-grab.png',fullPage:true});
 await page.evaluate(()=>{const r=movementState.robots[0];for(let n=0;n<1000&&r.delivered===0;n++)rawMovementStep(movementState,.025);if(r.delivered!==1||r.x!==r.homeX||r.y!==r.homeY)throw Error('did not deliver home');});
 assert.deepEqual(errors,[]);console.log('Browser outside grab, pause, Undo during grab, rendered working form and complete home delivery passed. Screenshot: /tmp/pixel-collect-outside-grab.png');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
