'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function setup(native){
  const events=[],requests=[],manifest={systems:{}},M3={
    SaveData:{load(){},syncEnergy(){},get(){return{cards:{},heroes:{}};}},
    RuntimeConfig:{init(done){events.push('config');done();},getManifest(){return manifest;},getSource(){return'remote';}},
    TextureAssets:{configure(){events.push('textures');return[];},waitFor(){return Promise.resolve();}},
    Deck:{allowedCards(){return[];},validate(){return{ok:true};}},WorldMap:{nodes(){return[];}},FeatureSystem:{dayKey(){return'2026-10-15';}},UILayout:{get(){return{};}}
  };
  const s={M3,console,Promise};s.window=s;
  if(native)s.ks={loadSubpackage(options){requests.push(options);events.push('subpackage');return{onProgressUpdate(){}};}};
  vm.createContext(s);
  function load(file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);}
  load('standard/subpackage-loader.js');if(native)load('api/kwai-subpackage.js');load('js/play/game-features.js');
  return{M3,events,requests,load};
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
test('native waits for monsters subpackage success before initializing image resources',async()=>{
  const {M3,events,requests}=setup(true);M3.Game.ensureStarted();
  assert.deepEqual(events,['subpackage']);assert.equal(requests[0].name,'monsters');
  requests[0].success({});await flush();
  assert.deepEqual(events,['subpackage','config','textures']);
  assert.equal(M3.Game.getViewModel().loadingPhase,'render');
});
test('subpackage failure prevents asset access and existing error-page action retries',async()=>{
  const {M3,events,requests}=setup(true);M3.Game.ensureStarted();requests[0].fail({errorMsg:'network unavailable'});await flush();
  assert.equal(M3.Game.getViewModel().state,'LOAD_ERROR');assert.deepEqual(events,['subpackage']);
  M3.Game.handlePointer(0,0);assert.equal(requests.length,2);requests[1].success({});await flush();
  assert.deepEqual(events,['subpackage','subpackage','config','textures']);
});
test('H5 initializes without invoking native subpackage API',async()=>{
  const {M3,events,requests}=setup(false);M3.Game.ensureStarted();await flush();
  assert.deepEqual(events,['config','textures']);assert.equal(requests.length,0);
});
test('all local monster assets live in declared monsters package and are required before rendering',()=>{
  const s={console,M3:{},Promise};s.window=s;vm.createContext(s);
  for(const name of ['enemy-animations','death-particles','texture-assets'])vm.runInContext(fs.readFileSync(path.join(root,'js/render',name+'.js'),'utf8'),s);
  const images={};s.M3.AssetManager={acquire(type,key,url){images[key]={url};},loaded(key){return!!images[key];},get(key){return images[key];}};
  const entries=s.M3.EnemyAnimations.manifest.concat(s.M3.DeathParticles.manifest);
  const required=Array.from(s.M3.TextureAssets.configure({assetManifest:[]}));
  assert.equal(entries.length,5);
  for(const item of entries){assert.ok(item.url.startsWith('subpackages/monsters/'));assert.ok(fs.existsSync(path.join(root,item.url)));assert.ok(required.includes(item.key));}
  const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));
  assert.ok(config.subpackages.some(item=>item.name==='monsters'&&item.root==='subpackages/monsters/'));
  assert.equal(fs.existsSync(path.join(root,'assets/Image/enemies')),false);
});
