(function(){
  var M3=window.M3;
  function width(text,size){return M3.BitmapFont.measureLabel(text,size,.35);}
  function wrap(text,size,maxWidth){
    var lines=[],line='',i,ch;
    for(i=0;i<text.length;i+=1){ch=text.charAt(i);if(line&&width(line+ch,size)>maxWidth){lines.push(line);line='';}line+=ch;}
    if(line)lines.push(line);
    if(lines.length>1&&/^[\u3400-\u9fff，。！？、]+$/.test(text)){
      var count=Math.ceil(text.length/lines.length);
      if(width(text.slice(0,count),size)<=maxWidth){lines=[];for(i=0;i<text.length;i+=count)lines.push(text.slice(i,i+count));}
    }
    return lines;
  }
  function content(l,r){
    var s=l.mapScale,inset=6*s,numberW=Math.ceil(width('第30关',18))+1,
      y=r.y+inset+l.mapPreviewH+4,nameX=r.x+inset+numberW+14;
    return {
      preview:{x:r.x+inset,y:r.y+inset,w:r.w-inset*2,h:l.mapPreviewH},
      number:{x:r.x+inset,y:y,w:numberW,h:l.mapNameH},
      name:{x:nameX,y:y,w:r.x+r.w-inset-nameX,h:l.mapNameH},
      divider:{x:r.x+inset+numberW+3,y:y+l.mapNameH/2,w:8},
      hint:{x:r.x+inset,y:y+l.mapNameH,w:r.w-inset*2,h:16},
      action:{x:r.x+inset,y:r.y+r.h-41,w:r.w-inset*2,h:34}
    };
  }
  function theme(level){
    var map=level.map||{},p=map.presentation||{},explicit=p.previewTheme||map.theme||'',name=level.uiName||level.name||'';
    if(/waste|desert|ruin|荒|废|峡谷/i.test(explicit))return 'wasteland';
    if(/factory|industrial|steel|工厂|工业/i.test(explicit))return 'factory';
    if(/forest|grass|森林/i.test(explicit))return 'forest';
    if(/city|urban|都市|城市/i.test(explicit))return 'city';
    if(/废|荒|峡谷|边境/.test(name))return 'wasteland';
    if(/钢铁|量子|工厂|工业|脉冲|哨站/.test(name))return 'factory';
    return 'city';
  }
  // Per-hero visual centers account for asymmetric shields, poses and transparent margins.
  // UV-only bust crops: source portraits and gameplay configuration stay untouched.
  function heroPortraitRegion(hero,sourceAspect,destAspect){
    var crops={'hero-1':[.225,.02,.755,.43],'hero-2':[.235,.025,.745,.445],'hero-3':[.31,.04,.82,.45]},
      c=(crops[hero.unitId]||crops[hero.portraitAsset]||[.15,.02,.85,.60]).slice(),w=c[2]-c[0],h=c[3]-c[1],target=destAspect/sourceAspect,d;
    if(w/h>target){d=(w-h*target)/2;c[0]+=d;c[2]-=d;}else c[3]=c[1]+w/target;
    return c;
  }
  M3.MapUI={content:content,wrap:wrap,theme:theme,heroPortraitRegion:heroPortraitRegion};
})();
