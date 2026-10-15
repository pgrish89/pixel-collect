const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(__dirname+'/pixel-collect.html','utf8').match(/<script id="model">([\s\S]*?)<\/script>/)[1],box);const M=box.PixelModel;
assert.match(fs.readFileSync(__dirname+'/pixel-collect.html','utf8'),/function workingRobot\(r\)/,'compact working art must fit the tested footprint');
const dot=(x,y,color=0)=>({x:142+x*18,y:47+y*18,color,state:0});
function fixture(dots){const s=M.create(0);s.dots=dots;s.jobs=M.colors.map(()=>[1]);return s;}
// Independent swept circle versus intact pixel: samples include the full segment,
// not only frame endpoints. The 8px working footprint must clear 6.5px pixels.
function advance(s,dt=.05){const old=s.robots.map(r=>({x:r.x,y:r.y})),solid=s.dots.filter(d=>d.state<2);M.step(s,dt);for(const [i,r] of s.robots.entries())for(const d of solid){const a=old[i],dx=r.x-a.x,dy=r.y-a.y,t=Math.max(0,Math.min(1,((d.x-a.x)*dx+(d.y-a.y)*dy)/(dx*dx+dy*dy||1)));assert(Math.hypot(a.x+t*dx-d.x,a.y+t*dy-d.y)>=14.5-1e-6,`robot ${i} swept its body through an intact pixel (${d.x},${d.y})`);}}
function until(s,p){for(let n=0;n<40000&&!p();n++)advance(s);assert(p(),'movement settled within bounded frames');}
{
 const dots=[];for(let y=0;y<12;y++)for(let x=0;x<12;x++)dots.push(dot(x,y,1));dots.find(d=>d.x===142+5*18&&d.y===47).color=0;
 const s=fixture(dots);assert(M.deploy(s,0));until(s,()=>s.delivered===1);assert.equal(s.robots[0].x,s.robots[0].homeX);assert.equal(s.robots[0].y,585);
 console.log('Outbound and home swept-body clearance around an intact wall passed.');
}
{
 // A sealed cavity remains closed while its gate is reserved; after pickup the
 // only entrance is a one-cell-wide corridor, which the compact body must fit.
 const dots=[];for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(!x||!y||x===6||y===6)dots.push(dot(x,y,2));
 const gate=dots.find(d=>d.x===196&&d.y===155);gate.color=0;const inner=dot(3,2,1);dots.push(inner);
 const s=fixture(dots);M.deploy(s,0);M.deploy(s,1);until(s,()=>s.robots[0].grab>0);
 assert.equal(gate.state,1);assert(!s.robots[1].target,'reserved gate does not open sealed cavity');
 const r=s.robots[0],position={x:r.x,y:r.y};advance(s,.05);assert.deepEqual({x:r.x,y:r.y},position,'grab holds beside pixel');assert.equal(Math.hypot(r.x-gate.x,r.y-gate.y),18);assert.equal(gate.state,1,'grab is not instantaneous pickup');
 until(s,()=>s.delivered===2);assert.equal(inner.state,2);
 console.log('Reserved gate, stationary beside-pixel grab, concurrent helper and narrow-cavity return passed.');
}
for(const phase of ['outbound','grab','return']){
 const s=fixture([dot(4,4,0),dot(6,4,1)]);M.deploy(s,0);
 until(s,()=>phase==='grab'?s.robots[0].grab>0:phase==='return'?!!s.robots[0].carrying:s.robots[0].route.length>3);
 const before=JSON.stringify({...s,history:[],exterior:undefined,exteriorVersion:undefined});M.deploy(s,1);
 // Snapshot points must not alias either mutable queue or waypoint objects.
 if(s.robots[0].route.length)s.robots[0].route[0].x+=1;
 if(s.robots[0].returnRoute.length)s.robots[0].returnRoute[0].x+=1;
 for(let n=0;n<8;n++)M.step(s,.05);assert(M.undo(s));
 assert.equal(JSON.stringify({...s,history:[],exterior:undefined,exteriorVersion:undefined}),before,'Undo deeply restores '+phase);
 until(s,()=>s.delivered===1);
}
console.log('Undo mid-outbound/grab/return deeply restores routes and resumes delivery.');
for(let i=0;i<5;i++){
 for(const concurrent of [false,true]){
 const s=M.create(i),plan=M.solution(i);if(concurrent){M.deploy(s,plan[0].color);M.deploy(s,plan[1].color);until(s,()=>M.settled(s));}
 for(const job of plan.slice(concurrent?2:0)){assert(M.deploy(s,job.color));until(s,()=>M.settled(s));}
 assert(s.done);assert(s.dots.every(d=>d.state===2));console.log('Swept footprint and full delivery: authored level '+(i+1)+(concurrent?' concurrent helpers':''));
 }
 const s=M.create(i),trap=require('./authored-levels.json')[M.levels[i].kind].trap;for(const c of trap.colors)M.deploy(s,c);until(s,()=>M.settled(s));assert.deepEqual(Array.from(s.robots.filter(r=>r.active),r=>r.delivered),trap.counts);
}
{
 const a=fixture([dot(4,4)]),b=fixture([dot(4,4)]);M.deploy(a,0);M.deploy(b,0);
 for(let i=0;i<200;i++){M.step(a,.2);for(let j=0;j<4;j++)M.step(b,.05);for(const key of ['x','y','grab'])assert(Math.abs(a.robots[0][key]-b.robots[0][key])<1e-8);assert.equal(a.delivered,b.delivered);}
 console.log('4× bounded substeps preserve route, grab and delivery timing.');
}
