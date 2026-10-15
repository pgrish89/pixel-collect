// Offline authoring tool: preserve silhouettes; add colored mosaic accents and
// derive exact pair-closure targets. Run explicitly, never during gameplay.
const fs=require('fs'),vm=require('vm');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(__dirname+'/pixel-collect.html','utf8').match(/<script id="model">([\s\S]*?)<\/script>/)[1],box);const M=box.PixelModel;
function closure(dots,selected){const s={dots:dots.map(d=>({...d})),version:0};let changed=true;const counts=Array(6).fill(0);while(changed){changed=false;for(const d of M.exposed(s))if(d.state===0&&selected.includes(d.color)){d.state=2;s.version++;counts[d.color]++;changed=true;}}return {dots:s.dots,counts};}
function author(i,seed){let n=seed;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const original=M.pictureDots(i);const dots=original.map(d=>({...d,color:random()<.32?Math.floor(random()*6):d.color}));let remaining=dots,plan=[],groups=[];
 while(remaining.some(d=>!d.state)){
  let best=null;
  for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){
   const result=closure(remaining,[a,b]),total=result.counts[a]+result.counts[b];if(!total)continue;
   const helper=result.counts[a]>closure(remaining,[a]).counts[a]&&result.counts[b]>closure(remaining,[b]).counts[b];
   if(!plan.length&&!helper)continue;
   const score=total+(helper?10:0);if(!best||score>best.score)best={...result,score,colors:[a,b]};
  }
  if(!best)return null;
  const jobs=best.colors.filter(c=>best.counts[c]).map(color=>({color,quota:best.counts[color]}));groups.push(jobs);plan.push(...jobs);remaining=best.dots;
 }
 // Verify the actual movement model, not just geometric closure.
 const jobs=Array.from({length:6},(_,c)=>plan.filter(j=>j.color===c).map(j=>j.quota));
 const create=()=>{const s=M.create(i);s.dots=dots.map(d=>({...d}));s.jobs=jobs.map(j=>j.slice());return s;};
 const settle=s=>{let t=0;while(t++<40000){M.step(s,.05);if(s.done||(!s.robots.some(r=>r.active)||M.blocked(s)))return true;}return false;};
 for(const reverse of [false,true]){const s=create(),p=plan.slice();if(reverse)[p[0],p[1]]=[p[1],p[0]];for(const j of p){if(!M.deploy(s,j.color)||!settle(s))return null;}if(!s.done)return null;}
 let trap=null;
 for(let a=0;a<4&&!trap;a++)for(let b=a+1;b<5&&!trap;b++)for(let c=b+1;c<6&&!trap;c++){const s=create();if(![a,b,c].every(x=>M.deploy(s,x)))continue;settle(s);const active=s.robots.filter(r=>r.active);if(active.length===3&&active.every(r=>r.delivered>0))trap={colors:[a,b,c],counts:active.map(r=>r.delivered)};}
 if(!trap)return null;
 const rows=Array.from({length:24},()=>Array(24).fill('.'));for(const d of dots)rows[(d.y-47)/18][(d.x-142)/18]=String(d.color);
 return {rows:rows.map(r=>r.join('')),plan,trap,seed};
}
const output={};for(let i=0;i<5;i++){for(let seed=1701;seed<2000;seed++){const result=author(i,seed+i*10000);if(result){output[M.levels[i].kind]=result;console.log(M.levels[i].id,result.seed,'jobs',result.plan.length,'trap',result.trap);break;}}if(!output[M.levels[i].kind])throw Error('No suitable layout');}
fs.writeFileSync(__dirname+'/authored-levels.json',JSON.stringify(output,null,2)+'\n');
