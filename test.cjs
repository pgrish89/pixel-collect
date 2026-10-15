const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/pixel-collect.html','utf8');
const source=html.match(/<script id="model">([\s\S]*?)<\/script>/)[1];
const box={};vm.createContext(box);vm.runInContext(source,box);const M=box.PixelModel;
assert.equal(M.levels.length,5);
for(let i=0;i<5;i++){const dots=M.makeDots(i);assert(dots.length>50);assert(dots.every(d=>d.color>=0&&d.color<6));assert(new Set(dots.map(d=>d.x+','+d.y)).size===dots.length);const s=M.create(i);let frames=0;while(!s.done&&frames<30000){M.step(s,.05);frames++;}assert(s.done,`level ${i+1} stuck`);assert.equal(s.delivered,dots.length);assert(s.dots.every(d=>d.state===2));console.log(`Level ${i+1}: ${dots.length} dots collected and delivered in ${frames} simulation frames`);}
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
console.log('All five levels complete; inline scripts parse.');
