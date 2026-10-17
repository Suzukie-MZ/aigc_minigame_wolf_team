'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

async function setup(){
  const manifest={systems:{M5_hero:{hero_unit_pool:[]},M14_energy:{daily_max_energy:10,ad_refill_amount:5,share_refill_amount:3}}};
  const today=new Date(),day=today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  const sdk={ad:null,share:null,writes:0};
  const M3={Layout:{w:414,h:896},_now:()=>1000,
    RuntimeConfig:{init(fn){fn();},getManifest:()=>manifest,getLevel:id=>({id,units:[]}),getSource:()=> 'test'},
    WorldMap:{nodes:()=>Array.from({length:30},(_,i)=>({id:'n'+i,levelId:'l'+i,unlocked:i===0}))},
    Deck:{allowedCards:()=>[],validate:()=>({ok:false})},FeatureSystem:{balanceReport:()=>({}),dayKey:()=>day}};
  const context={window:{M3},Promise,console,
    KwaiStorage:{getSync:()=>({version:1,unlockSequenceVersion:1,energy:2,energyDay:day}),setSync(){sdk.writes++;}},
    KwaiAd:{showRewarded(grant,cancel){sdk.ad={grant,cancel};}},
    KwaiShare:{share(options){sdk.share=options;}}};
  vm.createContext(context);
  for(const f of ['js/play/save-data.js','js/play/reward-system.js','js/render/ui-layout.js','js/play/game-features.js'])
    vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../..',f),'utf8'),context);
  M3.Game.ensureStarted();await Promise.resolve();M3.Game.assetsRendered();
  const l=M3.UILayout.get(),click=r=>M3.Game.handlePointer(r.x+r.w*.5,r.y+r.h*.5);
  return {M3,l,click,sdk};
}

test('home, menu, help and energy controls work; modal blocks background card and scroll input',async()=>{
  const {M3,l,click}=await setup();
  M3.Game.handleMapScroll(1e6);click(l.mapHome);assert.equal(M3.Game.getViewModel().mapScroll,0);assert.equal(M3.Game.getViewModel().mapDialog.kind,'home');assert.ok(M3.Game.getViewModel().mapDialog.lines.includes('已解锁关卡 1 / 30'));click(l.mapDialogActions[0]);
  click(l.mapMore);assert.equal(M3.Game.getViewModel().mapDialog.kind,'menu');
  click(l.levelCard(0,0));assert.equal(M3.Game.getViewModel().state,'WORLD_MAP');
  assert.equal(M3.Game.beginMapDrag(l.mapList.x+10,l.mapList.y+10),false);
  M3.Game.handleMapScroll(500);assert.equal(M3.Game.getViewModel().mapScroll,0);
  click(l.mapDialogActions[0]);assert.equal(M3.Game.getViewModel().mapDialog.kind,'help');
  click(l.mapDialogActions[1]);assert.equal(M3.Game.getViewModel().mapDialog,null);
  click(l.energyCurrent);assert.equal(M3.Game.getViewModel().mapDialog.kind,'energy');
  assert.ok(M3.Game.getViewModel().mapDialog.lines.includes('当前体力 2 / 10'));
  click(l.mapDialogActions[0]);click(l.mapUpgrade);assert.equal(M3.Game.getViewModel().state,'PROGRESSION');
  click(l.heroBack);assert.equal(M3.Game.getViewModel().state,'WORLD_MAP');
});

test('ad and share rewards change saved energy only after real SDK success; cancellation grants nothing',async()=>{
  const {M3,l,click,sdk}=await setup();
  click(l.energyAd);assert.ok(sdk.ad);assert.equal(M3.SaveData.get().energy,2);
  sdk.ad.cancel();assert.equal(M3.SaveData.get().energy,2);
  click(l.energyAd);sdk.ad.grant();assert.equal(M3.SaveData.get().energy,7);
  click(l.energyShare);assert.ok(sdk.share);assert.equal(M3.SaveData.get().energy,7);
  sdk.share.fail();assert.equal(M3.SaveData.get().energy,7);
  click(l.energyShare);sdk.share.success();assert.equal(M3.SaveData.get().energy,10);
  assert.equal(sdk.writes,2);
});

test('exit requires confirmation, saves progress, and browser preview can be re-entered',async()=>{
  const {M3,l,click,sdk}=await setup();
  click(l.mapExit);assert.equal(M3.Game.getViewModel().mapDialog.kind,'exit');
  click(l.mapDialogActions[1]);assert.equal(M3.Game.getViewModel().mapDialog,null);assert.equal(sdk.writes,0);
  click(l.mapExit);click(l.mapDialogActions[0]);assert.equal(M3.Game.getViewModel().mapDialog.kind,'exited');
  assert.equal(sdk.writes,1);
  click(l.mapDialogActions[0]);assert.equal(M3.Game.getViewModel().mapDialog,null);
  assert.equal(M3.Game.getViewModel().state,'WORLD_MAP');
});

test('terminal close is safe for every page and actions fit short phone screens',async()=>{
 const {M3,click}=await setup();
 for(const [w,h,top,bottom] of [[414,896,0,0],[390,844,44,34],[320,568,0,0]]){
  Object.assign(M3.Layout,{w,h,safeTop:top,bottomPadding:bottom});const l=M3.UILayout.get(),p=l.mapDialog;
  assert.ok(p.y>=top&&p.y+p.h<=h-bottom);assert.ok(p.w>=w*.88);
  for(const a of l.mapDialogActions){assert.ok(a.w>=48&&a.h>=48);assert.ok(a.x>=p.x&&a.x+a.w<=p.x+p.w);assert.ok(a.y+a.h<=p.y+p.h-10);}
  assert.ok(l.mapDialogActions[0].y+l.mapDialogActions[0].h<l.mapDialogActions[1].y);
  for(const entry of [l.mapHome,l.mapMore,l.mapExit,l.energyCurrent]){click(entry);assert.ok(M3.Game.getViewModel().mapDialog);click(l.mapDialogClose);assert.equal(M3.Game.getViewModel().mapDialog,null);}
  click(l.mapHome);click(l.mapDialogActions[1]);assert.equal(M3.Game.getViewModel().mapDialog.kind,'help');click(l.mapDialogClose);
 }
});
