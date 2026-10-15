(function () {
  var M3 = window.M3;
  function byId(list) { var out = {}; list.forEach(function (x) { out[x.id] = x; }); return out; }
  function Combat(level, manifest, deckIds) {
    var cards = byId(manifest.cards), i, card;
    this.level = level; this.manifest = manifest; this.deckIds = deckIds.slice(0); this.units = byId(level.units); this.cardUnits = {}; this.cardNames = {}; this.cardDescriptions = {}; this.cardColors = {}; this.cardCosts = {}; this.cardAssets = {}; this.unitColors = {}; this.unitAppearances = {}; this.unitAssets = {};
    level.units.forEach(function (unit) { this.unitColors[unit.id] = unit.color || [0.6,0.6,0.6]; this.unitAppearances[unit.id] = unit.appearance || {}; this.unitAssets[unit.id] = unit.imageAsset || ''; }, this);
    for (i = 0; i < deckIds.length; i += 1) { card = cards[deckIds[i]]; if (card) { this.cardUnits[card.id] = card.unitId; this.cardNames[card.id] = card.uiName || card.displayName || '防御塔'; this.cardDescriptions[card.id] = card.roleDescription || '通用防御单位'; this.cardColors[card.id] = card.color || [0.6,0.6,0.6]; this.cardAssets[card.id] = card.portraitAsset || ''; this.cardCosts[card.id] = (this.units[card.unitId] && this.units[card.unitId].buildCost) || 0; } }
    this.board = M3.Board.create(level); this.towers = []; this.enemies = []; this.gold = level.economy.initialGold; this.baseHp = level.economy.baseHp; this.buildCount = 0; this.match = { itemUses: 0, items: [] };
    this.waveIndex = -1; this.groupStates = []; this.selectedCard = deckIds[0] || null; this.selectedTower = null; this.result = null; this.elapsed = 0; this.wavePause = 0.6;
    this.bonds = M3.Bonds.evaluate(manifest, deckIds); this._startNextWave();
  }
  Combat.prototype._startNextWave = function () {
    var wave, now = this.elapsed;
    this.waveIndex += 1; if (this.waveIndex >= this.level.waves.length) return;
    wave = this.level.waves[this.waveIndex]; this.groupStates = (wave.groups || []).map(function (g) { return { group: g, left: g.count, next: now + (g.delay || 0) }; });
  };
  Combat.prototype._spawn = function (id) { var u = this.units[id], p = this.board.path[0]; if (!u) return; this.enemies.push({ unitId: id, x: p.x + 0.5, y: p.y + 0.5, segment: 0, progress: 0, hp: u.hp, maxHp: u.hp, slowUntil: 0, slowFactor: 1 }); };
  Combat.prototype._updateWaves = function () {
    var i, s, pending = false;
    for (i = 0; i < this.groupStates.length; i += 1) { s = this.groupStates[i]; if (s.left > 0) { pending = true; if (this.elapsed >= s.next) { this._spawn(s.group.enemy); s.left -= 1; s.next = this.elapsed + Math.max(0.08, s.group.interval || 1); } } }
    if (!pending && this.enemies.length === 0 && this.waveIndex < this.level.waves.length - 1) { this.wavePause -= this._lastDt || 0; if (this.wavePause <= 0) { this.wavePause = 0.6; this._startNextWave(); } }
  };
  Combat.prototype._updateEnemies = function (dt) {
    var i, e, u, a, b, dx, dy, len, dist, factor;
    for (i = this.enemies.length - 1; i >= 0; i -= 1) { e = this.enemies[i]; u = this.units[e.unitId]; if (e.dying) { e.deathAge = (e.deathAge || 0) + dt; if (e.deathAge >= e.deathDuration) this.enemies.splice(i, 1); continue; } if (e.hp <= 0) { this.gold = Math.min(this.level.economy.resourceCap, this.gold + (u.killReward || 0)); e.dying = true; e.deathAge = 0; e.deathDuration = .45; e.hp = 0; continue; }
      if (e.segment >= this.board.path.length - 1) { this.baseHp -= 1; this.enemies.splice(i, 1); continue; }
      a = this.board.path[e.segment]; b = this.board.path[e.segment + 1]; dx = b.x - a.x; dy = b.y - a.y; len = Math.sqrt(dx*dx + dy*dy) || 1; factor = this.elapsed < e.slowUntil ? e.slowFactor : 1; dist = (u.speed || 1) * (this.level.map.speedMultiplier || 1) * factor * dt; e.progress += dist / len;
      while (e.progress >= 1 && e.segment < this.board.path.length - 1) { e.progress -= 1; e.segment += 1; if (e.segment >= this.board.path.length - 1) break; }
      if (e.segment < this.board.path.length - 1) { a = this.board.path[e.segment]; b = this.board.path[e.segment + 1]; e.x = a.x + 0.5 + (b.x-a.x) * e.progress; e.y = a.y + 0.5 + (b.y-a.y) * e.progress; }
    }
  };
  Combat.prototype._updateTowers = function (dt) {
    var i, j, t, u, target, best, dx, dy, d, damage, effect = this.bonds.effects || {}, splash, damageModel = (this.manifest.systems.M8_balance || {}).damage_model;
    for (i = 0; i < this.towers.length; i += 1) { t = this.towers[i]; u = this.units[t.unitId]; t.cooldown -= dt; if (t.cooldown > 0) continue; target = null; best = -1;
      if(u.kind==='economy'){this.gold=Math.min(this.level.economy.resourceCap,this.gold+Number(u.productionAmount));t.cooldown=Number(u.productionInterval);continue;}
      for (j = 0; j < this.enemies.length; j += 1) { if (this.enemies[j].dying || (this.enemies[j].segment === 0 && this.enemies[j].progress <= .5)) continue; dx = this.enemies[j].x - (t.x+0.5); dy = this.enemies[j].y - (t.y+0.5); d = Math.sqrt(dx*dx+dy*dy); if (d <= u.range && this.enemies[j].segment + this.enemies[j].progress > best) { best = this.enemies[j].segment + this.enemies[j].progress; target = this.enemies[j]; } }
      if (!target) continue; damage = (u.attack || 0) * Math.pow(u.growth || 1, t.level - 1) * (effect.attackMultiplier || 1) * t.progressionMultiplier; if (damageModel === 'equal') target.hp -= Math.max(1, damage); else target.hp -= Math.max(1, damage - ((this.units[target.unitId] && this.units[target.unitId].defense) || 0));
      if (u.skill === 'slow') { target.slowFactor = Math.max(0.15, 1 - (u.skillPower || 0) - (effect.slowPowerBonus || 0)); target.slowUntil = this.elapsed + (u.skillDuration || 1); }
      if (u.skill === 'splash') { splash = damage * (u.skillPower || 0.5); for (j = 0; j < this.enemies.length; j += 1) if (this.enemies[j] !== target) { dx = this.enemies[j].x-target.x; dy = this.enemies[j].y-target.y; if (dx*dx+dy*dy <= 1.7) this.enemies[j].hp -= splash; } }
      t.cooldown = Math.max(0.08, (u.interval || 1) * (effect.attackSpeedMultiplier || 1));
    }
  };
  Combat.prototype.update = function (dt) {
    if (this.result) return; dt = Math.min(0.05, Math.max(0, dt)); this._lastDt = dt; this.elapsed += dt;
    this._updateWaves(); this._updateEnemies(dt); this._updateTowers(dt);
    if (this.baseHp <= 0) this.result = 'lose'; else if (this.waveIndex >= this.level.waves.length - 1 && this.groupStates.every(function (s) { return s.left <= 0; }) && this.enemies.length === 0) this.result = 'win';
  };
  Combat.prototype.selectCard = function (id) { if (this.deckIds.indexOf(id) >= 0) { this.selectedCard = id; this.selectedTower = null; } };
  Combat.prototype.towerAt = function (x,y) { var i; for (i=0;i<this.towers.length;i+=1) if(this.towers[i].x===x&&this.towers[i].y===y)return this.towers[i]; return null; };
  Combat.prototype.actOnCell = function (x, y) {
    var t = this.towerAt(x,y), unitId, u, cost, cardId = this.selectedCard;
    if (t) { this.selectedTower = null; return true; }
    if (this.board.isObstacle(x,y)) { cost = (this.level.map.obstacles && this.level.map.obstacles.clearCost) || 0; if (this.gold < cost) return false; this.gold -= cost; return this.board.clearObstacle(x,y); }
    if (!this.board.isBuildable(x,y) || !cardId) return false; unitId = this.cardUnits[cardId]; u = this.units[unitId]; cost=M3.TemplateRules.buildCost(this.manifest,u&&u.buildCost||0,this.buildCount);if (!u || this.gold < cost) return false; this.gold -= cost; this.buildCount+=1;this.selectedTower = null; this.towers.push({ cardId: cardId, unitId: unitId, x:x, y:y, level:1, cooldown:0, progressionMultiplier:1 }); return true;
  };
  Combat.prototype.selectedTowerInfo = function () { return null; };
  Combat.prototype.upgradeSelected = function () { return false; };
  Combat.prototype.view = function () { var self=this,costs={};this.deckIds.forEach(function(id){costs[id]=M3.TemplateRules.buildCost(self.manifest,self.cardCosts[id]||0,self.buildCount);});return { elapsed:this.elapsed, board:this.board, towers:this.towers, enemies:this.enemies, gold:Math.floor(this.gold), baseHp:this.baseHp, wave:this.waveIndex+1, waveCount:this.level.waves.length, selectedCard:this.selectedCard, selectedTower:null, deckIds:this.deckIds, cardNames:this.cardNames, cardDescriptions:this.cardDescriptions, cardColors:this.cardColors, cardCosts:costs, cardAssets:this.cardAssets, unitColors:this.unitColors, unitAppearances:this.unitAppearances, unitAssets:this.unitAssets, mapBackgroundAsset:this.level.map.backgroundAsset, mapPresentation:this.level.map.presentation, match:this.match,result:this.result, bonds:this.bonds.active }; };
  M3.Combat = { create: function (level, manifest, deck) { return new Combat(level, manifest, deck); } };
})();
