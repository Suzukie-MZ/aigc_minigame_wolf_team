'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');

test('battle waits for selected animation atlases, retries failed loads and consumes energy only after success',async()=>{
  const calls=[];let failFirst,retries=0,energySpent=0;
  const cards=Array.from({length:4},(_,i)=>({id:'card-'+i,unitId:'tower-'+i}));
  const level={map:{tileAssets:{grass:'tile-grass'}},units:cards.map((card)=>({id:card.unitId,imageAsset:card.unitId,kind:'tower'})).concat({id:'hero-1',imageAsset:'hero-1',kind:'hero'})};
  const manifest={cards,deckRules:{deckSize:4},systems:{M5_hero:{hero_unit_pool:[{id:'hero-card',unitId:'hero-1'}]}},presentation:{},assetManifest:[]};
  const rect=(x,y,w=10,h=10)=>({x,y,w,h});
  const layout={mapList:rect(0,0,10,10),levelRowH:10,levelGap:0,mapColumns:1,levelCard:()=>rect(0,0),detailStart:rect(20,0),heroModalCards:[rect(30,0)],heroNext:rect(40,0),towerModal:rect(45,0,70,30),towerCards:cards.map((_,i)=>rect(50+i*10,0)),towerStart:rect(100,0)};
  const s={console,Promise};s.window=s;s.M3={
    _now:()=>0,
    UILayout:{get:()=>layout,contains:(r,x,y)=>!!r&&x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h,setGrid(){}},
    RuntimeConfig:{init:done=>done(),getManifest:()=>manifest,getLevel:()=>level,getSource:()=> 'test'},
    SaveData:{load(){},syncEnergy(){},get:()=>({energy:5,outerCurrency:0,highestDifficulty:0}),consumeEnergy(){energySpent++;return true;},setRecentDeck(){}},
    Deck:{allowedCards:()=>cards,page:list=>list,validate:(_,deck)=>({ok:deck.length===4})},
    WorldMap:{nodes:()=>[{id:'node-1',levelId:'level-1',unlocked:true}]},
    Progression:{cardLevel:()=>1,upgradeCost:()=>10,heroLevel:()=>1,heroUpgradeCost:()=>10},
    FeatureSystem:{dayKey:()=> 'today',balanceReport:()=>null,prepareLevel:x=>x},
    DefenderAnimations:{requiredKeys:units=>units.map(u=>'combat-'+u.imageAsset+'-attack')},
    TextureAssets:{configure:()=>[],addAssets(){},waitFor(keys){calls.push(keys.slice());if(keys.some(k=>k.indexOf('combat-')===0)&&!retries++)return new Promise((_,reject)=>{failFirst=reject;});return Promise.resolve();}},
    Combat:{create:()=>({view:()=>({})})}
  };
  vm.createContext(s);
  vm.runInContext(fs.readFileSync(path.join(root,'js/play/game-features.js'),'utf8'),s);
  const game=s.M3.Game,click=(x)=>game.handlePointer(x,5);
  game.ensureStarted();await new Promise(setImmediate);game.assetsRendered();
  click(5);click(25);click(35);click(45);
  [55,65,75,85].forEach(click);
  assert.equal(game.getViewModel().deck.length,4);
  click(105);
  assert.equal(game.getViewModel().state,'DECK_SELECT');
  assert.equal(energySpent,0);
  assert.ok(calls.at(-1).includes('tile-grass'));
  for(const unit of level.units)assert.ok(calls.at(-1).includes('combat-'+unit.imageAsset+'-attack'));
  click(55);assert.equal(game.getViewModel().deck.length,4);
  failFirst(Object.assign(new Error('offline'),{assetKey:'combat-hero-1-attack'}));
  await new Promise(setImmediate);
  assert.match(game.getViewModel().message,/点击开始重试/);
  assert.equal(energySpent,0);
  click(105);await new Promise(setImmediate);
  assert.equal(game.getViewModel().state,'BATTLE');
  assert.equal(energySpent,1);
  assert.equal(retries,2);
});
