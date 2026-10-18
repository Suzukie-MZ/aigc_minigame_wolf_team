(function () {
  var M3=window.M3,draw=M3.Renderer.draw,cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],amber=[.957,.718,.173,1];
  function rect(r,color){if(r.w>0&&r.h>0)M3.Renderer.rect(r.x,r.y,r.w,r.h,color);}
  function line(x,y,x2,y2,width,color){M3.Renderer.terminal.line(x,y,x2,y2,width,color);}
  function frame(r,color){var b=1;rect({x:r.x,y:r.y,w:r.w,h:b},color);rect({x:r.x,y:r.y+r.h-b,w:r.w,h:b},color);rect({x:r.x,y:r.y,w:b,h:r.h},color);rect({x:r.x+r.w-b,y:r.y,w:b,h:r.h},color);}
  function label(value,r,size,color,options){M3.Renderer.terminal.label(value,r,size,color,options);}
  function stepPlate(r){
    var x=r.x,y=r.y,w=r.w,h=r.h,outer=[x,y,x+w-7,y,x+w,y+7,x+w,y+h,x+19,y+h,x,y+7],
      inner=[x+5,y+4,x+w-9,y+4,x+w-4,y+9,x+w-4,y+h-4,x+21,y+h-4,x+5,y+7],i;
    function polygon(points,color){var j,vertices=[];for(j=2;j<points.length-2;j+=2)vertices.push(points[0],points[1],points[j],points[j+1],points[j+2],points[j+3]);M3.Renderer.triangles(vertices,color);}
    polygon(outer,[.39,.49,.56,1]);polygon(inner,[.035,.12,.17,1]);
    for(i=0;i<outer.length;i+=2)line(outer[i],outer[i+1],outer[(i+2)%outer.length],outer[(i+3)%outer.length],1,[.65,.77,.82,1]);
    line(x+8,y+4,x+w-11,y+4,1,[.22,.40,.48,1]);
    line(x+22,y+h-4,x+w-5,y+h-4,1,[.34,.61,.67,1]);
    rect({x:x+w-5,y:y+9,w:3,h:6},[.66,.76,.80,1]);
  }
  function shadeRects(targets,l){
    var holes=[],edges=[l.top,l.top+l.usable],output=[],i,j,r,x,y,y2,spans,merged,last;
    for(i=0;i<targets.length;i+=1){
      r={x:Math.max(0,targets[i].x-4),y:Math.max(l.top,targets[i].y-4),right:Math.min(l.w,targets[i].x+targets[i].w+4),bottom:Math.min(l.top+l.usable,targets[i].y+targets[i].h+4)};
      if(r.right>r.x&&r.bottom>r.y){holes.push(r);edges.push(r.y,r.bottom);}
    }
    edges.sort(function(a,b){return a-b;});
    for(i=0;i<edges.length-1;i+=1){
      y=edges[i];y2=edges[i+1];if(y2<=y)continue;spans=[];
      for(j=0;j<holes.length;j+=1)if(holes[j].y<y2&&holes[j].bottom>y)spans.push([holes[j].x,holes[j].right]);
      spans.sort(function(a,b){return a[0]-b[0];});merged=[];
      for(j=0;j<spans.length;j+=1){last=merged[merged.length-1];if(last&&spans[j][0]<=last[1])last[1]=Math.max(last[1],spans[j][1]);else merged.push(spans[j].slice());}
      x=0;for(j=0;j<merged.length;j+=1){if(merged[j][0]>x)output.push({x:x,y:y,w:merged[j][0]-x,h:y2-y});x=merged[j][1];}
      if(x<l.w)output.push({x:x,y:y,w:l.w-x,h:y2-y});
    }
    return output;
  }
  function corners(r,color){
    var x=r.x-3,y=r.y-3,w=r.w+6,h=r.h+6,a=Math.min(12,r.w*.2,r.h*.3),b=3;
    rect({x:x,y:y,w:a,h:b},color);rect({x:x,y:y,w:b,h:a},color);
    rect({x:x+w-a,y:y,w:a,h:b},color);rect({x:x+w-b,y:y,w:b,h:a},color);
    rect({x:x,y:y+h-b,w:a,h:b},color);rect({x:x,y:y+h-a,w:b,h:a},color);
    rect({x:x+w-a,y:y+h-b,w:a,h:b},color);rect({x:x+w-b,y:y+h-a,w:b,h:a},color);
  }
  function pointer(r){
    var cx=r.w>80?r.x+r.w-23:r.x+r.w*.5,cy=r.h>70?r.y+r.h-18:r.y+r.h*.5,
      progress=(M3._now()%1100)/1100,radius=9+progress*9,i,a,b,
      pixels=['0002200000','0021120000','0021120000','0021120000','0021122200','0021111120','0221111112','2111111112','2111111112','0211111120','0021111120','0022222200'],x,y,scale=1.6;
    for(i=0;i<16;i+=1){a=i*Math.PI/8;b=(i+1)*Math.PI/8;line(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,cx+Math.cos(b)*radius,cy+Math.sin(b)*radius,1,[cyan[0],cyan[1],cyan[2],(1-progress)*.7]);}
    for(y=0;y<pixels.length;y+=1)for(x=0;x<pixels[y].length;x+=1)if(pixels[y].charAt(x)!=='0')rect({x:cx-3+x*scale,y:cy+2+y*scale,w:scale,h:scale},pixels[y].charAt(x)==='1'?paper:[.024,.106,.149,1]);
  }
  function overlay(t){
    var l=M3.UILayout.get(),p=t.panel,ui=M3.Renderer.terminal,compact=t.compact,lines=t.displayLines||t.lines,i,y,skip,next,target=t.focusTarget,
      highlights=t.highlights||t.targets,shade=shadeRects(highlights,l),active=M3.Renderer._activeView,step=('0'+t.index).slice(-2)+' / '+t.total;
    M3.Renderer._activeView=null;
    try{
      for(i=0;i<shade.length;i+=1)rect(shade[i],[.004,.012,.023,.66]);
      for(i=0;t.id!=='route'&&i<highlights.length;i+=1){
        frame({x:highlights[i].x-2,y:highlights[i].y-2,w:highlights[i].w+4,h:highlights[i].h+4},[cyan[0],cyan[1],cyan[2],.6]);
        corners(highlights[i],highlights[i]===target||t.id==='tower-inspect'?amber:[cyan[0],cyan[1],cyan[2],.65]);
      }
      if(target&&t.id!=='route'){
        // The leader stays outside both panel and target; the tap pulse is local.
        if(target.y>p.y+p.h+8&&target.y-(p.y+p.h)<100){var tx=target.x+target.w*.5;line(tx,p.y+p.h+2,tx,target.y-6,1,cyan);}
        else if(p.y>target.y+target.h+8&&p.y-target.y-target.h<100){var bx=target.x+target.w*.5;line(bx,target.y+target.h+5,bx,p.y-4,1,cyan);}
        pointer(target);
      }
      rect({x:p.x+3,y:p.y+5,w:p.w,h:p.h},[0,0,0,.32]);ui.panel(p);
      if(!compact){
        var tag={x:p.x+24,y:p.y-6,w:142,h:30};
        ui.tag(tag);ui.image('ui-wave-radar-v1',tag.x+8,tag.y+5,20,20,1);
        var tagText={x:tag.x+28,y:tag.y-2,w:100,h:30};
        label('战术引导',tagText,15,paper,{padding:0});
        label('战术引导',{x:tagText.x+.45,y:tagText.y,w:tagText.w,h:tagText.h},15,paper,{padding:0});
      }
      var badge={x:p.x+p.w-106,y:p.y+6,w:96,h:30};
      stepPlate(badge);label(step,{x:badge.x+17,y:badge.y-2,w:badge.w-24,h:badge.h},15,paper,{padding:0});
      var inset=compact?22:28;
      label(t.title,{x:p.x+inset,y:p.y+(compact?9:32),w:p.w-inset-(compact?114:inset),h:compact?22:28},compact?18:22,paper,{align:'left',padding:0});
      y=p.y+(compact?36:68);
      for(i=0;i<lines.length;i+=1)label(lines[i],{x:p.x+inset,y:y+i*(compact?17:20),w:p.w-inset*2,h:compact?17:20},compact?14:16,paper,{align:'left',padding:0});
      skip={x:t.skipRect.x,y:t.skipRect.y+(compact?8:2),w:t.skipRect.w,h:compact?32:44};
      ui.button(skip,'跳过引导',false,true,compact?14:16);
      if(t.nextRect){next={x:t.nextRect.x,y:t.nextRect.y+(compact?8:2),w:t.nextRect.w,h:compact?32:44};ui.button(next,t.button,true,true,compact?14:16);}
      else{
        var hintRect={x:t.skipRect.x+t.skipRect.w+10,y:skip.y-1,w:p.x+p.w-inset-(t.skipRect.x+t.skipRect.w+10),h:skip.h},hint=t.hint||'点击高亮区域继续',hintSize=compact?15:17,hintColor=cyan;
        label(hint,hintRect,hintSize,hintColor,{align:'right',padding:0,spacing:.45});
      }
    }finally{M3.Renderer._activeView=active;}
  }
  M3.TutorialOverlay={draw:overlay,shadeRects:shadeRects};
  M3.Renderer.draw=function(context,view){draw(context,view);if(view.tutorial)overlay(view.tutorial);};
})();
