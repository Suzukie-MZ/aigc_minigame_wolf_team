(function(){
  var M3=window.M3,PAGE_SIZE=6,HERO_POOL_SIZE=3,state='BOOT',started=false,last=0,manifest,levelId,selectedNodeId,level,cards=[],deck=[],heroes=[],heroPool=[],cardPage=0,heroPage=0,progressionPage=0,selectedProgressionHero=null,mapScroll=0,mapVelocity=0,combat,result,resultData,message='',messageFailed=false,messageExpiresAt=0,nodes=[],paused=false,itemMenuOpen=false,loadingPhase='config',loadingError='',assetKeys=[],loadAttempt=0,nodeSelection=0,visibleLevelRequests={},mapDialogState=null;
  function initialAssetKeys(){
    var keys={}, scenes=manifest.presentation&&manifest.presentation.sceneAssets||{};
    function add(key){if(key)keys[key]=true;}
    function unitAssets(unit){add(unit.imageAsset);(unit.levelAssetKeys||[]).forEach(add);}
    add(scenes.homeBackground);add(scenes.worldMapBackground);
    (manifest.cards||[]).forEach(function(card){add(card.portraitAsset);});
    heroPool.forEach(function(hero){add(hero.portraitAsset);});
    nodes.forEach(function(node){var current=M3.RuntimeConfig.getLevel(node.levelId),map;if(!current)return;map=current.map;add(map.backgroundAsset);Object.keys(map.tileAssets||{}).forEach(function(key){add(map.tileAssets[key]);});(current.units||[]).forEach(function(unit){if(unit.kind!=='enemy')unitAssets(unit);});});
    (manifest.assetManifest||[]).forEach(function(item){if(/^(tower[-_]|hero[-_]|font-cn-main-|ui-)/.test(item.key))add(item.key);});
    return Object.keys(keys);
  }
  function selectNode(node){
    var attempt=loadAttempt,selection=++nodeSelection;
    if(M3.RuntimeConfig.getLevel(node.levelId)){levelId=node.levelId;selectedNodeId=node.id;setState('LEVEL_DETAIL');return;}
    message='关卡加载中…';
    M3.RuntimeConfig.ensureLevel(node.levelId,function(error){
      if(attempt!==loadAttempt||selection!==nodeSelection||state!=='WORLD_MAP')return;
      if(error){message='关卡加载失败，请点击重试';return;}
      levelId=node.levelId;selectedNodeId=node.id;setState('LEVEL_DETAIL');
    });
  }
  function loadConfig(){
    var attempt=++loadAttempt,layout=M3.UILayout.get(),initialLevelCount=Math.max(1,Math.ceil(layout.mapList?layout.mapList.h/(layout.levelRowH+layout.levelGap):4)*(layout.mapColumns||1));
    state='LOADING';loadingPhase='config';loadingError='';assetKeys=[];visibleLevelRequests={};
    if(typeof ks!=='undefined'&&M3.SubpackageLoader&&!M3.SubpackageLoader.isLoaded('monsters')){
      loadingPhase='assets';
      M3.SubpackageLoader.load('monsters',{
        onSuccess:function(){if(attempt===loadAttempt)loadConfig();},
        onFail:function(error){if(attempt===loadAttempt){loadingError=error&&(error.errorMsg||error.message)||'怪物资源加载失败';state='LOAD_ERROR';}}
      });
      return;
    }
    M3.RuntimeConfig.init(function(){
      if(attempt!==loadAttempt)return;
      manifest=M3.RuntimeConfig.getManifest();
      if(!manifest){loadingError=(M3.RuntimeConfig.getErrors()||[])[0]||'配置加载失败';state='LOAD_ERROR';return;}
      try{
        M3.SaveData.syncEnergy(manifest);
        if(M3.BitmapFont)M3.BitmapFont.configure(manifest);
        cards=M3.Deck.allowedCards(manifest);
        heroPool=((manifest.systems.M5_hero||{}).hero_unit_pool||[]).slice(0,HERO_POOL_SIZE);
        nodes=M3.WorldMap.nodes(manifest);
        levelId=nodes.length?nodes[0].levelId:null;
        selectedNodeId=nodes.length?nodes[0].id:null;
        assetKeys=M3.TextureAssets?M3.TextureAssets.configure(manifest,initialAssetKeys()):[];
        loadingPhase='assets';
        Promise.resolve(M3.TextureAssets?M3.TextureAssets.waitFor(assetKeys):null).then(function(){
          if(attempt===loadAttempt&&state==='LOADING')loadingPhase='render';
        },function(error){
          if(attempt===loadAttempt){loadingError=error&&error.message||'图片加载失败';console.error('[Game] startup assets failed',loadingError);state='LOAD_ERROR';}
        });
      }catch(error){loadingError=error&&error.message||'资源初始化失败';console.error('[Game] startup initialization failed',loadingError);state='LOAD_ERROR';}
    },{initialLevelCount:initialLevelCount});
  }
  function start(){if(started)return;started=true;if(M3.KwaiPlatform)M3.KwaiPlatform.init();if(M3.GameLogger)M3.GameLogger.init('configurable-merge-defense','ks654147848546150500');M3.SaveData.load();if(M3.Tutorial)M3.Tutorial.init();loadConfig();}
  function loadExtraContent(){
    var attempt=loadAttempt;
    if(!M3.RuntimeConfig.loadRemaining)return;
    M3.RuntimeConfig.loadRemaining(function(error){
      if(attempt!==loadAttempt)return;
      if(error){message='其余关卡加载失败，点击底部重试';return;}
      manifest=M3.RuntimeConfig.getManifest();
      nodes=M3.WorldMap.nodes(manifest);
      if(M3.TextureAssets&&M3.TextureAssets.addAssets)M3.TextureAssets.addAssets(manifest.assetManifest);
      if(message==='其余关卡加载失败，点击底部重试')message='';
    });
  }
  function assetsRendered(){if(state==='LOADING'&&loadingPhase==='render'){loadingPhase='done';state='WORLD_MAP';loadExtraContent();}}
  function assetRenderFailed(error){if(state==='LOADING'){loadingError=error&&error.message||'图片渲染失败';state='LOAD_ERROR';}}
  function setState(s){nodeSelection+=1;mapDialogState=null;mapVelocity=0;state=s;message='';messageFailed=false;messageExpiresAt=0;}
  function showBattleMessage(value,failed){message=value||'';messageFailed=!!failed;messageExpiresAt=message?M3._now()+2200:0;}
  function beginDeck(){cardPage=0;setState('DECK_SELECT');}
  function toggleCard(id){var at=deck.indexOf(id),size=manifest.deckRules.deckSize||4;if(at>=0)deck.splice(at,1);else if(deck.length<size)deck.push(id);}
  function beginHeroes(reset){if(reset){heroes=[];deck=[];}heroPage=0;setState('HERO_SELECT');}
  function toggleHero(id){var at=heroes.indexOf(id);if(at>=0)heroes=[];else heroes=[id];}
  function findUnit(unitId){var current=M3.RuntimeConfig.getLevel(levelId),i;if(current&&current.units)for(i=0;i<current.units.length;i+=1)if(current.units[i].id===unitId)return current.units[i];return null;}
  function roleDescription(configured,unit,isHero){if(configured)return configured;if(!unit)return isHero?'支援全场的英雄单位':'通用防御单位';if(unit.kind==='economy')return'周期产出局内资源';if(unit.skill==='slow')return isHero?'远程减速控制敌人':'减速控制敌人推进';if(unit.skill==='splash')return isHero?'范围攻击清理敌群':'范围攻击多个敌人';if(unit.interval<=.7)return'高速持续单体输出';if(unit.range>=3)return'远距离单体输出';return isHero?'稳定输出支援防线':'稳定单体伤害';}
  function cardView(card){var out={},key,u=findUnit(card.unitId);for(key in card)if(Object.prototype.hasOwnProperty.call(card,key))out[key]=card[key];out.roleDescription=roleDescription(card.roleDescription,u,false);out.purchaseCost=u&&u.buildCost||0;out.level=M3.Progression.cardLevel(card.id);out.upgradeCost=M3.Progression.upgradeCost(manifest,card.id);return out;}
  function heroView(hero){var out={},key,u=findUnit(hero.unitId);for(key in hero)if(Object.prototype.hasOwnProperty.call(hero,key))out[key]=hero[key];out.roleDescription=roleDescription(hero.roleDescription,u,true);out.level=M3.Progression.heroLevel(hero.id);out.upgradeCost=M3.Progression.heroUpgradeCost(manifest,hero.id);out.purchaseCost=0;out.color=Array.isArray(out.color)&&out.color.length>=3?out.color:u&&u.color||[.3,.7,.8,1];out.appearance=out.appearance||u&&u.appearance||null;return out;}
  function beginBattle(){var index;if(!M3.Deck.validate(manifest,deck).ok){message='请选择四座防御塔';return;}if(heroes.length!==1){message='请选择一名英雄';return;}level=M3.RuntimeConfig.getLevel(levelId);if(!level){message='关卡配置不可用';return;}if(!M3.SaveData.consumeEnergy(manifest)){message='体力不足，请返回地图补充';return;}index=nodes.map(function(n){return n.id;}).indexOf(selectedNodeId)+1;level=M3.FeatureSystem.prepareLevel(level,manifest,index||1);M3.UILayout.setGrid(level.map.width,level.map.height);M3.SaveData.setRecentDeck(deck);combat=M3.Combat.create(level,manifest,deck,heroes);result=null;resultData=null;paused=false;itemMenuOpen=false;message='';messageFailed=false;messageExpiresAt=0;state='BATTLE';if(M3.Tutorial)M3.Tutorial.onBattleStart(index===1);}
  function finish(r){var index=nodes.map(function(n){return n.id;}).indexOf(selectedNodeId)+1,amount;paused=false;itemMenuOpen=false;result=r;if(r==='win')M3.SaveData.completeLevel(levelId||selectedNodeId,3,0,0,[selectedNodeId]);amount=M3.SaveData.addSettlement(manifest,r==='win',index||1);resultData={outerCurrency:amount,xp:r==='win'?30:10,layers:2,doubled:false};message='';messageFailed=false;messageExpiresAt=0;state='RESULT';}
  function update(){var now=M3._now(),dt=last?(now-last)/1000:0;last=now;if(state==='WORLD_MAP'&&mapVelocity){var scrollDt=Math.min(.05,Math.max(0,dt)),scrollBefore=mapScroll;shiftMap(mapVelocity*scrollDt);mapVelocity*=Math.exp(-7*scrollDt);if(Math.abs(mapVelocity)<12||mapScroll===scrollBefore)mapVelocity=0;}if(state==='BATTLE'&&messageExpiresAt&&now>=messageExpiresAt){message='';messageFailed=false;messageExpiresAt=0;}if(M3.KwaiPlatform&&M3.KwaiPlatform.setBannerAllowed)M3.KwaiPlatform.setBannerAllowed(false);if(state==='BATTLE'&&combat&&!paused&&!itemMenuOpen&&(!M3.Tutorial||!M3.Tutorial.shouldFreeze())&&(!M3.KwaiPlatform||M3.KwaiPlatform.isActive())){combat.update(dt);if(combat.result)finish(combat.result);}}
  function battleItemChoices(){var cfg=manifest.systems&&manifest.systems.M3_item||{};return(cfg.item_pool||[]).slice(0,cfg.choices_per_trigger||2);}
  function useBattleItem(index){var item=battleItemChoices()[index];if(!item){showBattleMessage('道具配置不可用',true);return;}M3.RewardSystem.unlockMatchItem(manifest,item,combat.match,function(){if(!M3.FeatureSystem.applyItem(combat,item)){showBattleMessage('道具配置不可用',true);return;}itemMenuOpen=false;showBattleMessage(item.effect==='clear_all_enemies'?'当前怪物已清除':'经济补给已到账');},function(){showBattleMessage('观看完整广告后生效',true);});}
  function openMapDialog(kind){
    var cfg=manifest.systems.M14_energy||{},energy=M3.SaveData.get().energy,max=Number(cfg.daily_max_energy)||10;
    mapVelocity=0;message='';
    if(kind==='home')mapDialogState={kind:kind,title:'作战首页',lines:['选择战图，准备下一场防守。','已解锁关卡 '+nodes.filter(function(n){return n.unlocked;}).length+' / '+nodes.length,'当前体力 '+energy+' / '+max,'英雄与防御塔可在出战前搭配。'],actions:['继续选图','玩法说明']};
    else if(kind==='menu')mapDialogState={kind:kind,title:'作战终端',lines:['选择已解锁的关卡进入战斗。','通关后解锁下一关。','下方入口可补充体力和强化英雄。'],actions:['玩法说明','关闭']};
    else if(kind==='help')mapDialogState={kind:kind,title:'玩法说明',lines:['选择已解锁关卡，查看战术地图。','先选一名英雄，再搭配四座防御塔。','消耗体力出战，部署单位守住基地。','通关获得奖励并解锁下一关。'],actions:['返回菜单','关闭']};
    else if(kind==='energy')mapDialogState={kind:kind,title:'体力',lines:['当前体力 '+energy+' / '+max,'每天恢复至体力上限。','完整观看广告可补充 '+(Number(cfg.ad_refill_amount)||5),'分享成功可补充 '+(Number(cfg.share_refill_amount)||3)],actions:['知道了']};
    else if(kind==='exit')mapDialogState={kind:kind,title:'退出游戏',lines:['关卡进度和英雄强化已保存。','是否退出本次游戏？'],actions:['确认退出','继续游戏']};
    else if(kind==='exited')mapDialogState={kind:kind,title:'已退出游戏',lines:['本次预览已结束。','点击下方按钮重新进入。'],actions:['重新进入']};
  }
  function mapDialogPointer(x,y,l){
    var d=mapDialogState,index=-1,i;
    if(M3.UILayout.contains(l.mapDialogClose,x,y)){mapDialogState=null;return;}
    for(i=0;i<d.actions.length;i+=1)if(M3.UILayout.contains(l.mapDialogActions[i],x,y))index=i;
    if(index<0)return;
    if(d.kind==='home'&&index===1){openMapDialog('help');return;}
    if(index===1){mapDialogState=null;return;}
    if(d.kind==='menu'){openMapDialog('help');return;}
    if(d.kind==='help'){openMapDialog('menu');return;}
    if(d.kind==='exit'){
      if(M3.SaveData.save)M3.SaveData.save();
      if(typeof ks!=='undefined'&&typeof KwaiBase!=='undefined'&&KwaiBase.exit)KwaiBase.exit();
      else openMapDialog('exited');
      return;
    }
    mapDialogState=null;
  }
  function pointerAction(x,y){var l=M3.UILayout.get(),i,r,gx,gy,visible,item,actionOk;
    if(state==='LOADING')return;
    if(state==='LOAD_ERROR'){loadConfig();return;}
    if(state==='WORLD_MAP'&&mapDialogState){mapDialogPointer(x,y,l);return;}
    // The visible inspection panel owns input above battle controls.
    if(state==='BATTLE'&&combat&&!paused&&!itemMenuOpen&&(combat.selectedTower||combat.selectedObstacle)&&(M3.UILayout.contains(l.towerPanel,x,y)||M3.UILayout.contains(l.towerUpgrade,x,y))){
      if(M3.UILayout.contains(l.towerUpgrade,x,y)){
        if(combat.selectedTower){actionOk=combat.upgradeSelected();showBattleMessage(actionOk?'升级成功':'资源不足或已满级',!actionOk);}
        else{actionOk=combat.clearSelectedObstacle();showBattleMessage(actionOk?'障碍已清除，可在此建塔':'局内资源不足',!actionOk);}
      }
      return;
    }
    if(state==='BATTLE'&&combat&&(combat.selectedTower||combat.selectedObstacle)&&!M3.UILayout.contains(l.board,x,y)&&!M3.UILayout.contains(l.towerUpgrade,x,y)){combat.clearInspection();showBattleMessage('');}
    if(state==='WORLD_MAP'){if(l.mapFooter&&M3.UILayout.contains(l.mapFooter,x,y)&&M3.RuntimeConfig.getExtraStatus&&M3.RuntimeConfig.getExtraStatus()==='error'){message='正在补充关卡目录…';loadExtraContent();return;}if(M3.UILayout.contains(l.mapHome,x,y)){mapScroll=0;mapVelocity=0;openMapDialog('home');return;}if(M3.UILayout.contains(l.mapMore,x,y)){openMapDialog('menu');return;}if(M3.UILayout.contains(l.mapExit,x,y)){openMapDialog('exit');return;}if(M3.UILayout.contains(l.energyCurrent,x,y)){openMapDialog('energy');return;}if(M3.UILayout.contains(l.energyAd,x,y)){M3.RewardSystem.refillEnergyAd(manifest,function(){message='体力补充成功';},function(){message=typeof ks==='undefined'?'请在快手中观看广告':'广告未完成';});return;}if(M3.UILayout.contains(l.energyShare,x,y)){M3.RewardSystem.refillEnergyShare(manifest,function(){message='分享补充成功';},function(){message=typeof ks==='undefined'?'请在快手中分享':'分享未完成';});return;}if(M3.UILayout.contains(l.mapUpgrade,x,y)){progressionPage=0;selectedProgressionHero=null;setState('PROGRESSION');return;}if(!M3.UILayout.contains(l.mapList,x,y))return;nodes=M3.WorldMap.nodes(manifest);for(i=0;i<nodes.length;i+=1){r=l.levelCard(i,mapScroll);if(r.y+r.h>l.mapList.y&&r.y<l.mapList.y+l.mapList.h&&M3.UILayout.contains(r,x,y)){if(!nodes[i].unlocked){message='请先通关上一关';return;}selectNode(nodes[i]);return;}}}
    else if(state==='LEVEL_DETAIL'){if(M3.UILayout.contains(l.detailBack,x,y)||M3.UILayout.contains(l.detailClose,x,y))setState('WORLD_MAP');else if(M3.UILayout.contains(l.detailStart,x,y))beginHeroes(true);}
    else if(state==='PROGRESSION'){visible=heroPool;r=l.loadoutHeroes||l.heroSelectCards||l.heroCards;for(i=0;i<r.length;i+=1){if(visible[i]&&M3.UILayout.contains(r[i],x,y)){selectedProgressionHero=selectedProgressionHero===visible[i].id?null:visible[i].id;message='';return;}}if(selectedProgressionHero&&M3.UILayout.contains(l.heroStart,x,y)){message=M3.Progression.upgradeHero(manifest,selectedProgressionHero)?'英雄升级成功':'材料不足或已满级';return;}if(M3.UILayout.contains(l.heroBack,x,y)){selectedProgressionHero=null;setState('WORLD_MAP');}}
    else if(state==='DECK_SELECT'){
      if(M3.UILayout.contains(l.towerClose,x,y)){setState('WORLD_MAP');return;}
      if(M3.UILayout.contains(l.towerPrev,x,y)){beginHeroes(false);return;}
      if(M3.UILayout.contains(l.towerStart,x,y)){if(M3.Deck.validate(manifest,deck).ok)beginBattle();return;}
      if(!M3.UILayout.contains(l.towerModal,x,y))return;
      visible=M3.Deck.page(cards,cardPage,PAGE_SIZE);
      for(i=0;i<l.towerCards.length;i+=1)if(visible[i]&&M3.UILayout.contains(l.towerCards[i],x,y)){toggleCard(visible[i].id);return;}
    }
    else if(state==='HERO_SELECT'){visible=heroPool;r=l.heroModalCards;for(i=0;i<visible.length&&i<r.length;i+=1)if(M3.UILayout.contains(r[i],x,y)){toggleHero(visible[i].id);return;}if(M3.UILayout.contains(l.heroCancel,x,y)||M3.UILayout.contains(l.heroClose,x,y))setState('WORLD_MAP');else if(M3.UILayout.contains(l.heroNext,x,y)&&heroes.length===1)beginDeck();}
    else if(state==='BATTLE'&&combat){
      if(itemMenuOpen){for(i=0;i<2;i+=1)if(M3.UILayout.contains(l.itemChoices[i],x,y)){useBattleItem(i);return;}if(M3.UILayout.contains(l.itemSkip,x,y)){itemMenuOpen=false;showBattleMessage('');}return;}
      if(M3.UILayout.contains(l.pauseButton,x,y)){paused=!paused;showBattleMessage('');return;}
      if(paused)return;
      if(M3.UILayout.contains(l.battleItems,x,y)){itemMenuOpen=true;showBattleMessage('');return;}
      for(i=0;i<combat.heroIds.length;i+=1)if(M3.UILayout.contains(l.battleHeroCard(i,combat.heroIds.length,combat.deckIds.length),x,y)){combat.selectHero(combat.heroIds[i]);showBattleMessage('');return;}
      if(y>=l.cardBarY){for(i=0;i<combat.deckIds.length;i+=1){r=l.battleTowerCard(i,combat.deckIds.length);if(M3.UILayout.contains(r,x,y)){combat.selectCard(combat.deckIds[i]);showBattleMessage('');return;}}}
      else if(M3.UILayout.contains(l.board,x,y)){var ground=M3.CombatProjection&&M3.CombatProjection.geometry(l,combat.board),picked=ground&&M3.CombatProjection.pick(ground,x,y);if(ground&&!picked)return;gx=picked?picked.x:Math.floor((x-l.board.x)/l.cell);gy=picked?picked.y:Math.floor((y-l.board.y)/l.cell);actionOk=combat.actOnCell(gx,gy);showBattleMessage(actionOk?'':(combat.lastActionMessage||'无法在此位置放置'),!actionOk);}
    }
    else if(state==='RESULT'){if(M3.UILayout.contains(l.resultDouble,x,y)&&resultData&&!resultData.doubled){M3.RewardSystem.doubleSettlement(M3.SaveData.get(),resultData.outerCurrency,function(amount){resultData.outerCurrency+=amount;resultData.doubled=true;message='结算奖励已翻倍';},function(){message='广告未完成';});return;}if(M3.UILayout.contains(l.resultButton,x,y)){nodes=M3.WorldMap.nodes(manifest);setState('WORLD_MAP');}}
  }
  function pointer(x,y){
    var consumed,view;
    if(M3.Tutorial){view=M3.Game.getViewModel();consumed=M3.Tutorial.handlePointer(x,y,view);if(consumed){if(consumed==='skip'&&view.tutorial&&view.tutorial.freeze)paused=false;if(consumed==='finish-items'){itemMenuOpen=false;paused=false;}return;}}
    pointerAction(x,y);
  }
  function loadVisibleLevels(){
    var l=M3.UILayout.get(),step=l.levelRowH+l.levelGap,first=Math.max(0,Math.floor(mapScroll/step)*(l.mapColumns||1)),last=Math.min(nodes.length,Math.ceil((mapScroll+l.mapList.h)/step)*(l.mapColumns||1)),attempt=loadAttempt,i,id;
    if(!M3.RuntimeConfig.ensureLevel)return;
    for(i=first;i<last;i+=1){
      id=nodes[i].levelId;
      if(M3.RuntimeConfig.getLevel(id)||visibleLevelRequests[id])continue;
      visibleLevelRequests[id]=true;
      M3.RuntimeConfig.ensureLevel(id,function(error,current){
        if(attempt!==loadAttempt||error)return;
        if(M3.TextureAssets&&M3.TextureAssets.addAssets)M3.TextureAssets.addAssets(current.assetManifest,true);
      });
    }
  }
  function shiftMap(delta){var l,max;if(state!=='WORLD_MAP'||mapDialogState||M3.Tutorial&&M3.Game.getViewModel().tutorial)return;l=M3.UILayout.get();max=Math.max(0,Math.ceil(nodes.length/(l.mapColumns||1))*(l.levelRowH+l.levelGap)-l.levelGap-l.mapList.h);mapScroll=Math.max(0,Math.min(max,mapScroll+delta));loadVisibleLevels();}
  function scrollMap(delta){if(state!=='WORLD_MAP')return;mapVelocity=0;shiftMap(delta);message='';}
  function beginMapDrag(x,y){if(state!=='WORLD_MAP'||mapDialogState||M3.Tutorial&&M3.Game.getViewModel().tutorial||!M3.UILayout.contains(M3.UILayout.get().mapList,x,y))return false;mapVelocity=0;return true;}
  function endMapDrag(velocity){if(state==='WORLD_MAP')mapVelocity=Math.max(-1800,Math.min(1800,Number(velocity)||0));}
  M3.Game={ensureStarted:start,update:update,assetsRendered:assetsRendered,assetRenderFailed:assetRenderFailed,handlePointer:pointer,handleMapScroll:scrollMap,beginMapDrag:beginMapDrag,endMapDrag:endMapDrag,getViewModel:function(){var save=M3.SaveData.get(),current=levelId?M3.RuntimeConfig.getLevel(levelId):null,index=nodes.map(function(n){return n.id;}).indexOf(selectedNodeId)+1,selectedHero=selectedProgressionHero&&heroPool.filter(function(h){return h.id===selectedProgressionHero;})[0];var view={state:state,mapDialog:mapDialogState,loadingPhase:loadingPhase,loadingError:loadingError,loadingProgress:M3.TextureAssets&&M3.TextureAssets.progress?M3.TextureAssets.progress(assetKeys):null,assetKeys:assetKeys,source:M3.RuntimeConfig.getSource(),presentation:manifest?manifest.presentation:null,systems:manifest?manifest.systems:null,levelPreview:current,totalLevelCount:manifest?Math.max(nodes.length,Number(manifest.totalLevelCount)||0):0,levelEntries:nodes.map(function(n){return{node:n,level:M3.RuntimeConfig.getLevel(n.levelId)};}),mapScroll:mapScroll,cards:cards.map(cardView),heroCards:heroPool.map(heroView),heroTotal:heroPool.length,heroPage:0,heroPageCount:1,progressionCards:heroPool.map(heroView),selectedProgressionHero:selectedHero?heroView(selectedHero):null,heroUpgradePreview:selectedHero?M3.Progression.heroUpgradePreview(manifest,selectedHero.id):null,materials:save.outerCurrency,energy:save.energy,highestDifficulty:save.highestDifficulty,progressionPage:0,cardTotal:cards.length,cardPage:0,cardPageCount:1,deck:deck,deckSize:manifest&&manifest.deckRules&&manifest.deckRules.deckSize||4,heroes:heroes,deckValid:manifest?M3.Deck.validate(manifest,deck).ok:false,nodes:nodes,combat:combat?combat.view():null,paused:paused,itemMenuOpen:itemMenuOpen,battleItemChoices:manifest?battleItemChoices():[],result:result,resultData:resultData,message:message,messageFailed:messageFailed,messageExpiresAt:messageExpiresAt,difficulty:index||1,balance:current?M3.FeatureSystem.balanceReport(current,manifest):null,dailySeed:M3.FeatureSystem.dayKey()};if(M3.Tutorial)view.tutorial=M3.Tutorial.view(view);return view;},restart:function(){mapDialogState=null;mapVelocity=0;paused=false;itemMenuOpen=false;selectedProgressionHero=null;message='';messageFailed=false;state='WORLD_MAP';combat=null;result=null;}};
})();
