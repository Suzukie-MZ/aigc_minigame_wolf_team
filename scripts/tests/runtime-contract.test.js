'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function setup(){
  const s={console,window:{M3:{SaveData:{get:()=>({cards:{},heroes:{},outerCurrency:0}),save(){}}}}};
  vm.createContext(s);
  for(const n of ['neutral-config','board','bonds','template-rules','feature-system','config-validator','progression','combat-features','runtime-config'])
    vm.runInContext(fs.readFileSync(path.join(root,'js/play',n+'.js'),'utf8'),s);
  const M=s.window.M3,m=JSON.parse(JSON.stringify(M.NeutralConfig.manifest));
  const l=JSON.parse(JSON.stringify(Object.values(M.NeutralConfig.levels)[0]));
  l.levelNumber=1;M.RuntimeConfig.normalizeRoleContracts(m,M.RuntimeConfig.normalizeLevelCompatibility(l));
  const enemy=l.units.find(u=>u.kind==='enemy'&&!u.boss).id;
  l.waves=[{id:'wave-1',groups:[{id:'g1',enemy,count:4,delay:5,interval:.8},{id:'g2',enemy,count:4,delay:9.4,interval:.8}]}];
  return {M,m,l};
}
function combat(M,m,l){return M.Combat.create(l,m,m.cards.slice(0,4).map(c=>c.id),[]);}
test('no-Boss teaching levels load, later levels still require Boss',()=>{
  const {M,l}=setup();
  assert.equal(M.ConfigValidator.validateLevel(l).ok,true);
  l.levelNumber=5;assert.ok(M.ConfigValidator.validateLevel(l).errors.includes('waves.boss'));
  l.levelNumber=1;l.waves[0].groups[0].enemy='missing';assert.equal(M.ConfigValidator.validateLevel(l).ok,false);
});
test('v2 preserves complete first delay; unmarked legacy keeps preview plus three seconds',()=>{
  const {M,m,l}=setup();
  const legacy=combat(M,m,l);assert.equal(legacy.groupStates[0].next,legacy.board.routePreviewDuration+3);
  l.waveExecution={startRule:'after_previous_cleared',groupTiming:'relative_to_wave_start',firstSpawn:'at_group_delay',timingVersion:2,interWaveDelay:0};
  const c=combat(M,m,l);assert.equal(c.groupStates[0].next,c.board.routePreviewDuration+5);
  assert.equal(c.wavePause,0);
  const times=[];c._spawn=function(){times.push(this.elapsed);this.enemies.push({});};
  for(let i=0;i<2000;i++){c.elapsed=i/100;c._updateWaves(.01);}
  assert.equal(times.length,8);
  assert.ok(Math.abs(times[4]-times[3]-2)<.04);
  assert.ok(times.every((v,i)=>!i||v-times[i-1]>=.79));
});
test('upgrade display and actual deduction honor configured growth and legacy default',()=>{
  const {M,m,l}=setup(),u=l.units.find(u=>u.kind==='tower');
  u.upgradeCost=100;u.upgradeCostGrowth=1.3;u.levelCap=6;
  const c=combat(M,m,l),t={unitId:u.id,level:2,x:0,y:0};c.towers.push(t);c.selectedTower=t;c.gold=1000;
  assert.equal(c.selectedTowerInfo().cost,130);assert.equal(c.upgradeSelected(),true);assert.equal(c.gold,870);
  assert.equal(c.selectedTowerInfo().cost,169);
  delete u.upgradeCostGrowth;assert.equal(c.selectedTowerInfo().cost,256);
});
test('final stats avoid hidden scaling; legacy stats retain existing growth',()=>{
  const {M,m,l}=setup(),u=l.units.find(u=>u.kind==='enemy');
  m.systems.M10_rank.difficulty_scale_per_tier=.15;
  delete m.systems.M8_balance.enemy_speed_scale;
  const old=M.FeatureSystem.prepareLevel(l,m,3).units.find(v=>v.id===u.id);
  assert.equal(old.hp,Math.round(u.hp*1.3));assert.ok(Math.abs(old.speed-u.speed*1.105*.8)<1e-9);
  m.systems.M8_balance.unit_stats_mode='final';
  const fresh=M.FeatureSystem.prepareLevel(l,m,3).units.find(v=>v.id===u.id);
  assert.equal(fresh.hp,u.hp);assert.equal(fresh.speed,u.speed);
});
test('role compatibility preserves explicit abilities and only fills missing fields',()=>{
  const {M,m,l}=setup(),u=l.units.find(u=>u.id===m.cards[0].unitId);
  m.systems.M8_balance.unit_stats_mode='final';
  Object.assign(u,{kind:'tower',combatRole:'area_damage',skill:'splash',skillPower:1.5});
  M.RuntimeConfig.normalizeRoleContracts(m,l);
  assert.equal(u.skill,'splash');assert.equal(u.skillPower,1.5);assert.equal(u.combatRole,'area_damage');
  delete u.skill;delete u.skillPower;M.RuntimeConfig.normalizeRoleContracts(m,l);
  assert.equal(u.skill,'splash');assert.equal(u.skillPower,.35);
  u.skill='none';M.RuntimeConfig.normalizeRoleContracts(m,l);
  assert.equal(u.skill,'none');assert.equal(M.ConfigValidator.validateLevel(l).ok,false);
});
test('invalid versioned timing and growth fail validation',()=>{
  const {M,l}=setup();l.waveExecution={timingVersion:2,interWaveDelay:-1};
  assert.ok(M.ConfigValidator.validateLevel(l).errors.includes('waveExecution.timing'));
  l.units[0].upgradeCostGrowth=.5;
  assert.ok(M.ConfigValidator.validateLevel(l).errors.includes('units.upgradeCostGrowth'));
});

test('per-level production wins over manifest fallback and economy never attacks',()=>{
 const {M,m,l}=setup(),u=l.units.find(u=>u.id===m.cards[0].unitId);m.cards[0].combatRole='economy';m.systems.M8_balance.unit_stats_mode='final';m.systems.M4_economy_unit={production_interval:5,production_amount:8};
 Object.assign(u,{kind:'economy',combatRole:'economy',productionInterval:10,productionAmount:23,attack:9999,range:99});
 M.RuntimeConfig.normalizeRoleContracts(m,l);assert.equal(u.productionInterval,10);assert.equal(u.productionAmount,23);
 const c=combat(M,m,l),enemy={hp:100,x:1,y:1,segment:2,progress:.5};c.towers=[{unitId:u.id,x:0,y:0,level:1,cooldown:0}];c.enemies=[enemy];c.gold=0;c._updateDefenders(.01);assert.equal(c.gold,23);assert.equal(enemy.hp,100);assert.equal(c.towers[0].cooldown,10);
 delete u.productionInterval;delete u.productionAmount;M.RuntimeConfig.normalizeRoleContracts(m,l);assert.equal(u.productionInterval,5);assert.equal(u.productionAmount,8);
 u.productionAmount=0;M.RuntimeConfig.normalizeRoleContracts(m,l);assert.equal(u.productionAmount,0);
});
