// Test-only simulation clock. Never deploys jobs; tests must click each button.
async function installPuzzleClock(page){
 await page.evaluate(()=>{
  const create=PixelModel.create,step=PixelModel.step;
  PixelModel.create=i=>(window.__puzzleState=create(i));
  PixelModel.step=(s,dt)=>{window.__puzzleState=s;for(let j=0;j<600&&!s.done;j++){step(s,.05);if(PixelModel.settled(s))break;}};
 });
}
async function waitForSettled(page){await page.waitForFunction(()=>window.__puzzleState&&PixelModel.settled(__puzzleState),null,{timeout:30000});}
async function selectJobs(page,i){
 const plan=await page.evaluate(i=>PixelModel.solution(i),i);
 for(const job of plan){await page.locator(`#fleet [data-color="${job.color}"]`).click();await waitForSettled(page);}
}
module.exports={installPuzzleClock,waitForSettled,selectJobs};
