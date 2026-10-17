'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function setup(rejectWebP,failPng=false,options={}){
 const requested=[],packages=[],s={console,Promise};s.window=s;
 s.ks={loadSubpackage(opts){packages.push(opts.name);Promise.resolve().then(()=>options.failPackage===opts.name?opts.fail({errMsg:'subpackage unavailable'}):opts.success({}));return{onProgressUpdate(){}};},createImage(){const image={};Object.defineProperty(image,'src',{set(url){if(!url)return;requested.push(url);const match=/^subpackages\/([^/]+)\//.exec(url);if(match)assert.ok(s.M3.SubpackageLoader.isLoaded(match[1]),'read image only after package is ready: '+url);if(options.throwWebP&&url.endsWith('.webp'))throw new Error('unsupported WebP');Promise.resolve().then(()=>{if((rejectWebP&&url.endsWith('.webp'))||(failPng&&url.includes('ui-map-reference.png')))image.onerror({target:image});else image.onload();});}});return image;}};
 vm.createContext(s);
 const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
 for(const file of ['standard/subpackage-loader.js','api/kwai-subpackage.js','standard/asset-manager.js','js/render/image-compatibility.js','js/play/neutral-config.js','js/render/loading-assets.js'])load(file);
 return{M3:s.M3,requested,packages,s,load,setPngFailure(value){failPng=value;}};
}
test('all startup images become ready when native rejects WebP but can decode PNG',async()=>{
 const {M3,requested,packages}=setup(true);await M3.LoadingAssets.ready();
 for(const key of ['ui-loading-background','ui-map-reference','ui-level-briefing','ui-tower-interface','ui-hero-interface'])assert.ok(M3.LoadingAssets.get(key),key);
 assert.ok(requested.some(url=>url.endsWith('home-loading-qiyuan.png')));
 assert.ok(packages.includes('ui-compat-map'));assert.ok(packages.includes('ui-compat-panels'));
});
test('failed compatibility image reports logical key and exact URL, not raw SDK event',async()=>{
 const {M3}=setup(true,true);
 await assert.rejects(M3.LoadingAssets.ready(),error=>typeof error.message==='string'&&error.message.includes('ui-map-reference')&&error.message.includes('ui-map-reference.png'));
});
test('PNG compatibility packages are not fetched when the original WebP loads successfully',async()=>{
 const {M3,packages}=setup(false);await M3.LoadingAssets.ready();
 assert.ok(!packages.includes('ui-compat-map'));assert.ok(!packages.includes('ui-compat-panels'));
});
test('all compatibility image paths exist and belong to declared packages or main',()=>{
 const s={window:{M3:{}}};vm.runInNewContext(fs.readFileSync(path.join(root,'js/render/image-compatibility.js'),'utf8'),s);
 const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));
 for(const [source,fallback] of Object.entries(s.window.M3.ImageCompatibility)){
  assert.ok(fs.existsSync(path.join(root,source)),source);assert.ok(fs.existsSync(path.join(root,fallback)),fallback);
  if(fallback.startsWith('subpackages/'))assert.ok(config.subpackages.some(p=>fallback.startsWith(p.root)),fallback);
 }
});

test('synchronous native src exceptions use the same PNG fallback',async()=>{
 const {M3}=setup(false,false,{throwWebP:true});await M3.LoadingAssets.ready();
 assert.ok(M3.LoadingAssets.get('ui-loading-background'));
 assert.ok(M3.LoadingAssets.get('ui-map-reference'));
});
test('compatibility package failure retains SDK reason and can be retried',async()=>{
 const options={failPackage:'ui-compat-map'},fixture=setup(true,false,options);
 await assert.rejects(fixture.M3.LoadingAssets.ready(),error=>error.assetKey==='ui-map-reference'&&error.url.endsWith('ui-map-reference.png')&&error.message.includes('subpackage unavailable'));
 assert.ok(!fixture.requested.some(url=>url.startsWith('subpackages/ui-compat-map/')));
 options.failPackage='';await fixture.M3.LoadingAssets.ready();
 assert.ok(fixture.M3.LoadingAssets.get('ui-map-reference'));
});
test('battle images also become ready with native WebP disabled',async()=>{
 const fixture=setup(true),{M3}=fixture;fixture.load('js/render/texture-assets.js');
 const items=Object.keys(M3.ImageCompatibility).filter(url=>url.startsWith('subpackages/battle-images/')).map((url,i)=>({key:'battle-compat-'+i,type:'image',url}));
 const keys=items.map(item=>item.key);M3.TextureAssets.configure({assetManifest:items},keys);
 await M3.TextureAssets.waitFor(keys);
 for(const key of keys)assert.ok(M3.TextureAssets.get(key));
 for(const item of items)assert.ok(fixture.requested.includes(M3.ImageCompatibility[item.url]));
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
test('actual Game startup reaches render phase with native WebP disabled',async()=>{
 const fixture=setup(true);startGame(fixture);await new Promise(setImmediate);
 assert.equal(fixture.M3.Game.getViewModel().state,'LOADING');assert.equal(fixture.M3.Game.getViewModel().loadingPhase,'render');
 fixture.M3.Game.assetsRendered();assert.equal(fixture.M3.Game.getViewModel().state,'WORLD_MAP');
});
test('actual Game preserves failure details and clicking retry recovers after PNG becomes available',async()=>{
 const fixture=setup(true,true);startGame(fixture);await new Promise(setImmediate);
 const failed=fixture.M3.Game.getViewModel();assert.equal(failed.state,'LOAD_ERROR');assert.match(failed.loadingError,/ui-map-reference.png/);
 fixture.setPngFailure(false);fixture.M3.Game.handlePointer(0,0);await new Promise(setImmediate);
 assert.equal(fixture.M3.Game.getViewModel().loadingPhase,'render');
 fixture.M3.Game.assetsRendered();assert.equal(fixture.M3.Game.getViewModel().state,'WORLD_MAP');
});
