'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function setup(hero){
 const draws=[],layout={board:{x:20,y:170,w:400,h:480},cell:40},board={width:8,height:10,isBuildable:(x,y)=>x===1&&y===0||x===5&&y===5,isHeroSlot:(x,y)=>x===4&&y===3};
 const M3={_now:()=>100,UILayout:{get:()=>layout},Renderer:{triangles:v=>draws.push(v)}};
 const s={window:{M3}};for(const f of ['combat-projection.js','deployment-hints.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'js/render',f),'utf8'),s);
 const c={board,towers:[{x:5,y:5}],heroes:[],mode:hero?'hero':'tower',selectedHero:'hero-3',heroUnits:{'hero-3':'hero-3'},selectedCard:'tower-1',cardUnits:{'tower-1':'tower-1'}};
 M3.DeploymentHints.draw({state:'BATTLE',combat:c});return {M3,layout,board,draws};
}
for(const hero of [false,true])test((hero?'hero':'tower')+' hint fits projected cell and hit-test selects that cell',()=>{
 const {M3,layout,board,draws}=setup(hero),g=M3.CombatProjection.geometry(layout,board),x=hero?4:1,y=hero?3:0;
 assert.equal(draws.length,1);const v=draws[0];assert.equal(v.length,48); // occupied tower excluded
 const xs=v.filter((_,i)=>i%2===0),ys=v.filter((_,i)=>i%2===1);
 assert.ok(Math.min(...xs)>g.x+x*g.cx);assert.ok(Math.max(...xs)<g.x+(x+1)*g.cx);
 assert.ok(Math.min(...ys)>g.y+y*g.cy);assert.ok(Math.max(...ys)<g.y+(y+1)*g.cy);
 const picked=M3.CombatProjection.pick(g,(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2);
 assert.equal(picked.x,x);assert.equal(picked.y,y);
});
