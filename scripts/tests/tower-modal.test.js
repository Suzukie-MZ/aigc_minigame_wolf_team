'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
async function setup(w=414,h=896){
 const cards=Array.from({length:6},(_,i)=>({id:'c'+i,unitId:'t'+i,uiName:'守望棱塔',portraitAsset:'tower-'+i})),
 heroes=Array.from({length:3},(_,i)=>({id:'h'+i,unitId:'hero'+i,uiName:'前线守望者'})),
 manifest={cards,deckRules:{deckSize:4,allowDuplicates:false},systems:{M5_hero:{hero_unit_pool:heroes}}},
 level={id:'level-1',map:{width:8,height:6,tiles:[]},units:cards.map((c,i)=>({id:c.unitId,buildCost:100+i*25})).concat(heroes.map(h=>({id:h.unitId})))},
 calls={energy:0,battles:[],saved:[]},M3={Layout:{w,h,safeTop:0,bottomPadding:0},_now:()=>1000,
 SaveData:{load(){},syncEnergy(){},get:()=>({energy:10,outerCurrency:0}),consumeEnergy(){calls.energy++;return true;},setRecentDeck(d){calls.saved=d.slice();}},
 RuntimeConfig:{init:fn=>fn(),getManifest:()=>manifest,getLevel:()=>level,getSource:()=> 'test'},
 WorldMap:{nodes:()=>[{id:'n1',levelId:'level-1',unlocked:true},{id:'n2',levelId:'level-2',unlocked:false}]},
 Progression:{cardLevel:()=>1,upgradeCost:()=>0,heroLevel:()=>1,heroUpgradeCost:()=>0},
 FeatureSystem:{prepareLevel:l=>l,balanceReport:()=>({}),dayKey:()=> 'test'},
 Combat:{create(l,m,d,hs){calls.battles.push({deck:d.slice(),heroes:hs.slice()});return{view:()=>({})};}}};
 const ctx={window:{M3},Promise,console};vm.createContext(ctx);
 for(const file of ['js/play/deck.js','js/render/ui-layout.js','js/play/game-features.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8'),ctx);
 M3.Game.ensureStarted();await Promise.resolve();M3.Game.assetsRendered();
 const click=r=>M3.Game.handlePointer(r.x+r.w/2,r.y+r.h/2),view=()=>M3.Game.getViewModel(),layout=()=>M3.UILayout.get();
 click(layout().levelCard(0,0));click(layout().detailStart);
 return{M3,calls,click,view,layout};
}
test('hero first, then four towers; disabled start and background controls cannot begin battle',async()=>{
 const s=await setup(),{M3,click,layout,view,calls}=s;assert.equal(view().state,'HERO_SELECT');
 click(layout().heroNext);assert.equal(view().state,'HERO_SELECT');
 click(layout().heroModalCards[0]);click(layout().heroNext);assert.equal(view().state,'DECK_SELECT');
 click(layout().towerStart);assert.equal(calls.energy,0);
 M3.Game.handleMapScroll(1e5);assert.equal(view().mapScroll,0);
 assert.equal(M3.Game.beginMapDrag(layout().mapList.x+5,layout().mapList.y+5),false);
 click(layout().mapHome);assert.equal(view().state,'DECK_SELECT');
 for(let i=0;i<3;i++)click(layout().towerCards[i]);click(layout().towerStart);assert.equal(calls.energy,0);
 click(layout().towerCards[3]);click(layout().towerCards[4]);assert.equal(view().deck.length,4);
 click(layout().towerCards[0]);assert.equal(view().deck.length,3);click(layout().towerCards[0]);
 click(layout().towerStart);assert.equal(view().state,'BATTLE');assert.equal(calls.energy,1);
 assert.equal(calls.battles.length,1);assert.equal(calls.saved.length,4);assert.equal(calls.battles[0].heroes[0],'h0');
});
test('previous step preserves choices; changing hero works; close returns to map without energy cost',async()=>{
 const {click,layout,view,calls}=await setup();
 click(layout().heroModalCards[0]);click(layout().heroNext);click(layout().towerCards[0]);
 assert.equal(view().cards[0].purchaseCost,100);
 for(let i=0;i<6;i++)assert.equal(view().cards[i].portraitAsset,'tower-'+i);
 click(layout().towerPrev);assert.equal(view().state,'HERO_SELECT');assert.equal(view().heroes[0],'h0');
 click(layout().heroModalCards[1]);click(layout().heroNext);assert.equal(view().state,'DECK_SELECT');
 assert.equal(view().deck[0],'c0');assert.equal(view().heroes[0],'h1');
 click(layout().towerClose);assert.equal(view().state,'WORLD_MAP');assert.equal(calls.energy,0);
});
test('six cards, title and actions fit at phone sizes with 48px actions and readable artwork',async()=>{
 for(const [w,h] of [[414,896],[390,844],[320,568]]){
  const {layout}=await setup(w,h),l=layout(),p=l.towerModal;
  assert.ok(p.w>=w*.88&&p.w<=w*.92+1e-6);assert.ok(p.y>=0&&p.y+p.h<=h);
  for(let i=0;i<6;i++){const r=l.towerCards[i];assert.ok(r.w>=110&&r.h>=100);assert.ok(r.y>=p.y+100);assert.ok(r.y+r.h<=l.towerCounter.y);if(i%2)assert.equal(r.y,l.towerCards[i-1].y);}
  for(const r of [l.towerStart,l.towerPrev,l.towerClose])assert.ok(r.w>=48&&r.h>=48);
  assert.ok(l.towerCounter.y+l.towerCounter.h<=l.towerStart.y);
 }
});

test('hero modal is single-select, cancels without energy and fits phone safe areas',async()=>{
 for(const [w,h] of [[414,896],[390,844],[320,568]]){
  const {M3,click,layout,view,calls}=await setup(w,h),l=layout(),p=l.heroModal;
  assert.ok(p.y>=0&&p.y+p.h<=h);assert.ok(p.w>=w*.88&&p.w<=w*.92+.01);
  for(const r of l.heroModalCards){assert.ok(r.h>=90);assert.ok(r.y>=p.y+100);assert.ok(r.y+r.h<=l.heroCancel.y-10);}
  for(const r of [l.heroCancel,l.heroNext,l.heroClose])assert.ok(r.w>=48&&r.h>=48);
  click(l.mapHome);assert.equal(view().state,'HERO_SELECT');
  click(l.heroModalCards[0]);click(l.heroModalCards[1]);assert.equal(view().heroes.length,1);assert.equal(view().heroes[0],'h1');
  click(l.heroModalCards[1]);assert.equal(view().heroes.length,0);click(l.heroNext);assert.equal(view().state,'HERO_SELECT');
  click(l.heroCancel);assert.equal(view().state,'WORLD_MAP');assert.equal(calls.energy,0);
  click(layout().levelCard(0,0));click(layout().detailStart);click(layout().heroClose);assert.equal(view().state,'WORLD_MAP');
 }
});
test('hero bust UV crops preserve proportions and portrait configuration',()=>{
 const M3={},ctx={window:{M3}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../js/render/map-ui-model.js'),'utf8'),ctx);
 for(const id of ['hero-1','hero-2','hero-3','future-hero'])for(const aspect of [.9,1.2,1.5]){
  const hero={unitId:id,portraitAsset:id},before=JSON.stringify(hero),c=M3.MapUI.heroPortraitRegion(hero,1,aspect);
  assert.ok(c.every(x=>x>=0&&x<=1));assert.ok(c[1]<=.04);if(id!=='future-hero')assert.ok(c[3]-c[1]<=.42+1e-8,'configured hero stays cropped to upper body');assert.ok(Math.abs((c[2]-c[0])/(c[3]-c[1])-aspect)<1e-8);assert.equal(JSON.stringify(hero),before);
 }
});
