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
const MONSTERS = { 'monster-1': '裂隙爬兽', 'monster-2': '流亡掠夺者', 'monster-3': '幽影飞袭者', 'monster-4': '远古战争傀儡', 'monster-5': '重甲异兽', 'monster-6': '咒印潜伏者', 'boss-1': '终末领主' };
const DIRS = [[0, 1, 'move'], [0, -1, 'up'], [1, 0, 'right'], [-1, 0, 'left']];

test('manifest registers 28 directional atlases under monster asset folders', () => {
  const a = setup().EnemyAnimations;
  assert.equal(a.manifest.length, 28);
  for (const item of a.manifest) {
    assert.match(item.url, /^subpackages\/monsters(-light|-heavy)?\/assets\/Image\/[^/]+\/[^/]+_(move|up|left|right)\.png$/);
    assert.ok(fs.existsSync(path.join(root, item.url)));
  }
});

test('every monster selects four distinct walk frames per movement direction', () => {
  const a = setup().EnemyAnimations;
  for (const id of Object.keys(MONSTERS)) {
    for (const [moveX, moveY, dir] of DIRS) {
      const e = { unitId: id, moveX, moveY };
      const names = [0, .125, .25, .375, .5].map(t => a.frameFor(id, e, t).name);
      assert.deepEqual(names, ['walk-01', 'walk-02', 'walk-03', 'walk-04', 'walk-01']);
      const keys = [];
      assert.equal(a.draw((key) => { keys.push(key); return true; }, id, e, .125, 0, 0, 256, 256, 1), true);
      assert.deepEqual(keys, [MONSTERS[id] + '-' + dir + '-move-atlas']);
    }
  }
});

test('movement direction resolves by dominant axis and unknown monsters stay static', () => {
  const a = setup().EnemyAnimations;
  assert.equal(a.frameFor('monster-1', { unitId: 'monster-1', moveX: -1, moveY: 0 }, .125).name, 'walk-02');
  assert.equal(a.frameFor('monster-1', { unitId: 'monster-1', moveX: 0, moveY: -1 }, .125).name, 'walk-02');
  assert.equal(a.frameFor('monster-1', { unitId: 'monster-1', moveX: 0, moveY: 1 }, .125).name, 'walk-02');
  assert.equal(a.frameFor('monster-1', { unitId: 'monster-1', dying: true }, .125), null);
  assert.equal(a.frameFor('monster-9', { unitId: 'monster-9', moveX: 0, moveY: 1 }, .125), null);
});

test('atlas UVs and trimmed sizes stay within every registered texture', () => {
  const a = setup().EnemyAnimations;
  for (const id of Object.keys(MONSTERS)) {
    for (const [moveX, moveY] of DIRS.map(d => [d[0], d[1]])) {
      const e = { unitId: id, moveX, moveY };
      const calls = [];
      assert.equal(a.draw((...args) => { calls.push(args); return true; }, id, e, .25, 0, 0, 256, 256, 1), true);
      const args = calls[0];
      const u0 = args[5], v0 = args[6], u1 = args[7], v1 = args[8];
      assert.ok(args[3] > 0 && args[4] > 0, 'frame size positive');
      assert.ok(u0 >= 0 && u1 <= 1 && u0 < u1, 'u range ' + u0 + ',' + u1);
      assert.ok(v0 >= 0 && v1 <= 1 && v1 < v0, 'v range ' + v0 + ',' + v1);
    }
  }
});
test('enemies keep animating before lethal impact and freeze the walking frame only during fade', () => {
  const a=setup().EnemyAnimations,enemy={unitId:'monster-1',moveX:1,moveY:0};
  enemy.dying=true;enemy.deathHold=.3;
  assert.notEqual(a.frameFor('monster-1',enemy,.125),a.frameFor('monster-1',enemy,.25));
  enemy.dying=false;enemy.deathHold=0;
  const last=a.frameFor('monster-1',enemy,.25);
  enemy.dying=true;enemy.deathFrameTime=.25;
  assert.equal(a.frameFor('monster-1',enemy,.4),last);
  assert.equal(a.frameFor('monster-1',enemy,1),last);
  const draws=[];assert.equal(a.draw((...args)=>{draws.push(args);return true;},'monster-1',enemy,1,0,0,256,256,.5),true);
  assert.equal(draws[0][10],.5);
});

test('shared texture pipeline registers bundled directional atlases alongside a remote manifest', () => {
  const M3 = setup(), images = {}, acquired = [];
  M3.AssetManager = {
    acquire(type, key, url) { acquired.push(url); images[key] = { src: url }; },
    loaded(key) { return !!images[key]; }, get(key) { return images[key]; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/render/texture-assets.js'), 'utf8'), { window: { M3 } });
  M3.TextureAssets.configure({ assetManifest: [] });
  const urls = a => a.manifest.map(item => item.url);
  assert.ok(urls(M3.EnemyAnimations).includes('subpackages/monsters/assets/Image/裂隙爬兽/裂隙爬兽_move.png'));
  assert.equal(M3.TextureAssets.get('裂隙爬兽-move-move-atlas').src, 'subpackages/monsters/assets/Image/裂隙爬兽/裂隙爬兽_move.png');
});

test('actual combat view advances movement frames and preserves frame when simulation is paused', () => {
  const M3 = setup(), context = { window: { M3 }, console };
  for (const file of ['neutral-config', 'template-rules', 'feature-system', 'bonds', 'board', 'combat', 'combat-features']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/play', file + '.js'), 'utf8'), context);
  }
  const manifest = M3.NeutralConfig.manifest;
  const level = JSON.parse(JSON.stringify(M3.NeutralConfig.levels[manifest.worldMap.nodes[0].levelId]));
  const combat = M3.Combat.create(level, manifest, manifest.cards.slice(0, 4).map(c => c.id), []);
  const unit = level.units.find(u => u.kind === 'enemy' && M3.EnemyAnimations.monsters[u.imageAsset]);
  const enemy = { unitId: unit.id };
  const first = M3.EnemyAnimations.frameFor(unit.imageAsset, enemy, combat.view().elapsed).name;
  for (let i = 0; i < 3; i++) combat.update(.05);
  assert.equal(combat.view().elapsed, combat.elapsed);
  assert.notEqual(M3.EnemyAnimations.frameFor(unit.imageAsset, enemy, combat.view().elapsed).name, first);
  const paused = M3.EnemyAnimations.frameFor(unit.imageAsset, enemy, combat.view().elapsed).name;
  assert.equal(M3.EnemyAnimations.frameFor(unit.imageAsset, enemy, combat.view().elapsed).name, paused);
});

test('actual enemy movement exports direction changes across a horizontal-to-vertical path corner', () => {
  const M3 = setup(), context = { window: { M3 }, console };
  for (const file of ['neutral-config', 'template-rules', 'feature-system', 'bonds', 'board', 'combat', 'combat-features']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/play', file + '.js'), 'utf8'), context);
  }
  const manifest = M3.NeutralConfig.manifest, level = JSON.parse(JSON.stringify(M3.NeutralConfig.levels[manifest.worldMap.nodes[0].levelId]));
  const combat = M3.Combat.create(level, manifest, manifest.cards.slice(0, 4).map(c => c.id), []);
  const unit = level.units.find(u => u.kind === 'enemy' && M3.EnemyAnimations.monsters[u.imageAsset]);
  combat.board.path = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}]; combat._spawn(unit.id);
  combat._updateEnemies(.01); const enemy = combat.view().enemies[0];
  assert.equal(enemy.moveX, 1); assert.equal(enemy.moveY, 0);
  assert.equal(M3.EnemyAnimations.draw((key) => key.endsWith('right-move-atlas'), unit.imageAsset, enemy, .125, 0, 0, 256, 256, 1), true);
  enemy.segment = 1; enemy.progress = 0; combat._updateEnemies(.01);
  assert.equal(enemy.moveX, 0); assert.equal(enemy.moveY, 1);
  assert.equal(M3.EnemyAnimations.frameFor(unit.imageAsset, enemy, .125).name, 'walk-02');
});

test('actual enemy switches from downward front to upward rear at a path turn', () => {
  const M3 = setup(), context = { window: { M3 }, console };
  for (const file of ['neutral-config', 'template-rules', 'feature-system', 'bonds', 'board', 'combat', 'combat-features']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/play', file + '.js'), 'utf8'), context);
  }
  const manifest = M3.NeutralConfig.manifest, level = JSON.parse(JSON.stringify(M3.NeutralConfig.levels[manifest.worldMap.nodes[0].levelId]));
  const combat = M3.Combat.create(level, manifest, manifest.cards.slice(0, 4).map(c => c.id), []);
  const unit = level.units.find(u => u.kind === 'enemy' && M3.EnemyAnimations.monsters[u.imageAsset]);
  combat.board.path = [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 0}]; combat._spawn(unit.id);
  combat._updateEnemies(.01); const enemy = combat.view().enemies[0];
  assert.equal(enemy.moveY, 1);
  assert.equal(M3.EnemyAnimations.draw((key) => key.endsWith('move-move-atlas'), unit.imageAsset, enemy, .125, 0, 0, 256, 256, 1), true);
  enemy.segment = 1; enemy.progress = 0; combat._updateEnemies(.01);
  assert.equal(enemy.moveY, -1);
  assert.equal(M3.EnemyAnimations.draw((key) => key.endsWith('up-move-atlas'), unit.imageAsset, enemy, .125, 0, 0, 256, 256, 1), true);
});
