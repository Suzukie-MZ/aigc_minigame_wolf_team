'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function setup(native=true){
  const requests=[],images=[],s={console,Promise};s.window=s;
  function createImage(){const image={src:''};images.push(image);return image;}
  if(native)s.ks={createImage,loadSubpackage(opts){requests.push(opts);return{onProgressUpdate(){}};}};
  else s.Image=function(){return createImage();};
  vm.createContext(s);
  for(const file of ['standard/subpackage-loader.js',...(native?['api/kwai-subpackage.js']:[]),'standard/asset-manager.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
  return{M3:s.M3,requests,images};
}
async function flush(){for(let i=0;i<12;i++)await Promise.resolve();}
test('native image paths wait for package success and share a single package request',async()=>{
  const {M3,requests,images}=setup();
  M3.AssetManager.acquire('image','a','subpackages/ui-images/assets/a.png');
  M3.AssetManager.acquire('image','b','subpackages/ui-images/assets/b.png');
  assert.equal(requests.length,1);assert.equal(requests[0].name,'ui-images');
  assert.ok(images.every(i=>i.src===''));
  requests[0].success({});await flush();
  assert.equal(images[0].src,'subpackages/ui-images/assets/a.png');assert.equal(images[1].src,'subpackages/ui-images/assets/b.png');
  images[0].onload();assert.equal(await M3.AssetManager.ready('a'),images[0]);
});
test('package failure rejects image readiness; image retry downloads the package again',async()=>{
  const {M3,requests,images}=setup();
  M3.AssetManager.acquire('image','a','subpackages/battle-images/assets/a.png');
  const ready=M3.AssetManager.ready('a');
  requests[0].fail({errorMsg:'offline'});await flush();
  await assert.rejects(ready);assert.equal(images[0].src,'');assert.equal(M3.AssetManager.getState('a').failed,true);
  M3.AssetManager.retry('a');assert.equal(requests.length,2);
  requests[1].success({});await flush();images[1].onload();assert.equal(await M3.AssetManager.ready('a'),images[1]);
});
test('releasing a pending image prevents a late package callback from reading its path',async()=>{
  const {M3,requests,images}=setup();M3.AssetManager.acquire('image','a','subpackages/ui-images/assets/a.png');M3.AssetManager.release('a');
  requests[0].success({});await flush();assert.equal(images[0].src,'');assert.equal(M3.AssetManager.get('a'),null);
});
test('startup images remain in main; H5 reads subpackage URLs without native downloads',()=>{
  const native=setup();native.M3.AssetManager.acquire('image','home','assets/home-asset/home-loading-qiyuan.png');
  assert.equal(native.requests.length,0);assert.ok(native.images[0].src.startsWith('assets/'));
  const web=setup(false);web.M3.AssetManager.acquire('image','a','subpackages/ui-images/assets/a.png');
  assert.equal(web.requests.length,0);assert.equal(web.images[0].src,'subpackages/ui-images/assets/a.png');
});
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
test('actual main directory and every declared image package stay below 6 MB',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));
  const roots=config.subpackages.map(p=>path.join(root,p.root));const all=files(root);
  const size=list=>list.reduce((total,p)=>total+fs.statSync(p).size,0);
  const main=all.filter(p=>!roots.some(r=>p.startsWith(r)));
  assert.ok(size(main)<6000000,'main exceeds 6,000,000 bytes');
  for(const pkg of config.subpackages){const dir=path.join(root,pkg.root);assert.ok(size(files(dir))<6000000,pkg.name+' exceeds 6 MB');}
  for(const name of ['ui-images','battle-images','monsters','monsters-light','monsters-heavy'])assert.ok(config.subpackages.some(p=>p.name===name));
  assert.ok(fs.existsSync(path.join(root,'assets/home-asset/home-loading-qiyuan.png')));
});
