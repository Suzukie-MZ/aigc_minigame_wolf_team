const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('live oblique scene draws finite geometry with atlas terrain, aimed towers and existing enemies',()=>{
 const images={},uploads=[],buffers=[],labels=[],M3={Layout:{w:414,h:896,safeTop:0,bottomPadding:0,dpr:2},_now:()=>1000,
 BitmapFont:{drawLabel:(renderer,value,r,size,color,options)=>{labels.push({value:String(value),r,size,options:options||{}});return true;},drawText:()=>true,measureLabel:(s,n)=>String(s).length*n},
 TextureAssets:{get(k){return k?(images[k]||(images[k]={width:1024,height:1024,key:k})):null;},cacheKey:k=>k,meta:()=>({}),tileKey:(m,t)=>'tile-'+t},
 Glyphs:{drawNumber(){}},EnemyAnimations:{draw:()=>false}};
 const ctx={window:{M3},Float32Array,Math,console};vm.createContext(ctx);
 for(const file of ['js/render/ui-font-hd-data.js','js/render/ui-layout.js','js/render/combat-projection.js','js/render/renderer.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 M3.UILayout.setGrid(8,6);
 const tiles=Array(48).fill('grass');tiles[0]='spawn';tiles[47]='goal';tiles[4]='obstacle';tiles[9]='tower_slot';tiles[17]='hero_slot';
 const c={board:{width:8,height:6,path:[],tile:(x,y)=>tiles[y*8+x]},towers:[{unitId:'tower-2',cardId:'c1',x:1,y:1,aimX:2,aimY:0,level:1}],heroes:[{unitId:'hero-1',heroId:'h1',x:1,y:2}],enemies:[{unitId:'monster-1',x:2.5,y:2.5,hp:10,maxHp:10,moveX:0,moveY:1}],
 deckIds:['c1'],heroIds:['h1'],heroUnits:{h1:'hero-1'},cardUnits:{c1:'tower-2'},heroNames:{h1:'英雄'},cardNames:{c1:'防御塔'},heroCosts:{h1:0},cardCosts:{c1:225},heroAssets:{},cardAssets:{},heroColors:{},cardColors:{},heroDescriptions:{},cardDescriptions:{},unitAssets:{'monster-1':'monster-1'},unitRenderScales:{},unitAppearances:{},unitColors:{},elapsed:1,gold:100,baseHp:15,wave:1,waveCount:12,attackEvents:[{sourceUnitId:'tower-4',fromX:1.5,fromY:1.5,toX:2.5,toY:2.5,age:.05,duration:.2}],damageEvents:[],deathEffects:[],match:{}};
 const gl=new Proxy({drawingBufferWidth:828,drawingBufferHeight:1792,NO_ERROR:0,getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>1,getUniformLocation:()=>1,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),createTexture:()=>({}),texImage2D(...args){uploads.push(args.at(-1).key);},bufferData(t,a){buffers.push(a);}}, {get(t,k){return k in t?t[k]:()=>{};}});
 M3.Renderer.draw(gl,{state:'BATTLE',presentation:{},levelPreview:{map:{width:8,height:6}},combat:c});
 assert.ok(uploads.includes('battle-scene-surround'));assert.ok(uploads.includes('pixel-units-25d'));assert.ok(uploads.includes('pixel-terrain-25d'));assert.ok(uploads.includes('monster-1'));
 for(const {value,r,size,options} of labels){const width=[...value].reduce((n,ch)=>n+(M3.UIFontHDData.advances[ch]??1)*size,0)+Math.max(0,value.length-1)*.35;assert.ok(width<=r.w-2*(options.padding??2)+.01,'Label must fit without ellipsis: '+value);}
 assert.ok(buffers.length>40);for(const b of buffers)for(const n of b)assert.ok(Number.isFinite(n));
});
