(function () {
  var M3=window.M3,draw=M3.Renderer.draw,cyan=[.35,.90,.88,1],white=[.94,.98,1,1];
  function rect(r,color){M3.Renderer.rect(r.x,r.y,r.w,r.h,color);}
  function frame(r,color){var b=2;rect({x:r.x,y:r.y,w:r.w,h:b},color);rect({x:r.x,y:r.y+r.h-b,w:r.w,h:b},color);rect({x:r.x,y:r.y,w:b,h:r.h},color);rect({x:r.x+r.w-b,y:r.y,w:b,h:r.h},color);}
  function text(value,x,y,size,color,width,kind,align){if(M3.BitmapFont)M3.BitmapFont.drawText(M3.Renderer,value,x,y,size,color,width,align||'left',kind||'body');}
  function shade(t,l){
    var list=t.targets,minX=l.w,minY=l.h,maxX=0,maxY=0,i,r,c=[.005,.012,.025,.72];
    for(i=0;i<list.length;i+=1){r=list[i];minX=Math.min(minX,r.x-4);minY=Math.min(minY,r.y-4);maxX=Math.max(maxX,r.x+r.w+4);maxY=Math.max(maxY,r.y+r.h+4);}
    if(!list.length){rect({x:0,y:l.top,w:l.w,h:l.usable},c);return;}
    minX=Math.max(0,minX);maxX=Math.min(l.w,maxX);minY=Math.max(l.top,minY);maxY=Math.min(l.top+l.usable,maxY);
    rect({x:0,y:l.top,w:l.w,h:Math.max(0,minY-l.top)},c);rect({x:0,y:maxY,w:l.w,h:Math.max(0,l.top+l.usable-maxY)},c);
    rect({x:0,y:minY,w:minX,h:maxY-minY},c);rect({x:maxX,y:minY,w:l.w-maxX,h:maxY-minY},c);
    for(i=0;t.id!=='route'&&i<list.length;i+=1){r=list[i];if((t.id==='tower-place'||t.id==='hero-place')&&r.w===l.cell&&r.h===l.cell)continue;frame({x:r.x-3,y:r.y-3,w:r.w+6,h:r.h+6},cyan);}
  }
  function overlay(t){
    var l=M3.UILayout.get(),p=t.panel,compact=p.h<130,i,y,active=M3.Renderer._activeView;
    // Overlay rectangles must bypass the existing battle tile interception.
    M3.Renderer._activeView=null;
    try{
      shade(t,l);
      rect(p,[.025,.065,.10,.98]);frame(p,[.26,.72,.76,1]);rect({x:p.x,y:p.y,w:4,h:p.h},cyan);
      text(t.title,p.x+14,p.y+9,1.6,white,p.w-95,'title');text(t.index+'/'+t.total,p.x+p.w-14,p.y+12,.8,cyan,64,'label','right');
      y=p.y+(compact?34:44);for(i=0;i<t.lines.length;i+=1)text(t.lines[i],p.x+14,y+i*(compact?17:21),.86,white,p.w-28,'body');
      rect(t.skipRect,[.10,.17,.22,1]);text('跳过引导',t.skipRect.x+t.skipRect.w/2,t.skipRect.y+6,.85,[.72,.82,.88,1],t.skipRect.w-8,'label','center');
      if(t.nextRect){rect(t.nextRect,[.12,.42,.43,1]);text(t.button,t.nextRect.x+t.nextRect.w/2,t.nextRect.y+6,.85,white,t.nextRect.w-10,'label','center');}
      else text('点击高亮区域继续',p.x+p.w-14,p.y+p.h-30,.82,cyan,p.w-120,'label','right');
    }finally{M3.Renderer._activeView=active;}
  }
  M3.Renderer.draw=function(context,view){draw(context,view);if(view.tutorial)overlay(view.tutorial);};
})();
