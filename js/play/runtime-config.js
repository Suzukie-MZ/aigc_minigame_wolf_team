(function () {
  var M3 = window.M3, CACHE = 'm3-runtime-config-v5', BASE = (window.RUNTIME_CONFIG_BASE_URL || '').replace(/\/$/, ''), ENDPOINTS = window.RUNTIME_CONFIG_ENDPOINTS || {}, MANIFEST_URL = ENDPOINTS.manifestUrl || (BASE ? BASE + '/v1/games/ks654147848546150500/runtime-manifest' : ''), LEVEL_URL_TEMPLATE = ENDPOINTS.levelUrlTemplate || (BASE ? BASE + '/v1/games/ks654147848546150500/levels/{levelId}' : ''), state = { source: 'fallback', manifest: null, levels: {}, errors: [] };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function merge(base, extra) { var out = {}, key; for (key in base) if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key]; for (key in extra) if (Object.prototype.hasOwnProperty.call(extra, key)) out[key] = extra[key]; return out; }
  function color(value, fallback) { return Array.isArray(value) && value.length >= 3 ? value.slice(0, 4) : clone(fallback); }
  function appearance(value, fallback, primary) { var out = merge(fallback, value || {}); out.primaryColor = color(value && value.primaryColor, primary); out.secondaryColor = color(value && value.secondaryColor, fallback.secondaryColor); out.accentColor = color(value && value.accentColor, fallback.accentColor); return out; }
  function configOrigin(url) { var match = /^(https?:\/\/[^/]+)/.exec(url || ''); return match ? match[1] : ''; }
  function normalizeAssetUrls(manifest) { var origin = configOrigin(MANIFEST_URL), list = manifest && manifest.assetManifest || [], i; if (!origin) return manifest; for (i = 0; i < list.length; i += 1) if (list[i] && typeof list[i].url === 'string' && list[i].url.charAt(0) === '/') list[i].url = origin + list[i].url; return manifest; }
  function applyUnitRole(unit,role,kind,economy){if(!unit||!role)return;unit.combatRole=role;if(role==='economy'){unit.kind='economy';unit.skill='none';if(typeof unit.productionInterval!=='number')unit.productionInterval=Number(economy&&economy.production_interval)||5;if(typeof unit.productionAmount!=='number')unit.productionAmount=Number(economy&&economy.production_amount)||1;return;}unit.kind=kind;if(role==='slow_control'||role==='long_range_slow'){unit.skill='slow';if(typeof unit.skillPower!=='number')unit.skillPower=.25;if(typeof unit.skillDuration!=='number')unit.skillDuration=1.2;}else if(role==='area_damage'){unit.skill='splash';if(typeof unit.skillPower!=='number')unit.skillPower=.35;}else unit.skill='none';}
  function normalizeRoleContracts(manifest,level){var units=level&&level.units||[],byId={},cards=manifest&&manifest.cards||[],heroes=manifest&&manifest.systems&&manifest.systems.M5_hero&&manifest.systems.M5_hero.hero_unit_pool||[],economy=manifest&&manifest.systems&&manifest.systems.M4_economy_unit,i;for(i=0;i<units.length;i+=1)byId[units[i].id]=units[i];for(i=0;i<Math.min(6,cards.length);i+=1)applyUnitRole(byId[cards[i].unitId],cards[i].combatRole,'tower',economy);for(i=0;i<Math.min(3,heroes.length);i+=1)applyUnitRole(byId[heroes[i].unitId],heroes[i].combatRole,'hero',economy);return level;}
  function inferredBoss(unit) { var id = unit && unit.id || '', asset = unit && unit.imageAsset || ''; return !!(unit && unit.kind === 'enemy' && (unit.boss === true || /(^|[-_.])boss([-_.]|$)/i.test(id) || /^boss([-_.]|$)/i.test(asset))); }
  function normalizeLevelCompatibility(level) {
    var units = level && level.units, i, unit, boss;
    if (!Array.isArray(units)) return level;
    for (i = 0; i < units.length; i += 1) {
      unit = units[i];
      if (!unit || unit.kind !== 'enemy') continue;
      boss = inferredBoss(unit);
      if (unit.boss === undefined && boss) unit.boss = true;
      if (unit.baseDamage === undefined) unit.baseDamage = boss ? 5 : 1;
      if (unit.renderScale === undefined) unit.renderScale = boss ? 1.15 : .72;
    }
    return level;
  }
  function levelUrl(id) { return LEVEL_URL_TEMPLATE.replace('{levelId}', encodeURIComponent(id)); }
  function applyPresentationFallback(manifest, levels) {
    var defaults = M3.NeutralConfig.manifest.presentation, supplied = manifest.presentation || {}, dc = defaults.colors, sc = supplied.colors || {}, cards = manifest.cards || [], rolePalette, enemyPalette, roleAppearances, enemyAppearances, cardByUnit = {}, assetKeys = {}, fallbackAssets = M3.NeutralConfig.manifest.assetManifest || [], key, i, j, units, enemyIndex, fallbackAppearance;
    manifest.presentation = clone(defaults); manifest.presentation.themeId = supplied.themeId || defaults.themeId; manifest.presentation.displayName = supplied.displayName || defaults.displayName;
    manifest.presentation.sceneAssets = merge(defaults.sceneAssets, supplied.sceneAssets || {});
    manifest.presentation.copy = merge(defaults.copy, supplied.copy || {});
    manifest.presentation.typography = merge(defaults.typography || {}, supplied.typography || {});
    manifest.presentation.typography.styles = merge((defaults.typography && defaults.typography.styles) || {}, (supplied.typography && supplied.typography.styles) || {});
    manifest.assetManifest = manifest.assetManifest || [];
    for (i = 0; i < manifest.assetManifest.length; i += 1) assetKeys[manifest.assetManifest[i].key] = true;
    for (i = 0; i < fallbackAssets.length; i += 1) if ((fallbackAssets[i].key.indexOf('font-cn-main-') === 0 || fallbackAssets[i].key.indexOf('ui-item-') === 0 || fallbackAssets[i].key.indexOf('ui-map-') === 0 || fallbackAssets[i].key === 'ui-level-lock' || fallbackAssets[i].key.indexOf('ui-result-') === 0) && !assetKeys[fallbackAssets[i].key]) manifest.assetManifest.push(clone(fallbackAssets[i]));
    for (key in dc) if (Object.prototype.hasOwnProperty.call(dc, key)) manifest.presentation.colors[key] = color(sc[key], dc[key]);
    rolePalette = Array.isArray(supplied.rolePalette) && supplied.rolePalette.length ? supplied.rolePalette : defaults.rolePalette;
    enemyPalette = Array.isArray(supplied.enemyPalette) && supplied.enemyPalette.length ? supplied.enemyPalette : defaults.enemyPalette;
    manifest.presentation.rolePalette = rolePalette.map(function (c, index) { return color(c, defaults.rolePalette[index % defaults.rolePalette.length]); });
    manifest.presentation.enemyPalette = enemyPalette.map(function (c, index) { return color(c, defaults.enemyPalette[index % defaults.enemyPalette.length]); });
    manifest.presentation.mapStyle = merge(defaults.mapStyle, supplied.mapStyle || {});
    manifest.presentation.combatEffects = {
      tower: merge(defaults.combatEffects.tower, supplied.combatEffects && supplied.combatEffects.tower || {}),
      hero: merge(defaults.combatEffects.hero, supplied.combatEffects && supplied.combatEffects.hero || {})
    };
    manifest.presentation.combatEffects.tower.color = color(manifest.presentation.combatEffects.tower.color, defaults.combatEffects.tower.color);
    manifest.presentation.combatEffects.tower.impactColor = color(manifest.presentation.combatEffects.tower.impactColor, defaults.combatEffects.tower.impactColor);
    manifest.presentation.combatEffects.hero.color = color(manifest.presentation.combatEffects.hero.color, defaults.combatEffects.hero.color);
    manifest.presentation.combatEffects.hero.impactColor = color(manifest.presentation.combatEffects.hero.impactColor, defaults.combatEffects.hero.impactColor);
    roleAppearances = Array.isArray(supplied.roleAppearances) && supplied.roleAppearances.length ? supplied.roleAppearances : defaults.roleAppearances;
    enemyAppearances = Array.isArray(supplied.enemyAppearances) && supplied.enemyAppearances.length ? supplied.enemyAppearances : defaults.enemyAppearances;
    manifest.presentation.roleAppearances = roleAppearances.map(function (a, index) { return appearance(a, defaults.roleAppearances[index % defaults.roleAppearances.length], manifest.presentation.rolePalette[index % manifest.presentation.rolePalette.length]); });
    manifest.presentation.enemyAppearances = enemyAppearances.map(function (a, index) { return appearance(a, defaults.enemyAppearances[index % defaults.enemyAppearances.length], manifest.presentation.enemyPalette[index % manifest.presentation.enemyPalette.length]); });
    for (i = 0; i < cards.length; i += 1) { cards[i].color = color(cards[i].color, manifest.presentation.rolePalette[i % manifest.presentation.rolePalette.length]); cards[i].symbol = cards[i].symbol || (i % 9) + 1; cards[i].uiName = cards[i].uiName || cards[i].displayName || ('守卫' + (i + 1)); if (typeof cards[i].portraitAsset !== 'string') cards[i].portraitAsset = ''; fallbackAppearance = manifest.presentation.roleAppearances[i % manifest.presentation.roleAppearances.length]; cards[i].appearance = appearance(cards[i].appearance, fallbackAppearance, cards[i].color); cardByUnit[cards[i].unitId] = cards[i]; }
    for (key in levels) if (Object.prototype.hasOwnProperty.call(levels, key)) {
      levels[key].map.presentation = merge({ groundColor: dc.ground, routeColor: dc.route, obstacleColor: dc.obstacle, waterColor: dc.background }, levels[key].map.presentation || {});
      levels[key].map.presentation.style = merge(manifest.presentation.mapStyle, levels[key].map.presentation.style || {});
      levels[key].uiName = levels[key].uiName || levels[key].name || '珊瑚前哨'; levels[key].description = levels[key].description || '守住最后的珊瑚礁'; levels[key].objective = levels[key].objective || ('坚持' + levels[key].waves.length + '波攻击');
      units = levels[key].units || []; enemyIndex = 0;
      for (j = 0; j < units.length; j += 1) { if (typeof units[j].attack === 'number') { fallbackAppearance = cardByUnit[units[j].id] ? cardByUnit[units[j].id].appearance : manifest.presentation.roleAppearances[j % manifest.presentation.roleAppearances.length]; units[j].color = color(units[j].color, fallbackAppearance.primaryColor); units[j].appearance = appearance(units[j].appearance, fallbackAppearance, units[j].color); } else { fallbackAppearance = manifest.presentation.enemyAppearances[enemyIndex % manifest.presentation.enemyAppearances.length]; units[j].color = color(units[j].color, manifest.presentation.enemyPalette[enemyIndex % manifest.presentation.enemyPalette.length]); units[j].appearance = appearance(units[j].appearance, fallbackAppearance, units[j].color); enemyIndex += 1; } }
    }
    return { manifest: manifest, levels: levels };
  }
  function accept(manifest, levels, source, errors) { var bundle = applyPresentationFallback(clone(manifest), clone(levels)); state.manifest = bundle.manifest; state.levels = bundle.levels; state.source = source; state.errors = errors || []; if (source === 'remote') try { KwaiStorage.setSync(CACHE, bundle); } catch (e) {} }
  function validBundle(manifest, levels) {
    var refs = manifest && manifest.levels, nodes = manifest && manifest.worldMap && manifest.worldMap.nodes, cards = (manifest&&manifest.cards||[]).filter(function(card){var banned=manifest&&manifest.deckRules&&manifest.deckRules.bannedCardIds||[];return card.unlocked!==false&&banned.indexOf(card.id)<0;}).slice(0,6), heroes=(manifest&&manifest.systems&&manifest.systems.M5_hero&&manifest.systems.M5_hero.hero_unit_pool||[]).slice(0,3), economyId=manifest&&manifest.systems&&manifest.systems.M4_economy_unit&&manifest.systems.M4_economy_unit.unit_id, key, i, j, unit, unitIds;
    if (!M3.ConfigValidator.validateManifest(manifest).ok || !refs || !levels) return false;
    for (key in refs) if (Object.prototype.hasOwnProperty.call(refs, key)) {
      if (!levels[key] || !M3.ConfigValidator.validateLevel(levels[key]).ok) return false;
      // 素材引用只影响对应图片的表现，不再作为整套远程配置的回退条件。
      // TextureAssets / Renderer 会对未声明或加载失败的单个素材使用默认资源或程序化兜底。
      unitIds = {}; for (i = 0; i < levels[key].units.length; i += 1) { unit=levels[key].units[i];unitIds[unit.id] = true; }
      for (j = 0; j < cards.length; j += 1) if (cards[j].unlocked !== false && !unitIds[cards[j].unitId]) return false;
      for (j = 0; j < heroes.length; j += 1) if (!unitIds[heroes[j].unitId]) return false;
      if (economyId && !unitIds[economyId]) return false;
    }
    for (i = 0; i < nodes.length; i += 1) if (!refs[nodes[i].levelId] || !levels[nodes[i].levelId]) return false;
    return Object.keys(refs).length > 0;
  }
  function fallback(reason) {
    var errors = state.errors.slice(0);
    errors.push(reason || 'fallback');
    var manifest = clone(M3.NeutralConfig.manifest), levels = clone(M3.NeutralConfig.levels), id;
    for (id in levels) if (Object.prototype.hasOwnProperty.call(levels, id)) normalizeRoleContracts(manifest, normalizeLevelCompatibility(levels[id]));
    accept(manifest, levels, 'fallback', errors);
  }
  function completeMissingLevels(manifest, levels, errors) {
    var refs = manifest.levels || {}, nodes = manifest.worldMap && manifest.worldMap.nodes || [], firstId = '', seed, nodeByLevel = {}, id, i, copy;
    for (i = 0; i < nodes.length; i += 1) nodeByLevel[nodes[i].levelId] = nodes[i];
    for (id in refs) if (Object.prototype.hasOwnProperty.call(refs, id) && levels[id]) { firstId = id; break; }
    seed = firstId && levels[firstId];
    if (!seed) return false;
    for (id in refs) if (Object.prototype.hasOwnProperty.call(refs, id) && !levels[id]) {
      copy = clone(seed);
      if (Object.prototype.hasOwnProperty.call(copy, 'id')) copy.id = id;
      if (nodeByLevel[id]) {
        copy.name = nodeByLevel[id].displayName || copy.name;
        copy.uiName = nodeByLevel[id].displayName || copy.uiName;
        copy.description = nodeByLevel[id].description || copy.description;
      }
      levels[id] = copy;
      errors.push('level fallback: ' + id);
    }
    return true;
  }
  function request(url, callback, retried) {
    KwaiNetwork.request({ url: url, method: 'GET', timeout: 5000, onSuccess: function (res) {
      if (res.statusCode >= 200 && res.statusCode < 300) callback(null, res.data); else if (res.statusCode >= 500 && !retried) setTimeout(function () { request(url, callback, true); }, 500); else callback(new Error('HTTP ' + res.statusCode));
    }, onFail: function (err) { if (!retried) setTimeout(function () { request(url, callback, true); }, 500); else callback(new Error((err && err.errMsg) || 'network')); } });
  }
  function loadRemote(done) {
    request(MANIFEST_URL, function (err, manifest) {
      var validation, refs = [], levels = {}, pending, remoteCount = 0, levelErrors = [];
      if (err) { fallback(err.message); done(); return; }
      manifest = normalizeAssetUrls(manifest);
      validation = M3.ConfigValidator.validateManifest(manifest); if (!validation.ok) { fallback(validation.errors.join(',')); done(); return; }
      Object.keys(manifest.levels || {}).forEach(function (id) { refs.push(id); }); pending = refs.length;
      if (!pending) { fallback('no levels'); done(); return; }
      refs.forEach(function (id) { request(levelUrl(id), function (levelErr, level) {
        var levelValidation;
        if (!levelErr) {
          level = normalizeRoleContracts(manifest,normalizeLevelCompatibility(level));
          levelValidation = M3.ConfigValidator.validateLevel(level);
        }
        if (levelErr) levelErrors.push('level ' + id + ': ' + levelErr.message);
        else if (!levelValidation.ok) levelErrors.push('level ' + id + ': ' + levelValidation.errors.join(','));
        else { levels[id] = level; remoteCount += 1; }
        pending -= 1;
        if (!pending) {
          if (!remoteCount || !completeMissingLevels(manifest, levels, levelErrors) || !validBundle(manifest, levels)) fallback('level load failed');
          else accept(manifest, levels, 'remote', levelErrors);
          done();
        }
      }); });
    });
  }
  M3.RuntimeConfig = {
    init: function (done) { if (!MANIFEST_URL || !LEVEL_URL_TEMPLATE) { fallback('runtime endpoints empty'); setTimeout(done, 0); } else loadRemote(done); },
    getManifest: function () { return state.manifest; }, getLevel: function (id) { return state.levels[id]; },
    getSource: function () { return state.source; }, getErrors: function () { return state.errors.slice(0); }, getBaseUrl: function () { return BASE; }, getManifestUrl: function () { return MANIFEST_URL; }, normalizeLevelCompatibility: normalizeLevelCompatibility, normalizeRoleContracts: normalizeRoleContracts
  };
})();
