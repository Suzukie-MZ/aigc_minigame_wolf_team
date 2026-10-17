(function () {
  var M3 = window.M3, BASE = (window.RUNTIME_CONFIG_BASE_URL || '').replace(/\/$/, ''), ENDPOINTS = window.RUNTIME_CONFIG_ENDPOINTS || {}, MANIFEST_URL = ENDPOINTS.manifestUrl || (BASE ? BASE + '/v1/games/ks654147848546150500/runtime-manifest' : ''), LEVEL_URL_TEMPLATE = ENDPOINTS.levelUrlTemplate || (BASE ? BASE + '/v1/games/ks654147848546150500/levels/{levelId}' : ''), state = { source: 'loading', manifest: null, levels: {}, errors: [] };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function merge(base, extra) { var out = {}, key; for (key in base) if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key]; for (key in extra) if (Object.prototype.hasOwnProperty.call(extra, key)) out[key] = extra[key]; return out; }
  function color(value, fallback) { return Array.isArray(value) && value.length >= 3 ? value.slice(0, 4) : clone(fallback); }
  function appearance(value, fallback, primary) { var out = merge(fallback, value || {}); out.primaryColor = color(value && value.primaryColor, primary); out.secondaryColor = color(value && value.secondaryColor, fallback.secondaryColor); out.accentColor = color(value && value.accentColor, fallback.accentColor); return out; }
  function configOrigin(url) { var match = /^(https?:\/\/[^/]+)/.exec(url || ''); return match ? match[1] : ''; }
  function normalizeAssetUrls(manifest) { var origin = configOrigin(MANIFEST_URL), list = manifest && manifest.assetManifest || [], i; if (!origin) return manifest; for (i = 0; i < list.length; i += 1) if (list[i] && typeof list[i].url === 'string' && list[i].url.charAt(0) === '/') list[i].url = origin + list[i].url; var animation=manifest.presentation&&manifest.presentation.combatAnimations;
    function normalizeAtlasUrls(value){if(!value||typeof value!=='object')return;if(value.key&&Array.isArray(value.frames)){if(typeof value.url==='string'&&value.url.charAt(0)==='/')value.url=origin+value.url;return;}Object.keys(value).forEach(function(key){normalizeAtlasUrls(value[key]);});}
    if(animation&&animation.roles)normalizeAtlasUrls(animation.roles);
    return manifest; }
  function applyLegacyUnitRole(unit,role,kind,economy){if(!unit||!role)return;unit.combatRole=role;if(role==='economy'){unit.kind='economy';unit.skill='none';if(unit.productionInterval===undefined)unit.productionInterval=Number(economy&&economy.production_interval)||5;if(unit.productionAmount===undefined)unit.productionAmount=Number(economy&&economy.production_amount)||1;return;}unit.kind=kind;if(role==='slow_control'||role==='long_range_slow'){unit.skill='slow';if(typeof unit.skillPower!=='number')unit.skillPower=.25;if(typeof unit.skillDuration!=='number')unit.skillDuration=1.2;}else if(role==='area_damage'){unit.skill='splash';if(typeof unit.skillPower!=='number')unit.skillPower=.35;}else unit.skill='none';}
  function applyUnitRole(unit,role,kind,economy,authoritative){
    if(!authoritative){applyLegacyUnitRole(unit,role,kind,economy);return;}
    if(!unit||!role)return;
    if(unit.combatRole===undefined)unit.combatRole=role;
    var effective=unit.combatRole, expectedKind=effective==='economy'?'economy':kind;
    if(unit.kind===undefined)unit.kind=expectedKind;
    if(effective==='economy'){
      if(unit.productionInterval===undefined)unit.productionInterval=Number(economy&&economy.production_interval)||5;
      if(unit.productionAmount===undefined)unit.productionAmount=Number(economy&&economy.production_amount)||1;
      return;
    }
    var skill=effective==='slow_control'||effective==='long_range_slow'?'slow':effective==='area_damage'?'splash':'none';
    if(unit.skill===undefined)unit.skill=skill;
    if(unit.skill==='slow'){
      if(unit.skillPower===undefined)unit.skillPower=.25;
      if(unit.skillDuration===undefined)unit.skillDuration=1.2;
    }else if(unit.skill==='splash'&&unit.skillPower===undefined)unit.skillPower=.35;
  }
  function normalizeRoleContracts(manifest,level){var units=level&&level.units||[],byId={},cards=manifest&&manifest.cards||[],heroes=manifest&&manifest.systems&&manifest.systems.M5_hero&&manifest.systems.M5_hero.hero_unit_pool||[],economy=manifest&&manifest.systems&&manifest.systems.M4_economy_unit,i;for(i=0;i<units.length;i+=1)byId[units[i].id]=units[i];for(i=0;i<Math.min(6,cards.length);i+=1)applyUnitRole(byId[cards[i].unitId],cards[i].combatRole,'tower',economy,manifest.systems.M8_balance.unit_stats_mode==='final');for(i=0;i<Math.min(3,heroes.length);i+=1)applyUnitRole(byId[heroes[i].unitId],heroes[i].combatRole,'hero',economy,manifest.systems.M8_balance.unit_stats_mode==='final');return level;}
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
  function levelUrl(manifest, id) { var ref = manifest.levels && manifest.levels[id]; return ref && typeof ref.url === 'string' && /^https:\/\//.test(ref.url) ? ref.url : LEVEL_URL_TEMPLATE.replace('{levelId}', encodeURIComponent(id)); }
  function applyPresentationFallback(manifest, levels) {
    var defaults = M3.NeutralConfig.manifest.presentation, supplied = manifest.presentation || {}, dc = defaults.colors, sc = supplied.colors || {}, cards = manifest.cards || [], rolePalette, enemyPalette, roleAppearances, enemyAppearances, cardByUnit = {}, assetKeys = {}, fallbackAssets = M3.NeutralConfig.manifest.assetManifest || [], key, i, j, units, enemyIndex, fallbackAppearance;
    manifest.presentation = clone(defaults); manifest.presentation.themeId = supplied.themeId || defaults.themeId; manifest.presentation.displayName = supplied.displayName || defaults.displayName;
    if(Object.prototype.hasOwnProperty.call(supplied,'combatAnimations'))manifest.presentation.combatAnimations=clone(supplied.combatAnimations);
    manifest.presentation.sceneAssets = merge({}, supplied.sceneAssets || {});
    manifest.presentation.copy = merge(defaults.copy, supplied.copy || {});
    manifest.presentation.typography = merge(defaults.typography || {}, supplied.typography || {});
    manifest.presentation.typography.styles = merge((defaults.typography && defaults.typography.styles) || {}, (supplied.typography && supplied.typography.styles) || {});
    // UI icons and font atlases are bundled with the game; keep atlas pixels aligned with the local glyph index.
    var localUi = {};
    for (i = 0; i < fallbackAssets.length; i += 1) if (/^ui-(item|map|result)-/.test(fallbackAssets[i].key) || /^font-cn-main-/.test(fallbackAssets[i].key) || fallbackAssets[i].key === 'ui-level-lock') localUi[fallbackAssets[i].key] = true;
    manifest.assetManifest = (manifest.assetManifest || []).filter(function (item) { return item && !localUi[item.key]; });
    for (i = 0; i < manifest.assetManifest.length; i += 1) assetKeys[manifest.assetManifest[i].key] = true;
    for (i = 0; i < fallbackAssets.length; i += 1) {
      if (localUi[fallbackAssets[i].key] || (fallbackAssets[i].key.indexOf('font-cn-main-') === 0 && !assetKeys[fallbackAssets[i].key])) manifest.assetManifest.push(clone(fallbackAssets[i]));
    }
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
    applyLevelPresentation(manifest,levels);
    return { manifest: manifest, levels: levels };
  }
  function applyLevelPresentation(manifest,levels){
    var cards=manifest.cards||[],cardByUnit={},key,i,j,units,enemyIndex,fallbackAppearance;
    for(i=0;i<cards.length;i+=1)cardByUnit[cards[i].unitId]=cards[i];
    for (key in levels) if (Object.prototype.hasOwnProperty.call(levels, key)) {
      levels[key].map.presentation = merge({ groundColor: manifest.presentation.colors.ground, routeColor: manifest.presentation.colors.route, obstacleColor: manifest.presentation.colors.obstacle, waterColor: manifest.presentation.colors.background }, levels[key].map.presentation || {});
      levels[key].map.presentation.style = merge(manifest.presentation.mapStyle, levels[key].map.presentation.style || {});
      levels[key].uiName = levels[key].uiName || levels[key].name || '珊瑚前哨'; levels[key].description = levels[key].description || '守住最后的珊瑚礁'; levels[key].objective = levels[key].objective || ('坚持' + levels[key].waves.length + '波攻击');
      units = levels[key].units || []; enemyIndex = 0;
      for (j = 0; j < units.length; j += 1) { if (typeof units[j].attack === 'number') { fallbackAppearance = cardByUnit[units[j].id] ? cardByUnit[units[j].id].appearance : manifest.presentation.roleAppearances[j % manifest.presentation.roleAppearances.length]; units[j].color = color(units[j].color, fallbackAppearance.primaryColor); units[j].appearance = appearance(units[j].appearance, fallbackAppearance, units[j].color); } else { fallbackAppearance = manifest.presentation.enemyAppearances[enemyIndex % manifest.presentation.enemyAppearances.length]; units[j].color = color(units[j].color, manifest.presentation.enemyPalette[enemyIndex % manifest.presentation.enemyPalette.length]); units[j].appearance = appearance(units[j].appearance, fallbackAppearance, units[j].color); enemyIndex += 1; } }
    }
    return levels;
  }
  function accept(manifest, levels, source, errors) { var bundle = applyPresentationFallback(clone(manifest), clone(levels)); state.manifest = bundle.manifest; state.levels = bundle.levels; state.source = source; state.errors = errors || [];  }
  function validBundle(manifest, levels) {
    var refs = manifest && manifest.levels, nodes = manifest && manifest.worldMap && manifest.worldMap.nodes, cards = (manifest&&manifest.cards||[]).filter(function(card){var banned=manifest&&manifest.deckRules&&manifest.deckRules.bannedCardIds||[];return card.unlocked!==false&&banned.indexOf(card.id)<0;}).slice(0,6), heroes=(manifest&&manifest.systems&&manifest.systems.M5_hero&&manifest.systems.M5_hero.hero_unit_pool||[]).slice(0,3), economyId=manifest&&manifest.systems&&manifest.systems.M4_economy_unit&&manifest.systems.M4_economy_unit.unit_id, key, i, j, unit, unitIds;
    if (!M3.ConfigValidator.validateManifest(manifest).ok || !refs || !levels) return false;
    for (key in levels) if (Object.prototype.hasOwnProperty.call(levels, key)) {
      if (!refs[key] || !levels[key] || !M3.ConfigValidator.validateLevel(levels[key]).ok) return false;
      // 素材引用只影响对应图片的表现，不再作为整套远程配置的回退条件。
      // TextureAssets / Renderer 会对未声明或加载失败的单个素材使用默认资源或程序化兜底。
      unitIds = {}; for (i = 0; i < levels[key].units.length; i += 1) { unit=levels[key].units[i];unitIds[unit.id] = true; }
      for (j = 0; j < cards.length; j += 1) if (cards[j].unlocked !== false && !unitIds[cards[j].unitId]) return false;
      for (j = 0; j < heroes.length; j += 1) if (!unitIds[heroes[j].unitId]) return false;
      if (economyId && !unitIds[economyId]) return false;
    }
    for (i = 0; i < nodes.length; i += 1) if (!refs[nodes[i].levelId]) return false;
    return Object.keys(refs).length > 0 && Object.keys(levels).length > 0;
  }
  function fallback(reason) {
    state.manifest = null;
    state.levels = {};
    state.source = 'error';
    state.errors = [reason || '配置加载失败'];
  }
  function request(url, callback, retried) {
    KwaiNetwork.request({ url: url, method: 'GET', timeout: 5000, onSuccess: function (res) {
      if (res.statusCode >= 200 && res.statusCode < 300) callback(null, res.data); else if (res.statusCode >= 500 && !retried) setTimeout(function () { request(url, callback, true); }, 500); else callback(new Error('HTTP ' + res.statusCode));
    }, onFail: function (err) { if (!retried) setTimeout(function () { request(url, callback, true); }, 500); else callback(new Error((err && err.errMsg) || 'network')); } });
  }
  var session = 0, inFlight = {}, backgroundStarted = false, extraStatus = 'idle', extraCallbacks = [], EXTRA_CACHE_KEY = 'ks0987654321.runtime-extra.v1';
  function ensureLevel(id, done) {
    var attempt = session, target = state, manifest = state.manifest;
    done = done || function () {};
    if (state.levels[id]) { done(null, state.levels[id]); return; }
    if (!manifest || !manifest.levels[id]) { done(new Error('关卡配置不可用')); return; }
    if (inFlight[id]) { inFlight[id].push(done); return; }
    var url = levelUrl(manifest, id);
    if (!url) { done(new Error('关卡地址缺失，请检查最新发布清单: ' + id)); return; }
    var callbacks = inFlight[id] = [done];
    request(url, function (err, level) {
      var levels = {}, bundle;
      if (attempt !== session || target !== state) return;
      if (!err) {
        level = normalizeRoleContracts(manifest, normalizeLevelCompatibility(level));
        levels[id] = level;
        if (manifest.deliveryProfile === 'startup' && level.releaseId !== manifest.releaseId) err = new Error('关卡发布版本不一致: ' + id);
        else if (!validBundle(manifest, levels)) err = new Error('关卡配置校验失败: ' + id);
        else {
          bundle = applyLevelPresentation(manifest, clone(levels));
          state.levels[id] = bundle[id];
        }
      }
      delete inFlight[id];
      if (err) state.errors.push('level ' + id + ': ' + err.message);
      callbacks.forEach(function (callback) { callback(err, state.levels[id]); });
    });
  }
  function loadBackgroundLevels() {
    if (backgroundStarted || !state.manifest) return;
    backgroundStarted = true;
    var attempt = session, queue = Object.keys(state.manifest.levels).filter(function (id) { return !state.levels[id]; });
    function next() {
      if (attempt !== session || !queue.length) return;
      ensureLevel(queue.shift(), function () { setTimeout(next, 0); });
    }
    next(); next();
  }
  function mergeExtra(extra) {
    var manifest = state.manifest, combined, nodeById = {}, nodeByLevel = {}, assets = {}, list = [], nodes = [], i;
    if (!extra || extra.deliveryVersion !== 1 || extra.deliveryProfile !== 'extra' || extra.releaseId !== manifest.releaseId || extra.gameId !== manifest.gameId) throw new Error('扩展清单发布版本不一致');
    if (!extra.levels || !extra.worldMap || !Array.isArray(extra.worldMap.nodes) || !Array.isArray(extra.assetManifest)) throw new Error('扩展清单格式错误');
    combined = clone(manifest);
    combined.levels = merge(manifest.levels, extra.levels);
    (manifest.worldMap.nodes || []).concat(extra.worldMap.nodes).forEach(function (node) {
      if (nodeById[node.id] || nodeByLevel[node.levelId]) throw new Error('扩展关卡目录重复: ' + node.levelId);
      nodeById[node.id] = true; nodeByLevel[node.levelId] = true; nodes.push(clone(node));
    });
    nodes.sort(function (a, b) { return (a.levelNumber || combined.levels[a.levelId].levelNumber || 0) - (b.levelNumber || combined.levels[b.levelId].levelNumber || 0); });
    (manifest.assetManifest || []).concat(extra.assetManifest).forEach(function (asset) {
      if (!assets[asset.key]) list.push(asset.key);
      assets[asset.key] = clone(asset);
    });
    combined.worldMap.nodes = nodes;
    combined.assetManifest = list.map(function (id) { return assets[id]; });
    if (!M3.ConfigValidator.validateManifest(combined).ok) throw new Error('扩展清单配置校验失败');
    for (i = 0; i < nodes.length; i += 1) if (!combined.levels[nodes[i].levelId]) throw new Error('扩展关卡入口缺失');
    if (manifest.totalLevelCount && nodes.length !== manifest.totalLevelCount) throw new Error('扩展关卡数量不匹配');
    // Keep the manifest object shared with the game, updating only the directory and asset references.
    manifest.levels = combined.levels;
    manifest.worldMap.nodes = combined.worldMap.nodes;
    manifest.assetManifest = combined.assetManifest;
  }
  function loadRemaining(done) {
    var manifest = state.manifest, attempt = session, cached, callbacks;
    done = done || function () {};
    if (!manifest) { done(new Error('配置尚未就绪')); return; }
    // Complete manifests can start immediately; split delivery waits until the extra directory is merged.
    if (!manifest.extraManifestUrl) { loadBackgroundLevels(); done(null); return; }
    if (extraStatus === 'ready') { done(null); setTimeout(function () { if (attempt === session) loadBackgroundLevels(); }, 0); return; }
    extraCallbacks.push(done);
    if (extraStatus === 'loading') return;
    extraStatus = 'loading';
    function finish(err) {
      if (attempt !== session) return;
      extraStatus = err ? 'error' : 'ready';
      if (err) state.errors.push('extra manifest: ' + err.message);
      callbacks = extraCallbacks; extraCallbacks = [];
      callbacks.forEach(function (callback) { callback(err); });
      if (!err) setTimeout(function () { if (attempt === session) loadBackgroundLevels(); }, 0);
    }
    try {
      cached = typeof KwaiStorage !== 'undefined' && KwaiStorage.getSync(EXTRA_CACHE_KEY);
      if (cached && cached.releaseId === manifest.releaseId && cached.url === manifest.extraManifestUrl) {
        try { mergeExtra(cached.manifest); finish(null); return; } catch (cacheError) { cached = null; }
      }
    } catch (storageError) { cached = null; }
    if (!/^https:\/\//.test(manifest.extraManifestUrl)) { finish(new Error('扩展清单地址无效')); return; }
    request(manifest.extraManifestUrl, function (err, extra) {
      if (attempt !== session) return;
      if (!err) {
        try { extra = normalizeAssetUrls(extra); mergeExtra(extra); }
        catch (error) { err = error; }
        if (!err) try {
          if (typeof KwaiStorage !== 'undefined') KwaiStorage.setSync(EXTRA_CACHE_KEY, { releaseId: manifest.releaseId, url: manifest.extraManifestUrl, manifest: extra });
        } catch (storageError) { /* Cache failure must not block the live response. */ }
      }
      finish(err);
    });
  }
  // 固定清单会更新，每次初始化使用独立请求；版本化关卡和图片继续使用缓存。
  function freshManifestUrl(attempt) {
    var parts = MANIFEST_URL.split('#'), url = parts.shift();
    return url + (url.indexOf('?') === -1 ? '?' : '&') + '_runtime=' + Date.now() + '-' + attempt + '-' + Math.random().toString(36).slice(2) + (parts.length ? '#' + parts.join('#') : '');
  }
  function loadRemote(done, options) {
    var attempt = ++session;
    state = { source: 'loading', manifest: null, levels: {}, errors: [] };
    inFlight = {}; backgroundStarted = false; extraStatus = 'idle'; extraCallbacks = [];
    request(freshManifestUrl(attempt), function (err, manifest) {
      var validation, refs, pending, levelErrors = [];
      if (attempt !== session) return;
      if (err) { fallback(err.message); done(); return; }
      manifest = normalizeAssetUrls(manifest);
      validation = M3.ConfigValidator.validateManifest(manifest);
      if (!validation.ok) { fallback(validation.errors.join(',')); done(); return; }
      refs = manifest.worldMap.nodes.slice(0, Math.max(1, options && options.initialLevelCount || 4)).map(function (node) { return node.levelId; }).filter(function (id, index, ids) { return ids.indexOf(id) === index; });
      pending = refs.length;
      if (!pending) { fallback('no levels'); done(); return; }
      accept(manifest, {}, 'loading', []);
      refs.forEach(function (id) { ensureLevel(id, function (levelErr) {
        if (levelErr) levelErrors.push('level ' + id + ': ' + levelErr.message);
        pending -= 1;
        if (!pending) {
          if (levelErrors.length) fallback('level load failed: ' + levelErrors.join('; '));
          else state.source = 'remote';
          done();
        }
      }); });
    });
  }
  M3.RuntimeConfig = {
    init: function (done, options) { if (!MANIFEST_URL) { fallback('runtime endpoints empty'); setTimeout(done, 0); } else loadRemote(done, options); },
    ensureLevel: ensureLevel, loadRemaining: loadRemaining, getExtraStatus: function () { return extraStatus; },
    getManifest: function () { return state.manifest; }, getLevel: function (id) { return state.levels[id]; },
    getSource: function () { return state.source; }, getErrors: function () { return state.errors.slice(0); }, getBaseUrl: function () { return BASE; }, getManifestUrl: function () { return MANIFEST_URL; }, normalizeLevelCompatibility: normalizeLevelCompatibility, normalizeRoleContracts: normalizeRoleContracts
  };
})();
