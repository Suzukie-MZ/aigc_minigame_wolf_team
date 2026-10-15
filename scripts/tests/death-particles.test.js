'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
function setup() {
  const context = { window: { M3: {} }, console };
  for (const file of ['play/neutral-config','play/template-rules','play/feature-system','play/bonds','play/board','play/combat','play/combat-features','render/death-particles']) {
    vm.runInNewContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'),context);
  }
  const M3 = context.window.M3, manifest = M3.NeutralConfig.manifest;
  const level = JSON.parse(JSON.stringify(M3.NeutralConfig.levels[manifest.worldMap.nodes[0].levelId]));
  const units = level.units.filter(u => u.kind === 'enemy');
  units[0].imageAsset='monster-1'; units[1].imageAsset='monster-2';
  const combat = M3.Combat.create(level,manifest,manifest.cards.slice(0,4).map(c=>c.id),[]);
  return {M3,combat,units};
}
test('monster-1 death starts exactly one burst anchored to its death coordinates', () => {
  const {combat,units} = setup();
  combat._spawn(units[0].id);
  const enemy=combat.enemies[0];enemy.x=2.25;enemy.y=3.5;enemy.hp=0;
  combat._updateEnemies(.01);
  const view=combat.view();
  assert.equal(view.deathEffects.length,1);
  assert.equal(view.deathEffects[0].x,2.25);assert.equal(view.deathEffects[0].y,3.5);
  assert.equal(view.deathEffects[0].particles.length,60);
  combat._updateEnemies(.01);
  assert.equal(combat.view().deathEffects.length,1);
});
test('other monster deaths and living monsters do not start death effects', () => {
  const {combat,units} = setup();
  combat._spawn(units[1].id);combat.enemies[0].hp=0;
  combat._spawn(units[0].id);
  combat._updateEnemies(.01);
  assert.equal(combat.view().deathEffects.length,0);
});
test('particle simulation expires and removes burst, while draws retain fixed map origin', () => {
  const {M3}=setup(),effects=[M3.DeathParticles.create(2,3)],calls=[];
  M3.DeathParticles.draw(effects,{x:100,y:200},258,(...args)=>{calls.push(args);return true;});
  assert.equal(calls.length,60);assert.equal(calls[0][0],'monster-1-death-particle');
  assert.ok(calls.every(a=>a.every((v,i)=>i===0||i===9||typeof v!=='number'||Number.isFinite(v))));
  const event=effects[0];M3.DeathParticles.update(effects,.1);
  assert.equal(event.x,2);assert.equal(event.y,3);assert.equal(event.age,.1);
  M3.DeathParticles.update(effects,.31);
  assert.equal(effects.length,0);
  assert.equal(M3.DeathParticles.blendSource,770);assert.equal(M3.DeathParticles.blendDestination,1);
});
