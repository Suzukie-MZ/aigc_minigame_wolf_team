'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function setup(width=414,height=896,safeTop=0,bottom=0) {
  const manifest={systems:{M5_hero:{hero_unit_pool:[]}}};
  const nodes=Array.from({length:30},(_,i)=>({id:'node-'+i,levelId:'level-'+i,unlocked:i===0}));
  const M3={Layout:{w:width,h:height,safeTop,bottomPadding:bottom},_now:()=>1000,
    SaveData:{load(){},syncEnergy(){},get:()=>({energy:10,outerCurrency:0,highestDifficulty:1})},
    RuntimeConfig:{init(fn){fn();},getManifest:()=>manifest,getLevel:id=>({id,units:[]}),getSource:()=> 'test'},
    WorldMap:{nodes:()=>nodes},Deck:{allowedCards:()=>[],validate:()=>({ok:false})},
    FeatureSystem:{balanceReport:()=>({}),dayKey:()=> 'test'}};
  const context={window:{M3},Promise,console};
  vm.createContext(context);
  for(const file of ['js/render/ui-layout.js','js/play/game-features.js'])
    vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8'),context);
  M3.Game.ensureStarted();
  await Promise.resolve();
  M3.Game.assetsRendered();
  assert.equal(M3.Game.getViewModel().state,'WORLD_MAP');
  return {M3,nodes};
}

test('two-column level browser keeps fixed controls outside the scroll region at phone sizes',async()=>{
  for(const [w,h,top,bottom] of [[414,896,0,0],[390,844,44,34],[320,568,20,0]]) {
    const {M3}=await setup(w,h,top,bottom),l=M3.UILayout.get();
    const left=l.levelCard(0,0),right=l.levelCard(1,0),next=l.levelCard(2,0);
    assert.equal(left.y,right.y);
    assert.ok(left.x+left.w<right.x);
    assert.ok(next.y>=left.y+left.h);
    assert.ok(l.mapList.y+l.mapList.h<l.mapDock.y);
    assert.ok(l.mapDock.y+l.mapDock.h<=h-bottom);
    for(const control of [l.energyAd,l.energyShare,l.energyCurrent,l.mapUpgrade]) {
      assert.ok(control.w>=48 && control.h>=48);
      assert.ok(control.y>=l.mapList.y+l.mapList.h);
    }
  }
});

test('right-column locked card cannot enter a level; first card opens its own level',async()=>{
  const {M3}=await setup(),l=M3.UILayout.get(),right=l.levelCard(1,0),left=l.levelCard(0,0);
  M3.Game.handlePointer(right.x+right.w*.5,right.y+right.h*.5);
  assert.equal(M3.Game.getViewModel().state,'WORLD_MAP');
  assert.equal(M3.Game.getViewModel().message,'请先通关上一关');
  M3.Game.handlePointer(left.x+left.w*.5,left.y+left.h*.5);
  const view=M3.Game.getViewModel();
  assert.equal(view.state,'LEVEL_DETAIL');
  assert.equal(view.levelPreview.id,'level-0');
});

test('scroll ends at the final row and its right-hand card opens the correct level',async()=>{
  const {M3,nodes}=await setup(),l=M3.UILayout.get();
  nodes[29].unlocked=true;
  M3.Game.handleMapScroll(1e7);
  const scroll=M3.Game.getViewModel().mapScroll,last=l.levelCard(29,scroll);
  assert.ok(Math.abs(last.y+last.h-(l.mapList.y+l.mapList.h))<.01);
  assert.ok(last.y>=l.mapList.y);
  M3.Game.handlePointer(last.x+last.w*.5,last.y+last.h*.5);
  assert.equal(M3.Game.getViewModel().levelPreview.id,'level-29');
  M3.Game.restart();M3.Game.handleMapScroll(-1e7);
  assert.equal(M3.Game.getViewModel().mapScroll,0);
});

test('briefing close and return lead to map without starting combat',async()=>{
 const {M3}=await setup(),click=r=>M3.Game.handlePointer(r.x+r.w/2,r.y+r.h/2),l=M3.UILayout.get();
 click(l.levelCard(0,0));assert.equal(M3.Game.getViewModel().state,'LEVEL_DETAIL');
 click(l.detailClose);assert.equal(M3.Game.getViewModel().state,'WORLD_MAP');
 click(l.levelCard(0,0));click(l.detailBack);assert.equal(M3.Game.getViewModel().state,'WORLD_MAP');
 click(l.levelCard(0,0));click(l.detailStart);assert.equal(M3.Game.getViewModel().state,'HERO_SELECT');
});
