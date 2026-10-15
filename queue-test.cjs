const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(__dirname+'/pixel-collect.html','utf8').match(/<script id="model">([\s\S]*?)<\/script>/)[1],box);const M=box.PixelModel;
const plain=x=>JSON.parse(JSON.stringify(x));
function until(s,p){for(let n=0;n<40000&&!p();n++)M.step(s,.05);assert(p(),'bounded simulation');}
for(let i=0;i<5;i++){
 const s=M.create(i),plan=M.solution(i),front=[[0,1,2,3],[0,1,5,3],[0,1,3,5],[0,1,2,4],[0,1,4,5]][i],queue=[...front,...Array.from(plan,(_,j)=>j).filter(j=>!front.includes(j))].map(j=>plan[j]);
 assert.equal(typeof M.availableJobs,'function','queue has model-level availability');
 assert.deepEqual(plain(M.availableJobs(s)),plain(queue.slice(0,4)),'four opening choices');
 const hidden=queue[4].color;
 assert(!M.deploy(s,hidden),'queued color cannot bypass the UI');assert.equal(s.history.length,0);
 assert(M.deploy(s,plan[0].color));
 assert.deepEqual(plain(M.availableJobs(s)),plain(queue.slice(1,4)),'selection does not replenish');
 until(s,()=>M.settled(s));assert(s.robots[plan[0].color].active,'partial quota stays active');
 assert.deepEqual(plain(M.availableJobs(s)),plain(queue.slice(1,4)),'partial deliveries do not replenish');
 assert(!M.deploy(s,hidden));
 const before=plain({...s,history:[],exterior:undefined,exteriorVersion:undefined});
 assert(M.deploy(s,plan[1].color));
 until(s,()=>!!s.robots[plan[1].color].carrying);
 assert(!M.availableJobs(s).some(j=>j.color===hidden),'pickup does not release queue');
 until(s,()=>M.settled(s));
 assert.deepEqual(plain(M.availableJobs(s)),plain(queue.slice(2,6)),'two completed quotas release exactly two jobs');
 assert(M.undo(s));assert.deepEqual(plain({...s,history:[],exterior:undefined,exteriorVersion:undefined}),before,'Undo restores queue availability and completion cursor');
 assert(M.deploy(s,plan[1].color));until(s,()=>M.settled(s));
 for(const j of plan.slice(2)){assert(M.deploy(s,j.color));until(s,()=>M.settled(s));}
 assert(s.done);assert.equal(s.delivered,s.dots.length);assert.deepEqual(plain(M.availableJobs(s)),[]);
 console.log(`Queue level ${i+1}: hidden rejection, no selection/pickup/partial refill, delivery refill, Undo and complete win passed.`);
}
