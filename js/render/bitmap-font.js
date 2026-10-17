(function () {
  var M3=window.M3,data=null,index={},fallbackIndex=0,style={},hdData=null,hdIndex={};
  function configure(manifest){var i,k,chars,source=manifest&&manifest.presentation&&manifest.presentation.typography||{};data=M3.BitmapFontData?JSON.parse(JSON.stringify(M3.BitmapFontData)):null;style=JSON.parse(JSON.stringify(source));index={};hdData=M3.UIFontHDData||null;hdIndex={};if(hdData)for(i=0;i<hdData.characters.length;i+=1)hdIndex[hdData.characters.charAt(i)]=i;if(!data)return;style.styles=style.styles||{};if(!style.styles.compactButton&&style.styles.button)style.styles.compactButton=JSON.parse(JSON.stringify(style.styles.button));style.styles.cardBody=style.styles.cardBody||{};if(style.styles.cardBody.minSize===undefined)style.styles.cardBody.minSize=10;if(style.styles.cardBody.letterSpacing===undefined)style.styles.cardBody.letterSpacing=.3;['resultTitle','resultBody','resultLabel','resultButton'].forEach(function(name){k=style.styles[name]=style.styles[name]||{};if(k.outlineWidth===undefined)k.outlineWidth=0;if(k.shadowColor===undefined)k.shadowColor=[0,0,0,0];if(k.shadowOffsetX===undefined)k.shadowOffsetX=0;if(k.shadowOffsetY===undefined)k.shadowOffsetY=0;});if(style.effectsEnabled!==true){style.outlineWidth=0;style.shadowColor=[0,0,0,0];style.shadowOffsetX=0;style.shadowOffsetY=0;['title','body','label','button','compactButton','cardBody','resultTitle','resultBody','resultLabel','resultButton'].forEach(function(name){k=style.styles[name]=style.styles[name]||{};k.outlineWidth=0;k.shadowColor=[0,0,0,0];k.shadowOffsetX=0;k.shadowOffsetY=0;});}data.texturePrefix=(style.defaultFont||'font-cn-main')+'-';chars=data.characters;for(i=0;i<chars.length;i+=1)index[chars.charAt(i)]=i;fallbackIndex=index[data.fallback]===undefined?0:index[data.fallback];}
  function rgba(value,fallback){return Array.isArray(value)?value:fallback;}
  function measure(value,size,letterSpacing){return String(value||'').length*(size*.86+(letterSpacing||0));}
  function snap(value){var dpr=M3.Layout&&M3.Layout.dpr||1;return Math.round(value*dpr)/dpr;}
  function physicalPixels(value){var dpr=Math.max(1,M3.Layout&&M3.Layout.dpr||1),pixels=Math.max(0,Number(value||0));return Math.min(1,pixels)/dpr;}
  function glyphHD(renderer,ch,x,y,size,color,alpha,dx,dy){
    var n=hdIndex[ch],col=n%hdData.columns,row=Math.floor(n/hdData.columns),pad=hdData.padding,
      u0=(col*hdData.cell+pad)/hdData.width,u1=((col+1)*hdData.cell-pad)/hdData.width,
      v0=1-(row*hdData.cell+pad)/hdData.height,v1=1-((row+1)*hdData.cell-pad)/hdData.height;
    return renderer.imageRegion(hdData.key,snap(x+(dx||0)),snap(y+(dy||0)),snap(size),snap(size),u0,v0,u1,v1,color,alpha,false);
  }
  function glyph(renderer,ch,x,y,size,color,alpha,dx,dy){var n=index[ch];if(n===undefined)n=fallbackIndex;if(hdData&&hdIndex[ch]!==undefined&&M3.TextureAssets.get(hdData.key))return glyphHD(renderer,ch,x,y,size,color,alpha,dx,dy);var page=Math.floor(n/data.pageSize),local=n%data.pageSize,col=local%data.columns,row=Math.floor(local/data.columns),rows=Math.ceil(Math.min(data.pageSize,data.characters.length-page*data.pageSize)/data.columns),pad=data.padding||0,u0=(col*data.cell+pad)/(data.columns*data.cell),v0=(row*data.cell+pad)/(rows*data.cell),u1=((col+1)*data.cell-pad)/(data.columns*data.cell),v1=((row+1)*data.cell-pad)/(rows*data.cell);var stroke=data.characters.charAt(n)==='薇'?Math.max(.45,size*.035):0,gx=snap(x+(dx||0)),gy=snap(y+(dy||0)),drawSize=snap(size),key=data.texturePrefix+page;if(stroke){/* Match the added thin glyph to the weight of the original atlas. */renderer.imageRegion(key,gx-stroke,gy,drawSize,drawSize,u0,v0,u1,v1,color,alpha,true);renderer.imageRegion(key,gx+stroke,gy,drawSize,drawSize,u0,v0,u1,v1,color,alpha,true);renderer.imageRegion(key,gx,gy-stroke,drawSize,drawSize,u0,v0,u1,v1,color,alpha,true);renderer.imageRegion(key,gx,gy+stroke,drawSize,drawSize,u0,v0,u1,v1,color,alpha,true);}return renderer.imageRegion(key,gx,gy,drawSize,drawSize,u0,v0,u1,v1,color,alpha,true);}
  function drawText(renderer,value,x,y,legacySize,color,maxWidth,align,kind){
    var text=String(value||''),textKind=kind||'body',preset=style.styles&&style.styles[textKind]||{},
      isResultTitle=textKind==='resultTitle',isResultButton=textKind==='resultButton',
      isResultLabel=textKind==='resultLabel',isResultBody=textKind==='resultBody',isCardBody=textKind==='cardBody',
      sizeFloor=(textKind==='title'||isResultTitle)?19:((textKind==='button'||textKind==='compactButton'||isResultButton)?15:((textKind==='label'||isResultLabel)?14:(isCardBody?10:13.5))),
      defaultSpacing=isResultTitle?1.4:isResultButton?1.1:isResultLabel?1.0:isResultBody?.9:isCardBody?.3:textKind==='title'?.8:textKind==='button'?.75:textKind==='compactButton'?0:textKind==='label'?.6:.4,
      defaultMinSize=isCardBody?sizeFloor:(style.minReadableSize||sizeFloor),
      minSize=Math.max(sizeFloor,Number(preset.minSize||defaultMinSize)),
      size=Math.max(minSize,preset.size||legacySize*((textKind==='title'||isResultTitle)?12:16)),
      spacing=preset.letterSpacing===undefined?defaultSpacing:Number(preset.letterSpacing),
      width,scale=1,maxChars,i,n,page,ox,
      outline=physicalPixels(preset.outlineWidth===undefined?(style.outlineWidth||0):preset.outlineWidth),
      outlineColor=rgba(preset.outlineColor||style.outlineColor,[0,0,0,.72]),
      shadowColor=rgba(preset.shadowColor||style.shadowColor,[0,0,0,0]),
      shadowX=physicalPixels(preset.shadowOffsetX===undefined?(style.shadowOffsetX||0):preset.shadowOffsetX),
      shadowY=physicalPixels(preset.shadowOffsetY===undefined?(style.shadowOffsetY||0):preset.shadowOffsetY),
      shadowAlpha,finalColor=rgba(preset.color,color);
    spacing=Math.max(spacing,defaultSpacing);width=measure(text,size,spacing);
    if(!data||!renderer.imageRegion||!M3.TextureAssets)return false;
    if(maxWidth&&width>maxWidth){scale=maxWidth/width;if(size*scale>=minSize){size*=scale;spacing*=scale;}else{size=minSize;maxChars=Math.max(1,Math.floor((maxWidth+spacing)/(size*.86+spacing)));if(text.length>maxChars)text=maxChars===1?'…':text.slice(0,maxChars-1)+'…';}width=measure(text,size,spacing);}
    for(i=0;i<text.length;i+=1){if(hdData&&hdIndex[text.charAt(i)]!==undefined&&M3.TextureAssets.get(hdData.key))continue;n=index[text.charAt(i)];if(n===undefined)n=fallbackIndex;page=Math.floor(n/data.pageSize);if(!M3.TextureAssets.get(data.texturePrefix+page))return false;}
    ox=snap(x);if(align==='center')ox=snap(x-width/2);else if(align==='right')ox=snap(x-width);
    shadowAlpha=Math.min(.16,shadowColor[3]===undefined?1:shadowColor[3]);
    for(i=0;i<text.length;i+=1){n=index[text.charAt(i)];if(n===undefined)n=fallbackIndex;if(shadowAlpha>0&&(shadowX!==0||shadowY!==0))glyph(renderer,text.charAt(i),ox,y,size,shadowColor,shadowAlpha,shadowX,shadowY);if(outline>0){glyph(renderer,text.charAt(i),ox,y,size,outlineColor,outlineColor[3]===undefined?1:outlineColor[3],-outline,0);glyph(renderer,text.charAt(i),ox,y,size,outlineColor,outlineColor[3]===undefined?1:outlineColor[3],outline,0);glyph(renderer,text.charAt(i),ox,y,size,outlineColor,outlineColor[3]===undefined?1:outlineColor[3],0,-outline);glyph(renderer,text.charAt(i),ox,y,size,outlineColor,outlineColor[3]===undefined?1:outlineColor[3],0,outline);}glyph(renderer,text.charAt(i),ox,y,size,finalColor,finalColor[3]===undefined?1:finalColor[3],0,0);ox=snap(ox+size*.86+spacing);}
    return true;
  }
  function labelWidth(value,size,spacing){var s=String(value),n=0,i;spacing=spacing===undefined?.35:spacing;for(i=0;i<s.length;i+=1)n+=(hdData&&hdData.advances&&hdData.advances[s.charAt(i)]!==undefined?hdData.advances[s.charAt(i)]:1)*size+(i?spacing:0);return n;}
  // UI labels use the font's natural em/advance metrics, rather than a fixed square pitch.
  function drawLabel(renderer,value,r,size,color,options){
    var opts=options||{},label=String(value),spacing=opts.spacing===undefined?.35:opts.spacing,
      padding=opts.padding===undefined?2:opts.padding,available=Math.max(1,r.w-padding*2),width,i,ch,pen,baseline,quad,
      em=hdData&&hdData.emSize||46,ascent=hdData&&hdData.ascent||40,descent=hdData&&hdData.descent||7;
    if(!hdData||!hdData.advances||!M3.TextureAssets||!M3.TextureAssets.get(hdData.key))return false;
    function advance(c){return(hdData.advances[c]===undefined?1:hdData.advances[c])*size;}
    function measureLabel(s){var total=0,j;for(j=0;j<s.length;j+=1)total+=advance(s.charAt(j))+(j?spacing:0);return total;}
    width=measureLabel(label);
    if(width>available){while(label.length&&measureLabel(label+'…')>available)label=label.slice(0,-1);label=label+'…';width=measureLabel(label);}
    for(i=0;i<label.length;i+=1)if(hdIndex[label.charAt(i)]===undefined)return false;
    pen=r.x+(r.w-width)*.5;
    if(opts.align==='left')pen=r.x+padding;else if(opts.align==='right')pen=r.x+r.w-padding-width;
    baseline=r.y+r.h*.5+(ascent-descent)*size/(em*2);
    quad=hdData.glyphPixels*size/em;
    for(i=0;i<label.length;i+=1){
      ch=label.charAt(i);
      glyphHD(renderer,ch,pen,hdData.inkCenters?r.y+r.h*.5-hdData.inkCenters[hdIndex[ch]]*size/em:baseline-ascent*size/em,quad,color,color[3]===undefined?1:color[3]);
      pen+=advance(ch)+spacing;
    }
    return true;
  }
  M3.BitmapFont={configure:configure,drawText:drawText,drawLabel:drawLabel,measureLabel:labelWidth,drawNumber:function(renderer,value,x,y,size,color){return drawText(renderer,String(Math.max(0,Math.floor(value))),x,y,size/16,color,null,'left','label');},measureText:measure,hasGlyph:function(ch){return index[ch]!==undefined||hdIndex[ch]!==undefined;}};
})();
