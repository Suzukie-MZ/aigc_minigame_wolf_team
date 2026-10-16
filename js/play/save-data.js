(function () {
  var M3 = window.M3, KEY = 'm3-configurable-defense-save-v1';
  function today(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
  function defaults() { return { version: 1, unlockSequenceVersion: 1, playerLevel: 1, playerXp: 0, materials: 0, outerCurrency: 0, energy: 10, energyDay: today(), highestDifficulty: 1, cards: {}, heroes: {}, stars: {}, completed: {}, recentDeck: [], tutorial: { version: 1, energySeen: false, battleDone: false, skipped: false } }; }
  function sanitize(v) {
    var d = defaults(); if (!v || v.version !== 1) return d;
    d.playerLevel = Math.max(1, Number(v.playerLevel) || 1); d.playerXp = Math.max(0, Number(v.playerXp) || 0);
    d.materials = Math.max(0, Number(v.materials) || 0); d.outerCurrency=Math.max(0,Number(v.outerCurrency)||0);d.energyDay=v.energyDay||'';d.energy=Math.max(0,Number(v.energy)||0);d.highestDifficulty=v.unlockSequenceVersion===1?Math.max(1,Number(v.highestDifficulty)||1):1;d.cards = v.cards || {};d.heroes=v.heroes||{}; d.stars = v.unlockSequenceVersion===1?(v.stars||{}):{};
    d.completed = v.unlockSequenceVersion===1?(v.completed||{}):{}; d.recentDeck = Array.isArray(v.recentDeck) ? v.recentDeck.slice(0, 10) : [];
    if(v.tutorial&&v.tutorial.version===1)d.tutorial={version:1,energySeen:v.tutorial.energySeen===true,battleDone:v.tutorial.battleDone===true,skipped:v.tutorial.skipped===true};
    return d;
  }
  var data = defaults();
  M3.SaveData = {
    load: function () { var raw;try { raw=KwaiStorage.getSync(KEY);data=sanitize(raw);if(raw&&raw.version===1&&raw.unlockSequenceVersion!==1)this.save(); } catch (e) { data = defaults(); } return data; },
    get: function () { return data; },
    save: function () { try { KwaiStorage.setSync(KEY, data); } catch (e) { console.warn('Save', '本地保存失败'); } },
    setTutorialProgress:function(values){var keys=['energySeen','battleDone','skipped'],i;for(i=0;i<keys.length;i+=1)if(values[keys[i]]===true)data.tutorial[keys[i]]=true;this.save();},
    reset: function () { data = defaults(); this.save(); },
    setRecentDeck: function (ids) { data.recentDeck = ids.slice(0); this.save(); },
    syncEnergy:function(manifest){var max=(manifest.systems.M14_energy||{}).daily_max_energy||10,changed=false;if(data.energyDay!==today()){data.energy=max;data.energyDay=today();changed=true;}else if(data.energy>max){data.energy=max;changed=true;}if(changed)this.save();return data.energy;},
    consumeEnergy:function(manifest){var ok=M3.TemplateRules.consumeEnergy(manifest,data);if(ok)this.save();return ok;},
    addSettlement:function(manifest,won,difficulty){var amount=M3.TemplateRules.settlement(manifest,won,difficulty);data.outerCurrency+=amount;data.playerXp+=won?30:10;if(won)data.highestDifficulty=Math.max(data.highestDifficulty,(difficulty||1)+1);this.save();return amount;},
    refillEnergy:function(manifest,amount){var max=(manifest.systems.M14_energy||{}).daily_max_energy||10;data.energy=Math.min(max,data.energy+Math.max(0,amount||1));this.save();return data.energy;},
    completeLevel: function (id, stars, xp, materials, aliases) { var i,key,ids=[id].concat(Array.isArray(aliases)?aliases:[]);for(i=0;i<ids.length;i+=1){key=ids[i];if(!key)continue;data.completed[key]=true;data.stars[key]=Math.max(data.stars[key]||0,stars);}data.playerXp+=xp||0;data.materials+=materials||0;this.save(); }
  };
})();
