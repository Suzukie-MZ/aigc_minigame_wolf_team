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
  const native=setup();native.M3.AssetManager.acquire('image','home','assets/home-asset/home-loading-qiyuan.webp');
  assert.equal(native.requests.length,0);assert.ok(native.images[0].src.startsWith('assets/'));
  const web=setup(false);web.M3.AssetManager.acquire('image','a','subpackages/ui-images/assets/a.png');
  assert.equal(web.requests.length,0);assert.equal(web.images[0].src,'subpackages/ui-images/assets/a.png');
});
test('actual staged release and ZIP enforce all package budgets and omit development combat sources',()=>{
  const os=require('node:os'),cp=require('node:child_process');
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'wolves-release-test-'));
  try {
    const zip=path.join(output,'game.zip');
    cp.execFileSync('python3',[path.join(root,'scripts/build-game-package.py'),'--output',zip],{stdio:'pipe'});
    const report=JSON.parse(fs.readFileSync(path.join(output,'game.size.json'),'utf8'));
    assert.ok(report.main_package_bytes<6000000);assert.ok(report.runtime_bytes<30000000);
    for(const size of Object.values(report.subpackage_bytes))assert.ok(size<6000000);
    assert.ok(report.lossless_png_savings>0);
    assert.ok(!report.files.some(p=>p.startsWith('subpackages/combat/')||p==='js/render/combat-atlas-data.js'));
    assert.ok(report.files.includes('assets/home-asset/home-loading-qiyuan.webp'));
    assert.ok(report.files.includes('js/render/defender-animations.js'));
    const stage=path.join(output,'game');
    const sum=report.files.reduce((total,p)=>total+fs.statSync(path.join(stage,p)).size,0);
    assert.equal(sum,report.runtime_bytes);
    cp.execFileSync('python3',['-c',`import zipfile, pathlib; z=zipfile.ZipFile(${JSON.stringify(zip)}); root=pathlib.Path(${JSON.stringify(stage)}); assert all(z.read(n)==(root/n).read_bytes() for n in z.namelist())`]);
  } finally {fs.rmSync(output,{recursive:true,force:true});}
});
