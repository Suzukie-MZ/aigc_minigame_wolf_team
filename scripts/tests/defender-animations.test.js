 'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function setup(extra={}){const s={console,Promise,...extra};s.window=s;s.M3={};vm.createContext(s);for(const n of ['combat-atlas-data','defender-animations'])vm.runInContext(fs.readFileSync(path.join(root,'js/render',n+'.js'),'utf8'),s);return s;}
const unit=(key,name,kind='hero')=>({id:key,imageAsset:key,displayName:name,kind});
test('hero direction follows dominant target axis and action direction is frozen until the next attack',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,u=unit('hero-2','秘法先知'),actor={x:3,y:3,unitId:u.id,level:1};
 assert.deepEqual([[0,-3],[0,3],[-3,1],[3,-1]].map(([x,y])=>a.direction(x,y)),['up','down','left','right']);
 const event={};a.record(actor,u,{x:0,y:3.5},'hero',10,event);
 assert.equal(actor.combatAction.direction,'left');assert.equal(event.roleKey,'hero-2');
 assert.equal(a.frameFor(actor,10.1).atlas.key,'combat-hero-2-right-attack');
 assert.equal(a.frameFor(actor,10.1).frame.name,a.frameFor(actor,10.1).frame.name);
 assert.equal(a.frameFor(actor,11),null);assert.equal(a.frameFor({},10),null);
});
test('mirrored left frames invert both texture coordinates and trimmed canvas offsets',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,u=unit('hero-2','秘法先知'),actor={x:1,y:1,level:1},calls=[];
 a.record(actor,u,{x:0,y:1.5},'hero',0,{});const f=a.frameFor(actor,.1),r=f.frame.rect,o=f.frame.offset;
 assert.equal(a.draw((...args)=>{calls.push(args);return true;},actor,.1,10,20,258,258,1),true);
 assert.equal(calls[0][1],10+258-o[0]-r[2]);assert.equal(calls[0][5],(r[0]+r[2])/f.atlas.width);assert.equal(calls[0][7],r[0]/f.atlas.width);
});
test('tower actions select actual upgrade level, play named frames once and reject unrelated themes',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,u=unit('tower-4','震荡重炮','tower'),actor={x:0,y:0,level:3};
 a.record(actor,u,{x:2,y:2},'tower',0,{});
 assert.deepEqual([0,.1,.2,.3].map(t=>a.frameFor(actor,t).frame.name.slice(-6)),['01.png','02.png','03.png','04.png']);
 assert.match(a.frameFor(actor,0).atlas.key,/lv3-attack/);assert.equal(a.frameFor(actor,.5),null);
 assert.equal(a.roleFor(unit('tower-4','新主题的炮台','tower')),null);
});
test('projectile and hit effects play separately; economy only plays pulse and resource without an attack pose',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,actor={x:0,y:0,level:2},e={age:0,duration:.4,fromX:.5,fromY:.5,toX:3,toY:2};
 a.record(actor,unit('tower-4','震荡重炮','tower'),{x:3,y:2},'tower',0,e);
 assert.equal(a.effectFor(e).group,'projectile');e.age=.25;assert.equal(a.effectFor(e).group,'hit');e.age=.5;assert.equal(a.effectFor(e),null);
 const income={age:0,duration:.4};a.record(actor,unit('tower-5','星辉工坊','economy'),{x:.5,y:.5},'income',0,income);
 assert.equal(actor.combatAction,null);assert.equal(a.effectFor(income).group,'pulse');income.age=.25;assert.equal(a.effectFor(income).group,'resource');
 assert.equal(a.draw(()=>false,actor,0,0,0,50,50,1),false);
});
test('combat atlas textures register lazily without decoding the entire package at startup',()=>{
 const s=setup(),M=s.M3,acquired=[];M.AssetManager={acquire(t,k,url){acquired.push(url);},loaded(){return false;}};
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/texture-assets.js'),'utf8'),s);
 M.TextureAssets.configure({assetManifest:[]});M.TextureAssets.loadRemaining();assert.equal(acquired.length,0);
 assert.equal(M.DefenderAnimations.manifest.length,86);assert.ok(M.TextureAssets.has('combat-tower-1-lv1-attack'));
});
test('native package load gates first decode; failed loading preserves fallback and retries on next battle',async()=>{
 const s=setup({ks:{}}),M=s.M3,requests=[],decoded=[];let loaded=false;
 M.SubpackageLoader={isLoaded(){return loaded;},load(name,opts){requests.push({name,opts});}};
 M.TextureAssets={waitFor(keys){decoded.push(...keys);return Promise.resolve();}};
 M.DefenderAnimations.preload([unit('tower-4','震荡重炮','tower')]);assert.equal(requests[0].name,'combat');assert.equal(decoded.length,0);
 requests[0].opts.onFail(new Error('offline'));await Promise.resolve();assert.equal(decoded.length,0);
 M.DefenderAnimations.preload([unit('tower-4','震荡重炮','tower')]);assert.equal(requests.length,2);loaded=true;requests[1].opts.onSuccess();await Promise.resolve();await Promise.resolve();
 assert.deepEqual(decoded.sort(),['combat-tower-4-lv1-attack','combat-tower-4-lv1-effects']);
});
test('release entries use CDN combat metadata and do not declare the development combat package',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),native=fs.readFileSync(path.join(root,'js/main.js'),'utf8');
 for(const entry of [html,native]){assert.ok(!entry.includes('combat-atlas-data.js'));assert.ok(entry.indexOf('defender-animations.js')<entry.indexOf('texture-assets.js'));}
 const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));assert.ok(!config.subpackages.some(p=>p.name==='combat'));
});
test('missing CDN combat metadata uses static fallback without requesting a removed package',async()=>{
 const s={console,Promise,ks:{}};s.window=s;s.M3={SubpackageLoader:{load(){throw new Error('must not load local combat');}}};vm.createContext(s);
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/defender-animations.js'),'utf8'),s);
 const a=s.M3.DefenderAnimations;assert.equal(a.configure({assetManifest:[]}).mode,'static');
 assert.equal(a.manifest.length,0);assert.equal(await a.preload([unit('tower-4','震荡重炮','tower')]),false);
 assert.equal(a.draw(()=>{throw new Error('no atlas expected');},{},0,0,0,64,64,1),false);
});

function realCombat(){
 const s=setup(),M=s.M3;M.SaveData={get:()=>({cards:{},heroes:{},outerCurrency:0}),save(){}};
 for(const n of ['neutral-config','board','bonds','template-rules','feature-system','progression','combat-features'])vm.runInContext(fs.readFileSync(path.join(root,'js/play',n+'.js'),'utf8'),s);
 const m=JSON.parse(JSON.stringify(M.NeutralConfig.manifest)),l=JSON.parse(JSON.stringify(Object.values(M.NeutralConfig.levels)[0]));
 const towers=l.units.filter(u=>u.kind==='tower'),hero=l.units.find(u=>u.kind==='hero');
 Object.assign(towers[0],{displayName:'守望棱塔',imageAsset:'tower-1',attack:11,range:10,interval:1.7,skill:'none',growth:1.5});
 Object.assign(towers[1],{displayName:'星辉工坊',imageAsset:'tower-5',kind:'economy',productionAmount:23,productionInterval:10,growth:1.2});
 Object.assign(hero,{displayName:'秘法先知',imageAsset:'hero-2',attack:7,range:10,interval:2,skill:'none'});
 m.systems.M8_balance.damage_model='equal';
 const c=M.Combat.create(l,m,m.cards.slice(0,4).map(c=>c.id),[]);c.bonds.effects={};
 return {M,m,l,c,tower:towers[0],economy:towers[1],hero};
}
test('real attacks preserve damage and cooldown while identifying actor, level and frozen target direction',()=>{
 const {M,c,tower,hero}=realCombat(),enemy={unitId:c.level.units.find(u=>u.kind==='enemy').id,x:0,y:2.5,hp:100,maxHp:100,segment:2,progress:.5};
 const t={unitId:tower.id,cardId:'card-a',x:1,y:1,level:2,cooldown:0,progressionMultiplier:1};c.towers=[t];c.enemies=[enemy];
 c._updateDefenders(.05);assert.equal(enemy.hp,83.5);assert.equal(t.cooldown,1.7);
 assert.equal(c.attackEvents[0].unitId,tower.id);assert.equal(c.attackEvents[0].level,2);assert.equal(c.attackEvents[0].assetKey,'tower-1');
 assert.equal(c.attackEvents[0].sourceId,'card-a@1,1');assert.equal(c.attackEvents[0].roleKey,'tower-1');
 c.towers=[];const h={unitId:hero.id,heroId:'hero-card',x:2,y:2,level:1,cooldown:0};c.heroes=[h];c._updateDefenders(.05);
 assert.equal(enemy.hp,76.5);assert.equal(h.cooldown,2);assert.equal(h.combatAction.direction,'left');
 enemy.x=10;assert.equal(h.combatAction.direction,'left');
 const a=M.DefenderAnimations.frameFor(h,c.elapsed+.1);assert.equal(a.mirror,true);
 c.result='win';const before=c.elapsed;c.update(.05);assert.equal(c.elapsed,before);
 assert.equal(M.DefenderAnimations.frameFor(h,c.elapsed+.1).frame,a.frame);
});
test('economy production emits only income event and leaves all enemy health and attack actions untouched',()=>{
 const {c,economy}=realCombat(),enemy={unitId:'enemy',x:1,y:1,hp:100,segment:2,progress:.5};
 c.towers=[{unitId:economy.id,cardId:'income-card',x:1,y:1,level:2,cooldown:0}];c.enemies=[enemy];c.gold=0;c.match.incomeMultiplier=1.25;
 c._updateDefenders(.05);assert.equal(enemy.hp,100);assert.equal(c.damageEvents.length,0);assert.equal(c.gold,23*1.2*1.25);assert.equal(c.towers[0].cooldown,10);
 assert.equal(c.attackEvents.length,1);assert.equal(c.attackEvents[0].type,'income');assert.equal(c.attackEvents[0].roleKey,'tower-5');assert.equal(c.towers[0].combatAction,null);
 c._updateDefenders(.05);assert.equal(c.attackEvents.length,1);
});
test('no target causes no new action and missing atlas image returns fallback',()=>{
 const {M,c,tower}=realCombat(),t={unitId:tower.id,cardId:'card-a',x:1,y:1,level:1,cooldown:0};c.towers=[t];c.enemies=[];c._updateDefenders(.05);
 assert.equal(c.attackEvents.length,0);assert.equal(t.combatAction,undefined);
 M.DefenderAnimations.record(t,tower,{x:2,y:2},'tower',0,{});assert.equal(M.DefenderAnimations.draw(()=>false,t,.1,0,0,100,100,1),false);
});

test('a missing atlas never falls back to an unrelated static hero image and gets incorrectly cropped',()=>{
 const s=setup(),M=s.M3,images={};M.NeutralConfig={manifest:{assetManifest:[{key:'hero-1',type:'image',url:'assets/hero.png'}]}};
 M.AssetManager={acquire(t,key,url){if(url==='assets/hero.png')images[key]={src:url};},loaded(key){return!!images[key];},get(key){return images[key];}};
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/texture-assets.js'),'utf8'),s);M.TextureAssets.configure({assetManifest:[]});
 assert.ok(Object.values(images).some(image=>image.src==='assets/hero.png'));assert.equal(M.TextureAssets.get('combat-tower-1-lv1-attack'),null);
});
test('bound effects stop after their named frames even when old generic effect duration is longer',()=>{
 const {M3:M}=setup(),event={duration:2};M.DefenderAnimations.record({x:0,y:0,level:1},unit('tower-1','守望棱塔','tower'),{x:2,y:1},'tower',0,event);
 assert.equal(event.duration,.4);event.age=.4;assert.equal(M.DefenderAnimations.effectFor(event),null);
});

function remoteManifest(M,base='https://cdn.example/release-a/') {
 const data=JSON.parse(JSON.stringify(M.CombatAtlasData)),assets=new Map();
 function visit(v){if(!v||typeof v!=='object')return;if(v.key&&v.frames){v.url=base+v.url;assets.set(v.key,{key:v.key,type:'image',url:v.url,version:'v1',lazy:true});}else Object.values(v).forEach(visit);}
 visit(data);return {presentation:{combatAnimations:data},assetManifest:[...assets.values()]};
}
test('remote descriptors drive directions, mirror and economy with no native combat subpackage request',async()=>{
 const s=setup({ks:{}}),M=s.M3,a=M.DefenderAnimations,decoded=[];let loads=0;
 M.SubpackageLoader={isLoaded(){return false;},load(){loads++;}};M.TextureAssets={waitFor(keys){decoded.push(...keys);return Promise.resolve();}};
 assert.equal(a.configure(remoteManifest(M)).error,null);
 await a.preload([unit('hero-2','秘法先知'),unit('tower-5','星辉工坊','economy')]);assert.equal(loads,0);assert.ok(decoded.includes('combat-hero-2-right-attack'));
 const actor={x:1,y:1,level:1};a.record(actor,unit('hero-2','秘法先知'),{x:0,y:1.5},'hero',0,{});
 assert.equal(a.frameFor(actor,0).mirror,true);assert.match(a.frameFor(actor,0).atlas.url,/^https:\/\/cdn.example/);
 const income={age:0};a.record(actor,unit('tower-5','星辉工坊','economy'),{x:1.5,y:1.5},'income',0,income);assert.equal(actor.combatAction,null);assert.equal(a.effectFor(income).group,'pulse');
});
test('malformed remote descriptions fail closed and never silently restore bundled animation',()=>{
 for(const mutate of [m=>m.presentation.combatAnimations=null,m=>m.presentation.combatAnimations.roles['hero-1'].directions.up.frames[0].rect[0]=99999,m=>m.assetManifest[0].url='https://different.example/a.png',m=>m.presentation.combatAnimations.roles['hero-1'].directions.up.width=Infinity,m=>m.presentation.combatAnimations.roles['hero-1'].directions.up.url='file:///tmp/test.png',m=>m.presentation.combatAnimations.roles['hero-1'].effectGroups.hit=[]]) {
  const {M3:M}=setup(),m=remoteManifest(M);mutate(m);const status=M.DefenderAnimations.configure(m);assert.equal(status.mode,'remote');assert.ok(status.error);assert.equal(M.DefenderAnimations.manifest.length,0);assert.equal(M.DefenderAnimations.roleFor(unit('hero-2','秘法先知')),null);
  M.DefenderAnimations.configure({});assert.equal(M.DefenderAnimations.manifest.length,86);
 }
});
test('switching release discards old actions and does not reuse texture handles when key and version are unchanged',async()=>{
 const s=setup(),M=s.M3,images={},urls=[];M.AssetManager={loaded(k){return !!images[k];},get(k){return images[k];},ready(k){return Promise.resolve(images[k]);}};
 M.CdnLoader={loadImage(k,url,group,opts){urls.push(url);images[k]={url};opts.onSuccess(images[k]);return Promise.resolve(images[k]);}};
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/texture-assets.js'),'utf8'),s);
 const key='combat-hero-2-right-attack',actor={x:1,y:1,level:1};
 M.TextureAssets.configure(remoteManifest(M));await M.TextureAssets.waitFor([key]);const first=M.TextureAssets.cacheKey(key);
 M.DefenderAnimations.record(actor,unit('hero-2','秘法先知'),{x:0,y:1.5},'hero',0,{});
 M.TextureAssets.configure(remoteManifest(M,'https://cdn.example/release-b/'));assert.equal(M.DefenderAnimations.frameFor(actor,0),null);await M.TextureAssets.waitFor([key]);
 assert.notEqual(M.TextureAssets.cacheKey(key),first);assert.match(M.TextureAssets.get(key).url,/release-b/);assert.ok(urls.some(u=>u.includes('release-a'))&&urls.some(u=>u.includes('release-b')));
});
test('failed remote texture loading resolves preload and leaves static rendering usable',async()=>{
 const {M3:M}=setup({ks:{}});M.DefenderAnimations.configure(remoteManifest(M));M.TextureAssets={waitFor(){return Promise.reject(new Error('offline'));}};
 await M.DefenderAnimations.preload([unit('hero-2','秘法先知')]);const actor={x:1,y:1,level:1};M.DefenderAnimations.record(actor,unit('hero-2','秘法先知'),{x:0,y:1.5},'hero',0,{});
 assert.equal(M.DefenderAnimations.draw(()=>false,actor,0,0,0,100,100,1),false);
});
test('remote fps controls attack, effect timing and resets on legacy fallback',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,m=remoteManifest(M),actor={x:0,y:0,level:1},u=unit('tower-1','守望棱塔','tower'),event={};m.presentation.combatAnimations.fps=20;assert.equal(a.configure(m).error,null);a.record(actor,u,{x:2,y:1},'tower',0,event);assert.equal(event.duration,.2);assert.equal(a.frameFor(actor,.05).frame.name.slice(-6),'02.png');event.age=.1;assert.equal(a.effectFor(event).group,'hit');assert.equal(a.frameFor(actor,.2),null);
 m.presentation.combatAnimations.fps=61;assert.ok(a.configure(m).error);a.configure({});a.record(actor,u,{x:2,y:1},'tower',0,event);assert.equal(event.duration,.4);
});
test('configured fps controls projectile travel endpoint and resource rise transition',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,m=remoteManifest(M),actor={x:0,y:0,level:1};m.presentation.combatAnimations.fps=20;a.configure(m);
 const e={age:.05,fromX:.5,fromY:.5,toX:4.5,toY:.5};a.record(actor,unit('tower-1','守望棱塔','tower'),{x:4.5,y:.5},'tower',0,e);
 function drawnCenter(event){const f=a.effectFor(event),calls=[];assert.ok(a.drawEffect((...args)=>{calls.push(args);return true;},event,{x:0,y:0},100));const fr=f.frame;return [calls[0][1]-fr.offset[0]*140/fr.source[0]+70,calls[0][2]-fr.offset[1]*140/fr.source[1]+70];}
 assert.ok(Math.abs(drawnCenter(e)[0]-250)<1e-8);e.age=.1;assert.ok(Math.abs(drawnCenter(e)[0]-450)<1e-8);
 const income={age:.1,fromX:.5,fromY:.5,toX:.5,toY:.5};a.record(actor,unit('tower-5','星辉工坊','economy'),{x:.5,y:.5},'income',0,income);assert.ok(Math.abs(drawnCenter(income)[1]-50)<1e-8);income.age=.15;assert.ok(Math.abs(drawnCenter(income)[1]-47)<1e-8);
});
