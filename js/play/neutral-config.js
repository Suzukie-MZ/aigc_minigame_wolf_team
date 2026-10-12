// [NOTE] No reference code used. Designed from idea.md + scaffold spec.
(function () {
  var M3 = window.M3;

  function makeTiles() {
    var tiles = [], x, y;
    for (y = 0; y < 12; y += 1) {
      for (x = 0; x < 10; x += 1) tiles.push('grass');
    }
    for (x = 0; x < 10; x += 1) tiles[8 * 10 + x] = 'road';
    for (y = 0; y <= 8; y += 1) tiles[y * 10 + 8] = 'road';
    tiles[8 * 10] = 'spawn';
    tiles[8] = 'goal';
    tiles[4 * 10 + 2] = 'obstacle';
    tiles[7 * 10 + 5] = 'obstacle';
    [[1,2],[3,2],[5,2],[1,5],[3,5],[6,5]].forEach(function(p){tiles[p[1]*10+p[0]]='tower_slot';});
    [[9,3],[9,6],[9,9]].forEach(function(p){tiles[p[1]*10+p[0]]='hero_slot';});
    return tiles;
  }
  function makeAltTiles(){var tiles=makeTiles(),i;for(i=0;i<tiles.length;i+=1)if(tiles[i]==='tower_slot')tiles[i]='grass';[[2,2],[4,2],[6,2],[2,5],[4,5],[7,5]].forEach(function(p){tiles[p[1]*10+p[0]]='tower_slot';});return tiles;}

  var units = [
    { id: 'tower-1', prototype: 'arrow', enabled: true, attack: 18, range: 2.5, interval: 0.9, levelCap: 3, growth: 1.25, buildCost: 55, upgradeCost: 45, skill: 'none', displayName: '潮刃卫士', color: [0.18,0.72,0.86], imageAsset: '', soundAsset: '' },
    { id: 'tower-2', prototype: 'arrow', enabled: true, attack: 31, range: 3.2, interval: 1.4, levelCap: 3, growth: 1.25, buildCost: 80, upgradeCost: 60, skill: 'none', displayName: '赤礁射手', color: [0.94,0.42,0.32], imageAsset: '', soundAsset: '' },
    { id: 'tower-3', prototype: 'frost', enabled: true, attack: 12, range: 2.4, interval: 1.1, levelCap: 3, growth: 1.2, buildCost: 70, upgradeCost: 55, skill: 'slow', skillPower: 0.35, skillDuration: 1.5, displayName: '冰潮术士', color: [0.32,0.78,0.92], imageAsset: '', soundAsset: '' },
    { id: 'tower-4', prototype: 'ranger', enabled: true, attack: 16, range: 2.2, interval: 1.2, levelCap: 3, growth: 1.22, buildCost: 90, upgradeCost: 70, skill: 'splash', skillPower: 0.55, displayName: '星珊瑚法师', color: [0.78,0.42,0.88], imageAsset: '', soundAsset: '' },
    { id: 'tower-5', prototype: 'arrow', enabled: true, attack: 9, range: 2.0, interval: 0.45, levelCap: 3, growth: 1.18, buildCost: 65, upgradeCost: 50, skill: 'none', displayName: '海风游侠', color: [0.26,0.86,0.58], imageAsset: '', soundAsset: '' },
    { id: 'tower-6', prototype: 'frost', enabled: true, attack: 24, range: 2.8, interval: 1.8, levelCap: 3, growth: 1.3, buildCost: 105, upgradeCost: 80, skill: 'slow', skillPower: 0.5, skillDuration: 1.0, displayName: '深蓝祭司', color: [0.34,0.52,0.96], imageAsset: '', soundAsset: '' },
    { id: 'hero-unit-1', kind: 'hero', prototype: 'ranger', enabled: true, attack: 24, range: 2.5, interval: 0.9, skill: 'none', displayName: '潮汐先锋', color: [1.0,0.72,0.25], imageAsset: '', soundAsset: '' },
    { id: 'hero-unit-2', kind: 'hero', prototype: 'frost', enabled: true, attack: 19, range: 3.0, interval: 1.1, skill: 'slow', skillPower: 0.25, skillDuration: 1.2, displayName: '深海贤者', color: [0.45,0.82,1.0], imageAsset: '', soundAsset: '' },
    { id: 'hero-unit-3', kind: 'hero', prototype: 'ranger', enabled: true, attack: 27, range: 2.0, interval: 1.0, skill: 'splash', skillPower: 0.35, displayName: '星礁统领', color: [0.92,0.48,0.90], imageAsset: '', soundAsset: '' },
    { id: 'enemy-scout', kind: 'enemy', prototype: 'scout', enemyRole: 'fast', enabled: true, hp: 55, defense: 0, speed: 1.45, killReward: 7, baseDamage: 1, renderScale: .68, displayName: '迅捷体', color: [.96,.34,.32], appearance: { bodyShape:'light',accessory:'eyes',bodyScaleX:.52,bodyScaleY:.44,headScale:.20 }, imageAsset: '', soundAsset: '' },
    { id: 'enemy-raider', kind: 'enemy', prototype: 'raider', enemyRole: 'balanced', enabled: true, hp: 90, defense: 1, speed: 1.05, killReward: 10, baseDamage: 1, renderScale: .76, displayName: '突击体', color: [.92,.48,.24], appearance: { bodyShape:'wide',accessory:'spikes',bodyScaleX:.66,bodyScaleY:.52,headScale:.24 }, imageAsset: '', soundAsset: '' },
    { id: 'enemy-swarm', kind: 'enemy', prototype: 'swarm', enemyRole: 'swarm', enabled: true, hp: 48, defense: 0, speed: 1.25, killReward: 5, baseDamage: 1, renderScale: .58, displayName: '群聚体', color: [.84,.26,.58], appearance: { bodyShape:'blob',accessory:'eyes',bodyScaleX:.48,bodyScaleY:.38,headScale:.18 }, imageAsset: '', soundAsset: '' },
    { id: 'enemy-guard', kind: 'enemy', prototype: 'guard', enemyRole: 'armored', enabled: true, hp: 180, defense: 5, speed: .72, killReward: 18, baseDamage: 2, renderScale: .88, displayName: '护甲体', color: [.54,.42,.78], appearance: { bodyShape:'armored',accessory:'horns',bodyScaleX:.76,bodyScaleY:.66,headScale:.28 }, imageAsset: '', soundAsset: '' },
    { id: 'enemy-caster', kind: 'enemy', prototype: 'caster', enemyRole: 'support', enabled: true, hp: 125, defense: 2, speed: .88, killReward: 15, baseDamage: 1, renderScale: .80, displayName: '干扰体', color: [.40,.54,.90], appearance: { bodyShape:'robe',accessory:'orb',bodyScaleX:.58,bodyScaleY:.66,headScale:.30 }, imageAsset: '', soundAsset: '' },
    { id: 'enemy-brute', kind: 'enemy', prototype: 'brute', enemyRole: 'tank', enabled: true, hp: 300, defense: 8, speed: .55, killReward: 30, baseDamage: 3, renderScale: 1.02, displayName: '重装体', color: [.62,.22,.30], appearance: { bodyShape:'giant',accessory:'shell',bodyScaleX:.86,bodyScaleY:.78,headScale:.32 }, imageAsset: '', soundAsset: '' },
    { id: 'enemy-boss', kind: 'enemy', prototype: 'boss', enemyRole: 'boss', boss: true, bossSkill: 'none', enabled: true, hp: 900, defense: 12, speed: .42, killReward: 90, baseDamage: 5, renderScale: 1.28, displayName: '统领体', color: [.46,.12,.26], appearance: { bodyShape:'giant',accessory:'crown',bodyScaleX:.96,bodyScaleY:.92,headScale:.36 }, imageAsset: '', soundAsset: '' }
  ];
  units.forEach(function (unit) { unit.imageAsset = unit.id.indexOf('tower-') === 0 || unit.id.indexOf('hero-unit-') === 0 ? 'demo-guardian' : ''; if(unit.id.indexOf('tower-')===0)unit.levelAssetKeys=['demo-guardian-lv1','demo-guardian-lv2','demo-guardian-lv3']; });
  units.forEach(function (unit) { if(!unit.kind)unit.kind = unit.id.indexOf('tower-') === 0 ? 'tower' : 'enemy'; });
  units[0].role = 'melee_high_atk'; units[0].combatRole = 'single_target'; units[1].role = 'mid_balanced'; units[1].combatRole = 'long_range_single'; units[2].role = 'ranged_coverage'; units[2].combatRole = 'slow_control'; units[3].role = 'single_target_finisher'; units[3].combatRole = 'area_damage'; units[5].combatRole = 'long_range_slow'; units[6].combatRole = 'rapid_damage'; units[7].combatRole = 'long_range_slow'; units[8].combatRole = 'area_damage';
  units[4].kind = 'economy'; units[4].combatRole = 'economy'; units[4].attack = 0; units[4].productionInterval = 5; units[4].productionAmount = 8;

  var level = {
    name: '珊瑚前哨', uiName: '珊瑚前哨', description: '守住最后的珊瑚礁', objective: '坚持12波攻击', revision: 1, status: 'published', delivery: 'embedded-fallback',
    schemaVersion: 5, template: 'fixed-path-v1',
    map: {
      width: 10, height: 12, theme: 'coral-fantasy', backgroundAsset: 'demo-scene', tiles: makeTiles(), speedMultiplier: 0.65,
      presentation: { groundColor: [0.08,0.30,0.31], routeColor: [0.34,0.48,0.48], obstacleColor: [0.72,0.36,0.28], waterColor: [0.03,0.13,0.22] },
      tileAssets: { grass: 'tile-grass', road: 'tile-road', spawn: 'tile-spawn', goal: 'tile-goal', obstacle: 'tile-obstacle', tower_slot: 'tile-tower-slot', hero_slot: 'tile-hero-slot', item_slot: '' },
      obstacles: { clearable: true, clearCost: 25, afterClear: 'tower_slot' },
      path: [{x:0,y:8},{x:1,y:8},{x:2,y:8},{x:3,y:8},{x:4,y:8},{x:5,y:8},{x:6,y:8},{x:7,y:8},{x:8,y:8},{x:8,y:7},{x:8,y:6},{x:8,y:5},{x:8,y:4},{x:8,y:3},{x:8,y:2},{x:8,y:1},{x:8,y:0}]
    },
    units: units,
    economy: { initialGold: 240, baseHp: 20, resourceCap: 1000 },
    waves: [
      {id:'wave-1',groups:[{id:'wave-1-scout',enemy:'enemy-scout',count:6,delay:0,interval:1.0}]},
      {id:'wave-2',groups:[{id:'wave-2-scout',enemy:'enemy-scout',count:6,delay:0,interval:.9},{id:'wave-2-swarm',enemy:'enemy-swarm',count:4,delay:2,interval:.55}]},
      {id:'wave-3',groups:[{id:'wave-3-raider',enemy:'enemy-raider',count:6,delay:0,interval:.9},{id:'wave-3-scout',enemy:'enemy-scout',count:3,delay:2,interval:.75}]},
      {id:'wave-4',groups:[{id:'wave-4-swarm',enemy:'enemy-swarm',count:12,delay:0,interval:.42},{id:'wave-4-caster',enemy:'enemy-caster',count:2,delay:3,interval:1.1}]},
      {id:'wave-5',groups:[{id:'wave-5-guard',enemy:'enemy-guard',count:3,delay:0,interval:1.3},{id:'wave-5-scout',enemy:'enemy-scout',count:8,delay:1,interval:.72}]},
      {id:'wave-6',groups:[{id:'wave-6-raider',enemy:'enemy-raider',count:8,delay:0,interval:.72},{id:'wave-6-caster',enemy:'enemy-caster',count:3,delay:2,interval:1.0}]},
      {id:'wave-7',groups:[{id:'wave-7-brute',enemy:'enemy-brute',count:2,delay:0,interval:1.6},{id:'wave-7-swarm',enemy:'enemy-swarm',count:10,delay:1.5,interval:.38}]},
      {id:'wave-8',groups:[{id:'wave-8-guard',enemy:'enemy-guard',count:4,delay:0,interval:1.1},{id:'wave-8-raider',enemy:'enemy-raider',count:6,delay:1,interval:.68},{id:'wave-8-caster',enemy:'enemy-caster',count:2,delay:3,interval:.9}]},
      {id:'wave-9',groups:[{id:'wave-9-brute',enemy:'enemy-brute',count:3,delay:0,interval:1.35},{id:'wave-9-scout',enemy:'enemy-scout',count:10,delay:1,interval:.58}]},
      {id:'wave-10',groups:[{id:'wave-10-guard',enemy:'enemy-guard',count:5,delay:0,interval:.95},{id:'wave-10-caster',enemy:'enemy-caster',count:4,delay:1.5,interval:.82},{id:'wave-10-swarm',enemy:'enemy-swarm',count:12,delay:2.5,interval:.32}]},
      {id:'wave-11',groups:[{id:'wave-11-brute',enemy:'enemy-brute',count:4,delay:0,interval:1.2},{id:'wave-11-raider',enemy:'enemy-raider',count:8,delay:1,interval:.58},{id:'wave-11-caster',enemy:'enemy-caster',count:5,delay:2,interval:.72}]},
      {id:'wave-12',groups:[{id:'wave-12-boss',enemy:'enemy-boss',count:1,delay:1,interval:1},{id:'wave-12-guard',enemy:'enemy-guard',count:2,delay:3,interval:1.1},{id:'wave-12-swarm',enemy:'enemy-swarm',count:8,delay:4,interval:.35}]}
    ],
    audio: { musicAsset: '', victoryAsset: '' },
    waveExecution: { startRule: 'after_previous_cleared', groupTiming: 'relative_to_wave_start', firstSpawn: 'at_group_delay' },
    requiredCapabilities: ['dynamic_wave_groups','fixed_path','buildable_cells','character_ids_and_wave_references','static_character_images','attack_or_death_audio','clear_obstacles_to_build'],
    assetManifest: []
  };
  level.mapVariants=[{id:'daily-a',tiles:makeTiles()},{id:'daily-b',tiles:makeAltTiles()}];

  var fallbackLevels = {}, fallbackLevelRefs = {}, fallbackNodes = [], fallbackIndex, fallbackLevel;
  for (fallbackIndex = 1; fallbackIndex <= 8; fallbackIndex += 1) {
    fallbackLevel = JSON.parse(JSON.stringify(level));
    fallbackLevel.name = '珊瑚前哨' + fallbackIndex;
    fallbackLevel.uiName = '珊瑚前哨' + fallbackIndex;
    fallbackLevel.revision = fallbackIndex;
    fallbackLevels['neutral-level-' + fallbackIndex] = fallbackLevel;
    fallbackLevelRefs['neutral-level-' + fallbackIndex] = { embedded: true, revision: fallbackIndex };
    fallbackNodes.push({ id: 'level-' + fallbackIndex, x: 0.5, y: fallbackIndex / 9, levelId: 'neutral-level-' + fallbackIndex, displayName: '珊瑚前哨' + fallbackIndex, description: '守住最后的珊瑚礁', prerequisites: fallbackIndex===1?[]:['level-'+(fallbackIndex-1)], minStars: 0, minPlayerLevel: 1 });
  }

  M3.NeutralConfig = {
    manifest: {
      schemaVersion: 1, revision: 2, gameId: 'ks654147848546150500',
      presentation: {
        themeId: 'coral-fantasy', displayName: '珊瑚防线',
        copy: { homeTitle: '珊瑚防线', homeSubtitle: '守护最后的珊瑚礁', homeAction: '进入潮汐地图', mapTitle: '潮汐战图', mapSubtitle: '选择珊瑚前哨', mapUpgrade: '英雄强化', detailBack: '返回', detailAction: '选择四座防御塔', deckTitle: '选择四座防御塔', deckHint: '固定阵容，局内不可更换', progressionTitle: '英雄强化', progressionMaterial: '局外货币', progressionCost: '强化花费', purchaseCost: '建造花费', battleGold: '局内资源', battleLife: '基地', resultWin: '守护成功', resultLose: '防线失守', resultAction: '返回地图' },
        sceneAssets: { homeBackground: 'demo-scene', worldMapBackground: 'demo-scene', levelBackground: 'demo-scene', battleBackground: 'demo-scene' },
        typography: { defaultFont: 'font-cn-main', minReadableSize: 13.5, outlineWidth: 0, outlineColor: [0.01,0.06,0.09,0.58], shadowColor: [0,0,0,0], shadowOffsetX: 0, shadowOffsetY: 0, styles: { title: { minSize: 19, letterSpacing: 0.8, outlineWidth: 0, shadowColor: [0,0,0,0], shadowOffsetX: 0, shadowOffsetY: 0 }, body: { minSize: 13.5, letterSpacing: 0.4, outlineWidth: 0 }, label: { minSize: 14, letterSpacing: 0.6, outlineWidth: 0 }, button: { minSize: 15, letterSpacing: 0.75, outlineWidth: 0, shadowColor: [0,0,0,0], shadowOffsetX: 0, shadowOffsetY: 0 }, compactButton: { minSize: 15, letterSpacing: 0, outlineWidth: 0, shadowColor: [0,0,0,0], shadowOffsetX: 0, shadowOffsetY: 0 } } },
        colors: { background: [0.025,0.10,0.17], panel: [0.07,0.24,0.29], primary: [0.16,0.72,0.70], accent: [0.96,0.48,0.36], success: [0.20,0.76,0.48], disabled: [0.24,0.30,0.34], frame: [0.72,0.96,0.91], route: [0.34,0.48,0.48], ground: [0.08,0.30,0.31], obstacle: [0.72,0.36,0.28], enemy: [0.92,0.28,0.38], health: [0.28,0.94,0.46], gold: [1.0,0.82,0.28] },
        rolePalette: [[0.18,0.72,0.86],[0.94,0.42,0.32],[0.32,0.78,0.92],[0.78,0.42,0.88],[0.26,0.86,0.58],[0.34,0.52,0.96]],
        enemyPalette: [[.96,.34,.32],[.92,.48,.24],[.84,.26,.58],[.54,.42,.78],[.40,.54,.90],[.62,.22,.30],[.46,.12,.26]],
        mapStyle: { tileGap: 2, tileBorder: 2, tileBorderColor: [0.10,0.42,0.42], groundAccentColor: [0.12,0.38,0.34], routeInset: 0.18, routeMarkerColor: [0.62,0.76,0.70], obstacleInset: 0.20, obstacleAccentColor: [0.96,0.58,0.34], spawnColor: [0.22,0.86,0.78], goalColor: [1.0,0.72,0.30], backgroundBandColor: [0.04,0.22,0.31], backgroundBandCount: 5 },
        combatEffects: {
          tower: { color: [0.42,0.94,1.0,1], impactColor: [0.88,1.0,1.0,1], duration: 0.18, trailWidth: 0.07, impactScale: 0.18 },
          hero: { color: [1.0,0.76,0.20,1], impactColor: [1.0,0.34,0.16,1], duration: 0.28, trailWidth: 0.12, impactScale: 0.30 }
        },
        roleAppearances: [
          { bodyShape: 'tall', accessory: 'blade', bodyScaleX: 0.56, bodyScaleY: 0.72, headScale: 0.34, secondaryColor: [0.10,0.34,0.48], accentColor: [0.82,0.98,0.94] },
          { bodyShape: 'wide', accessory: 'bow', bodyScaleX: 0.70, bodyScaleY: 0.58, headScale: 0.31, secondaryColor: [0.46,0.16,0.18], accentColor: [1.0,0.78,0.34] },
          { bodyShape: 'robe', accessory: 'orb', bodyScaleX: 0.62, bodyScaleY: 0.68, headScale: 0.36, secondaryColor: [0.12,0.38,0.62], accentColor: [0.80,0.98,1.0] },
          { bodyShape: 'robe', accessory: 'staff', bodyScaleX: 0.60, bodyScaleY: 0.72, headScale: 0.34, secondaryColor: [0.36,0.16,0.54], accentColor: [1.0,0.66,0.88] },
          { bodyShape: 'light', accessory: 'fan', bodyScaleX: 0.54, bodyScaleY: 0.62, headScale: 0.30, secondaryColor: [0.10,0.42,0.32], accentColor: [0.86,1.0,0.62] },
          { bodyShape: 'tall', accessory: 'shell', bodyScaleX: 0.64, bodyScaleY: 0.74, headScale: 0.38, secondaryColor: [0.14,0.24,0.58], accentColor: [0.72,0.88,1.0] }
        ],
        enemyAppearances: [
          { bodyShape:'light', accessory:'eyes', bodyScaleX:.52, bodyScaleY:.44, headScale:.20, secondaryColor:[.52,.12,.16], accentColor:[1,.78,.68] },
          { bodyShape:'wide', accessory:'spikes', bodyScaleX:.66, bodyScaleY:.52, headScale:.24, secondaryColor:[.48,.20,.10], accentColor:[1,.84,.54] },
          { bodyShape:'blob', accessory:'eyes', bodyScaleX:.48, bodyScaleY:.38, headScale:.18, secondaryColor:[.44,.10,.30], accentColor:[1,.68,.88] },
          { bodyShape:'armored', accessory:'horns', bodyScaleX:.76, bodyScaleY:.66, headScale:.28, secondaryColor:[.24,.18,.46], accentColor:[.82,.72,1] },
          { bodyShape:'robe', accessory:'orb', bodyScaleX:.58, bodyScaleY:.66, headScale:.30, secondaryColor:[.14,.24,.54], accentColor:[.70,.86,1] },
          { bodyShape:'giant', accessory:'shell', bodyScaleX:.86, bodyScaleY:.78, headScale:.32, secondaryColor:[.30,.08,.12], accentColor:[.96,.54,.48] },
          { bodyShape:'giant', accessory:'crown', bodyScaleX:.96, bodyScaleY:.92, headScale:.36, secondaryColor:[.20,.04,.14], accentColor:[1,.42,.58] }
        ]
      },
      systems: {
        M1_loadout: { resource_name: '局内资源', tower_pool_size: 6, loadout_size: 4, cost_increment_tiers: [{ start: 1, end: 8, step: 1 }, { start: 9, end: 15, step: 3 }, { start: 16, end: null, step: 5 }] },
        M2_slot: { slot_categories: [{ name: 'tower_slot', count: 6 }, { name: 'hero_slot', count: 3 }] },
        M3_item: { item_pool: [{ id: 'item-economy', category: 'economy', effect: 'income_multiplier', value: 1.25, displayName: '经济强化', description: '本局经济收益提高25%' }, { id: 'item-clear', category: 'combat', effect: 'clear_all_enemies', value: 0, displayName: '清除怪物', description: '清除当前地图全部怪物' }], choices_per_trigger: 2, ad_gate: true, trigger_timing: 'manual_button' },
        M4_economy_unit: { unit_id: 'tower-5', production_interval: 5, production_amount: 8 },
        M5_hero: { hero_unit_pool: [{ id:'hero-1',unitId:'hero-unit-1',combatRole:'rapid_damage',uiName:'潮汐先锋',roleDescription:'快速输出，支援主防线',color:[1,.72,.25],portraitAsset:'demo-guardian' },{ id:'hero-2',unitId:'hero-unit-2',combatRole:'long_range_slow',uiName:'深海贤者',roleDescription:'远程减速，控制敌群',color:[.45,.82,1],portraitAsset:'demo-guardian' },{ id:'hero-3',unitId:'hero-unit-3',combatRole:'area_damage',uiName:'星礁统领',roleDescription:'范围攻击，清理敌群',color:[.92,.48,.90],portraitAsset:'demo-guardian' }], deploy_limit_per_match: 1, loadout_limit:1, hero_upgrade_currency: 'outer_currency' },
        M6_units: { pow_formula: 'ATK*FRQ*RGE', range_primary: true, roles: ['melee_high_atk','mid_balanced','ranged_coverage','single_target_finisher'] },
        M7_resources: { inner: { id: 'inner_currency', usage: 'build_tower', sources: ['economy_unit','kill_enemy'] }, outer: { id: 'outer_currency', usage: 'hero_upgrade', sources: ['match_settlement'] }, win_reward: 25, lose_reward: 8, exchange_enabled: false },
        M8_balance: { damage_model: 'subtract_defense', tower_pow_formula: 'ATK*FRQ*RGE', enemy_pressure_formula: 'HP*SPD', effective_path_length: 17, tower_pow_target_min: 20, tower_pow_target_max: 80, wave_pressure_target_min: 50, wave_pressure_target_max: 4000, minimum_defense_ratio: 1, enemy_speed_scale: .8 },
        M9_crisis: { crisis_wave_ratio: 0.42, tutorial_wave_count: 4, risk_conversion_mechanism: 'base_hp_to_inner_currency', conversion_rate: 10 },
        M10_rank: { rank_name: '关卡', difficulty_scale_per_tier: 0.15, failure_downgrade: false },
        M11_randomness: { map_rotation_period: 'daily', boss_uncertainty_dims: [], boss_source: 'waves', item_choice_fairness_guard: 'cross_category' },
        M14_energy: { daily_max_energy: 10, energy_cost_per_match: 1, refill_methods: ['rewarded_ad','share'], ad_refill_amount:5, share_refill_amount:3 },
        M16_feedback: { settlement_layers_min: 2, failure_reward_enabled: true }
      },
      deckRules: { deckSize: 4, allowDuplicates: false, requiredTags: [], bannedCardIds: [] },
      cards: [
        { id: 'card-1', unitId: 'tower-1', combatRole: 'single_target', displayName: '潮刃卫士', uiName: '潮刃卫士', roleDescription: '稳定单体伤害', symbol: 1, tags: ['rapid'], color: [0.18,0.72,0.86], portraitAsset: '' },
        { id: 'card-2', unitId: 'tower-2', combatRole: 'long_range_single', displayName: '赤礁射手', uiName: '赤礁射手', roleDescription: '远距离单体输出', symbol: 2, tags: ['precision'], color: [0.94,0.42,0.32], portraitAsset: '' },
        { id: 'card-3', unitId: 'tower-3', combatRole: 'slow_control', displayName: '冰潮术士', uiName: '冰潮术士', roleDescription: '减速控制敌人推进', symbol: 3, tags: ['control'], color: [0.32,0.78,0.92], portraitAsset: '' },
        { id: 'card-4', unitId: 'tower-4', combatRole: 'area_damage', displayName: '星珊瑚法师', uiName: '星珊瑚法师', roleDescription: '范围攻击多个敌人', symbol: 4, tags: ['area'], color: [0.78,0.42,0.88], portraitAsset: '' },
        { id: 'card-5', unitId: 'tower-5', combatRole: 'economy', displayName: '海风游侠', uiName: '海风游侠', roleDescription: '周期产出局内资源', symbol: 5, tags: ['rapid'], color: [0.26,0.86,0.58], portraitAsset: '' },
        { id: 'card-6', unitId: 'tower-6', combatRole: 'long_range_slow', displayName: '深蓝祭司', uiName: '深蓝祭司', roleDescription: '远程减速控制敌人', symbol: 6, tags: ['control'], color: [0.34,0.52,0.96], portraitAsset: '' }
      ],
      progression: { maxLevel:20,baseXp:100,xpGrowth:1.25,statPerLevel:.04,baseUpgradeCost:25,upgradeCostGrowth:1.35,heroMaxLevel:20,heroStatPerLevel:.06,heroBaseUpgradeCost:30,heroUpgradeCostGrowth:1.4 },
      bonds: [
        { id: 'bond-rapid', tag: 'rapid', thresholds: [{ count: 2, effect: { type: 'attackSpeedMultiplier', value: 0.9 } }] },
        { id: 'bond-control', tag: 'control', thresholds: [{ count: 2, effect: { type: 'slowPowerBonus', value: 0.1 } }] }
      ],
      worldMap: { nodes: fallbackNodes },
      levels: fallbackLevelRefs,
      assetManifest: [
        { key: 'ui-item-question', type: 'image', url: 'assets/Image/ui/item-question-glass.jpeg', version: '1', preload: true, render: { fit: 'contain' } },
        { key: 'ui-level-lock', type: 'image', url: 'assets/Image/ui/level-lock.png', version: '1', preload: true, render: { fit: 'contain' } },
        { key: 'demo-scene', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover' } },
        { key: 'tile-grass', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover', region: [0,0,.333,.333] } },
        { key: 'tile-road', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover', region: [.333,0,.666,.333] } },
        { key: 'tile-spawn', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover', region: [.666,0,1,.333] } },
        { key: 'tile-goal', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover', region: [0,.333,.333,.666] } },
        { key: 'tile-obstacle', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover', region: [.333,.333,.666,.666] } },
        { key: 'tile-tower-slot', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover', region: [.666,.333,1,.666] } },
        { key: 'tile-hero-slot', type: 'image', url: 'assets/Image/demo/coral-battlefield.png', version: '1', preload: true, render: { fit: 'cover', region: [0,.666,.333,1] } },
        { key: 'demo-guardian', type: 'image', url: 'assets/Image/demo/coral-guardian.png', version: '1', preload: true, render: { fit: 'cover' } },
        { key: 'demo-guardian-lv1', type: 'image', url: 'assets/Image/demo/coral-guardian.png', version: '1', preload: true, render: { fit: 'cover', region: [0,0,1,1] } },
        { key: 'demo-guardian-lv2', type: 'image', url: 'assets/Image/demo/coral-guardian.png', version: '1', preload: true, render: { fit: 'cover', region: [.04,.04,.96,.96] } },
        { key: 'demo-guardian-lv3', type: 'image', url: 'assets/Image/demo/coral-guardian.png', version: '1', preload: true, render: { fit: 'cover', region: [.08,0,.92,.92] } }
      ]
    },
    levels: fallbackLevels
  };
  M3.NeutralConfig.manifest.cards.forEach(function (card) { card.portraitAsset = 'demo-guardian'; });
  for (fallbackIndex = 0; fallbackIndex < 9; fallbackIndex += 1) M3.NeutralConfig.manifest.assetManifest.push({ key: 'font-cn-main-' + fallbackIndex, type: 'image', url: 'assets/Font/font-cn-main-' + fallbackIndex + '.png', version: '1', preload: true });
})();
