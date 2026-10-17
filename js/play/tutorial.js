(function () {
  var M3=window.M3,stage=null,pending=null,progress={},steps=['energy-ad','energy-share','first-level','detail','hero-pick','hero-next','tower-pick','tower-next','route','pause','resume','tower-card','tower-place','hero-card','hero-place','items','item-info'];
  function saved(){var data=M3.SaveData.get();return data.tutorial||{};}
  function write(values){if(M3.SaveData.setTutorialProgress)M3.SaveData.setTutorialProgress(values);progress=saved();}
  function init(){stage=null;pending=null;progress=saved();}
  function move(next){stage=next;pending=null;}
  function finish(){write({energySeen:true,battleDone:true});move(null);}
  function freeze(){return steps.indexOf(stage)>=steps.indexOf('route');}
  function onBattleStart(first){progress=saved();if(first&&!progress.skipped&&!progress.battleDone)move('route');else move(null);}
  function inside(r,x,y){return!!r&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
  function occupied(c,x,y){var list=(c.towers||[]).concat(c.heroes||[]),i;for(i=0;i<list.length;i+=1)if(list[i].x===x&&list[i].y===y)return true;return false;}
  function slots(c,l,hero){var result=[],x,y,board=c&&c.board;if(!board)return result;for(y=0;y<board.height;y+=1)for(x=0;x<board.width;x+=1)if((hero?board.isHeroSlot(x,y):board.isBuildable(x,y))&&!occupied(c,x,y)){var g=M3.CombatProjection&&M3.CombatProjection.geometry(l,board);result.push({x:g?g.x+x*g.cx:l.board.x+x*l.cell,y:g?g.y+y*g.cy:l.board.y+y*l.cell,w:g?g.cx:l.cell,h:g?g.cy:l.cell});}return result;}
  function view(v){
    var l,c=v.combat,energy=v.systems&&v.systems.M14_energy||{},first=v.nodes&&v.nodes[0],out,i,targets=[],top,h,panelY,available;
    if(v.mapDialog)return null;
    if(!v.presentation||v.state==='BOOT'||v.state==='LOADING'||v.state==='LOAD_ERROR')return null;
    progress=saved();if(progress.skipped||progress.battleDone)return null;
    if(v.state==='WORLD_MAP'){
      if(first&&M3.SaveData.get().completed&&(M3.SaveData.get().completed[first.levelId]||M3.SaveData.get().completed[first.id])){finish();return null;}
      if(!stage||steps.indexOf(stage)>2)move(progress.energySeen?'first-level':'energy-ad');
    }else if(v.state==='LEVEL_DETAIL')move('detail');
    else if(v.state==='DECK_SELECT')move((v.deck||[]).length===4?'tower-next':'tower-pick');
    else if(v.state==='HERO_SELECT')move((v.heroes||[]).length===1?'hero-next':'hero-pick');
    else if(v.state==='BATTLE'){
      if(v.difficulty!==1)return null;
      if(stage==='pause'&&v.paused)move('resume');
      if(stage==='resume'&&!v.paused)move('tower-card');
      if(stage==='tower-card'&&pending==='tower-card'&&c&&c.mode==='tower'&&c.selectedCard)move('tower-place');
      if(stage==='tower-place'&&c&&!c.selectedCard)move('tower-card');
      if(stage==='tower-place'&&c&&(c.towers||[]).length>0)move('hero-card');
      if(stage==='hero-card'&&pending==='hero-card'&&c&&c.mode==='hero'&&c.selectedHero)move('hero-place');
      if(stage==='hero-place'&&c&&!c.selectedHero)move('hero-card');
      if(stage==='hero-place'&&c&&(c.heroes||[]).length>0)move('items');
      if(stage==='items'&&v.itemMenuOpen)move('item-info');
      if(stage==='item-info'&&!v.itemMenuOpen){finish();return null;}
    }else return null;
    if(!stage)return null;l=M3.UILayout.get();
    out={id:stage,title:'新手引导',lines:[],targets:targets,button:null,freeze:freeze(),index:steps.indexOf(stage)+1,total:steps.length,path:null};
    if(stage==='energy-ad'){out.title='补充体力';out.lines=['体力不足时，观看完整广告','可补充 '+(energy.ad_refill_amount||5)+' 点体力。'];targets.push(l.energyAd);out.button='知道了';}
    else if(stage==='energy-share'){out.title='分享补充';out.lines=['分享成功也能补充 '+(energy.share_refill_amount||3)+' 点体力。','体力达到上限后不再增加。'];targets.push(l.energyShare);out.button='知道了';}
    else if(stage==='first-level'){out.title='选择第一关';out.lines=['点击高亮的第一个关卡，','开始学习如何守住基地。'];if(first)targets.push(l.levelCard(0,v.mapScroll));}
    else if(stage==='detail'){out.title='查看关卡';out.lines=['这里可以查看地图和守护目标。','点击下方按钮，开始选择阵容。'];targets.push(l.detailStart);}
    else if(stage==='tower-pick'){out.title='选择四座塔';out.lines=['选 4 座防御塔组成阵容。','已选 '+(v.deck||[]).length+'/4，点击卡片可选中或取消。'];targets.push.apply(targets,l.towerCards||l.loadoutCards||l.cards);}
    else if(stage==='tower-next'){out.title='塔防已选好';out.lines=['已经选好 4 座防御塔。','点击高亮按钮，消耗体力开始。'];targets.push(l.towerStart||l.deckStart);}
    else if(stage==='hero-pick'){out.title='选择一名英雄';out.lines=['每局可以选择 1 名英雄。','点击一张英雄卡片将其选中。'];targets.push.apply(targets,l.heroModalCards||l.loadoutHeroes||l.heroSelectCards||l.heroCards);}
    else if(stage==='hero-next'){out.title='继续选择防御塔';out.lines=['英雄已经选好。','点击高亮按钮，继续选择防御塔。'];targets.push(l.heroNext||l.heroStart);}
    else if(stage==='route'){out.title='怪物的移动路径';out.lines=['怪物从出生点沿箭头移动。','抵达终点会扣除基地生命。'];targets.push(l.board);out.path=c&&c.board&&c.board.path||[];out.button='知道了';}
    else if(stage==='pause'){out.title='暂停战斗';out.lines=['点击暂停按钮，可暂停战斗。','教学期间怪物不会前进。'];targets.push(l.pauseButton);}
    else if(stage==='resume'){out.title='继续战斗';out.lines=['再次点击同一按钮即可继续。','先完成部署教学，再迎接怪物。'];targets.push(l.pauseButton);}
    else if(stage==='tower-card'){
      out.title='选择要放置的塔';out.lines=['点击底部一张塔防卡片，','再到地图上的建塔格放置。'];
      for(i=0;c&&i<c.deckIds.length;i+=1)if((c.cardCosts[c.deckIds[i]]||0)<=c.gold)targets.push(l.battleTowerCard(i,c.deckIds.length));
      if(!targets.length){out.lines=['当前金币不足以建塔。','击败怪物可获得更多金币。'];out.button='知道了';}
    }else if(stage==='tower-place'){
      out.title='放置防御塔';out.lines=['点击高亮的可建塔格。','放置成功后会扣除对应金币。'];targets.push.apply(targets,slots(c,l,false));if(!targets.length){out.lines=['当前没有可用建塔格。','清除障碍后可以继续建塔。'];out.button='知道了';}else targets.push(l.battleTowerCard(c.deckIds.indexOf(c.selectedCard),c.deckIds.length));
    }else if(stage==='hero-card'){out.title='选择英雄';out.lines=['点击英雄卡片，','准备部署本局选择的英雄。'];if(c&&c.heroIds.length)targets.push(l.battleHeroCard(0,c.heroIds.length,c.deckIds.length));else out.button='知道了';}
    else if(stage==='hero-place'){
      out.title='部署英雄';out.lines=['点击高亮的英雄专属格。','英雄每局最多部署 1 名。'];targets.push.apply(targets,slots(c,l,true));if(!targets.length){out.lines=['当前没有可用英雄格。','英雄只能放在英雄专属格。'];out.button='知道了';}else targets.push(l.battleHeroCard(0,c.heroIds.length,c.deckIds.length));
    }else if(stage==='items'){out.title='战斗道具';out.lines=['点击道具入口，','查看本局可用的道具。'];targets.push(l.battleItems);}
    else if(stage==='item-info'){out.title='道具使用方法';out.lines=['观看完整广告后，道具才会生效。','也可暂不使用，直接开始战斗。'];targets.push.apply(targets,l.itemChoices);targets.push(l.itemSkip);out.button='开始战斗';}
    out.targets=targets.filter(function(r){return!!r;});
    top=l.top||0;h=154;panelY=top+Math.max(52,l.usable*.065);
    if(v.state==='DECK_SELECT'||v.state==='HERO_SELECT'){
      var modal=v.state==='DECK_SELECT'?l.towerModal:l.heroModal;available=modal?modal.y-top-16:(l.loadoutCards&&l.loadoutCards[0]&&l.loadoutCards[0].y||top+160)-top-20;
      h=Math.max(108,Math.min(140,available));panelY=top+10;
    }else if(out.targets.length&&out.targets[0].y<top+l.usable*.42)panelY=top+l.usable-h-18;
    if(stage==='route'){h=Math.min(154,Math.max(108,l.board.y-top-42));panelY=l.board.y-h-32;if(panelY<top+10)panelY=l.board.y+l.board.h+28;}
    if(stage==='tower-place'||stage==='hero-place')panelY=top+10;
    if(stage==='item-info')panelY=top+Math.max(16,l.usable*.06);
    out.panel={x:16,y:panelY,w:l.w-32,h:h};
    out.skipRect={x:out.panel.x+12,y:out.panel.y+h-38,w:80,h:28};
    out.nextRect=out.button?{x:out.panel.x+out.panel.w-124,y:out.panel.y+h-38,w:112,h:28}:null;
    return out;
  }
  function handlePointer(x,y,v){
    var t=v.tutorial,i;if(!t)return false;
    if(inside(t.skipRect,x,y)){write({skipped:true});move(null);return 'skip';}
    if(t.nextRect&&inside(t.nextRect,x,y)){
      if(stage==='energy-ad')move('energy-share');
      else if(stage==='energy-share'){write({energySeen:true});move('first-level');}
      else if(stage==='route')move('pause');
      else if(stage==='tower-card'||stage==='tower-place')move('hero-card');
      else if(stage==='hero-card'||stage==='hero-place')move('items');
      else if(stage==='item-info'){finish();return 'finish-items';}
      return true;
    }
    if(t.button&&stage!=='item-info')return true;
    for(i=0;i<t.targets.length;i+=1)if(inside(t.targets[i],x,y)){pending=stage;return false;}
    return true;
  }
  M3.Tutorial={init:init,view:view,handlePointer:handlePointer,onBattleStart:onBattleStart,shouldFreeze:freeze};
})();
