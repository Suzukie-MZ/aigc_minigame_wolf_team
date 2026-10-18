(function(){
  var M3=window.M3;
  function geometry(l,board){
    // Fit every cell plus standing-unit headroom; no zoom, crop or pan state.
    var cell=Math.min(l.board.w/board.width,l.board.h/(board.height*.72+1.6)),w=cell*board.width,h=cell*board.height*.72;
    return{x:l.board.x+(l.board.w-w)/2,y:l.board.y+(l.board.h-h)/2,w:w,h:h,cx:cell,cy:cell*.72};
  }
  function point(g,x,y){return{x:g.x+x*g.cx,y:g.y+y*g.cy};}
  function pick(g,x,y){if(x<g.x||y<g.y||x>=g.x+g.w||y>=g.y+g.h)return null;return{x:Math.floor((x-g.x)/g.cx),y:Math.floor((y-g.y)/g.cy)};}
  M3.CombatProjection={manifest:[{key:'ui-support-dossier',url:'subpackages/ui-images/assets/Image/ui/ui-support-dossier-v1.jpg',type:'image',version:'1',preload:true},{key:'battle-scene-surround',url:'subpackages/battle-images/assets/Image/ui/battle-scene-surround.webp',type:'image',version:'1',preload:true}],geometry:geometry,point:point,pick:pick};
})();
