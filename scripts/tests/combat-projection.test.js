const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){const M3={},ctx={window:{M3}};vm.runInNewContext(fs.readFileSync('js/render/combat-projection.js','utf8'),ctx);return M3.CombatProjection;}
test('foreshortened board preserves every matrix cell and rejects margins',()=>{
 const P=setup();for(const [w,h] of [[8,6],[10,12],[16,8]]){
  const g=P.geometry({board:{x:16,y:180,w:382,h:300}},{width:w,height:h});
  assert.ok(Math.abs(g.cy/g.cx-.72)<1e-8);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const s=P.point(g,x+.5,y+.5),picked=P.pick(g,s.x,s.y);assert.equal(picked.x,x);assert.equal(picked.y,y);}
  for(const [x,y] of [[g.x-1,g.y],[g.x,g.y-1],[g.x+g.w,g.y],[g.x,g.y+g.h]])assert.equal(P.pick(g,x,y),null);
 }
});
test('heroes, crossbow and mortar turn; non-directional towers retain a single 2.5D view',()=>{
 const P=setup();assert.equal(P.facing(1,0),3);assert.equal(P.facing(-1,0),1);assert.equal(P.facing(0,-1),2);assert.equal(P.facing(0,1),0);
 for(const id of ['hero-1','hero-2','hero-3','tower-2','tower-4']){assert.ok(P.directional(id));assert.notDeepEqual(P.region(id,0),P.region(id,2));}
 for(const id of ['tower-1','tower-3','tower-5','tower-6']){assert.ok(!P.directional(id));for(let d=1;d<4;d++)assert.deepEqual(P.region(id,0),P.region(id,d));}
 assert.equal(P.direction({x:0,y:0},[{x:2,y:.5,hp:10,dying:false}]),3);assert.equal(P.direction({x:0,y:0},[{x:2,y:.5,hp:0}]),0);
});
test('all configured pixel regions are inside atlas and stable by identity',()=>{
 const P=setup();for(const id of ['hero-1','hero-2','hero-3','tower-1','tower-2','tower-3','tower-4','tower-5','tower-6'])for(let d=0;d<4;d++){const r=P.region(id,d);assert.ok(r[0]>=0&&r[1]>=0&&r[2]<=1&&r[3]<=1&&r[2]>r[0]&&r[3]>r[1]);}
 assert.equal(P.region('unconfigured',0),null);
});
