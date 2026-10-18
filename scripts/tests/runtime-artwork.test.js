'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function setup(){
  const requested=[],s={console,Promise};s.window=s;s.M3={};
  s.ks={createImage(){const image={};Object.defineProperty(image,'src',{set(url){if(!url)return;image.url=url;requested.push(url);Promise.resolve().then(()=>image.onload());}});return image;}};
  vm.createContext(s);
  for(const file of ['standard/asset-manager.js','standard/cdn-loader.js','js/render/combat-projection.js','js/render/texture-assets.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
  return{M:s.M3,requested};
}
for(const update of ['configure','addAssets'])test(update+' replaces portraits when the URL changes but the key and version stay the same',async()=>{
  const {M,requested}=setup(),keys=['hero-2','tower-6-lv1'],assets=release=>keys.map(key=>({key,type:'image',version:'1',url:'https://cdn.test/'+release+'/'+key+'.png',lazy:true}));
  M.TextureAssets.configure({assetManifest:assets('release-a')},[]);
  await M.TextureAssets.waitFor(keys);const before=keys.map(key=>M.TextureAssets.cacheKey(key));
  if(update==='configure')M.TextureAssets.configure({assetManifest:assets('release-b')},[]);
  else M.TextureAssets.addAssets(assets('release-b'));
  await M.TextureAssets.waitFor(keys);
  keys.forEach((key,i)=>{assert.notEqual(M.TextureAssets.cacheKey(key),before[i]);assert.equal(M.TextureAssets.get(key).url,'https://cdn.test/release-b/'+key+'.png');});
  assert.equal(requested.length,4);
});
test('battle no longer registers or requests the retired fixed unit and terrain atlases',()=>{
  const {M,requested}=setup();M.TextureAssets.configure({assetManifest:[]});M.TextureAssets.loadRemaining();
  for(const key of ['pixel-units-25d','pixel-terrain-25d'])assert.equal(M.TextureAssets.has(key),false);
  assert.ok(requested.every(url=>!/(pixel-units|pixel-terrain)-25d/.test(url)));
  for(const file of ['pixel-units-25d-v1.webp','pixel-terrain-25d-v1.webp'])assert.equal(fs.existsSync(path.join(root,'subpackages/battle-images/assets/Image/ui',file)),false);
});
