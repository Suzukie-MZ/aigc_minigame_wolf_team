(function () {
  var M3 = window.M3;
  M3.Progression = {
    cardLevel: function (cardId) { var c = M3.SaveData.get().cards[cardId]; return c && c.level ? Math.max(1, c.level) : 1; },
    statMultiplier: function (manifest, cardId) { var p = manifest.progression || {}, level = this.cardLevel(cardId); return 1 + (level - 1) * (p.statPerLevel || 0); },
    upgradeCost: function (manifest, cardId) { var p = manifest.progression || {}, level = this.cardLevel(cardId); return Math.round((p.baseUpgradeCost || 25) * Math.pow(p.upgradeCostGrowth || 1, level - 1)); },
    upgrade: function (manifest, cardId) { var d = M3.SaveData.get(), p = manifest.progression || {}, cost = this.upgradeCost(manifest, cardId), c, level = this.cardLevel(cardId); if (level >= (p.maxLevel || 20) || d.outerCurrency < cost) return false; c = d.cards[cardId] || { level: 1, xp: 0 }; d.outerCurrency -= cost; c.level += 1; d.cards[cardId] = c; M3.SaveData.save(); return true; },
    heroLevel: function (heroId) { var h = M3.SaveData.get().heroes[heroId]; return h && h.level ? Math.max(1, h.level) : 1; },
    heroUpgradeCost: function (manifest, heroId) { var p = manifest.progression || {}, level = this.heroLevel(heroId); return Math.round((p.heroBaseUpgradeCost || p.baseUpgradeCost || 25) * Math.pow(p.heroUpgradeCostGrowth || p.upgradeCostGrowth || 1, level - 1)); },
    heroMultiplier: function (manifest, heroId) { return 1 + (this.heroLevel(heroId) - 1) * ((manifest.progression && manifest.progression.heroStatPerLevel) || 0.06); },
    heroUpgradePreview: function (manifest, heroId) { var p = manifest.progression || {}, level = this.heroLevel(heroId), maxLevel = p.heroMaxLevel || p.maxLevel || 20, step = p.heroStatPerLevel || 0.06, cost = this.heroUpgradeCost(manifest, heroId); return { heroId: heroId, level: level, nextLevel: Math.min(maxLevel, level + 1), maxLevel: maxLevel, currentBonus: Math.round((level - 1) * step * 100), nextBonus: Math.round(Math.min(maxLevel - 1, level) * step * 100), cost: cost, canUpgrade: level < maxLevel && M3.SaveData.get().outerCurrency >= cost }; },
    upgradeHero: function (manifest, heroId) { var d = M3.SaveData.get(), p = manifest.progression || {}, cost = this.heroUpgradeCost(manifest, heroId), h, level = this.heroLevel(heroId); if (level >= (p.heroMaxLevel || p.maxLevel || 20) || d.outerCurrency < cost) return false; h = d.heroes[heroId] || { level: 1 }; d.outerCurrency -= cost; h.level += 1; d.heroes[heroId] = h; M3.SaveData.save(); return true; }
  };
})();
