 'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function setup(extra={}){const s={console,Promise,...extra};s.window=s;s.M3={};vm.createContext(s);vm.runInContext(fs.readFileSync(path.join(root,'js/render/defender-animations.js'),'utf8'),s);s.M3.DefenderAnimations.configure(remoteManifest(s.M3));return s;}
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
 assert.equal(a.effectFor(e),null);assert.equal(a.drawEffect(()=>{throw Error('released early');},e,{x:0,y:0},100),true);
 e.age=.1;assert.equal(a.effectFor(e).group,'projectile');e.age=.35;assert.equal(a.effectFor(e).group,'hit');e.age=.5;assert.equal(a.effectFor(e),null);
 const income={age:0,duration:.4};a.record(actor,unit('tower-5','星辉工坊','economy'),{x:.5,y:.5},'income',0,income);
 assert.equal(actor.combatAction,null);assert.equal(a.effectFor(income).group,'pulse');income.age=.25;assert.equal(a.effectFor(income).group,'resource');
 assert.equal(a.draw(()=>false,actor,0,0,0,50,50,1),false);
});
test('combat atlas textures register lazily without decoding the entire package at startup',()=>{
 const s=setup(),M=s.M3,acquired=[];M.AssetManager={acquire(t,k,url){acquired.push(url);},loaded(){return false;}};
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/texture-assets.js'),'utf8'),s);
 M.TextureAssets.configure(remoteManifest(M));M.TextureAssets.loadRemaining();assert.equal(acquired.length,0);
 assert.equal(M.DefenderAnimations.manifest.length,86);assert.ok(M.TextureAssets.has('combat-tower-1-lv1-attack'));
});
test('native remote loading never requests a local combat package and retries images on the next battle',async()=>{
 const s=setup({ks:{}}),M=s.M3,decoded=[];let offline=true;
 M.SubpackageLoader={load(){throw Error('local combat package must not be requested');}};
 M.TextureAssets={waitFor(keys){decoded.push(...keys);return offline?Promise.reject(Error('offline')):Promise.resolve();}};
 await M.DefenderAnimations.preload([unit('tower-4','震荡重炮','tower')]);assert.equal(decoded.length,2);
 offline=false;await M.DefenderAnimations.preload([unit('tower-4','震荡重炮','tower')]);
 assert.deepEqual(decoded,['combat-tower-4-lv1-attack','combat-tower-4-lv1-effects','combat-tower-4-lv1-attack','combat-tower-4-lv1-effects']);
});
test('selected battle atlases include hero idle and every direction; upgrades prefetch their own level',async()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,keys=a.requiredKeys([unit('hero-2','秘法先知'),unit('tower-4','震荡重炮','tower'),unit('tower-5','星辉工坊','economy')]);
 assert.equal(keys.length,7);
 for(const direction of ['up','down','right'])assert.ok(keys.includes('combat-hero-2-'+direction+'-attack'));
 assert.ok(keys.includes('combat-tower-4-lv1-attack'));
 assert.ok(keys.includes('combat-tower-5-lv1-effects'));
 assert.ok(!keys.includes('combat-tower-5-lv1-attack'));
 const loaded=[];M.TextureAssets={waitFor(list){loaded.push(...list);return Promise.resolve();}};
 await a.prefetchUpgrade(unit('tower-4','震荡重炮','tower'),2);
 assert.deepEqual(loaded,['combat-tower-4-lv2-attack','combat-tower-4-lv2-effects']);
});
test('native image decode failure can be retried with the same combat key',async()=>{
 let fail=true,attempts=0;
 const s=setup({ks:{createImage(){const img={};Object.defineProperty(img,'src',{set(url){if(!url)return;attempts++;Promise.resolve().then(()=>{if(fail){fail=false;img.onerror(new Error('decode failed'));}else img.onload();});}});return img;}}});
 const M=s.M3,key='combat-tower-4-lv1-attack';
 for(const file of ['standard/asset-manager.js','standard/cdn-loader.js','js/render/texture-assets.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
 M.TextureAssets.configure(remoteManifest(M));
 await assert.rejects(M.TextureAssets.waitFor([key]),error=>error.assetKey===key&&error.url.endsWith(key+'.png')&&error.reason==='decode failed');
 await M.TextureAssets.waitFor([key]);
 assert.equal(attempts,2);assert.ok(M.TextureAssets.get(key));
});
test('a failed in-battle preload is requested again on the next attack',async()=>{
 const {M3:M}=setup(),loaded=[];let fail=true;
 M.TextureAssets={waitFor(keys){loaded.push(...keys);if(fail&&keys[0].endsWith('attack')){fail=false;return Promise.reject(new Error('offline'));}return Promise.resolve();}};
 const u=unit('tower-4','震荡重炮','tower'),a=M.DefenderAnimations;
 await a.preload([u]);
 const actor={x:0,y:0,level:1};a.record(actor,u,{x:2,y:2},'tower',0,{});
 await new Promise(setImmediate);
 assert.equal(loaded.filter(key=>key==='combat-tower-4-lv1-attack').length,2);
});
test('release entries use CDN combat metadata and do not declare the development combat package',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),native=fs.readFileSync(path.join(root,'js/main.js'),'utf8');
 for(const entry of [html,native]){assert.ok(!entry.includes('combat-atlas-data.js'));assert.ok(entry.indexOf('defender-animations.js')<entry.indexOf('texture-assets.js'));}
 const config=JSON.parse(fs.readFileSync(path.join(root,'game.json'),'utf8'));assert.ok(!config.subpackages.some(p=>p.name==='combat'));
 assert.ok(!fs.existsSync(path.join(root,'subpackages/combat')));
 assert.ok(!fs.existsSync(path.join(root,'js/render/combat-atlas-data.js')));
});
test('missing CDN combat metadata uses static fallback without requesting a removed package',async()=>{
 const s={console,Promise,ks:{}};s.window=s;s.M3={CombatAtlasData:{roles:{legacy:{}}},SubpackageLoader:{load(){throw new Error('must not load local combat');}}};vm.createContext(s);
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/defender-animations.js'),'utf8'),s);
 const a=s.M3.DefenderAnimations;assert.equal(a.configure({assetManifest:[]}).mode,'static');
 assert.equal(a.manifest.length,0);assert.equal(await a.preload([unit('tower-4','震荡重炮','tower')]),false);
 assert.equal(a.draw(()=>{throw new Error('no atlas expected');},{},0,0,0,64,64,1),false);
});
test('heroes start facing down and keep the first frame of their last attack direction when idle',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations;
 for(const [key,name] of [['hero-1','前线守望者'],['hero-2','秘法先知'],['hero-3','远征先锋']]){
  const u=unit(key,name),actor={x:1,y:1,level:1},idle=[];
  assert.equal(a.draw((...args)=>{idle.push(args);return true;},actor,0,0,0,100,100,1,u),true);
  assert.equal(idle[0][0],'combat-'+key+'-down-attack');assert.equal(actor.combatAction,undefined);
  for(const [dir,target] of Object.entries({up:{x:1.5,y:-2},down:{x:1.5,y:4},left:{x:-2,y:1.5},right:{x:4,y:1.5}})){
   a.record(actor,u,target,'hero',1,{});const action=JSON.stringify(actor.combatAction),first=[],rest=[];
   assert.equal(actor.combatAction.direction,dir);
   a.draw((...args)=>{first.push(args);return true;},actor,1,0,0,100,100,1,u);
   a.draw((...args)=>{rest.push(args);return true;},actor,10,0,0,100,100,1,u);
   assert.deepEqual(rest[0],first[0]);assert.equal(JSON.stringify(actor.combatAction),action);assert.equal(a.frameFor(actor,10),null);
   assert.equal(a.draw(()=>false,actor,10,0,0,100,100,1,u),false);
  }
 }
});
test('idle direction ignores actions from an older release or a different artwork role',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,u=unit('hero-1','前线守望者'),actor={x:1,y:1,level:1};
 a.record(actor,u,{x:4,y:1.5},'hero',1,{});a.configure(remoteManifest(M));
 const calls=[];a.draw((...args)=>{calls.push(args);return true;},actor,10,0,0,100,100,1,u);assert.equal(calls[0][0],'combat-hero-1-down-attack');
 a.record(actor,u,{x:4,y:1.5},'hero',1,{});calls.length=0;
 a.draw((...args)=>{calls.push(args);return true;},actor,10,0,0,100,100,1,unit('hero-3','远征先锋'));assert.equal(calls[0][0],'combat-hero-3-down-attack');
});
test('unmatched heroes, unavailable images and missing or invalid metadata preserve static fallback; towers do not acquire hero idle poses',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,noDraw=()=>{throw Error('unexpected atlas');};
 assert.equal(a.draw(noDraw,{},0,0,0,100,100,1,unit('hero-1','其他主题英雄')),false);
 assert.equal(a.draw(noDraw,{},0,0,0,100,100,1,unit('tower-1','守望棱塔','tower')),false);
 assert.equal(a.draw(()=>false,{},0,0,0,100,100,1,unit('hero-1','前线守望者')),false);
 for(const m of [{},{presentation:{combatAnimations:null}}]){a.configure(m);assert.equal(a.draw(noDraw,{},0,0,0,100,100,1,unit('hero-1','前线守望者')),false);}
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
test('upgrading a real tower requests the new attack and effect atlases',async()=>{
 const {M,c,tower}=realCombat(),loaded=[];
 M.TextureAssets={waitFor(keys){loaded.push(...keys);return Promise.resolve();}};
 tower.levelCap=6;tower.upgradeCost=50;c.gold=1000;
 const placed={unitId:tower.id,cardId:'card-a',x:1,y:1,level:1};
 c.towers=[placed];c.selectedTower=placed;
 assert.equal(c.upgradeSelected(),true);
 await new Promise(setImmediate);
 assert.equal(placed.level,2);
 assert.deepEqual(loaded.slice(-2),['combat-tower-1-lv2-attack','combat-tower-1-lv2-effects']);
});
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
 assert.equal(c.view().units[hero.id],hero);
});
test('economy production emits only income event and leaves all enemy health and attack actions untouched',()=>{
 const {c,economy}=realCombat(),enemy={unitId:'enemy',x:1,y:1,hp:100,segment:2,progress:.5};
 c.towers=[{unitId:economy.id,cardId:'income-card',x:1,y:1,level:2,cooldown:0}];c.enemies=[enemy];c.gold=0;c.match.incomeMultiplier=1.25;
 c._updateDefenders(.05);assert.equal(enemy.hp,100);assert.equal(c.damageEvents.length,0);assert.equal(c.gold,23*1.2*1.25);assert.equal(c.towers[0].cooldown,10);
 assert.equal(c.attackEvents.length,1);assert.equal(c.attackEvents[0].type,'income');assert.equal(c.attackEvents[0].roleKey,'tower-5');assert.equal(c.towers[0].combatAction,null);
 c._updateDefenders(.05);assert.equal(c.attackEvents.length,1);
});
test('enemy kills keep their reward and fade without creating or updating legacy particles',()=>{
 const {M,c}=realCombat(),u=c.level.units.find(u=>u.kind==='enemy'),e={unitId:u.id,x:.5,y:.5,hp:0,maxHp:1},gold=c.gold;
 M.DeathParticles={matches(){throw Error('legacy emitter used');},create(){throw Error('legacy emitter used');},update(){throw Error('legacy emitter used');}};
 c.enemies=[e];c._updateEnemies(.01);assert.equal(e.dying,true);
 assert.equal(c.gold,Math.min(c.level.economy.resourceCap,gold+(u.killReward||0)*c.match.incomeMultiplier));
 const paid=c.gold;c.update(.05);assert.equal(c.gold,paid);assert.ok(e.deathAge>0);
 c._updateEnemies(.5);assert.ok(!c.enemies.includes(e));assert.equal(c.view().deathEffects,undefined);
});
test('no target causes no new action and missing atlas image returns fallback',()=>{
 const {M,c,tower}=realCombat(),t={unitId:tower.id,cardId:'card-a',x:1,y:1,level:1,cooldown:0};c.towers=[t];c.enemies=[];c._updateDefenders(.05);
 assert.equal(c.attackEvents.length,0);assert.equal(t.combatAction,undefined);
 M.DefenderAnimations.record(t,tower,{x:2,y:2},'tower',0,{});assert.equal(M.DefenderAnimations.draw(()=>false,t,.1,0,0,100,100,1),false);
});
test('lethal hits keep the enemy fully present until impact while damage and reward are counted only once',()=>{
 const {M,c,tower}=realCombat(),u=c.level.units.find(u=>u.kind==='enemy'),e={unitId:u.id,x:2.5,y:2.5,hp:1,maxHp:1,segment:2,progress:.5};
 c._updateWaves=()=>{};c.towers=[{unitId:tower.id,cardId:'card-a',x:1,y:1,level:1,cooldown:0}];c.enemies=[e];
 const gold=c.gold;c._updateDefenders(0);const attack=c.attackEvents[0];assert.equal(e.hp,0);assert.ok(Math.abs(attack.impactDelay-.3)<1e-8);
 c._updateEnemies(0);const reward=c.gold;assert.equal(reward,Math.min(c.level.economy.resourceCap,gold+(u.killReward||0)*c.match.incomeMultiplier));
 for(let i=0;i<5;i++)c.update(.05);
 assert.ok(e.deathHold>0);assert.equal(e.deathAge,0);assert.ok(c.enemies.includes(e));assert.ok(c.damageEvents[0].age<0);
 c.update(.05);assert.ok(e.deathHold<1e-8);assert.ok(e.deathAge<1e-8);assert.equal(M.DefenderAnimations.effectFor(attack).group,'hit');assert.equal(c.damageEvents[0].age,0);
 const before=c.elapsed;c.result='paused-test';c.update(.05);assert.equal(c.elapsed,before);c.result=null;
 c.update(.05);assert.ok(e.deathAge>0);assert.equal(c.gold,reward);
 for(let i=0;i<10;i++)c.update(.05);assert.ok(!c.enemies.includes(e));assert.equal(c.gold,reward);
});
test('projectiles and damage labels follow movement until impact, then freeze at the same collision point',()=>{
 const {c,tower}=realCombat(),e={unitId:c.level.units.find(u=>u.kind==='enemy').id,x:2,y:2,hp:100,maxHp:100};
 const attack=c._recordAttack({unitId:tower.id,x:0,y:0,level:1},e,'tower');c._dealDamage(e,10,attack);
 e.x=3;e.y=4;c._updateVisualEvents(.15);assert.equal(attack.toX,3);assert.equal(attack.toY,4);assert.ok(c.damageEvents[0].age<0);
 e.x=4;e.y=5;c._updateVisualEvents(.15);assert.equal(attack.target,null);assert.equal(attack.toX,4);assert.equal(c.damageEvents[0].x,4);assert.equal(c.damageEvents[0].y,5);
 e.x=20;e.y=20;c._updateVisualEvents(.05);assert.equal(attack.toX,4);assert.equal(attack.toY,5);assert.equal(c.damageEvents[0].x,4);
});
test('a lethal target continues walking and turning during flight, then stops at the actual hit point',()=>{
 const {c,tower}=realCombat(),u=c.level.units.find(u=>u.kind==='enemy');u.speed=2;c.level.map.speedMultiplier=1;
 c.board.path=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:2,y:1}];c._updateWaves=()=>{};
 const enemy={unitId:u.id,x:1.3,y:.5,hp:1,maxHp:1,segment:0,progress:.8,moveX:1,moveY:0};c.enemies=[enemy];
 const attack=c._recordAttack({unitId:tower.id,x:0,y:0,level:1},enemy,'tower');c._dealDamage(enemy,1,attack);
 c.update(.05);assert.ok(enemy.x>1.3);assert.ok(enemy.deathHold>0);assert.equal(enemy.deathFrameTime,undefined);
 c.update(.05);c.update(.05);assert.equal(enemy.segment,1);assert.equal(enemy.moveX,0);assert.equal(enemy.moveY,1);assert.ok(enemy.y>.5);assert.equal(attack.toY,enemy.y);
 for(let i=0;i<3;i++)c.update(.05);
 assert.equal(enemy.deathHold,0);assert.ok(Math.abs(enemy.deathFrameTime-.3)<1e-8);assert.equal(attack.toX,enemy.x);assert.equal(attack.toY,enemy.y);
 const position=[enemy.x,enemy.y];c.update(.05);assert.deepEqual([enemy.x,enemy.y],position);assert.ok(enemy.deathAge>0);
});
test('a defeated enemy reaching the goal while awaiting impact cannot deal base damage or pay twice',()=>{
 const {c,tower}=realCombat(),u=c.level.units.find(u=>u.kind==='enemy');u.speed=4;c.level.map.speedMultiplier=1;
 c.board.path=[{x:0,y:0},{x:1,y:0}];c._updateWaves=()=>{};
 const enemy={unitId:u.id,x:1.4,y:.5,hp:1,maxHp:1,segment:0,progress:.9,moveX:1,moveY:0};c.enemies=[enemy];
 const hp=c.baseHp,attack=c._recordAttack({unitId:tower.id,x:0,y:0,level:1},enemy,'tower');c._dealDamage(enemy,1,attack);
 c.update(.05);const gold=c.gold;assert.equal(enemy.segment,1);assert.equal(enemy.x,1.5);
 for(let i=0;i<18;i++)c.update(.05);
 assert.equal(c.baseHp,hp);assert.equal(c.gold,gold);assert.ok(!c.enemies.includes(enemy));
});
test('splash deaths share impact timing and direct damage without a projectile keeps its immediate fade',()=>{
 const {c,tower}=realCombat(),u=c.level.units.find(u=>u.kind==='enemy'),a={unitId:u.id,x:2.5,y:2.5,hp:1,maxHp:1,segment:2,progress:.5},b={...a,x:2.6};
 tower.skill='splash';tower.skillPower=1;c.towers=[{unitId:tower.id,x:1,y:1,level:1,cooldown:0}];c.enemies=[a,b];c._updateDefenders(0);
 assert.equal(a.hp,0);assert.equal(b.hp,0);c._updateEnemies(0);assert.equal(a.deathHold,b.deathHold);assert.ok(a.deathHold>0);
 const direct={unitId:u.id,x:2,y:2,hp:1,maxHp:1};c.enemies=[direct];c._dealDamage(direct,1);c._updateEnemies(0);assert.equal(direct.deathHold,0);c._updateEnemies(.1);assert.equal(direct.deathAge,.1);
});

test('a missing atlas never falls back to an unrelated static hero image and gets incorrectly cropped',()=>{
 const s=setup(),M=s.M3,images={};M.NeutralConfig={manifest:{assetManifest:[{key:'hero-1',type:'image',url:'assets/hero.png'}]}};
 M.AssetManager={acquire(t,key,url){if(url==='assets/hero.png')images[key]={src:url};},loaded(key){return!!images[key];},get(key){return images[key];}};
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/texture-assets.js'),'utf8'),s);M.TextureAssets.configure(remoteManifest(M));
 assert.ok(Object.values(images).some(image=>image.src==='assets/hero.png'));assert.equal(M.TextureAssets.get('combat-tower-1-lv1-attack'),null);
});
test('bound effects stop after their named frames even when old generic effect duration is longer',()=>{
 const {M3:M}=setup(),event={duration:2};M.DefenderAnimations.record({x:0,y:0,level:1},unit('tower-1','守望棱塔','tower'),{x:2,y:1},'tower',0,event);
 assert.equal(event.duration,.5);event.age=.5;assert.equal(M.DefenderAnimations.effectFor(event),null);
});

function remoteManifest(M,base='https://cdn.example/release-a/') {
 // Synthetic server descriptors exercise the contract without shipping real artwork or frame data.
 const roles={},assets=new Map();
 function atlas(key){const frames=Array.from({length:4},(_,i)=>({name:key+'_'+String(i+1).padStart(2,'0')+'.png',rect:[(i%2)*64,Math.floor(i/2)*80,64,80],offset:[11,13],source:[258,258]}));const a={key,url:base+key+'.png',width:128,height:160,frames};assets.set(key,{key,type:'image',url:a.url,version:'v1',lazy:true});return a;}
 function effects(v,key,economy){v.effects=atlas(key);v.effectGroups=economy?{pulse:v.effects.frames.slice(0,2),resource:v.effects.frames.slice(2)}:{projectile:v.effects.frames.slice(0,2),hit:v.effects.frames.slice(2)};}
 ['守望棱塔','穿云弩台','秘法尖塔','震荡重炮','星辉工坊','远征哨塔'].forEach((name,i)=>{const key='tower-'+(i+1),role=roles[key]={name,kind:'tower',economy:i===4,levels:{}};for(let level=1;level<=6;level++){const v=role.levels[level]={attack:atlas('combat-'+key+'-lv'+level+'-attack')};effects(v,'combat-'+key+'-lv'+level+'-effects',role.economy);}});
 ['前线守望者','秘法先知','远征先锋'].forEach((name,i)=>{const key='hero-'+(i+1),role=roles[key]={name,kind:'hero',economy:false,directions:{}};for(const d of ['up','down','right','left']){if(i===1&&d==='left')role.directions.left={...role.directions.right,mirror:true};else role.directions[d]=atlas('combat-'+key+'-'+d+'-attack');}effects(role,'combat-'+key+'-effects',false);});
 return {presentation:{combatAnimations:{schemaVersion:1,sourceCommit:'test-server-release',roles}},assetManifest:[...assets.values()]};
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
  M.DefenderAnimations.configure({});assert.equal(M.DefenderAnimations.manifest.length,0);assert.equal(M.DefenderAnimations.status().mode,'static');
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
 const {M3:M}=setup(),a=M.DefenderAnimations,m=remoteManifest(M),actor={x:0,y:0,level:1},u=unit('tower-1','守望棱塔','tower'),event={};m.presentation.combatAnimations.fps=20;assert.equal(a.configure(m).error,null);a.record(actor,u,{x:2,y:1},'tower',0,event);assert.equal(event.duration,.25);assert.equal(a.frameFor(actor,.05).frame.name.slice(-6),'02.png');event.age=.15;assert.equal(a.effectFor(event).group,'hit');assert.equal(a.frameFor(actor,.2),null);
 m.presentation.combatAnimations.fps=61;assert.ok(a.configure(m).error);a.configure(remoteManifest(M));a.record(actor,u,{x:2,y:1},'tower',0,event);assert.equal(event.duration,.5);
});
test('configured fps controls projectile travel endpoint and resource rise transition',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,m=remoteManifest(M),actor={x:0,y:0,level:1};m.presentation.combatAnimations.fps=20;a.configure(m);
 const e={age:.1,fromX:.5,fromY:.5,toX:4.5,toY:.5};a.record(actor,unit('tower-1','守望棱塔','tower'),{x:4.5,y:.5},'tower',0,e);
 function drawnCenter(event){const f=a.effectFor(event),calls=[];assert.ok(a.drawEffect((...args)=>{calls.push(args);return true;},event,{x:0,y:0},100));const fr=f.frame;return [calls[0][1]-fr.offset[0]*140/fr.source[0]+70,calls[0][2]-fr.offset[1]*140/fr.source[1]+70];}
 assert.ok(Math.abs(drawnCenter(e)[0]-250)<1e-8);e.age=.15;assert.ok(Math.abs(drawnCenter(e)[0]-450)<1e-8);
 const income={age:.1,fromX:.5,fromY:.5,toX:.5,toY:.5};a.record(actor,unit('tower-5','星辉工坊','economy'),{x:.5,y:.5},'income',0,income);assert.ok(Math.abs(drawnCenter(income)[1]-50)<1e-8);income.age=.15;assert.ok(Math.abs(drawnCenter(income)[1]-47)<1e-8);
});

function rendererFixture(animated=false){
 const portraits=[],actions=[],cards=[],M={};const s={window:{M3:M},Float32Array};vm.createContext(s);
 vm.runInContext(fs.readFileSync(path.join(root,'js/render/combat-projection.js'),'utf8'),s);
 M.DefenderAnimations={draw(...args){actions.push(args);return animated;}};
 M.recordPortrait=(...args)=>{portraits.push(args);return true;};M.recordCard=(...args)=>cards.push(args);
 const source=fs.readFileSync(path.join(root,'js/render/renderer.js'),'utf8'),hooks=`
 M3.testWorld=obliqueWorld;M3.testBattle=battle;M3.testCard=battleDeploymentCard;
 imageAssetContain=M3.recordPortrait;
 gl={drawingBufferWidth:414,drawingBufferHeight:896,enable:function(){},disable:function(){},scissor:function(){}};
 groundShadow=remoteTerrain=drawRect=battleArmor=mapLabel=battlePrice=battleEnvironment=battleBackdrop=battleFieldGround=battleOuterArmor=battleCommand=battleMessagePanel=battleInspection=function(){};
 obliqueWorld=function(){};battleDeploymentCard=M3.recordCard;
 `;
 vm.runInContext(source.replace(/\}\)\(\);\s*$/,hooks+'})();'),s);
 const c={board:{width:8,height:6,tile:()=> 'grass',level:{map:{}}},elapsed:0,towers:[],heroes:[],enemies:[],unitAssets:{'hero-2':'hero-current','tower-6':'tower-current'},units:{'hero-2':unit('hero-current','当前英雄')},unitLevelAssets:{'tower-6':['tower-lv1-current','tower-lv2-current']},attackEvents:[],damageEvents:[],deckIds:[],heroIds:[],heroUnits:{},heroNames:{},heroAssets:{},cardUnits:{},cardNames:{},cardAssets:{},cardCosts:{}};
 const l={w:414,h:896,top:0,usable:896,heroBarY:650,board:{x:0,y:150,w:414,h:460},battleHeroCard:()=>({x:0,y:650,w:280,h:90}),battleTowerCard:()=>({x:0,y:750,w:90,h:140})};
 return{M,c,l,portraits,actions,cards};
}
test('RuntimeConfig retains server animation metadata through normalization and TextureAssets configuration',async()=>{
 const s=setup(),M=s.M3;for(const file of ['js/play/neutral-config.js','js/play/config-validator.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
 const m=JSON.parse(JSON.stringify(M.NeutralConfig.manifest)),remote=remoteManifest(M);
 m.presentation.combatAnimations=remote.presentation.combatAnimations;m.assetManifest.push(...remote.assetManifest);
 const levels=JSON.parse(JSON.stringify(M.NeutralConfig.levels));
 Object.keys(m.levels).forEach(id=>{m.levels[id].url='https://config.test/levels/'+id;});
 const requests=[];let clock=1234;s.Date={now:()=>clock};
 s.RUNTIME_CONFIG_ENDPOINTS={manifestUrl:'https://config.test/manifest?channel=live#preview',levelUrlTemplate:'https://config.test/levels/{levelId}'};
 s.KwaiNetwork={request(opts){requests.push(opts.url);const url=opts.url.split('?')[0],body=url.endsWith('/manifest')?m:levels[url.split('/').pop()];opts.onSuccess({statusCode:200,data:JSON.parse(JSON.stringify(body))});}};
 vm.runInContext(fs.readFileSync(path.join(root,'js/play/runtime-config.js'),'utf8'),s);
 await new Promise(resolve=>M.RuntimeConfig.init(resolve,{initialLevelCount:1}));
 assert.equal(M.RuntimeConfig.getSource(),'remote');
 const accepted=M.RuntimeConfig.getManifest();assert.equal(accepted.presentation.combatAnimations.sourceCommit,'test-server-release');
 assert.equal(M.DefenderAnimations.configure(accepted).error,null);assert.equal(M.DefenderAnimations.manifest.length,86);
 assert.equal(requests[0],'https://config.test/manifest?channel=live&_runtime=1234');
 assert.ok(requests.slice(1).every(url=>!url.includes('_runtime=')));
 clock=4567;await new Promise(resolve=>M.RuntimeConfig.init(resolve,{initialLevelCount:1}));
 assert.ok(requests.includes('https://config.test/manifest?channel=live&_runtime=4567'));
});
test('body release delay is respected across coarse updates and frozen direction survives movement and upgrades',()=>{
 const {M3:M}=setup(),a=M.DefenderAnimations,actor={x:0,y:0,level:1},u=unit('tower-1','守望棱塔','tower'),e={age:0};
 a.record(actor,u,{x:3,y:.5},'tower',0,e);assert.equal(e.effectDelay,.1);assert.equal(e.duration,.5);
 e.age=.05;assert.equal(a.effectFor(e),null);e.age=.11;assert.equal(a.effectFor(e).group,'projectile');
 actor.level=6;assert.match(a.frameFor(actor,.15).atlas.key,/lv1-attack/);
 const next={age:.11};a.record(actor,u,{x:-3,y:.5},'tower',1,next);assert.match(a.frameFor(actor,1.1).atlas.key,/lv6-attack/);assert.equal(e.direction,'right');assert.equal(next.direction,'left');
 e.age=.31;assert.equal(a.effectFor(e).group,'hit');e.age=1;assert.equal(a.effectFor(e),null);
});
test('battle models use configured hero artwork and tower level assets rather than numeric-ID skins',()=>{
 const {M,c,l,portraits}=rendererFixture();c.heroes=[{unitId:'hero-2',x:1,y:1}];c.towers=[{unitId:'tower-6',x:2,y:2,level:2}];
 M.testWorld(l,{combat:c});assert.deepEqual(portraits.map(a=>a[0]),['hero-current','tower-lv2-current']);
 assert.equal(portraits[1][3],portraits[1][4]);portraits.length=0;c.unitAssets['hero-2']='hero-next-theme';c.unitLevelAssets['tower-6'][1]='tower-next-theme';
 M.testWorld(l,{combat:c});assert.deepEqual(portraits.map(a=>a[0]),['hero-next-theme','tower-next-theme']);
});
test('renderer passes the current hero definition to playback and renders remote sprite effects',()=>{
 const {M,c,l,portraits,actions}=rendererFixture(true);let effects=0;
 c.heroes=[{unitId:'hero-2',x:1,y:1}];
 c.deathEffects=[{particles:[{}]}];M.DeathParticles={draw(){throw Error('legacy particle overlay used');}};
 c.attackEvents=[{type:'hero',age:.1,duration:.4,fromX:.5,fromY:.5,toX:1.5,toY:1.5}];
M.DefenderAnimations.drawEffect=()=>{effects++;return true;};
 M.testWorld(l,{combat:c});assert.equal(portraits.length,0);assert.equal(actions[0][8],c.units['hero-2']);assert.equal(effects,1);
});
test('battle cards honor configured portraits and use configured model assets when portraits are absent',()=>{
 const {M,c,l,cards,portraits}=rendererFixture();
 c.heroIds=['support'];c.heroUnits.support='hero-2';c.heroNames.support='当前英雄';c.heroAssets.support='hero-portrait';
 c.deckIds=['artillery'];c.cardUnits.artillery='tower-6';c.cardNames.artillery='当前防御塔';c.cardCosts.artillery=100;c.cardAssets.artillery='tower-portrait';
 M.testBattle(l,{combat:c});assert.deepEqual(cards.map(a=>[a[1],a[5]]),[['hero-portrait',true],['tower-portrait',false]]);
 for(const card of cards)M.testCard(...card);assert.deepEqual(portraits.map(a=>a[0]),['hero-portrait','tower-portrait']);
 delete c.heroAssets.support;delete c.cardAssets.artillery;cards.length=0;M.testBattle(l,{combat:c});
 assert.deepEqual(cards.map(a=>a[1]),['hero-current','tower-lv1-current']);
});
