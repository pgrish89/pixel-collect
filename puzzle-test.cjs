const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(__dirname+'/pixel-collect.html','utf8').match(/<script id="model">([\s\S]*?)<\/script>/)[1],box);const M=box.PixelModel;
const dot=(x,y,color=0)=>({x:142+x*18,y:47+y*18,color,state:0});
function fixture(dots){const s=M.create(0);s.queueEnabled=false;s.dots=dots;s.jobs=M.colors.map(()=>[1]);return s;}
function until(s,predicate){for(let i=0;i<10000&&!predicate();i++)M.step(s,.05);assert(predicate(),'bounded simulation reached expected state');}
{
 const s=fixture(M.colors.map((_,i)=>dot(i*2,0,i)));
 assert.equal(s.robots.filter(r=>r.active).length,0);
 for(const c of [0,1,2])assert(M.deploy(s,c));
 assert.equal(M.deploy(s,3),false,'fourth selection rejected even when a job exists');
 assert.equal(M.deploy(s,0),false,'active color cannot be redeployed');
 assert.deepEqual(Array.from(s.robots.filter(r=>r.active),r=>r.slot),[0,1,2]);
 assert.equal(s.history.length,3,'rejected selections do not create undo entries');
 until(s,()=>!!s.robots[0].carrying);
 assert.equal(s.robots[0].delivered,0);assert(s.robots[0].active,'pickup does not unlock slot');
 until(s,()=>!s.robots.some(r=>r.active));
 assert.equal(s.delivered,3);assert.equal(s.dots.filter(d=>d.state===2).length,3);
 for(const r of s.robots.slice(0,3)){assert.equal(r.delivered,r.quota);assert.equal(r.slot,null);}
 assert.equal(M.deploy(s,0),false,'exhausted color stays unavailable');
 assert(M.deploy(s,3),'delivered slot can be reused');
 console.log('Three-slot limit, rejected selections, delivery-only unlock, concurrent exact quotas passed.');
}
{
 // Sealed 5x5 ring with an inner pixel: adjacency to a cavity is not exterior.
 const dots=[];for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(!x||!y||x===4||y===4)dots.push(dot(x,y,0));
 const inside=dot(2,2,1),gate=dots.find(d=>d.x===178&&d.y===47);dots.push(inside);
 const s=fixture(dots);assert(!M.exposed(s).has(inside));
 gate.state=1;s.version++;assert(!M.exposed(s).has(inside),'reserved pixel still seals cavity');
 assert(M.deploy(s,1));assert(M.blocked(s),'inner-only active color is blocked');
 gate.state=3;s.version++;assert(M.exposed(s).has(inside),'pickup opens outside-connected cavity');
 assert(!M.blocked(s));
 console.log('Cavity flood fill, reserved occupancy, pickup exposure and blocked detection passed.');
}
for(const phase of ['target','carrying']){
 const s=fixture([dot(0,0,0),dot(2,0,1)]);assert(M.deploy(s,0));until(s,()=>!!s.robots[0][phase]);
 const before=JSON.stringify({...s,history:[],exterior:undefined,exteriorVersion:undefined});
 assert(M.deploy(s,1));M.step(s,.05);assert(M.undo(s));
 assert.equal(JSON.stringify({...s,history:[],exterior:undefined,exteriorVersion:undefined}),before,'undo restores full deployment snapshot');
 const r=s.robots[0],d=r[phase];assert(s.dots.includes(d),'references point into restored dots');assert(r.active);
 assert.equal(d.state,phase==='target'?1:3);assert.equal(s.robots[1].active,false);
 until(s,()=>s.delivered===1);assert.equal(d.state,2,'restored robot resumes and delivers restored dot');
 assert(M.undo(s));assert.equal(s.delivered,0);assert.equal(s.robots.filter(r=>r.active).length,0);assert.equal(M.undo(s),false);
 console.log(`Undo mid-${phase}: complete snapshot, reference identity, prior running robot and history passed.`);
}
