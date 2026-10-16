(function () {
  var M3=window.M3,draw=M3.Renderer.draw;
  function quad(v,x,y,w,h){v.push(x,y,x+w,y,x,y+h,x,y+h,x+w,y,x+w,y+h);}
  function render(v){
    var c=v.combat,hero,l,x,y,i,unit,used={},vertices=[],inset,b,px,py,size,alpha;
    if(v.state!=='BATTLE'||!c||v.itemMenuOpen||c.selectedTower||c.selectedObstacle)return;
    hero=c.mode==='hero';
    if(hero){if(!c.selectedHero||!c.heroUnits[c.selectedHero])return;}
    else if(!c.selectedCard||!c.cardUnits[c.selectedCard])return;
    l=M3.UILayout.get();inset=Math.max(3,l.cell*.09);b=Math.max(1.5,Math.min(2,l.cell*.045));size=l.cell-2*inset;
    for(i=0;i<c.towers.length+c.heroes.length;i+=1){unit=i<c.towers.length?c.towers[i]:c.heroes[i-c.towers.length];used[unit.x+','+unit.y]=true;}
    for(y=0;y<c.board.height;y+=1)for(x=0;x<c.board.width;x+=1){
      if(used[x+','+y]||!(hero?c.board.isHeroSlot(x,y):c.board.isBuildable(x,y)))continue;
      px=l.board.x+x*l.cell+inset;py=l.board.y+y*l.cell+inset;
      quad(vertices,px,py,size,b);quad(vertices,px,py+size-b,size,b);quad(vertices,px,py+b,b,size-2*b);quad(vertices,px+size-b,py+b,b,size-2*b);
    }
    if(!vertices.length)return;
    alpha=.25+.65*(.5+.5*Math.sin(M3._now()*.007));
    M3.Renderer.triangles(vertices,hero?[1,.83,.42,alpha]:[.35,.95,.86,alpha]);
  }
  M3.DeploymentHints={draw:render};
  M3.Renderer.draw=function(context,v){draw(context,v);render(v);};
})();
