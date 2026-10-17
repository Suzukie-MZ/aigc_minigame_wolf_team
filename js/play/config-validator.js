(function () {
  var M3 = window.M3;
  var ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
  var TILE_TYPES = { grass:true, road:true, spawn:true, goal:true, obstacle:true, tower_slot:true, hero_slot:true, item_slot:true };
  var TOWER_ROLES = { single_target:true,long_range_single:true,slow_control:true,area_damage:true,economy:true,long_range_slow:true };
  var HERO_ROLES = { rapid_damage:true,long_range_slow:true,area_damage:true };
  var COMBAT_ROLES = { single_target:true,long_range_single:true,slow_control:true,area_damage:true,economy:true,long_range_slow:true,rapid_damage:true };
  function result(ok, errors) { return { ok: ok, errors: errors || [] }; }
  function finite(n, min, max) { return typeof n === 'number' && isFinite(n) && n >= min && n <= max; }
  function integer(n, min, max) { return finite(n, min, max) && Math.floor(n) === n; }
  function validAsset(value) { return !value || ID_RE.test(value) || /^(https:\/\/|assets\/|subpackages\/)/.test(value); }
  function validAssetUrl(value) { return typeof value === 'string' && (/^(https:\/\/|assets\/|subpackages\/)/.test(value) || /^http:\/\/(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(:\d+)?\//.test(value)); }
  function validRoleDescription(value) { return value === undefined || (typeof value === 'string' && value.length > 0 && value.length <= 40); }
  function exactSources(value, expected) { var seen = {}, i; if (!Array.isArray(value) || value.length !== expected.length) return false; for (i = 0; i < value.length; i += 1) seen[value[i]] = true; for (i = 0; i < expected.length; i += 1) if (!seen[expected[i]]) return false; return true; }
  function validateManifest(m) {
    var e = [], ids = {}, nodeIds = {}, banned = {}, playable = 0, deckSize = m && m.deckRules && m.deckRules.deckSize, i, c, n, assets, key, systems=m&&m.systems||{},cfg,tiers,expectedStart,heroIds={},itemEffects={},effects={income_multiplier:true,clear_all_enemies:true};
    if (!m || m.schemaVersion !== 1) e.push('manifest.schemaVersion');
    if (!m || !m.deckRules || m.deckRules.deckSize !== 4) e.push('deckRules.deckSize');
    if (!m || !Array.isArray(m.cards) || m.cards.length < 1) e.push('cards');
    if (m && m.deckRules && Array.isArray(m.deckRules.bannedCardIds)) for (i = 0; i < m.deckRules.bannedCardIds.length; i += 1) banned[m.deckRules.bannedCardIds[i]] = true;
    if (m && Array.isArray(m.cards)) for (i = 0; i < m.cards.length; i += 1) {
      c = m.cards[i];
      if (!c || !ID_RE.test(c.id || '') || !ID_RE.test(c.unitId || '') || ids[c.id]) e.push('cards[' + i + ']');
      else { ids[c.id] = true; if (c.unlocked !== false && !banned[c.id]) playable += 1; }
      if (c && !validAsset(c.portraitAsset)) e.push('cards.assets[' + i + ']');
      if (c && !validRoleDescription(c.roleDescription)) e.push('cards.roleDescription[' + i + ']');
      if (c && c.combatRole !== undefined && !TOWER_ROLES[c.combatRole]) e.push('cards.combatRole[' + i + ']');
    }
    if (finite(deckSize, 1, 10) && playable < 6) e.push('cards.playableCount');
    if (!m || !m.worldMap || !Array.isArray(m.worldMap.nodes)) e.push('worldMap.nodes');
    else for (i = 0; i < m.worldMap.nodes.length; i += 1) {
      n = m.worldMap.nodes[i];
      if (!n || !ID_RE.test(n.id || '') || !ID_RE.test(n.levelId || '') || nodeIds[n.id]) e.push('worldMap.nodes[' + i + ']');
      else nodeIds[n.id] = true;
    }
    if (m && Array.isArray(m.assetManifest)) for (i = 0; i < m.assetManifest.length; i += 1) {
      c = m.assetManifest[i];
      if (!c || !ID_RE.test(c.key || '') || c.type !== 'image' || !validAssetUrl(c.url)) e.push('assetManifest[' + i + ']');
    }
    assets = m && m.presentation && m.presentation.sceneAssets;
    if (assets) for (key in assets) if (Object.prototype.hasOwnProperty.call(assets, key) && !validAsset(assets[key])) e.push('presentation.sceneAssets.' + key);
    cfg=systems.M1_loadout;tiers=cfg&&cfg.cost_increment_tiers;expectedStart=1;if(!cfg||cfg.tower_pool_size!==6||cfg.loadout_size!==deckSize||!Array.isArray(tiers)||!tiers.length)e.push('systems.M1_loadout');else for(i=0;i<tiers.length;i+=1){c=tiers[i];if(!c||c.start!==expectedStart||!finite(c.step,0,100000)||(!(c.end===null)&&!finite(c.end,c.start,100000))||(c.end===null&&i!==tiers.length-1)){e.push('systems.M1_loadout.tiers');break;}if(c.end!==null)expectedStart=c.end+1;}
    cfg=systems.M3_item;if(!cfg||cfg.choices_per_trigger!==2||cfg.ad_gate!==true||cfg.trigger_timing!=='manual_button'||!Array.isArray(cfg.item_pool)||cfg.item_pool.length!==2)e.push('systems.M3_item');else{for(i=0;i<cfg.item_pool.length;i+=1){c=cfg.item_pool[i];if(!c||!ID_RE.test(c.id||'')||!effects[c.effect]||!finite(c.value,0,100000)){e.push('systems.M3_item.pool');break;}itemEffects[c.effect]=true;}if(!itemEffects.income_multiplier||!itemEffects.clear_all_enemies)e.push('systems.M3_item.effects');}
    cfg=systems.M5_hero;if(!cfg||!Array.isArray(cfg.hero_unit_pool)||cfg.hero_unit_pool.length<3||cfg.deploy_limit_per_match!==1||cfg.loadout_limit!==1)e.push('systems.M5_hero');else for(i=0;i<cfg.hero_unit_pool.length;i+=1){c=cfg.hero_unit_pool[i];if(!c||!ID_RE.test(c.id||'')||!ID_RE.test(c.unitId||'')||heroIds[c.id]||!validRoleDescription(c.roleDescription)||(c.combatRole!==undefined&&!HERO_ROLES[c.combatRole])){e.push('systems.M5_hero.pool');break;}heroIds[c.id]=true;}
    cfg=systems.M6_units;if(!cfg||cfg.range_primary!==true||cfg.pow_formula!=='ATK*FRQ*RGE'||!Array.isArray(cfg.roles)||cfg.roles.length<3)e.push('systems.M6_units');
    cfg=systems.M7_resources;if(!cfg||cfg.exchange_enabled!==false||!cfg.inner||!cfg.outer||!exactSources(cfg.inner.sources,['economy_unit','kill_enemy'])||!exactSources(cfg.outer.sources,['match_settlement']))e.push('systems.M7_resources');
    cfg=systems.M8_balance;if(!cfg||cfg.tower_pow_formula!=='ATK*FRQ*RGE'||cfg.enemy_pressure_formula!=='HP*SPD'||!finite(cfg.effective_path_length,.1,1000)||!finite(cfg.tower_pow_target_min,0,1000000)||!finite(cfg.tower_pow_target_max,cfg.tower_pow_target_min,1000000)||!finite(cfg.wave_pressure_target_min,0,100000000)||!finite(cfg.wave_pressure_target_max,cfg.wave_pressure_target_min,100000000)||!finite(cfg.minimum_defense_ratio,0,1000)||(cfg.enemy_speed_scale!==undefined&&!finite(cfg.enemy_speed_scale,.1,2)))e.push('systems.M8_balance');
    if (systems.M8_balance && systems.M8_balance.unit_stats_mode !== undefined && ['final','legacy'].indexOf(systems.M8_balance.unit_stats_mode)<0) e.push('systems.M8_balance.unit_stats_mode');
    cfg=systems.M9_crisis;if(!cfg||!finite(cfg.crisis_wave_ratio,.33,.5)||!finite(cfg.tutorial_wave_count,1,100)||cfg.risk_conversion_mechanism!=='base_hp_to_inner_currency'||!finite(cfg.conversion_rate,0,100000))e.push('systems.M9_crisis');
    cfg=systems.M14_energy;if(!cfg||!integer(cfg.daily_max_energy,1,1000)||!integer(cfg.energy_cost_per_match,1,1000)||!integer(cfg.ad_refill_amount,1,1000)||!integer(cfg.share_refill_amount,1,1000)||!exactSources(cfg.refill_methods,['rewarded_ad','share']))e.push('systems.M14_energy');
    return result(e.length === 0, e);
  }
  function validateLevel(l) {
    var e = [], ids = {}, i, j, u, g, p, previous, key, tileAssets, enemyCount=0, bossCount=0, bossScheduled=false;
    if (l && l.waveExecution && (l.waveExecution.timingVersion !== undefined || l.waveExecution.interWaveDelay !== undefined) && (l.waveExecution.timingVersion !== 2 || !finite(l.waveExecution.interWaveDelay,0,60))) e.push('waveExecution.timing');
    if (!l || l.schemaVersion !== 5 || l.template !== 'fixed-path-v1') e.push('schema/template');
    if (!l || !l.map || !finite(l.map.width, 2, 40) || !finite(l.map.height, 2, 40)) e.push('map.size');
    if (l && l.map && (!Array.isArray(l.map.tiles) || l.map.tiles.length !== l.map.width * l.map.height)) e.push('map.tiles');
    if (l && l.map && Array.isArray(l.map.tiles)) for (i=0;i<l.map.tiles.length;i+=1) if(!TILE_TYPES[l.map.tiles[i]]){e.push('map.tiles['+i+']');break;}
    tileAssets=l&&l.map&&l.map.tileAssets;if(tileAssets)for(key in tileAssets)if(Object.prototype.hasOwnProperty.call(tileAssets,key)&&(!TILE_TYPES[key]||!validAsset(tileAssets[key]))){e.push('map.tileAssets.'+key);break;}
    if (!l || !l.map || !Array.isArray(l.map.path) || l.map.path.length < 2) e.push('map.path');
    else for (i = 0; i < l.map.path.length; i += 1) {
      p = l.map.path[i];
      if (!p || !finite(p.x, 0, l.map.width - 1) || !finite(p.y, 0, l.map.height - 1)) e.push('map.path[' + i + ']');
      if (i > 0 && p) { previous=l.map.path[i-1]; if (!previous || Math.abs(previous.x-p.x)+Math.abs(previous.y-p.y)!==1) e.push('map.path.continuity'); }
    }
    if (!l || !Array.isArray(l.units) || l.units.length > 200) e.push('units');
    else for (i = 0; i < l.units.length; i += 1) {
      u = l.units[i];
      if (!u || !ID_RE.test(u.id || '') || ids[u.id]) e.push('units[' + i + ']');
      else ids[u.id] = u;
      if (u && (!validAsset(u.imageAsset) || !validAsset(u.soundAsset))) e.push('units.assets[' + i + ']');
      if (u && u.upgradeCostGrowth !== undefined && !finite(u.upgradeCostGrowth,1,100)) e.push('units.upgradeCostGrowth');
      if (u && u.combatRole !== undefined && !COMBAT_ROLES[u.combatRole]) e.push('units.combatRole[' + i + ']');
      if (u && u.levelAssetKeys !== undefined) {
        if (!Array.isArray(u.levelAssetKeys) || (u.kind==='tower'||u.kind==='economy') && u.levelAssetKeys.length !== u.levelCap) e.push('units.levelAssetKeys[' + i + ']');
        else for (j = 0; j < u.levelAssetKeys.length; j += 1) if (typeof u.levelAssetKeys[j] !== 'string' || !ID_RE.test(u.levelAssetKeys[j])) { e.push('units.levelAssetKeys[' + i + '][' + j + ']'); break; }
      }
      if (u && (u.kind==='tower'||u.kind==='hero') && (!finite(u.attack,0,1000000)||!finite(u.range,.1,1000)||!finite(u.interval,.01,1000))) e.push('units.combat[' + i + ']');
      if (u && u.kind==='economy' && (!finite(u.productionInterval,.01,100000)||!finite(u.productionAmount,0,1000000)||!finite(u.buildCost,0,1000000))) e.push('units.economy[' + i + ']');
      if (u && u.combatRole==='economy' && u.kind!=='economy') e.push('units.combatRole.economy[' + i + ']');
      if (u && (u.combatRole==='slow_control'||u.combatRole==='long_range_slow') && (u.skill!=='slow'||!finite(u.skillPower,0,1)||!finite(u.skillDuration,.01,100000))) e.push('units.combatRole.slow[' + i + ']');
      if (u && u.combatRole==='area_damage' && (u.skill!=='splash'||!finite(u.skillPower,0,1000))) e.push('units.combatRole.area[' + i + ']');
      if (u && (u.combatRole==='single_target'||u.combatRole==='long_range_single'||u.combatRole==='rapid_damage') && u.skill!=='none') e.push('units.combatRole.single[' + i + ']');
      if (u && (u.kind==='tower'||u.kind==='economy') && (!finite(u.levelCap,1,100)||!finite(u.growth,1,100)||!finite(u.upgradeCost,0,1000000))) e.push('units.upgrade[' + i + ']');
      if (u && u.kind==='enemy') {
        if (u.boss===true) bossCount+=1; else enemyCount+=1;
        if (!finite(u.hp,1,100000000)||!finite(u.speed,.001,1000)||!finite(u.defense,0,1000000)||!finite(u.killReward,0,1000000)||!finite(u.baseDamage,1,100000)||!finite(u.renderScale,.45,1.4)) e.push('units.enemy[' + i + ']');
      }
    }
    if (enemyCount!==6||bossCount!==1) e.push('units.enemyRoster');
    if (!l || !l.economy || !finite(l.economy.baseHp, 1, 100000) || !finite(l.economy.initialGold, 0, 10000000)) e.push('economy');
    if (l && l.economy && Number(l.economy.regenRate || 0) !== 0) e.push('economy.regenRate');
    if (l && l.map && l.map.obstacles && l.map.obstacles.clearable && l.map.obstacles.afterClear !== 'tower_slot') e.push('map.obstacles.afterClear');
    if (!l || !Array.isArray(l.waves) || !l.waves.length || l.waves.length > 200) e.push('waves');
    else for (i = 0; i < l.waves.length; i += 1) {
      if (!Array.isArray(l.waves[i].groups)||!l.waves[i].groups.length) { e.push('waves[' + i + '].groups'); continue; }
      for (g = 0; g < l.waves[i].groups.length; g += 1) { u=l.waves[i].groups[g]; if (!u||!ID_RE.test(u.id||'')||!ids[u.enemy]||ids[u.enemy].kind!=='enemy') e.push('waves[' + i + '].enemy'); else if(ids[u.enemy].boss===true)bossScheduled=true; if(!u||!finite(u.count,1,100000)||!finite(u.delay,0,100000)||!finite(u.interval,.01,100000))e.push('waves['+i+'].timing'); }
    }
    if (!bossScheduled && !(integer(l.levelNumber,1,4))) e.push('waves.boss');
    if (l && l.map && !validAsset(l.map.backgroundAsset)) e.push('map.backgroundAsset');
    return result(e.length === 0, e);
  }
  M3.ConfigValidator = { validateManifest: validateManifest, validateLevel: validateLevel, validAsset: validAsset };
})();
