'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
function setup() {
  const s = { window: { M3: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/render/enemy-animations.js'), 'utf8'), s);
  return s.window.M3;
}
test('spider movement follows named frame order, loops and freezes at a fixed combat time', () => {
  const a = setup().EnemyAnimations, e = { unitId: 'enemy-1' };
  assert.deepEqual([0,.125,.25,.375,.5].map(t => a.frameFor('monster-1', e, t).name), ['move-01.png','move-02.png','move-03.png','move-04.png','move-01.png']);
  assert.equal(a.frameFor('monster-1', e, .25), a.frameFor('monster-1', e, .25));
  assert.equal(a.frameFor('monster-2', e, .25), null);
  assert.equal(a.frameFor('monster-1', { unitId: 'enemy-1', dying: true }, .25), null);
});
test('atlas UVs and trimmed offsets preserve original sprite canvas without stretching the atlas', () => {
  const a = setup().EnemyAnimations, calls = [];
  assert.equal(a.draw((...args) => { calls.push(args); return true; }, 'monster-1', { unitId: 'enemy-1' }, .125, 10, 20, 258, 258, 1), true);
  const args = calls[0];
  assert.deepEqual(args.slice(0,5), ['monster-1-move-atlas',14,36,248,235]);
  assert.deepEqual(args.slice(5,9), [761/1024,1,1009/1024,1-235/256]);
  assert.equal(a.draw(() => false, 'monster-1', { unitId: 'enemy-1' }, 0, 0, 0, 50, 50, 1), false);
});
test('shared texture pipeline registers bundled movement atlas alongside a remote manifest', () => {
  const M3 = setup(), images = {}, acquired = [];
  M3.AssetManager = {
    acquire(type,key,url) { acquired.push(url); images[key]={src:url}; },
    loaded(key) { return !!images[key]; }, get(key) { return images[key]; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/render/texture-assets.js'), 'utf8'), {window:{M3}});
  M3.TextureAssets.configure({ assetManifest: [] });
  assert.ok(acquired.includes('subpackages/monsters/assets/Image/enemies/spider_move.png'));
  assert.equal(M3.TextureAssets.get('monster-1-move-atlas').src, 'subpackages/monsters/assets/Image/enemies/spider_move.png');
});


test('actual combat view advances movement frames and preserves frame when simulation is paused', () => {
  const M3 = setup(), context = { window: { M3 }, console };
  for (const file of ['neutral-config','template-rules','feature-system','bonds','board','combat','combat-features']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/play', file + '.js'), 'utf8'), context);
  }
  const manifest = M3.NeutralConfig.manifest;
  const level = JSON.parse(JSON.stringify(M3.NeutralConfig.levels[manifest.worldMap.nodes[0].levelId]));
  const combat = M3.Combat.create(level, manifest, manifest.cards.slice(0,4).map(c => c.id), []);
  const enemy = { unitId: 'enemy-1' };
  const first = M3.EnemyAnimations.frameFor('monster-1', enemy, combat.view().elapsed).name;
  for (let i=0;i<3;i++) combat.update(.05);
  assert.equal(combat.view().elapsed, combat.elapsed);
  assert.notEqual(M3.EnemyAnimations.frameFor('monster-1', enemy, combat.view().elapsed).name, first);
  const paused = M3.EnemyAnimations.frameFor('monster-1', enemy, combat.view().elapsed).name;
  assert.equal(M3.EnemyAnimations.frameFor('monster-1', enemy, combat.view().elapsed).name, paused);
});

test('horizontal movement selects separate left and right atlases, vertical stays frontal', () => {
  const a=setup().EnemyAnimations,calls=[];
  const right={unitId:'enemy-1',moveX:1,moveY:0},left={unitId:'enemy-1',moveX:-1,moveY:0};
  assert.equal(a.frameFor('monster-1',right,.125).name,'monster-1-right-02.png');
  assert.equal(a.frameFor('monster-1',{unitId:'enemy-1',moveX:0,moveY:1},.125).name,'move-02.png');
  a.draw((...args)=>{calls.push(args);return true;},'monster-1',right,.125,0,0,256,256,1);
  a.draw((...args)=>{calls.push(args);return true;},'monster-1',left,.125,0,0,256,256,1);
  assert.equal(calls[0][0],'monster-1-right-move-atlas');
  assert.deepEqual(calls[0].slice(5,9),[246/1024,1,486/1024,1-166/256]);
  assert.equal(calls[1][0],'monster-1-left-move-atlas');
  assert.deepEqual(calls[1].slice(5,9),[246/1024,1,486/1024,1-166/256]);
});
test('side texture not ready falls back to an animated front frame', () => {
  const a=setup().EnemyAnimations,keys=[];
  const result=a.draw((key)=>{keys.push(key);return key==='monster-1-move-atlas';},'monster-1',{unitId:'enemy-1',moveX:1,moveY:0},.25,0,0,50,50,1);
  assert.equal(result,true);assert.deepEqual(keys,['monster-1-right-move-atlas','monster-1-move-atlas']);
});
test('actual enemy movement exports direction changes across a horizontal-to-vertical path corner', () => {
  const M3=setup(),context={window:{M3},console};
  for(const file of ['neutral-config','template-rules','feature-system','bonds','board','combat','combat-features']) vm.runInNewContext(fs.readFileSync(path.join(root,'js/play',file+'.js'),'utf8'),context);
  const manifest=M3.NeutralConfig.manifest,level=JSON.parse(JSON.stringify(M3.NeutralConfig.levels[manifest.worldMap.nodes[0].levelId]));
  const combat=M3.Combat.create(level,manifest,manifest.cards.slice(0,4).map(c=>c.id),[]);
  const unit=level.units.find(u=>u.kind==='enemy');combat.board.path=[{x:0,y:0},{x:1,y:0},{x:1,y:1}];combat._spawn(unit.id);
  combat._updateEnemies(.01);const enemy=combat.view().enemies[0];assert.equal(enemy.moveX,1);assert.equal(enemy.moveY,0);
  assert.ok(M3.EnemyAnimations.frameFor('monster-1',enemy,.125).side);
  enemy.segment=1;enemy.progress=0;combat._updateEnemies(.01);assert.equal(enemy.moveX,0);assert.equal(enemy.moveY,1);
  assert.equal(M3.EnemyAnimations.frameFor('monster-1',enemy,.125).name,'move-02.png');
});

test('upward and downward movement select distinct rear and front four-frame cycles', () => {
  const a=setup().EnemyAnimations,up={unitId:'enemy-1',moveX:0,moveY:-1},down={unitId:'enemy-1',moveX:0,moveY:1};
  assert.deepEqual([0,.125,.25,.375,.5].map(t=>a.frameFor('monster-1',up,t).name),['monster-1-up-01.png','monster-1-up-02.png','monster-1-up-03.png','monster-1-up-04.png','monster-1-up-01.png']);
  assert.deepEqual([0,.125,.25,.375].map(t=>a.frameFor('monster-1',down,t).name),['move-01.png','move-02.png','move-03.png','move-04.png']);
  const keys=[];
  a.draw((key)=>{keys.push(key);return true;},'monster-1',up,.25,0,0,256,256,1);
  a.draw((key)=>{keys.push(key);return true;},'monster-1',down,.25,0,0,256,256,1);
  assert.deepEqual(keys,['monster-1-up-move-atlas','monster-1-move-atlas']);
});
test('actual enemy switches from downward front to upward rear at a path turn', () => {
  const M3=setup(),context={window:{M3},console};
  for(const file of ['neutral-config','template-rules','feature-system','bonds','board','combat','combat-features']) vm.runInNewContext(fs.readFileSync(path.join(root,'js/play',file+'.js'),'utf8'),context);
  const manifest=M3.NeutralConfig.manifest,level=JSON.parse(JSON.stringify(M3.NeutralConfig.levels[manifest.worldMap.nodes[0].levelId]));
  const combat=M3.Combat.create(level,manifest,manifest.cards.slice(0,4).map(c=>c.id),[]);
  const unit=level.units.find(u=>u.kind==='enemy');combat.board.path=[{x:0,y:0},{x:0,y:1},{x:0,y:0}];combat._spawn(unit.id);
  combat._updateEnemies(.01);const enemy=combat.view().enemies[0];assert.equal(enemy.moveY,1);
  assert.equal(M3.EnemyAnimations.frameFor('monster-1',enemy,.125).name,'move-02.png');
  enemy.segment=1;enemy.progress=0;combat._updateEnemies(.01);assert.equal(enemy.moveY,-1);
  assert.equal(M3.EnemyAnimations.frameFor('monster-1',enemy,.125).name,'monster-1-up-02.png');
});


test('supplied left atlas follows frame names rather than packed order and restores 258px canvas offsets', () => {
  const a=setup().EnemyAnimations,left={unitId:'enemy-1',moveX:-1,moveY:0};
  const frames=[0,.125,.25,.375].map(t=>a.frameFor('monster-1',left,t));
  assert.deepEqual(frames.map(f=>f.name),['monster-1-left-01.png','monster-1-left-02.png','monster-1-left-03.png','monster-1-left-04.png']);
  assert.deepEqual(frames.map(f=>f.rect[0]),[0,246,735,488]);
  const calls=[];a.draw((...args)=>{calls.push(args);return true;},'monster-1',left,.125,10,20,258,258,1);
  assert.deepEqual(calls[0].slice(0,5),['monster-1-left-move-atlas',16,66,240,166]);
  assert.ok(calls[0][5]<calls[0][7]);
});


test('supplied right atlas follows named frame order and restores its own 258px offsets', () => {
  const a=setup().EnemyAnimations,right={unitId:'enemy-1',moveX:1,moveY:0};
  const frames=[0,.125,.25,.375].map(t=>a.frameFor('monster-1',right,t));
  assert.deepEqual(frames.map(f=>f.name),['monster-1-right-01.png','monster-1-right-02.png','monster-1-right-03.png','monster-1-right-04.png']);
  assert.deepEqual(frames.map(f=>f.rect[0]),[0,246,735,488]);
  const calls=[];a.draw((...args)=>{calls.push(args);return true;},'monster-1',right,.125,10,20,258,258,1);
  assert.deepEqual(calls[0].slice(0,5),['monster-1-right-move-atlas',22,66,240,166]);
  assert.ok(calls[0][5]<calls[0][7]);
});


test('supplied up atlas follows names rather than packed order and restores 258px canvas offsets', () => {
  const a=setup().EnemyAnimations,up={unitId:'enemy-1',moveX:0,moveY:-1};
  const frames=[0,.125,.25,.375].map(t=>a.frameFor('monster-1',up,t));
  assert.deepEqual(frames.map(f=>f.name),['monster-1-up-01.png','monster-1-up-02.png','monster-1-up-03.png','monster-1-up-04.png']);
  assert.deepEqual(frames.map(f=>f.rect[0]),[710,0,486,248]);
  const calls=[];a.draw((...args)=>{calls.push(args);return true;},'monster-1',up,.125,10,20,258,258,1);
  assert.deepEqual(calls[0].slice(0,5),['monster-1-up-move-atlas',16,30,246,237]);
  assert.deepEqual(calls[0].slice(5,9),[0,1,246/1024,1-237/256]);
  assert.equal(a.manifest.find(item=>item.key==='monster-1-up-move-atlas').version,'2');
});
