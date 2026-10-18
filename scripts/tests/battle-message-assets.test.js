const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('all settlement, wave and arena assets load on native devices without WebP, including after remote manifests',async()=>{
 const requested=[],M3={SubpackageLoader:{load(name,opts){opts.onSuccess();}}},s={console,Promise,M3};s.window=s;
 s.ks={createImage(){const image={};Object.defineProperty(image,'src',{set(url){if(!url)return;requested.push(url);Promise.resolve().then(()=>{if(url.endsWith('.webp')||!fs.existsSync(url))image.onerror(new Error('missing or unsupported image'));else image.onload();});}});return image;}};
 vm.createContext(s);
 for(const file of ['standard/asset-manager.js','js/render/battle-messages.js','js/render/texture-assets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),s);
 const assets=M3.BattleMessages.assets,keys=Array.from(assets,x=>x.key),remote=Array.from(assets,x=>({...x,url:'https://example.com/stale.webp',render:{region:[0,0,1,1]}}));
 M3.TextureAssets.configure({assetManifest:remote},keys);
 await M3.TextureAssets.waitFor(keys);
 assert.equal(requested.length,3);
 assert.ok(requested.every(url=>/\.(png|jpg)$/.test(url)));
 M3.TextureAssets.addAssets(remote);
 await M3.TextureAssets.waitFor(keys);
 for(const item of assets){assert.ok(M3.TextureAssets.get(item.key));assert.equal(M3.TextureAssets.meta(item.key).url,item.url);assert.deepEqual(M3.TextureAssets.meta(item.key).render,item.render);}
 assert.equal(M3.TextureAssets.progress(keys).loaded,9);
});
