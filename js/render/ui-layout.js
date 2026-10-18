(function () {
  var M3 = window.M3,gridW=10,gridH=12,cachedLayout=null,cachedW,cachedH,cachedTop,cachedBottom,cachedGridW,cachedGridH;
  function rect(x,y,w,h){return{x:x,y:y,w:w,h:h};}
  function contains(r,x,y){return x>=r.x&&y>=r.y&&x<=r.x+r.w&&y<=r.y+r.h;}
  function layout() {
    var w=M3.Layout.w||414,h=M3.Layout.h||896,top=M3.Layout.safeTop||0,bottom=M3.Layout.bottomPadding||0,usable=Math.max(320,h-top-bottom),margin=Math.max(12,w*0.04),battleHudTop=top+Math.max(50,Math.min(62,usable*.065)),hudBottom=battleHudTop+39,battleRowY=top+usable*.63,battleBoardTop=hudBottom+34,boardW=w-margin*2,battleGap=Math.max(6,Math.min(14,usable*.014)),battleSpace=Math.max(80,battleRowY-battleBoardTop),cell=Math.min(boardW/gridW,Math.max(2,(battleSpace-battleGap*2)/gridH)),boardH=cell*gridH,boardX=(w-cell*gridW)/2,boardY=battleBoardTop+(battleSpace-boardH)*.5,i,cards=[],heroCards=[],heroSelectCards=[],cardGap=10,cardW=Math.min((w-margin*2-cardGap)/2,usable*.23),cardStartX=(w-cardW*2-cardGap)/2,cardStartY=top+usable*.16,heroCardW=cardW,heroStartX=cardStartX,heroStartY=top+usable*.22,heroSelectRowGap=Math.max(64,Math.min(76,usable*.075)),mapHeaderY=top+Math.max(44,Math.min(52,usable*.052)),mapHeaderH=Math.max(50,Math.min(60,usable*.062)),shortcutY=mapHeaderY+mapHeaderH+10,shortcutH=Math.max(50,Math.min(62,usable*.065)),shortcutGap=8,shortcutW=(w-margin*2-shortcutGap*3)/4,mapList=rect(margin,shortcutY+shortcutH+44,w-margin*2,Math.max(80,usable-(shortcutY-top+shortcutH+44)-66)),levelGap=usable*.018,levelRowH=Math.max(132,Math.min(184,(mapList.h-levelGap*3)/3.33)),heroArtH=usable*.092,towerArtH=usable*.074,heroCardH=usable*.165,battleCardH=usable*.16,itemCardH=usable*.11,itemAreaW=Math.min(w*.18,76),itemAreaX=w-margin-itemAreaW;
    // Reference positions use the supplied 286 x 618 design; the list absorbs device height changes.
    var ms=w/286,mapGap=9*ms,mapColumns=2,mapDockH=Math.max(78,62*ms),mapTopH=31*ms,mapShift=mapTopH-31*ms,mapNameH=w<360?34:24,mapPreviewH=100*ms;
    mapHeaderY=top+mapTopH;mapHeaderH=62*ms;
    shortcutH=mapDockH;shortcutY=top+usable-mapDockH-5*ms;shortcutGap=0;
    shortcutW=(w-18*ms)/4;
    mapList=rect(17*ms,top+123*ms+mapShift,w-34*ms,Math.max(100,shortcutY-top-128*ms-mapShift));
    levelGap=7*ms;levelRowH=6*ms+mapPreviewH+4+mapNameH+16+2+34+7;
    var loadoutCards=[],loadoutHeroes=[],loadoutGap=12,loadoutTop=top+Math.max(128,usable*.19),loadoutBottom=top+usable*.85,loadoutW=(w-margin*2-loadoutGap)/2,loadoutH=(loadoutBottom-loadoutTop-loadoutGap*2)/3,heroRowH=(loadoutBottom-loadoutTop-loadoutGap*2)/3;
    for(i=0;i<6;i+=1)loadoutCards.push(rect(margin+(i%2)*(loadoutW+loadoutGap),loadoutTop+Math.floor(i/2)*(loadoutH+loadoutGap),loadoutW,loadoutH));
    for(i=0;i<3;i+=1)loadoutHeroes.push(rect(margin,loadoutTop+i*(heroRowH+loadoutGap),w-margin*2,heroRowH));
    var towerW=w*.92,towerH=Math.min(670,Math.max(usable*.72,Math.min(540,usable-24))),towerPanel=rect((w-towerW)/2,top+(usable-towerH)/2+(usable>700?12:0),towerW,towerH),towerGap=10,
      towerGridTop=towerPanel.y+100,towerCounterY=towerPanel.y+towerPanel.h-96,
      towerCardW=(towerW-28-towerGap)/2,towerCardH=(towerCounterY-towerGridTop-18)/3,towerCards=[];
    for(i=0;i<6;i+=1)towerCards.push(rect(towerPanel.x+14+(i%2)*(towerCardW+towerGap),towerGridTop+Math.floor(i/2)*(towerCardH+6),towerCardW,towerCardH));
    var heroW=w*.92,heroH=Math.min(620,Math.max(usable*.66,Math.min(480,usable-32))),heroModal=rect((w-heroW)/2,top+(usable-heroH)/2+(usable>700?12:0),heroW,heroH),heroModalCards=[],heroModalRowH=(heroH-182-12)/3;
    for(i=0;i<3;i+=1)heroModalCards.push(rect(heroModal.x+14,heroModal.y+100+i*(heroModalRowH+6),heroW-28,heroModalRowH));
    // Upgrade shares the hero dossier skin, with space for live upgrade effects and cost.
    var upgradeH=Math.min(700,usable-24),upgradePanel=rect((w-heroW)/2,top+(usable-upgradeH)/2,heroW,upgradeH),upgradeRowH=(upgradeH-260)/3;
    loadoutHeroes=[];
    for(i=0;i<3;i+=1)loadoutHeroes.push(rect(upgradePanel.x+14,upgradePanel.y+104+i*(upgradeRowH+6),heroW-28,upgradeRowH));
    var upgradeSummary=rect(upgradePanel.x+14,upgradePanel.y+upgradeH-140,heroW-28,64),
      upgradeBack=rect(upgradePanel.x+14,upgradePanel.y+upgradeH-64,86,48),
      upgradeStart=rect(upgradePanel.x+110,upgradePanel.y+upgradeH-64,heroW-124,48);
    var settlementH=Math.min(480,usable-40),settlement=rect(w*.04,top+(usable-settlementH)/2,w*.92,settlementH),
      settlementGap=8,settlementInner=settlement.w-36,settlementRewardW=(settlementInner-settlementGap)/2,
      settlementRewards=[rect(settlement.x+18,settlement.y+settlementH*.43,settlementRewardW,settlementH*.25),rect(settlement.x+26+settlementRewardW,settlement.y+settlementH*.43,settlementRewardW,settlementH*.25)];
    var terminalH=Math.min(480,usable-32),terminal=rect(w*.04,top+(usable-terminalH)/2,w*.92,terminalH);
    var detailGap=8,detailWidth=w-24,detailHeaderH=w<360?64:86,detailObjectiveH=w<360?94:118,detailActionH=52,
      detailActionY=top+usable-12-detailActionH,detailFlow=rect(12,detailActionY-32,detailWidth,24),
      detailObjective=rect(12,detailFlow.y-8-detailObjectiveH,detailWidth,detailObjectiveH),
      detailHeader=rect(12,top+54,detailWidth,detailHeaderH),
      detailMapFrame=rect(12,detailHeader.y+detailHeader.h+detailGap,detailWidth,detailObjective.y-detailGap-(detailHeader.y+detailHeader.h+detailGap)),detailBackW=w<360?82:96;
    for(i=0;i<6;i+=1)cards.push(rect(cardStartX+(i%2)*(cardW+cardGap),cardStartY+Math.floor(i/2)*(cardW+8),cardW,cardW));
    for(i=0;i<3;i+=1)heroCards.push(rect(i===2?(w-heroCardW)/2:heroStartX+i*(heroCardW+cardGap),heroStartY+(i===2?heroCardW+10:0),heroCardW,heroCardW));
    for(i=0;i<3;i+=1)heroSelectCards.push(rect(i===2?(w-heroCardW)/2:heroStartX+i*(heroCardW+cardGap),heroStartY+(i===2?heroCardW+heroSelectRowGap:0),heroCardW,heroCardW));
    // One full-width field with no inset map frame; compact cards leave the field the main screen area.
    var dockTowerH=Math.max(118,Math.min(140,usable*.157)),commandH=102,
      dockY=top+usable-16-dockTowerH,commandY=dockY-6-commandH,
      fieldTop=top+180,fieldSpace=commandY-14-fieldTop,
      arena=rect(8,fieldTop,w-16,fieldSpace),
      battleViewport=rect(arena.x,arena.y,arena.w,arena.h);
    battleHudTop=top+48;hudBottom=top+106;battleRowY=commandY;
    var supportW=w*.94,supportH=Math.min(620,usable-72,Math.max(430,supportW*1.30)),
      support=rect((w-supportW)/2,top+(usable-supportH)/2+12,supportW,supportH),supportPad=16,supportGap=10,
      supportCardW=(supportW-supportPad*2-supportGap)/2,supportCardY=support.y+108,
      supportCardH=supportH-198,
      supportCards=[rect(support.x+supportPad,supportCardY,supportCardW,supportCardH),rect(support.x+supportPad+supportCardW+supportGap,supportCardY,supportCardW,supportCardH)],
      supportActions=supportCards.map(function(r){return rect(r.x+10,r.y+r.h-62,r.w-20,48);});
    return { waveNotice:rect(12,top+112,w-24,60),upgradePanel:upgradePanel,upgradeSummary:upgradeSummary,heroModal:heroModal,heroModalCards:heroModalCards,heroClose:rect(heroModal.x+heroW-48,heroModal.y+2,48,48),heroCancel:rect(heroModal.x+14,heroModal.y+heroH-64,(heroW-38)/2,48),heroNext:rect(heroModal.x+24+(heroW-38)/2,heroModal.y+heroH-64,(heroW-38)/2,48),w:w,h:h,top:top,usable:usable,loadoutCards:loadoutCards,loadoutHeroes:loadoutHeroes,battleArena:arena,battleHudTop:battleHudTop,battleHudBottom:hudBottom,battleHint:rect(12,hudBottom+5,w-24,22),battleBoardGap:(battleSpace-boardH)*.5,homeHero:rect(w*.1,top+usable*.19,w*.8,usable*.34),homeStart:rect(w*.2,top+usable*.66,w*.6,usable*.1),towerModal:towerPanel,towerCards:towerCards,towerClose:rect(towerPanel.x+towerPanel.w-48,towerPanel.y+2,48,48),towerCounter:rect(towerPanel.x+14,towerCounterY,towerW-28,22),towerPrev:rect(towerPanel.x+14,towerPanel.y+towerH-64,(towerW-38)*.48,48),towerStart:rect(towerPanel.x+24+(towerW-38)*.48,towerPanel.y+towerH-64,(towerW-38)*.52,48),mapScale:ms,mapTopH:mapTopH,mapNameH:mapNameH,mapPreviewH:mapPreviewH,mapHeader:rect(20*ms,mapHeaderY,w-40*ms,mapHeaderH),mapUpgrade:rect(9*ms+3*shortcutW,shortcutY,shortcutW,shortcutH),energyAd:rect(9*ms,shortcutY,shortcutW,shortcutH),energyShare:rect(9*ms+shortcutW,shortcutY,shortcutW,shortcutH),energyCurrent:rect(9*ms+2*shortcutW,shortcutY,shortcutW,shortcutH),mapBrand:rect(43*ms,mapHeaderY-24*ms,67*ms,22*ms),mapDock:rect(5*ms,shortcutY,w-10*ms,shortcutH),mapSection:rect(20*ms,top+104*ms+mapShift,w-40*ms,18*ms),mapShell:rect(7*ms,top+94*ms+mapShift,w-14*ms,shortcutY-top-99*ms-mapShift),mapDialog:terminal,mapDialogClose:rect(terminal.x+terminal.w-48,terminal.y+2,48,48),mapDialogActions:[rect(terminal.x+18,terminal.y+terminal.h-124,terminal.w-36,48),rect(terminal.x+18,terminal.y+terminal.h-66,terminal.w-36,48)],mapFooter:rect(margin,mapList.y+mapList.h+4,w-margin*2,22),mapList:mapList,mapColumns:mapColumns,levelRowH:levelRowH,levelGap:levelGap,levelCard:function(index,scroll){return rect(mapList.x+(index%mapColumns)*((mapList.w-mapGap)/mapColumns+mapGap),mapList.y+Math.floor(index/mapColumns)*(levelRowH+levelGap)-(scroll||0),(mapList.w-mapGap)/mapColumns,levelRowH);},detailClose:rect(w-58,top+6,48,48),detailFlow:detailFlow,detailLegend:rect(detailMapFrame.x+12,detailMapFrame.y+detailMapFrame.h-(w<360?42:48),detailMapFrame.w-24,32),detailHeader:detailHeader,detailMapFrame:detailMapFrame,detailObjective:detailObjective,detailPreview:rect(detailMapFrame.x+12,detailMapFrame.y+(w<360?32:40),detailMapFrame.w-24,detailMapFrame.h-(w<360?76:98)),detailBack:rect(12,detailActionY,detailBackW,detailActionH),detailStart:rect(24+detailBackW,detailActionY,detailWidth-detailBackW-12,detailActionH),cards:cards,heroCards:heroCards,heroSelectCards:heroSelectCards,progressionPanel:rect(margin,top+usable*.018,w-margin*2,usable*.16),progressionCancel:rect(margin+8,top+usable*.128,(w-margin*2-24)*.36,usable*.04),progressionConfirm:rect(margin+16+(w-margin*2-24)*.36,top+usable*.128,(w-margin*2-24)*.64,usable*.04),progressionBack:rect(w*.08,top+usable*.88,w*.20,usable*.07),pagePrev:rect(margin,top+usable*.88,w*.20,usable*.07),pageNext:rect(w-margin-w*.20,top+usable*.88,w*.20,usable*.07),deckStart:rect(w*.31,top+usable*.88,w*.61,usable*.07),heroBack:upgradeBack,heroStart:upgradeStart,board:battleViewport,cell:cell,gridWidth:gridW,gridHeight:gridH,heroBarY:battleRowY,cardBarY:dockY,battleHeroArtH:heroArtH,battleCardArtH:towerArtH,battleCardH:battleCardH,battleItems:rect(w-116,commandY+54,98,48),battleHeroCard:function(index,heroCount,towerCount){return rect(18,commandY,w-146,commandH);},battleTowerCard:function(index,count){var gap=6,cardW=(w-36-gap*(Math.max(1,count)-1))/Math.max(1,count);return rect(18+index*(cardW+gap),dockY,cardW,dockTowerH);},pauseButton:rect(w-116,commandY,98,48),itemModal:support,itemChoices:supportCards,itemActions:supportActions,itemSkip:rect(w*.5-supportW*.25,support.y+supportH-70,supportW*.5,48),towerPanel:rect(12,commandY-94,w-24,86),towerUpgrade:rect(w-116,commandY-76,96,48),resultPanel:settlement,resultBadge:rect(w*.5-96,settlement.y+22,192,108),resultRewards:settlementRewards,resultDouble:rect(settlement.x+18,settlement.y+settlementH-116,settlementInner,48),resultButton:rect(settlement.x+18,settlement.y+settlementH-60,settlementInner,48) };
  }
  // Layout consumers only read these rectangles. Rebuild when a geometry input changes.
  function getLayout(){
    var current=M3.Layout;
    if(!cachedLayout||cachedW!==current.w||cachedH!==current.h||cachedTop!==current.safeTop||cachedBottom!==current.bottomPadding||cachedGridW!==gridW||cachedGridH!==gridH){
      cachedLayout=layout();cachedW=current.w;cachedH=current.h;cachedTop=current.safeTop;cachedBottom=current.bottomPadding;cachedGridW=gridW;cachedGridH=gridH;
    }
    return cachedLayout;
  }
  M3.UILayout={get:getLayout,contains:contains,setGrid:function(w,h){gridW=Math.max(2,Math.min(40,Math.floor(Number(w))||10));gridH=Math.max(2,Math.min(60,Math.floor(Number(h))||12));}};
})();
