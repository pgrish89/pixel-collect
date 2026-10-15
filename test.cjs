const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/pixel-collect.html','utf8');
const source=html.match(/<script id="model">([\s\S]*?)<\/script>/)[1];
const box={};vm.createContext(box);vm.runInContext(source,box);const M=box.PixelModel;
assert.equal(M.levels.length,5);
for(let i=0;i<5;i++){
 const dots=M.makeDots(i),s=M.create(i),plan=M.solution(i);assert(dots.length>50);assert(dots.every(d=>d.color>=0&&d.color<6));assert.equal(new Set(dots.map(d=>d.x+','+d.y)).size,dots.length);
 for(let c=0;c<6;c++)assert.equal(s.jobs[c].reduce((a,b)=>a+b,0),dots.filter(d=>d.color===c).length);
 let frames=0;for(const job of plan){assert(M.deploy(s,job.color));assert.equal(s.robots[job.color].quota,job.quota);let n=0;while(s.robots[job.color].active&&n++<4000){M.step(s,.05);frames++;}assert(!s.robots[job.color].active,`level ${i+1}, job ${job.color} blocked`);}
 assert(s.done,`level ${i+1} stuck`);assert.equal(s.delivered,dots.length);assert(s.dots.every(d=>d.state===2));console.log(`Level ${i+1}: ${dots.length} delivered, ${plan.length} explicit jobs, ${frames} bounded frames`);
}
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);console.log('All five peeling plans win; exact quotas and scripts verified.');
