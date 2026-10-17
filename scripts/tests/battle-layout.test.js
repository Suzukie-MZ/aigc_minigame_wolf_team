const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(w,h,top=0,bottom=0){const M3={Layout:{w,h,safeTop:top,bottomPadding:bottom}},ctx={window:{M3}};for(const f of ['js/render/ui-layout.js','js/render/combat-projection.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);return M3;}
test('full-width field preserves every playable cell without an inset frame or dock overlap',()=>{
 for(const dims of [[414,896,0,0],[390,844,44,34],[320,568,20,20]])for(const [cols,rows] of [[8,6],[16,16],[30,40]]){
  const M3=setup(...dims);M3.UILayout.setGrid(cols,rows);const l=M3.UILayout.get(),P=M3.CombatProjection,board={width:cols,height:rows};
  assert.ok(l.battleArena.y+l.battleArena.h<=l.heroBarY-8);assert.ok(l.board.y+l.board.h<=l.battleArena.y+l.battleArena.h);
  assert.ok(l.battleHeroCard(0,1,4).h<=102);
  for(const r of [l.pauseButton,l.battleItems])assert.ok(r.w>=48&&r.h>=48);
  for(let i=0;i<4;i++){const r=l.battleTowerCard(i,4);assert.ok(r.h>=118&&r.h<=140);assert.ok(r.y>=l.heroBarY+48);assert.ok(r.y+r.h<=dims[1]-dims[3]-10);}
  const hero=l.battleHeroCard(0,1,4),last=l.battleTowerCard(3,4);
  assert.ok(hero.x+hero.w+6<=l.battleItems.x);
  assert.equal(hero.x,l.w-(l.battleItems.x+l.battleItems.w));
  assert.ok(Math.abs(hero.x-(l.w-last.x-last.w))<.001);
  assert.deepEqual(l.board,l.battleArena);
  const g=P.geometry(l,board);assert.ok(g.w<=l.board.w+.001&&g.h<=l.board.h+.001);
  assert.ok(g.x>=l.board.x&&g.y>=l.board.y);assert.ok(g.x+g.w<=l.board.x+l.board.w+.001&&g.y+g.h<=l.board.y+l.board.h+.001);
  for(const [x,y] of [[0,0],[cols-1,rows-1]]){const p=P.point(g,x+.5,y+.5),c=P.pick(g,p.x,p.y);assert.equal(c.x,x);assert.equal(c.y,y);}
  assert.ok(l.board.h>=g.h+g.cx*1.6-.001);
  assert.equal(P.pick(g,g.x+g.w*.5,g.y-1),null);
  assert.equal(P.zoom,undefined);assert.equal(P.pan,undefined);assert.equal(l.battleZoomIn,undefined);

 }
});
test('battle drag does not pan or deploy; tapping still deploys',()=>{
 const events={},calls={pan:0,click:0},M3={Layout:{w:414,h:896},_now:()=>1,Game:{beginMapDrag:()=>false,handlePointer(){calls.click++;}}},canvas={getBoundingClientRect:()=>({left:0,top:0,width:414,height:896}),addEventListener(k,fn){events[k]=fn;}};
 vm.runInNewContext(fs.readFileSync('js/play/input.js','utf8'),{window:{M3,canvas}});
 const e=(x,y)=>({clientX:x,clientY:y,preventDefault(){}});events.mousedown(e(100,200));events.mousemove(e(140,230));events.mouseup(e(140,230));assert.equal(calls.pan,0);assert.equal(calls.click,0);
 events.mousedown(e(100,200));events.mouseup(e(100,200));assert.equal(calls.click,1);
});
