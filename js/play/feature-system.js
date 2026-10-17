(function () {
  var M3 = window.M3;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function dayKey() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function hash(seed, salt) { var x = ((seed || 1) * 1103515245 + (salt || 0) * 12345) & 2147483647; return x < 0 ? -x : x; }
  function difficulty(manifest, level, tier) {
    var out = clone(level), cfg = manifest.systems.M10_rank || {}, balance = manifest.systems.M8_balance || {}, enemySpeedScale = Number(balance.enemy_speed_scale), scale = 1 + Math.max(0, tier - 1) * (cfg.difficulty_scale_per_tier || 0);
    if (balance.unit_stats_mode === 'final') { out.difficultyTier=tier; out.difficultyScale=1; return out; }
    if (!(enemySpeedScale > 0)) enemySpeedScale = .8;
    out.units.forEach(function (unit) { if (unit.kind === 'enemy') { unit.hp = Math.round((unit.hp || 1) * scale); unit.speed = (unit.speed || 1) * Math.min(1.8, 1 + (scale - 1) * 0.35) * enemySpeedScale; } });
    out.difficultyTier = tier; out.difficultyScale = scale; return out;
  }
  function rotateMap(level, manifest, seed) {
    var variants = level.mapVariants || [], chosen;
    if (!variants.length) return level;
    chosen = variants[hash(seed, 7) % variants.length];
    if (chosen.tiles) level.map.tiles = chosen.tiles.slice(0);
    if (chosen.path) level.map.path = clone(chosen.path);
    if (chosen.backgroundAsset) level.map.backgroundAsset = chosen.backgroundAsset;
    level.mapVariantId = chosen.id || 'variant-' + (hash(seed, 7) % variants.length);
    return level;
  }
  function bossPlan(level) {
    var bossIds = {}, result = { appears: false, count: 0, skill: 'none', enemyId: null, waveIndex: -1 };
    level.units.forEach(function (unit) { if (unit.kind === 'enemy' && unit.boss === true) bossIds[unit.id] = unit; });
    (level.waves || []).forEach(function (wave, waveIndex) { (wave.groups || []).forEach(function (group) { var boss = bossIds[group.enemy]; if (!boss) return; result.appears = true; result.count += group.count || 0; if (result.waveIndex < 0) result.waveIndex = waveIndex; if (!result.enemyId) { result.enemyId = boss.id; result.skill = boss.bossSkill || 'none'; } }); });
    return result;
  }
  function prepareLevel(level, manifest, tier) {
    var seed = dayKey() + tier * 97, out = difficulty(manifest, level, tier);
    rotateMap(out, manifest, seed); out.dailySeed = seed; out.bossPlan = bossPlan(out); return out;
  }
  function crisisWave(manifest, level) { var cfg = manifest.systems.M9_crisis || {}; return Math.max((cfg.tutorial_wave_count || 0) + 1, Math.round(level.waves.length * (cfg.crisis_wave_ratio || 0.42))); }
  function balanceReport(level, manifest) { var cfg=(manifest.systems&&manifest.systems.M8_balance)||{},raw=M3.TemplateRules.balance(manifest,level),towerTotal=0,waveMax=0,minRatio=Infinity,towerMin=Number(cfg.tower_pow_target_min)||0,towerMax=Number(cfg.tower_pow_target_max)||Infinity,waveMin=Number(cfg.wave_pressure_target_min)||0,waveLimit=Number(cfg.wave_pressure_target_max)||Infinity,ratioLimit=Number(cfg.minimum_defense_ratio)||0,valid=true;raw.towers.forEach(function(x){towerTotal+=x.pow;if(x.pow<towerMin||x.pow>towerMax)valid=false;});raw.waves.forEach(function(x){waveMax=Math.max(waveMax,x.pressure);if(x.pressure<waveMin||x.pressure>waveLimit)valid=false;if(x.pressure>0)minRatio=Math.min(minRatio,x.defenseRatio);});if(!raw.towers.length||!raw.enemies.length||minRatio<ratioLimit)valid=false;return{towerPow:Math.round(towerTotal),enemyPressure:Math.round(waveMax),ratio:minRatio===Infinity?0:minRatio,valid:valid,waves:raw.waves,effectivePathLength:raw.effectivePathLength}; }
  function applyItem(combat, item) {
    if (!item) return false;
    if (item.effect === 'income_multiplier') combat.match.incomeMultiplier *= item.value || 1;
    else if (item.effect === 'range_multiplier') combat.match.rangeMultiplier *= item.value || 1;
    else if (item.effect === 'instant_gold') combat.gold = Math.min(combat.level.economy.resourceCap, combat.gold + Math.max(0, Number(item.value) || 0));
    else if (item.effect === 'base_heal') combat.baseHp = Math.min(combat.level.economy.baseHp, combat.baseHp + Math.max(0, Number(item.value) || 0));
    else if (item.effect === 'clear_all_enemies') {
      combat.enemies.length = 0;
      combat.damageEvents.length = 0;
      combat.attackEvents.length = 0;
    }
    else return false;
    combat.match.items.push(item.id); return true;
  }
  M3.FeatureSystem = { dayKey: dayKey, prepareLevel: prepareLevel, crisisWave: crisisWave, balanceReport: balanceReport, applyItem: applyItem };
})();
