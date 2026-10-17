(function(){
  var M3=window.M3;
  function geometry(l,board){
    // Fit every cell plus standing-unit headroom; no zoom, crop or pan state.
    var cell=Math.min(l.board.w/board.width,l.board.h/(board.height*.72+1.6)),w=cell*board.width,h=cell*board.height*.72;
    return{x:l.board.x+(l.board.w-w)/2,y:l.board.y+(l.board.h-h)/2,w:w,h:h,cx:cell,cy:cell*.72};
  }
  function point(g,x,y){return{x:g.x+x*g.cx,y:g.y+y*g.cy};}
  function pick(g,x,y){if(x<g.x||y<g.y||x>=g.x+g.w||y>=g.y+g.h)return null;return{x:Math.floor((x-g.x)/g.cx),y:Math.floor((y-g.y)/g.cy)};}
  function facing(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx<0?1:3):(dy<0?2:0);}
  function direction(unit,enemies){var target=null,best=Infinity,i,dx,dy,d;for(i=0;i<enemies.length;i+=1){if(enemies[i].dying||enemies[i].hp<=0)continue;dx=enemies[i].x-unit.x-.5;dy=enemies[i].y-unit.y-.5;d=dx*dx+dy*dy;if(d<best){best=d;target=enemies[i];}}return target?facing(target.x-unit.x-.5,target.y-unit.y-.5):0;}
  function row(id){var m=/^(hero|tower)-(\d+)/.exec(id||'');return m?(m[1]==='hero'?Number(m[2])-1:Number(m[2])+2):-1;}
  function directional(id){return /^hero-/.test(id)||id==='tower-2'||id==='tower-4';}
  var ys=[0,207,430,606,805,979,1181,1374,1577,1881];
  function region(id,d){var r=row(id);if(r<0||r>8)return null;var c=directional(id)?d:0;return[c/4,ys[r]/1881,(c+1)/4,ys[r+1]/1881];}
  M3.CombatProjection={manifest:[{key:'battle-scene-surround',url:'assets/Image/ui/battle-scene-surround.webp',type:'image',version:'1',preload:true},{key:'pixel-terrain-25d',url:'assets/Image/ui/pixel-terrain-25d-v1.webp',type:'image',version:'1',preload:true},{key:'pixel-units-25d',url:'assets/Image/ui/pixel-units-25d-v1.webp',type:'image',version:'1',preload:true}],geometry:geometry,point:point,pick:pick,facing:facing,direction:direction,directional:directional,region:region};
})();
