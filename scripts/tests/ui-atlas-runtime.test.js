const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('packaged UI atlas overrides original icon URLs even when manifest lists them',()=>{
 const requested=[],M3={AssetManager:{acquire(type,key,url){requested.push(url);return Promise.resolve();},loaded:()=>true,get:()=>({width:1024,height:1024})}},ctx={window:{M3},Promise};vm.createContext(ctx);
 for(const file of ['js/play/neutral-config.js','js/render/ui-icon-assets.js','js/render/texture-assets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const keys=new Set(M3.UIIconAssets.manifest.map(x=>x.key)),originals=M3.NeutralConfig.manifest.assetManifest.filter(x=>keys.has(x.key));
 M3.TextureAssets.configure({assetManifest:originals});
 for(const entry of originals){assert.ok(!requested.includes(entry.url));assert.equal(M3.TextureAssets.meta(entry.key).url,'subpackages/ui-images/assets/Image/ui/ui-icons.png');assert.equal(M3.TextureAssets.meta(entry.key).render.region.length,4);}
 assert.ok(requested.includes('subpackages/ui-images/assets/Image/ui/ui-icons.png'));
});

const path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
function nativeAtlas(){
 const requested=[],s={console,Promise};s.window=s;
 s.ks={createImage(){const image={};Object.defineProperty(image,'src',{set(url){requested.push(url);Promise.resolve().then(()=>{if(url.endsWith('.webp'))image.onerror(new Error('unsupported WebP'));else image.onload();});}});return image;}};
 s.M3={SubpackageLoader:{load(name,opts){opts.onSuccess();return Promise.resolve();},isLoaded(){return true;}}};
 vm.createContext(s);
 for(const file of ['standard/asset-manager.js','js/play/neutral-config.js','js/render/ui-icon-assets.js','js/render/texture-assets.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
 return {M3:s.M3,requested};
}
test('native image readiness succeeds without WebP decoding and all 14 icons share one PNG',async()=>{
 const {M3,requested}=nativeAtlas(),keys=Array.from(M3.UIIconAssets.manifest,x=>x.key);
 assert.equal(keys.length,14);
 M3.TextureAssets.configure(M3.NeutralConfig.manifest,keys);
 await M3.TextureAssets.waitFor(keys);
 assert.deepEqual(requested,['subpackages/ui-images/assets/Image/ui/ui-icons.png']);
 for(const key of keys){assert.ok(M3.TextureAssets.get(key));assert.equal(M3.TextureAssets.meta(key).render.region.length,4);}
 assert.equal(M3.TextureAssets.progress(keys).loaded,14);
});
test('late extra manifests cannot replace UI atlas addresses or their UV regions',async()=>{
 const {M3,requested}=nativeAtlas(),keys=Array.from(M3.UIIconAssets.manifest,x=>x.key);
 M3.TextureAssets.configure(M3.NeutralConfig.manifest,keys);await M3.TextureAssets.waitFor(keys);
 const before=keys.map(key=>JSON.stringify(M3.TextureAssets.meta(key)));
 M3.TextureAssets.addAssets(M3.NeutralConfig.manifest.assetManifest);
 M3.TextureAssets.addAssets(keys.map(key=>({key,type:'image',url:'https://example.com/'+key+'.webp',version:'remote'})));
 for(let i=0;i<keys.length;i++)assert.equal(JSON.stringify(M3.TextureAssets.meta(keys[i])),before[i]);
 await M3.TextureAssets.waitFor(keys);assert.deepEqual(requested,['subpackages/ui-images/assets/Image/ui/ui-icons.png']);
});
test('upload file list ships the PNG atlas required by both runtimes',()=>{
 const program="import importlib.util,json; from pathlib import Path; p=Path('scripts/build-game-package.py'); s=importlib.util.spec_from_file_location('build',p); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); files=m.runtime_files(); m.check_references(files); print(json.dumps([str(p.relative_to(m.ROOT)) for p in files]))";
 const files=JSON.parse(execFileSync('python3',['-c',program],{cwd:root,encoding:'utf8'}));
 assert.ok(files.includes('subpackages/ui-images/assets/Image/ui/ui-icons.png'));
});
