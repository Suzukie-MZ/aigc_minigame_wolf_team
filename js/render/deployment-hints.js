(function () {
  var M3=window.M3;
  function quad(v,x,y,w,h){v.push(x,y,x+w,y,x,y+h,x,y+h,x+w,y,x+w,y+h);}
  function rangeHint(v){
    var c=v.combat,hint=c.towerRangeHint,l,g,center,rx,ry,fill=[],edge=[],i,a,b,x1,y1,x2,y2,ix1,iy1,ix2,iy2,width=1.8;
    if(!hint||v.paused||c.selectedObstacle)return;
    l=M3.UILayout.get();g=M3.CombatProjection.geometry(l,c.board);center=M3.CombatProjection.point(g,hint.x+.5,hint.y+.5);
    rx=hint.range*g.cx;ry=hint.range*g.cy;
    // Project the same grid-space circle used by combat onto the compressed ground plane.
    for(i=0;i<96;i+=1){
      a=i*Math.PI*2/96;b=(i+1)*Math.PI*2/96;
      x1=center.x+Math.cos(a)*rx;y1=center.y+Math.sin(a)*ry;x2=center.x+Math.cos(b)*rx;y2=center.y+Math.sin(b)*ry;
      ix1=center.x+Math.cos(a)*Math.max(0,rx-width);iy1=center.y+Math.sin(a)*Math.max(0,ry-width);
      ix2=center.x+Math.cos(b)*Math.max(0,rx-width);iy2=center.y+Math.sin(b)*Math.max(0,ry-width);
      fill.push(center.x,center.y,x1,y1,x2,y2);edge.push(x1,y1,x2,y2,ix1,iy1,ix1,iy1,x2,y2,ix2,iy2);
    }
    M3.Renderer.triangles(fill,hint.hero?[1,.83,.42,.12]:[.35,.95,.86,.12]);M3.Renderer.triangles(edge,hint.hero?[1,.83,.42,.85]:[.35,.95,.86,.85]);
  }
  function render(v){
    var c=v.combat,hero,l,x,y,i,unit,used={},vertices=[],inset,b,px,py,size,alpha,g,cw,ch;
    if(v.state!=='BATTLE'||!c||v.itemMenuOpen)return;
    rangeHint(v);
    if(c.selectedTower||c.selectedHeroUnit||c.selectedObstacle)return;
    hero=c.mode==='hero';
    if(hero){if(!c.selectedHero||!c.heroUnits[c.selectedHero])return;}
    else if(!c.selectedCard||!c.cardUnits[c.selectedCard])return;
    l=M3.UILayout.get();g=M3.CombatProjection&&M3.CombatProjection.geometry(l,c.board);cw=g?g.cx:l.cell;ch=g?g.cy:l.cell;inset=Math.max(3,l.cell*.09);b=Math.max(1.5,Math.min(2,l.cell*.045));size=cw-2*inset;
    for(i=0;i<c.towers.length+c.heroes.length;i+=1){unit=i<c.towers.length?c.towers[i]:c.heroes[i-c.towers.length];used[unit.x+','+unit.y]=true;}
    for(y=0;y<c.board.height;y+=1)for(x=0;x<c.board.width;x+=1){
      if(used[x+','+y]||!(hero?c.board.isHeroSlot(x,y):c.board.isBuildable(x,y)))continue;
      px=(g?g.x+x*g.cx:l.board.x+x*l.cell)+inset;py=(g?g.y+y*g.cy:l.board.y+y*l.cell)+inset;
      quad(vertices,px,py,size,b);quad(vertices,px,py+ch-2*inset-b,size,b);quad(vertices,px,py+b,b,ch-2*inset-2*b);quad(vertices,px+size-b,py+b,b,ch-2*inset-2*b);
    }
    if(!vertices.length)return;
    alpha=.25+.65*(.5+.5*Math.sin(M3._now()*.007));
    M3.Renderer.triangles(vertices,hero?[1,.83,.42,alpha]:[.35,.95,.86,alpha]);
  }
  M3.DeploymentHints={draw:render};
})();
