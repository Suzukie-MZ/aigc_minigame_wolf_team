const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('packaged UI atlas overrides original icon URLs even when manifest lists them',()=>{
 const requested=[],M3={AssetManager:{acquire(type,key,url){requested.push(url);return Promise.resolve();},loaded:()=>true,get:()=>({width:1024,height:1024})}},ctx={window:{M3},Promise};vm.createContext(ctx);
 for(const file of ['js/play/neutral-config.js','js/render/ui-icon-assets.js','js/render/texture-assets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const keys=new Set(M3.UIIconAssets.manifest.map(x=>x.key)),originals=M3.NeutralConfig.manifest.assetManifest.filter(x=>keys.has(x.key));
 M3.TextureAssets.configure({assetManifest:originals});
 for(const entry of originals){assert.ok(!requested.includes(entry.url));assert.equal(M3.TextureAssets.meta(entry.key).url,'assets/Image/ui/ui-icons.webp');assert.equal(M3.TextureAssets.meta(entry.key).render.region.length,4);}
 assert.ok(requested.includes('assets/Image/ui/ui-icons.webp'));
});
