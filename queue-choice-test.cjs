// Four waiting choices compete for three slots: selecting every visible robot
// is not a solution. Keep a reachable, progressed bad choice on every mission.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(__dirname+'/pixel-collect.html','utf8').match(/<script id="model">([\s\S]*?)<\/script>/)[1],box);const M=box.PixelModel;
for(let i=0;i<5;i++){
 const colors=Array.from(M.availableJobs(M.create(i)),j=>j.color);
 assert.equal(colors.length,4,'four waiting choices compete for three active slots');
 let trap;
 for(let a=0;a<2;a++)for(let b=a+1;b<3;b++)for(let c=b+1;c<4;c++){
  const s=M.create(i),chosen=[colors[a],colors[b],colors[c]];assert(chosen.every(c=>M.deploy(s,c)));
  for(let n=0;n<40000&&!M.settled(s);n++)M.step(s,.05);
  const active=s.robots.filter(r=>r.active);
  if(active.length===3&&active.every(r=>r.delivered>0)){trap=chosen;assert(M.blocked(s));assert(M.undo(s));assert.equal(s.robots.filter(r=>r.active).length,2);}
 }
 assert(trap,'every level retains a legal progressed three-slot trap with the queue enabled');
 console.log(`Queued level ${i+1}: meaningful four-way choice, legal progressed trap ${trap}, Undo recovery passed.`);
}
