'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function setup(failStartup,options={}){
 const requested=[],packages=[],s={console,Promise};s.window=s;
 s.ks={loadSubpackage(opts){packages.push(opts.name);Promise.resolve().then(()=>options.failPackage===opts.name?opts.fail({errMsg:'subpackage unavailable'}):opts.success({}));return{onProgressUpdate(){}};},createImage(){const image={};Object.defineProperty(image,'src',{set(url){if(!url)return;requested.push(url);const match=/^subpackages\/([^/]+)\//.exec(url);if(match)assert.ok(s.M3.SubpackageLoader.isLoaded(match[1]),'read image only after package is ready: '+url);if(options.throwWebP&&url.endsWith('.webp'))throw new Error('unsupported WebP');Promise.resolve().then(()=>{if(url.endsWith('.webp')||(failStartup&&/(home-loading-qiyuan|ui-map-reference|ui-tower-interface|ui-level-briefing|ui-hero-interface)/.test(url)))image.onerror({target:image});else image.onload();});}});return image;}};
 vm.createContext(s);
 const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
 for(const file of ['standard/subpackage-loader.js','api/kwai-subpackage.js','standard/asset-manager.js','js/play/neutral-config.js','js/render/loading-assets.js'])load(file);
 return{M3:s.M3,requested,packages,s,load,setStartupFailure(value){failStartup=value;}};
}
test('startup uses single-format PNG files on devices without WebP decoding',async()=>{
 const {M3,requested,packages}=setup(false);await M3.LoadingAssets.ready();
 assert.ok(requested.includes('assets/home-asset/home-loading-qiyuan.png'));
 assert.ok(requested.every(url=>!url.endsWith('.webp')));
 assert.ok(packages.includes('ui-map-images'));
 assert.ok(packages.includes('ui-panel-images'));
 assert.ok(!packages.some(name=>name.startsWith('ui-compat-')));
});
test('failed original image keeps its precise path and SDK reason',async()=>{
 const {M3}=setup(true);
 await assert.rejects(M3.LoadingAssets.ready(),error=>typeof error.message==='string'&&error.url.endsWith('.png'));
});
test('old compatibility packages and duplicate images remain removed',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));
 assert.ok(!config.subpackages.some(p=>p.name.startsWith('ui-compat-')));
 assert.equal(fs.existsSync(path.join(root,'assets/home-asset/home-loading-qiyuan.webp')),false);
 for(const file of ['pixel-terrain-25d-v1','pixel-units-25d-v1','battle-scene-surround'])assert.equal(fs.existsSync(path.join(root,'subpackages/battle-images/assets/Image/ui',file+'.png')),false);
});

function startGame(fixture){
 const {M3,load}=fixture;
 const manifest={systems:{},presentation:{},assetManifest:[]};
 M3.SaveData={load(){},syncEnergy(){},get(){return{};}};
 M3.RuntimeConfig={init(done){done();},getManifest(){return manifest;},getSource(){return'test';}};
 M3.Deck={allowedCards(){return[];},validate(){return{ok:true};}};M3.WorldMap={nodes(){return[];}};
 M3.FeatureSystem={dayKey(){return'test';}};M3.UILayout={get(){return{};}};
 M3.TextureAssets={configure(){return[];},waitFor(){return Promise.resolve();}};
 load('js/play/game-features.js');M3.Game.ensureStarted();
}
test('actual Game startup reaches the world map when WebP decoding is unsupported',async()=>{
 const fixture=setup(false);startGame(fixture);await new Promise(setImmediate);
 assert.equal(fixture.M3.Game.getViewModel().loadingPhase,'render');
 fixture.M3.Game.assetsRendered();assert.equal(fixture.M3.Game.getViewModel().state,'WORLD_MAP');
});
test('actual Game can retry a failed startup image',async()=>{
 const fixture=setup(true);startGame(fixture);await new Promise(setImmediate);
 const failed=fixture.M3.Game.getViewModel();assert.equal(failed.state,'LOAD_ERROR');assert.match(failed.loadingError,/\.png/);
 fixture.setStartupFailure(false);fixture.M3.Game.handlePointer(0,0);await new Promise(setImmediate);
 assert.equal(fixture.M3.Game.getViewModel().loadingPhase,'render');
 fixture.M3.Game.assetsRendered();assert.equal(fixture.M3.Game.getViewModel().state,'WORLD_MAP');
});
