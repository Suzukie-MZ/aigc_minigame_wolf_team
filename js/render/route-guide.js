(function () {
  var M3=window.M3,draw=M3.Renderer.draw,board=null,segments=[],length=0,started=0;
  function prepare(next){
    var path=next.path||[],i,a,b,dx,dy,size;
    board=next;segments=[];length=0;started=M3._now();
    for(i=1;i<path.length;i+=1){a=path[i-1];b=path[i];dx=b.x-a.x;dy=b.y-a.y;size=Math.sqrt(dx*dx+dy*dy);if(!size)continue;segments.push({x:a.x+.5,y:a.y+.5,dx:dx/size,dy:dy/size,start:length,end:length+size});length+=size;}
  }
  function position(distance){
    var i,s;
    if(distance<0||distance>length)return null;
    for(i=0;i<segments.length;i+=1){s=segments[i];if(distance<=s.end)return{x:s.x+s.dx*(distance-s.start),y:s.y+s.dy*(distance-s.start),dx:s.dx,dy:s.dy};}
    return null;
  }
  function chevron(vertices,p,l,g){
    var cx=g?g.x+p.x*g.cx:l.board.x+p.x*l.cell,cy=g?g.y+p.y*g.cy:l.board.y+p.y*l.cell,size=Math.min(8,l.cell*.17),points=[[-.65,-.85],[.35,0],[-.65,.85],[-1.05,.45],[-.45,0],[-1.05,-.45]],order=[0,1,4,0,4,5,1,2,3,1,3,4],i,q;
    for(i=0;i<order.length;i+=1){q=points[order[i]];vertices.push(cx+(q[0]*p.dx-q[1]*p.dy)*size,cy+(q[0]*p.dy+q[1]*p.dx)*size);}
  }
  function render(v){
    var c=v.combat,t=v.tutorial,teaching=t&&t.id==='route',l,time,duration,head,i,p,vertices=[],alpha,active,g;
    if(v.state!=='BATTLE'||!c||!c.board){board=null;return;}
    if(board!==c.board)prepare(c.board);
    if(!length||t&&!teaching||v.itemMenuOpen)return;
    duration=c.board.routePreviewDuration;
    time=teaching?Math.max(0,(M3._now()-started)/1000)%(duration+.6):c.elapsed;
    if(time>duration)return;
    l=M3.UILayout.get();g=M3.CombatProjection&&M3.CombatProjection.geometry(l,c.board);head=time/duration*length;
    for(i=0;i<3;i+=1){p=position(head-i*.36);if(p)chevron(vertices,p,l,g);}
    if(!vertices.length)return;
    alpha=Math.min(1,time/.15)*.9;
    active=M3.Renderer._activeView;M3.Renderer._activeView=null;
    try{M3.Renderer.triangles(vertices,[.64,.98,.96,Math.max(0,alpha)]);}finally{M3.Renderer._activeView=active;}
  }
  M3.RouteGuide={draw:render};
  M3.Renderer.draw=function(context,v){draw(context,v);render(v);};
})();
