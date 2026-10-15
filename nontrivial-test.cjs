const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(__dirname+'/pixel-collect.html','utf8').match(/<script id="model">([\s\S]*?)<\/script>/)[1],box);const M=box.PixelModel;
function settle(s){let n=0;while(!M.settled(s)&&n++<40000)M.step(s,.05);assert(M.settled(s),'bounded quiescence');for(const r of s.robots){if(r.active){assert(r.delivered<r.quota);assert.notEqual(r.slot,null);}else assert.equal(r.slot,null);}return n;}
assert.equal(typeof M.settled,'function','model exposes quiescence for helper-dependent plans');
const totals=[362,196,300,192,319],authored=require('./authored-levels.json');
for(let i=0;i<5;i++){
 const base=M.create(i),plan=M.solution(i),fixture=authored[M.levels[i].kind];
 assert.equal(base.dots.length,totals[i],'original pixel total preserved');
 assert.deepEqual(Array.from(base.dots,d=>[d.x,d.y]),Array.from(M.pictureDots(i),d=>[d.x,d.y]),'original silhouette preserved');
 assert.deepEqual(JSON.parse(JSON.stringify(plan)),fixture.plan,'fixed authored plan reproduced');
 for(const d of base.dots)assert.equal(String(d.color),fixture.rows[(d.y-47)/18][(d.x-142)/18],'fixed authored mosaic reproduced');
 const concurrent=M.create(i);for(const job of plan.slice(0,2))assert(M.deploy(concurrent,job.color));settle(concurrent);assert(!concurrent.robots.some(r=>r.active),'helper pair also clears when deployed together');
 for(const job of plan.slice(2)){assert(M.deploy(concurrent,job.color));settle(concurrent);}assert(concurrent.done);
 assert(new Set(base.dots.map(d=>d.color)).size>3,'more colors than slots on every picture');
 for(let c=0;c<6;c++)assert.equal(base.jobs[c].reduce((a,b)=>a+b,0),base.dots.filter(d=>d.color===c).length,'exact per-color targets');
 // The first two jobs are a genuine helper pair: neither can finish alone.
 const openings=[];
 for(const job of plan.slice(0,2)){const s=M.create(i);assert(M.deploy(s,job.color));settle(s);assert(s.robots[job.color].active,'opening requires another color');assert(s.delivered>0,'opening makes useful progress');openings.push({color:job.color,delivered:s.delivered,quota:job.quota});}
 for(const reverse of [false,true]){
  const s=M.create(i),actions=Array.from(plan,j=>({...j}));if(reverse)[actions[0],actions[1]]=[actions[1],actions[0]];
  for(const job of actions){assert(M.deploy(s,job.color),`legal helper schedule level ${i+1}`);assert.equal(s.robots[job.color].quota,job.quota);settle(s);}
  assert(s.done);assert.equal(s.delivered,s.dots.length);assert(s.dots.every(d=>d.state===2));assert(!s.robots.some(r=>r.active));
 }
 let trap=null;
 for(let a=0;a<4&&!trap;a++)for(let b=a+1;b<5&&!trap;b++)for(let c=b+1;c<6&&!trap;c++){
  const s=M.create(i);if(![a,b,c].every(color=>M.deploy(s,color)))continue;settle(s);
  if(s.robots.filter(r=>r.active).length===3&&s.robots.filter(r=>r.active).every(r=>r.delivered>0)){trap={colors:[a,b,c],delivered:s.robots.filter(r=>r.active).map(r=>r.delivered),quotas:s.robots.filter(r=>r.active).map(r=>r.quota)};assert(M.blocked(s));const before=s.delivered;for(let n=0;n<500;n++)M.step(s,.05);assert.equal(s.delivered,before,'stalled indefinitely, not just travelling home');assert(!M.deploy(s,[0,1,2,3,4,5].find(x=>![a,b,c].includes(x))));assert(M.undo(s));assert.equal(s.robots.filter(r=>r.active).length,2);}
 }
 assert(trap,`level ${i+1} has a progressed full-slot trap`);assert.deepEqual(trap.colors,fixture.trap.colors);assert.deepEqual(Array.from(trap.delivered),fixture.trap.counts);
 console.log(JSON.stringify({level:M.levels[i].id,win:plan,openings,alternateOpening:plan.slice(0,2).map(j=>j.color).reverse(),trap}));
}
console.log('Nontrivial acceptance: five helper-dependent wins, two winning openings each, exact targets and progressed three-slot traps.',totals);
