(function () {
  var M3=window.M3,gl,program,buffer,posLoc,colorLoc,resLoc,imageProgram,imageBuffer,imagePosLoc,imageUvLoc,imageResLoc,imageAlphaLoc,imageTintLoc,imageSharpLoc,imageUvBoundsLoc,imageClipLoc,textures={};
  function shader(type,source){var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function init(context){if(program)return;gl=context;program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a;uniform vec2 r;void main(){vec2 z=a/r;vec2 c=z*2.0-1.0;gl_Position=vec4(c.x,-c.y,0,1);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform vec4 c;void main(){gl_FragColor=c;}'));gl.linkProgram(program);buffer=gl.createBuffer();posLoc=gl.getAttribLocation(program,'a');resLoc=gl.getUniformLocation(program,'r');colorLoc=gl.getUniformLocation(program,'c');imageProgram=gl.createProgram();gl.attachShader(imageProgram,shader(gl.VERTEX_SHADER,'attribute vec2 a;attribute vec2 u;uniform vec2 r;varying vec2 v;void main(){vec2 z=a/r;vec2 c=z*2.0-1.0;gl_Position=vec4(c.x,-c.y,0,1);v=u;}'));gl.attachShader(imageProgram,shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D s;uniform float o;uniform float q;uniform float k;uniform vec4 m;uniform vec4 t;varying vec2 v;void main(){vec4 c=texture2D(s,v);vec2 p=(v-m.xy)/(m.zw-m.xy);float z=step(k,p.x+p.y)*step(k,(1.0-p.x)+p.y)*step(k,p.x+(1.0-p.y))*step(k,(1.0-p.x)+(1.0-p.y));float a=mix(c.a,smoothstep(.38,.62,c.a),q)*z;gl_FragColor=vec4(c.rgb*t.rgb,a*o*t.a);}'));gl.linkProgram(imageProgram);imageBuffer=gl.createBuffer();imagePosLoc=gl.getAttribLocation(imageProgram,'a');imageUvLoc=gl.getAttribLocation(imageProgram,'u');imageResLoc=gl.getUniformLocation(imageProgram,'r');imageAlphaLoc=gl.getUniformLocation(imageProgram,'o');imageTintLoc=gl.getUniformLocation(imageProgram,'t');imageSharpLoc=gl.getUniformLocation(imageProgram,'q');imageUvBoundsLoc=gl.getUniformLocation(imageProgram,'m');imageClipLoc=gl.getUniformLocation(imageProgram,'k');gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}
  function rect(x,y,w,h,c){var v=new Float32Array([x,y,x+w,y,x,y+h,x,y+h,x+w,y,x+w,y+h]);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,v,gl.STREAM_DRAW);gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);gl.uniform2f(resLoc,M3.Layout.w,M3.Layout.h);gl.uniform4f(colorLoc,c[0],c[1],c[2],c.length>3?c[3]:1);gl.drawArrays(gl.TRIANGLES,0,6);}
  function solid(points,c){var v=new Float32Array(points);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,v,gl.STREAM_DRAW);gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);gl.uniform2f(resLoc,M3.Layout.w,M3.Layout.h);gl.uniform4f(colorLoc,c[0],c[1],c[2],c.length>3?c[3]:1);gl.drawArrays(gl.TRIANGLES,0,v.length/2);}
  function diamond(cx,cy,w,h,c){solid([cx,cy-h*.5,cx+w*.5,cy,cx,cy+h*.5,cx,cy-h*.5,cx,cy+h*.5,cx-w*.5,cy],c);}
  function line(x1,y1,x2,y2,width,c){var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy)||1,px=-dy/len*width*.5,py=dx/len*width*.5;solid([x1+px,y1+py,x2+px,y2+py,x1-px,y1-py,x1-px,y1-py,x2+px,y2+py,x2-px,y2-py],c);}
  function imageRegion(key,x,y,w,h,u0,v0,u1,v1,tint,alpha,sharpen,clip,rotation){var image,cached,texture,v,textureKey;if(!key||!M3.TextureAssets||(image=M3.TextureAssets.get(key))===null)return false;textureKey=M3.TextureAssets.cacheKey?M3.TextureAssets.cacheKey(key):key;cached=textures[textureKey];if(!cached||cached.image!==image){if(cached&&cached.texture&&gl.deleteTexture)gl.deleteTexture(cached.texture);texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,key==='battle-scene-surround'||/monster.*atlas/.test(key)?gl.NEAREST:gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);cached=textures[textureKey]={texture:texture,image:image};}texture=cached.texture;tint=tint||[1,1,1,1];v=new Float32Array([x,y,u0,v0,x+w,y,u1,v0,x,y+h,u0,v1,x,y+h,u0,v1,x+w,y,u1,v0,x+w,y+h,u1,v1]);if(rotation){var ci,px,py,cs=Math.cos(rotation),sn=Math.sin(rotation),cx=x+w*.5,cy=y+h*.5;for(ci=0;ci<v.length;ci+=4){px=v[ci]-cx;py=v[ci+1]-cy;v[ci]=cx+px*cs-py*sn;v[ci+1]=cy+px*sn+py*cs;}}gl.useProgram(imageProgram);gl.bindBuffer(gl.ARRAY_BUFFER,imageBuffer);gl.bufferData(gl.ARRAY_BUFFER,v,gl.STREAM_DRAW);gl.enableVertexAttribArray(imagePosLoc);gl.vertexAttribPointer(imagePosLoc,2,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(imageUvLoc);gl.vertexAttribPointer(imageUvLoc,2,gl.FLOAT,false,16,8);gl.uniform2f(imageResLoc,M3.Layout.w,M3.Layout.h);gl.uniform1f(imageAlphaLoc,alpha===undefined?1:alpha);gl.uniform1f(imageSharpLoc,sharpen?1:0);gl.uniform1f(imageClipLoc,clip||0);gl.uniform4f(imageUvBoundsLoc,u0,v0,u1,v1);gl.uniform4f(imageTintLoc,tint[0],tint[1],tint[2],tint.length>3?tint[3]:1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.drawArrays(gl.TRIANGLES,0,6);return true;} function imageAsset(key,x,y,w,h,alpha){var meta=M3.TextureAssets&&M3.TextureAssets.meta(key),region=meta&&meta.render&&meta.render.region,u0=region&&region[0]||0,v0=region&&region[1]||0,u1=region&&region[2]||1,v1=region&&region[3]||1;return imageRegion(key,x,y,w,h,u0,1-v0,u1,1-v1,[1,1,1,1],alpha,false,0);} function imageAssetContain(key,x,y,w,h,alpha){var image=M3.TextureAssets&&M3.TextureAssets.get(key),meta=M3.TextureAssets&&M3.TextureAssets.meta(key),region=meta&&meta.render&&meta.render.region||[0,0,1,1],sourceW=image&&(image.naturalWidth||image.width),sourceH=image&&(image.naturalHeight||image.height),aspect,boxAspect,drawW,drawH;if(!image||!sourceW||!sourceH)return false;sourceW*=Math.max(.001,region[2]-region[0]);sourceH*=Math.max(.001,region[3]-region[1]);aspect=sourceW/sourceH;boxAspect=w/h;if(aspect>boxAspect){drawW=w;drawH=w/aspect;}else{drawH=h;drawW=h*aspect;}return imageAsset(key,x+(w-drawW)*.5,y+(h-drawH)*.5,drawW,drawH,alpha);} function imageAssetChamfer(key,x,y,w,h,cut,alpha){var meta=M3.TextureAssets&&M3.TextureAssets.meta(key),region=meta&&meta.render&&meta.render.region,u0=region&&region[0]||0,v0=region&&region[1]||0,u1=region&&region[2]||1,v1=region&&region[3]||1,clip=Math.max(0,Math.min(.45,(Number(cut)||0)/Math.max(1,Math.min(w,h))));return imageRegion(key,x,y,w,h,u0,1-v0,u1,1-v1,[1,1,1,1],alpha,false,clip);}
  function isTowerFrame(r){var active=M3.Renderer&&M3.Renderer._activeView,l,cell,i,t,rects,j,target;if(!active||active.state!=='BATTLE'||!active.combat||!active.combat.towers)return false;l=M3.UILayout.get();cell=l.cell;for(i=0;i<active.combat.towers.length;i+=1){t=active.combat.towers[i];rects=[{x:l.board.x+(t.x+.16)*cell,y:l.board.y+(t.y+.12)*cell,w:cell*.68,h:cell*.76},{x:l.board.x+(t.x+.08)*cell,y:l.board.y+(t.y+.04)*cell,w:cell*.84,h:cell*.90}];for(j=0;j<rects.length;j+=1){target=rects[j];if(Math.abs(r.x-target.x)<.02&&Math.abs(r.y-target.y)<.02&&Math.abs(r.w-target.w)<.02&&Math.abs(r.h-target.h)<.02)return true;}}return false;}
  function frame(r,c,b){if(isTowerFrame(r))return;b=b||2;rect(r.x,r.y,r.w,b,c);rect(r.x,r.y+r.h-b,r.w,b,c);rect(r.x,r.y,b,r.h,c);rect(r.x+r.w-b,r.y,b,r.h,c);}
  var drawRect=rect,drawImageAsset=imageAsset;
  function isFullScene(x,y,w,h){var top=M3.Layout.safeTop||0;return Math.abs(x)<.05&&Math.abs(y-top)<.05&&Math.abs(w-M3.Layout.w)<.05&&h>=M3.Layout.h-top-1;}
  rect=function(x,y,w,h,c){var active=M3.Renderer&&M3.Renderer._activeView;if(isFullScene(x,y,w,h)&&c&&c.length>3&&c[3]>.10&&c[3]<1&&(!active||active.state!=='BATTLE'))c=[c[0],c[1],c[2],.10];drawRect(x,y,w,h,c);};
  imageAsset=function(key,x,y,w,h,alpha){if(isFullScene(x,y,w,h))alpha=Math.max(.92,alpha===undefined?1:alpha);return drawImageAsset(key,x,y,w,h,alpha);};
  function lockIcon(r,c){var size=Math.min(r.w,r.h)*.34,b=Math.max(2,size*.12),x=r.x+(r.w-size)*.5,y=r.y+r.h*.24;rect(x,y,size,b,c);rect(x,y,b,size*.46,c);rect(x+size-b,y,b,size*.46,c);rect(x-size*.12,y+size*.36,size*1.24,size*.72,c);rect(x+size*.43,y+size*.56,size*.14,size*.25,[.06,.08,.1,.9]);}
  function lockImage(r,c){var size=Math.min(r.w,r.h)*.42,cx=r.x+r.w*.5,cy=r.y+r.h*.5,icon={x:cx-size*.5,y:cy-size*.5,w:size,h:size};if(!imageAsset('ui-level-lock',icon.x,icon.y,icon.w,icon.h,1))lockIcon(r,c);}
  function tone(v,key,fallback){var colors=v.presentation&&v.presentation.colors;return colors&&colors[key]||fallback;}
  function copy(v,key,fallback){return v.presentation&&v.presentation.copy&&v.presentation.copy[key]||fallback;}
  function chamfer(r,c,cut){var x=r.x,y=r.y,w=r.w,h=r.h,k=Math.max(2,Math.min(cut||8,Math.min(w,h)*.18)),cx=x+w*.5,cy=y+h*.5,p=[[x+k,y],[x+w-k,y],[x+w,y+k],[x+w,y+h-k],[x+w-k,y+h],[x+k,y+h],[x,y+h-k],[x,y+k]],a=[],i,n;for(i=0;i<8;i+=1){n=(i+1)%8;a.push(cx,cy,p[i][0],p[i][1],p[n][0],p[n][1]);}solid(a,c);}
  function chamferOutline(r,c,b,cut){var k=Math.max(2,Math.min(cut||8,Math.min(r.w,r.h)*.18)),p=[[r.x+k,r.y],[r.x+r.w-k,r.y],[r.x+r.w,r.y+k],[r.x+r.w,r.y+r.h-k],[r.x+r.w-k,r.y+r.h],[r.x+k,r.y+r.h],[r.x,r.y+r.h-k],[r.x,r.y+k]],i,n;for(i=0;i<8;i+=1){n=(i+1)%8;line(p[i][0],p[i][1],p[n][0],p[n][1],b||2,c);}}
  function cutCorners(r,c,cut){var x=r.x,y=r.y,w=r.w,h=r.h,k=Math.max(2,Math.min(cut||8,Math.min(w,h)*.18));solid([x,y,x+k,y,x,y+k,x+w,y,x+w,y+k,x+w-k,y,x,y+h,x,y+h-k,x+k,y+h,x+w,y+h,x+w-k,y+h,x+w,y+h-k],c);}
  function uiPalette(){return{navy:[.025,.055,.075,.96],navy2:[.04,.09,.115,.96],panelVariants:[[.025,.080,.095,.96],[.040,.065,.110,.96],[.060,.055,.105,.96],[.030,.085,.075,.96]],borderVariants:[[.22,.72,.76,1],[.34,.58,.86,1],[.62,.48,.82,1],[.32,.70,.54,1],[.82,.62,.28,1],[.78,.42,.52,1]],buttonGreen:[.035,.20,.15,.98],buttonBlue:[.035,.13,.22,.98],buttonAmber:[.20,.15,.055,.98],buttonViolet:[.13,.085,.20,.98],resource:[.72,.82,.86,1],primary:[.22,.72,.76,1],cyan:[.22,.72,.76,1],violet:[.66,.50,.86,1],accent:[.55,.72,.80,1],gold:[.55,.72,.80,1],ink:[.012,.028,.042,1],paper:[.94,.97,.98,1],frame:[.78,.87,.90,1],muted:[.50,.60,.65,1],disabled:[.18,.22,.24,1]};}
  function sceneBackdrop(l,v,key,opacity,withoutOverlay){var p=uiPalette(v),asset=key||(v.presentation&&v.presentation.sceneAssets&&v.presentation.sceneAssets.worldMapBackground);opacity=Math.max(.92,opacity===undefined?.92:opacity);if(!imageAsset(asset,0,l.top,l.w,l.usable,opacity))rect(0,l.top,l.w,l.usable,p.ink);if(withoutOverlay)return;rect(0,l.top,l.w,l.usable,[.005,.025,.045,.10]);rect(0,l.top+l.usable*.88,l.w,l.usable*.12,[.005,.025,.045,.08]);}
  function ornatePanel(r,v,accent,selected,fill){var p=uiPalette(),cut=Math.min(11,Math.max(5,r.h*.08)),edge=accent||p.accent;chamfer({x:r.x+4,y:r.y+5,w:r.w,h:r.h},[0,0,0,.34],cut);chamfer(r,fill||p.navy,cut);chamferOutline(r,selected?p.primary:[edge[0],edge[1],edge[2],.86],selected?3:2,cut);chamferOutline({x:r.x+4,y:r.y+4,w:r.w-8,h:r.h-8},[.72,.82,.86,.22],1,Math.max(3,cut-3));}
  // Layered metal frames for settlement and tactical supply surfaces.
  function buttonBackground(color){return[color[0],color[1],color[2],.5];}
  function refinedPanel(r,accent,fill,kind){
    var button=kind==='button',panel=kind==='panel',cut=Math.min(panel?16:12,Math.max(button?6:8,Math.min(r.w,r.h)*.075)),inset=panel?5:3,
      inner={x:r.x+inset,y:r.y+inset,w:r.w-inset*2,h:r.h-inset*2},
      edge=[accent[0],accent[1],accent[2],button?.66:.48],
      light=[Math.min(1,accent[0]+.25),Math.min(1,accent[1]+.18),Math.min(1,accent[2]+.15),.66],
      span=Math.min(panel?22:14,r.w*.12,r.h*.17),x=r.x,y=r.y,w=r.w,h=r.h;
    chamfer({x:x+2,y:y+4,w:w,h:h},[0,0,0,button?.13:.26],cut);
    chamfer(r,button?buttonBackground(fill):fill,cut);
    // A fine outer keyline and recessed inner line keep large panels crisp without a neon double rim.
    chamferOutline(r,[accent[0],accent[1],accent[2],.10],3,cut);
    chamferOutline(r,edge,1.25,cut);
    chamferOutline(inner,[.70,.86,.90,.13],.7,cut-inset*.55);
    // Restrained corner facets add a metallic finish while leaving the long edges quiet.
    line(x+cut+span,y,x+cut,y,1.35,light);
    line(x+cut,y,x,y+cut,1.35,light);
    line(x,y+cut,x,y+cut+span,1.25,[accent[0],accent[1],accent[2],.62]);
    line(x+w-cut-span,y,x+w-cut,y,1.35,light);
    line(x+w-cut,y,x+w,y+cut,1.35,light);
    line(x+w,y+cut,x+w,y+cut+span,1.25,[accent[0],accent[1],accent[2],.62]);
    line(x,y+h-cut-span,x,y+h-cut,1.25,[accent[0],accent[1],accent[2],.48]);
    line(x,y+h-cut,x+cut,y+h,1.25,[accent[0],accent[1],accent[2],.48]);
    line(x+cut,y+h,x+cut+span,y+h,1.25,[accent[0],accent[1],accent[2],.48]);
    line(x+w,y+h-cut-span,x+w,y+h-cut,1.25,[accent[0],accent[1],accent[2],.48]);
    line(x+w,y+h-cut,x+w-cut,y+h,1.25,[accent[0],accent[1],accent[2],.48]);
    line(x+w-cut,y+h,x+w-cut-span,y+h,1.25,[accent[0],accent[1],accent[2],.48]);
    if(panel){
      line(x+w*.40,y+2,x+w*.60,y+2,1,[accent[0],accent[1],accent[2],.24]);
      line(x+w*.45,y+h-2,x+w*.55,y+h-2,1,[accent[0],accent[1],accent[2],.20]);
    }
    if(button)line(x+cut+5,y+3,x+w-cut-5,y+3,.8,[.75,.91,.95,.16]);
  }
  function titlePlate(l,v,label,sub){var p=uiPalette(),r={x:l.w*.14,y:l.top+l.usable*.008,w:l.w*.72,h:l.usable*.058};ornatePanel(r,v,p.frame,true);diamond(l.w*.5,r.y,r.h*.20,r.h*.20,p.primary);text(label,l.w*.5,r.y+r.h*.14,1.55,p.paper,r.w*.86,'center','title');if(sub)text(sub,l.w*.5,r.y+r.h*.64,.52,p.accent,r.w*.88,'center');}
  function uiButton(r,v,label,kind,enabled,compact){var p=uiPalette(),fontScale=Math.max(.78,Math.min(1.08,r.h/52)),fontPx=Math.max(15,fontScale*16),accent=kind==='back'?p.muted:(kind==='green'?[.28,.78,.58,1]:kind==='blue'?[.28,.66,.88,1]:kind==='amber'?[.88,.68,.28,1]:kind==='violet'?[.66,.50,.86,1]:kind==='gold'?p.primary:p.accent),fill=enabled===false?p.disabled:(kind==='green'?p.buttonGreen:kind==='blue'?p.buttonBlue:kind==='amber'?p.buttonAmber:kind==='violet'?p.buttonViolet:kind==='gold'?[.035,.26,.29,.98]:kind==='back'?[.035,.10,.13,.98]:p.navy2);chamfer({x:r.x+3,y:r.y+4,w:r.w,h:r.h},[0,0,0,.175],8);chamfer(r,buttonBackground(fill),8);chamferOutline(r,enabled===false?p.muted:accent,2,8);text(label,r.x+r.w*.5,r.y+(r.h-fontPx)*.5,fontScale,enabled===false?[.64,.67,.68,1]:p.paper,r.w*.88,'center',(compact||String(label).length>9)?'compactButton':'button');}
  function selectionMark(r,v){var p=uiPalette(),cx=r.x+r.w-18,cy=r.y+18;diamond(cx,cy,28,28,p.primary);diamond(cx,cy,20,20,p.navy);line(cx-6,cy,cx-1,cy+5,3,p.paper);line(cx-1,cy+5,cx+8,cy-7,3,p.paper);}
  function edgeJewels(r,v){var p=uiPalette(),s=Math.min(11,r.h*.08);diamond(r.x+r.w*.5,r.y,s,s,p.accent);diamond(r.x+r.w*.5,r.y+r.h,s,s,p.primary);}
  function levelBriefIcon(cx,cy,size,p){var accent=p.cyan,shade=[.018,.050,.070,1],paper=[.88,.96,.96,1],w=size*.62,h=size*.72,x=cx-w*.5,y=cy-h*.5;diamond(cx,cy,size*.96,size*.96,[accent[0],accent[1],accent[2],.22]);chamfer({x:x,y:y,w:w,h:h},shade,4);chamferOutline({x:x,y:y,w:w,h:h},accent,1.5,4);rect(x+w*.16,y+h*.20,w*.68,1.6,paper);rect(x+w*.16,y+h*.38,w*.55,1.6,paper);rect(x+w*.16,y+h*.56,w*.46,1.6,paper);diamond(x+w*.83,y+h*.18,size*.13,size*.13,p.gold);line(cx-size*.30,cy+size*.34,cx+size*.30,cy+size*.34,1.3,[accent[0],accent[1],accent[2],.75]);}
  function levelBadge(cx,cy,value,active,p){var accent=active?p.frame:p.muted,size=54,label=String(value),fontSize=24,fallbackWidth=label.length*fontSize*.75-fontSize*.20;diamond(cx+2,cy+3,size+4,size+4,[0,0,0,.38]);diamond(cx,cy,size+4,size+4,accent);diamond(cx,cy,size,size,p.navy2);diamond(cx,cy,size-9,size-9,[accent[0],accent[1],accent[2],.55]);diamond(cx,cy,size-13,size-13,p.navy);diamond(cx,cy-size*.50,5,10,accent);diamond(cx+size*.50,cy,10,5,accent);diamond(cx,cy+size*.50,5,10,accent);diamond(cx-size*.50,cy,10,5,accent);if(!M3.BitmapFont||!M3.BitmapFont.drawText(M3.Renderer,label,cx,cy-fontSize*.5,1.5,active?p.paper:[.68,.74,.76,1],size*.56,'center','label'))M3.Glyphs.drawNumber(M3.Renderer,value,cx-fallbackWidth*.5,cy-fontSize*.5,fontSize,active?p.paper:[.68,.74,.76,1]);}
  function towerLevelAsset(v,unitId,level){var list=v.combat.unitLevelAssets&&v.combat.unitLevelAssets[unitId]||[],index=Math.min(list.length-1,Math.max(0,(Number(level)||1)-1));while(index>=0){if(list[index])return list[index];index-=1;}return v.combat.unitAssets[unitId];}
  function heroDisplayName(name){var value=String(name||'英雄');value=value.replace(/薇萝/g,'花萝').replace(/蜂后\s*莉奥拉/g,'蜂后奥拉').replace(/莉奥拉/g,'奥拉');return value.replace(/\s+/g,' ').trim();}
  function text(value,x,y,size,color,maxWidth,align,styleKind){var dark=color&&color[0]+color[1]+color[2]<.75,kind=styleKind||(dark?'button':(size>1.8?'title':'body'));if(!M3.BitmapFont||!M3.BitmapFont.drawText(M3.Renderer,value,x,y,size,color,maxWidth,align,kind))M3.Glyphs.drawText(M3.Renderer,value,x,y,size,color,maxWidth,align);}
  function cardTextLines(value,r,y,maxLines,color,fontSize,lineHeight,kind){var source=String(value||''),maxWidth=Math.max(20,r.w-6),size=fontSize||.76,textKind=kind||'body',glyphSize=textKind==='cardBody'?Math.max(10,size*16):Math.max(13.5,size*16),glyphWidth=glyphSize*.86+(textKind==='cardBody'?.3:.4),perLine=Math.max(1,Math.floor(maxWidth/glyphWidth)),limit=Math.max(1,maxLines||1),lines=[],i,line;while(source.length&&lines.length<limit){line=source.slice(0,perLine);source=source.slice(perLine);lines.push(line);}if(source.length&&lines.length){line=lines[lines.length-1];line=(line.length>1?line.slice(0,line.length-1):line)+'…';lines[lines.length-1]=line;}for(i=0;i<lines.length;i+=1)text(lines[i],r.x+r.w*.5,y+i*(lineHeight||15.5),size,color,maxWidth,'center',textKind);return lines.length;}
  function battleCardCost(r,value,y){
    var label=String(Math.max(0,Math.round(Number(value)||0))),size=18,gap=5,numberWidth=Math.min(r.w-size-gap-14,Math.max(14,label.length*12)),x=r.x+(r.w-size-gap-numberWidth)*.5;
    battleHudIcon('coin',x,y-2,size,[.90,.70,.25,1]);
    text(label,x+size+gap,y,.68,[.44,.29,.11,1],numberWidth,'left','body');
  }
  function battleCardArt(r,key,appearance,color,artH,v,selected){
    var infoY=r.y+artH,art={x:r.x+5,y:r.y+5,w:r.w-10,h:artH-9},edge=selected?[.65,.49,.25,.65]:[.96,.96,.90,.28];
    chamfer({x:r.x+1,y:r.y+2,w:r.w,h:r.h},[.12,.10,.065,.06],7);
    chamfer(r,selected?[.98,.92,.76,.36]:[.98,.95,.88,.24],7);
    chamferOutline(r,edge,selected?1.8:1,7);
    line(r.x+9,r.y+2,r.x+r.w-9,r.y+2,.8,[1,1,.96,.25]);
    if(!imageAssetContain(key,art.x,art.y,art.w,art.h,1))actor(r.x+r.w*.5,r.y+artH*.5,Math.min(art.w,art.h)*.90,appearance,color);
    chamfer({x:r.x+3,y:infoY,w:r.w-6,h:r.h-artH-3},[.99,.98,.94,.38],4);
    line(r.x+9,infoY,r.x+r.w-9,infoY,.7,[.40,.39,.29,.12]);
    if(selected)line(r.x+12,r.y+2,r.x+r.w-12,r.y+2,1.6,[1,.97,.80,.55]);
    return infoY;
  }
  function actor(cx,cy,size,a,fallback){var sx=(a&&a.bodyScaleX)||.62,sy=(a&&a.bodyScaleY)||.68,hs=(a&&a.headScale)||.32,primary=(a&&a.primaryColor)||fallback,secondary=(a&&a.secondaryColor)||[.2,.25,.3],accent=(a&&a.accentColor)||[.9,.95,1],bx=cx-size*sx*.5,by=cy-size*sy*.34,bw=size*sx,bh=size*sy*.62,hx=cx-size*hs*.5,hy=by-size*hs*.62,shape=a&&a.bodyShape,tool=a&&a.accessory;rect(cx-size*.34,cy+size*.27,size*.68,size*.10,[0,0,0,.24]);if(shape==='wide'||shape==='armored'||shape==='giant')rect(bx-size*.08,by+bh*.14,bw+size*.16,bh*.66,secondary);rect(bx,by,bw,bh,primary);if(shape==='robe')rect(bx-size*.06,by+bh*.56,bw+size*.12,bh*.34,secondary);else if(shape==='blob')rect(bx+size*.08,by+bh*.58,bw-size*.16,bh*.30,secondary);else rect(bx+bw*.18,by+bh*.58,bw*.64,bh*.18,secondary);rect(hx,hy,size*hs,size*hs,secondary);rect(hx+size*hs*.2,hy+size*hs*.22,size*hs*.6,size*hs*.18,accent);if(tool==='blade')rect(cx+bw*.38,by-size*.05,size*.08,bh*.92,accent);else if(tool==='bow'){rect(cx+bw*.30,by+bh*.08,size*.07,bh*.76,accent);rect(cx+bw*.18,by+bh*.42,size*.28,size*.06,accent);}else if(tool==='orb')rect(cx+bw*.28,by+bh*.18,size*.20,size*.20,accent);else if(tool==='staff')rect(cx+bw*.34,by-size*.14,size*.07,bh*1.08,accent);else if(tool==='fan'){rect(cx+bw*.16,by+bh*.18,size*.30,size*.08,accent);rect(cx+bw*.24,by+bh*.08,size*.08,size*.30,accent);}else if(tool==='shell')frame({x:bx+bw*.16,y:by+bh*.16,w:bw*.68,h:bh*.52},accent,Math.max(1,size*.05));else if(tool==='eyes'){rect(hx+size*hs*.16,hy+size*hs*.28,size*.07,size*.07,accent);rect(hx+size*hs*.64,hy+size*hs*.28,size*.07,size*.07,accent);}else if(tool==='horns'){rect(hx-size*.08,hy-size*.12,size*.09,size*.22,accent);rect(hx+size*hs-size*.01,hy-size*.12,size*.09,size*.22,accent);}else if(tool==='crown'){rect(hx,hy-size*.13,size*hs,size*.12,accent);rect(hx+size*hs*.42,hy-size*.24,size*hs*.16,size*.18,accent);}}
  function mapPreview(r,level,v){var m=level&&level.map,x,y,cw,ch,tile,key,col,hasImage,style=m&&m.presentation&&m.presentation.style||{},cellX,cellY,mapX,mapY,mapW,mapH;hasImage=m&&imageAsset(m.backgroundAsset,r.x,r.y,r.w,r.h,.82);if(!hasImage)rect(r.x,r.y,r.w,r.h,tone(v,'background',[.03,.12,.2,1]));if(!m)return;cw=ch=Math.min(r.w/m.width,r.h/m.height);mapW=cw*m.width;mapH=ch*m.height;mapX=r.x+(r.w-mapW)*.5;mapY=r.y+(r.h-mapH)*.5;for(y=0;y<m.height;y+=1)for(x=0;x<m.width;x+=1){cellX=mapX+x*cw;cellY=mapY+y*ch;tile=m.tiles[y*m.width+x];key=M3.TextureAssets&&M3.TextureAssets.tileKey(m,tile);col=tile==='road'||tile==='spawn'||tile==='goal'?(m.presentation.routeColor||tone(v,'route',[.4,.5,.5,1])):(m.presentation.groundColor||tone(v,'ground',[.1,.3,.3,1]));if(tile==='obstacle')col=m.presentation.obstacleColor||tone(v,'obstacle',[.7,.3,.2,1]);if(!hasImage||tile!=='buildable')rect(cellX+1,cellY+1,cw-2,ch-2,hasImage?[col[0],col[1],col[2],.62]:col);if(key)imageAsset(key,cellX,cellY,cw,ch,1);else if(tile==='road')rect(cellX+cw*.22,cellY+ch*.22,cw*.56,ch*.56,style.routeMarkerColor||tone(v,'frame',[.7,.9,.8,1]));if(tile==='spawn')frame({x:cellX+2,y:cellY+2,w:cw-4,h:ch-4},style.spawnColor||tone(v,'success',[.2,.8,.6,1]),2);if(tile==='goal')frame({x:cellX+2,y:cellY+2,w:cw-4,h:ch-4},style.goalColor||tone(v,'gold',[1,.8,.3,1]),2);}frame(r,tone(v,'frame',[.7,.9,.9,1]),2);}
  function home(l,v){var hero=l.homeHero,roles=v.presentation&&v.presentation.roleAppearances||[],colors=v.presentation&&v.presentation.rolePalette||[],i;text(copy(v,'homeTitle','珊瑚防线'),l.w*.5,l.top+l.usable*.055,3,tone(v,'frame',[.8,1,1,1]),l.w*.82,'center');text(copy(v,'homeSubtitle','守护最后的珊瑚礁'),l.w*.5,l.top+l.usable*.12,1.45,tone(v,'primary',[.2,.8,.7,1]),l.w*.76,'center');rect(hero.x,hero.y,hero.w,hero.h,tone(v,'panel',[.12,.16,.24,1]));for(i=0;i<5;i+=1)rect(hero.x+hero.w*(.08+i*.2),hero.y+hero.h*(.62-(i%2)*.12),hero.w*.035,hero.h*(.28+(i%3)*.08),tone(v,'accent',[.9,.4,.3,1]));actor(hero.x+hero.w*.3,hero.y+hero.h*.55,hero.h*.42,roles[0],colors[0]||tone(v,'primary',[.2,.7,.8,1]));actor(hero.x+hero.w*.5,hero.y+hero.h*.48,hero.h*.48,roles[3],colors[3]||tone(v,'accent',[.8,.4,.8,1]));actor(hero.x+hero.w*.7,hero.y+hero.h*.55,hero.h*.42,roles[1],colors[1]||tone(v,'accent',[.9,.4,.3,1]));frame(hero,tone(v,'frame',[.7,1,.82,1]),2);rect(l.homeStart.x,l.homeStart.y,l.homeStart.w,l.homeStart.h,buttonBackground(tone(v,'primary',[.18,.72,.48,1])));frame(l.homeStart,tone(v,'frame',[.7,1,.82,1]),3);text(copy(v,'homeAction','进入潮汐地图'),l.w*.5,l.homeStart.y+l.homeStart.h*.3,1.75,tone(v,'background',[.02,.1,.16,1]),l.homeStart.w*.82,'center');}
  function map(l,v){var entries=v.levelEntries||[],energyCfg=v.systems&&v.systems.M14_energy||{},adAmount=Number(energyCfg.ad_refill_amount)||5,shareAmount=Number(energyCfg.share_refill_amount)||3,i,item,node,level,r,preview,tx,active,top=l.mapList.y,bottom=l.mapList.y+l.mapList.h;imageAsset(v.presentation&&v.presentation.sceneAssets&&v.presentation.sceneAssets.worldMapBackground,0,l.top,l.w,l.usable,.22);text(copy(v,'mapTitle','潮汐战图'),l.w*.5,l.top+l.usable*.025,2.2,tone(v,'frame',[.8,1,1,1]),l.w*.8,'center');rect(l.energyAd.x,l.energyAd.y,l.energyAd.w,l.energyAd.h,tone(v,'success',[.2,.7,.45,1]));text('广告体力 +'+adAmount,l.energyAd.x+l.energyAd.w*.5,l.energyAd.y+l.energyAd.h*.25,.58,[1,1,1,1],l.energyAd.w*.9,'center');rect(l.energyShare.x,l.energyShare.y,l.energyShare.w,l.energyShare.h,tone(v,'primary',[.2,.58,.72,1]));text('分享补充 +'+shareAmount,l.energyShare.x+l.energyShare.w*.5,l.energyShare.y+l.energyShare.h*.25,.62,[1,1,1,1],l.energyShare.w*.9,'center');rect(l.energyCurrent.x,l.energyCurrent.y,l.energyCurrent.w,l.energyCurrent.h,tone(v,'panel',[.1,.22,.27,1]));frame(l.energyCurrent,tone(v,'gold',[1,.82,.28,1]),1);text('当前体力 '+v.energy,l.energyCurrent.x+l.energyCurrent.w*.5,l.energyCurrent.y+l.energyCurrent.h*.25,.62,tone(v,'gold',[1,.82,.28,1]),l.energyCurrent.w*.9,'center');rect(l.mapUpgrade.x,l.mapUpgrade.y,l.mapUpgrade.w,l.mapUpgrade.h,tone(v,'primary',[.2,.58,.72,1]));text(copy(v,'mapUpgrade','角色升级'),l.mapUpgrade.x+l.mapUpgrade.w*.5,l.mapUpgrade.y+l.mapUpgrade.h*.28,.9,tone(v,'background',[.03,.1,.16,1]),l.mapUpgrade.w*.86,'center');for(i=0;i<entries.length;i+=1){item=entries[i];node=item.node;level=item.level;r=l.levelCard(i,v.mapScroll);if(r.y+1<top||r.y+r.h-1>bottom)continue;active=node&&node.unlocked;rect(r.x,r.y,r.w,r.h,active?tone(v,'panel',[.12,.22,.28,1]):tone(v,'disabled',[.25,.27,.3,1]));preview={x:r.x+8,y:r.y+8,w:r.w*.43,h:r.h-16};mapPreview(preview,level,v);if(!active){rect(preview.x,preview.y,preview.w,preview.h,[.04,.06,.08,.68]);lockIcon(preview,tone(v,'frame',[.82,.88,.9,1]));}tx=r.x+r.w*.49;M3.Glyphs.drawNumber(M3.Renderer,i+1,tx,r.y+12,26,active?tone(v,'gold',[1,.8,.3,1]):tone(v,'frame',[.7,.7,.7,1]));text(node.displayName||level.uiName||('前哨'+(i+1)),tx,r.y+r.h*.42,1.05,active?tone(v,'frame',[.8,1,1,1]):tone(v,'background',[.12,.15,.18,1]),r.w*.47,'left');text(active?(node.description||level.description||'守住防线'):'完成上一关解锁',tx,r.y+r.h*.68,.72,active?tone(v,'primary',[.3,.8,.7,1]):tone(v,'background',[.12,.15,.18,1]),r.w*.47,'left');frame(r,active?tone(v,'frame',[.7,.9,.9,1]):tone(v,'disabled',[.4,.42,.44,1]),active?2:1);}}
  function detail(l,v){var level=v.levelPreview||{};text(level.uiName||'关卡',l.w*.5,l.top+l.usable*.05,2.7,tone(v,'frame',[.8,1,1,1]),l.w*.82,'center');mapPreview(l.detailPreview,level,v);text(level.description||'守住防线',l.w*.5,l.top+l.usable*.57,1.35,tone(v,'frame',[.8,1,1,1]),l.w*.84,'center');rect(l.detailBack.x,l.detailBack.y,l.detailBack.w,l.detailBack.h,tone(v,'disabled',[.28,.34,.38,1]));frame(l.detailBack,tone(v,'frame',[.7,.88,1,1]),2);text(copy(v,'detailBack','返回'),l.detailBack.x+l.detailBack.w*.5,l.detailBack.y+l.detailBack.h*.3,1.5,tone(v,'frame',[.8,1,1,1]),l.detailBack.w*.76,'center');rect(l.detailStart.x,l.detailStart.y,l.detailStart.w,l.detailStart.h,tone(v,'primary',[.24,.62,.9,1]));frame(l.detailStart,tone(v,'frame',[.7,.88,1,1]),3);text(copy(v,'detailAction','选择四座防御塔'),l.detailStart.x+l.detailStart.w*.5,l.detailStart.y+l.detailStart.h*.3,1.35,tone(v,'background',[.03,.1,.16,1]),l.detailStart.w*.86,'center');}
  function deck(l,v){var i,r,c,selected={};(v.deck||[]).forEach(function(id){selected[id]=true;});text(copy(v,'deckTitle','选择四座防御塔'),l.w*.5,l.top+l.usable*.035,2.15,tone(v,'frame',[.8,1,1,1]),l.w*.86,'center');text(copy(v,'deckHint','固定阵容，局内不可更换')+'  '+v.deck.length+'/'+v.cardTotal,l.w*.5,l.top+l.usable*.105,.82,tone(v,'primary',[.3,.8,.7,1]),l.w*.9,'center');for(i=0;i<l.cards.length;i+=1){r=l.cards[i];c=v.cards[i]&&v.cards[i].color||tone(v,'panel',[.18,.2,.24]);rect(r.x,r.y,r.w,r.h,tone(v,'panel',[.12,.18,.22,1]));if(v.cards[i]){imageAsset(v.cards[i].portraitAsset,r.x+5,r.y+5,r.w-10,r.h*.58,1)||actor(r.x+r.w*.5,r.y+r.h*.32,Math.min(r.w,r.h)*.64,v.cards[i].appearance,c);text(v.cards[i].uiName||('守卫'+(i+1)),r.x+r.w*.5,r.y+r.h*.63,.95,tone(v,'frame',[1,1,1,1]),r.w*.9,'center');text(v.cards[i].roleDescription||'通用防御单位',r.x+r.w*.5,r.y+r.h*.75,.76,tone(v,'primary',[.3,.8,.7,1]),r.w*.9,'center');text(copy(v,'purchaseCost','花费')+' '+v.cards[i].purchaseCost,r.x+r.w*.5,r.y+r.h*.87,.76,tone(v,'gold',[1,.8,.3,1]),r.w*.86,'center');}if(v.cards[i]&&selected[v.cards[i].id])frame(r,tone(v,'frame',[1,1,1,1]),5);else frame(r,tone(v,'background',[.12,.15,.2,1]),2);}rect(l.pagePrev.x,l.pagePrev.y,l.pagePrev.w,l.pagePrev.h,tone(v,'primary',[.24,.55,.9,1]));text('返回',l.pagePrev.x+l.pagePrev.w*.5,l.pagePrev.y+l.pagePrev.h*.24,.86,[1,1,1,1],l.pagePrev.w*.8,'center');rect(l.deckStart.x,l.deckStart.y,l.deckStart.w,l.deckStart.h,v.deckValid?tone(v,'success',[.18,.72,.48,1]):tone(v,'disabled',[.3,.32,.35,1]));text('开始防御',l.deckStart.x+l.deckStart.w*.5,l.deckStart.y+l.deckStart.h*.24,1.05,tone(v,'background',[.03,.1,.16,1]),l.deckStart.w*.85,'center');}
  function heroSelect(l,v){var i,r,h,selected={};(v.heroes||[]).forEach(function(id){selected[id]=true;});text('选择一名英雄',l.w*.5,l.top+l.usable*.045,2.2,tone(v,'frame',[.8,1,1,1]),l.w*.9,'center');text('固定 3 名候选，局内限用一名',l.w*.5,l.top+l.usable*.12,.92,tone(v,'primary',[.3,.8,.7,1]),l.w*.9,'center');for(i=0;i<v.heroCards.length&&i<l.heroCards.length;i+=1){r=l.heroCards[i];h=v.heroCards[i];rect(r.x,r.y,r.w,r.h,tone(v,'panel',[.12,.18,.22,1]));imageAsset(h.portraitAsset,r.x+4,r.y+4,r.w-8,r.h*.60,1)||actor(r.x+r.w*.5,r.y+r.h*.33,Math.min(r.w,r.h)*.66,h.appearance,h.color);text(h.uiName,r.x+r.w*.5,r.y+r.h*.64,.95,[1,1,1,1],r.w*.9,'center');text(h.roleDescription||'支援全场的英雄单位',r.x+r.w*.5,r.y+r.h*.76,.76,tone(v,'primary',[.3,.8,.7,1]),r.w*.9,'center');text('等级 '+h.level,r.x+r.w*.5,r.y+r.h*.88,.78,tone(v,'gold',[1,.8,.3,1]),r.w*.84,'center');frame(r,selected[h.id]?tone(v,'gold',[1,.8,.3,1]):tone(v,'frame',[.7,.9,.9,1]),selected[h.id]?5:2);}rect(l.heroBack.x,l.heroBack.y,l.heroBack.w,l.heroBack.h,tone(v,'disabled',[.3,.32,.35,1]));text('返回',l.heroBack.x+l.heroBack.w*.5,l.heroBack.y+l.heroBack.h*.27,.92,[1,1,1,1],l.heroBack.w*.8,'center');rect(l.heroStart.x,l.heroStart.y,l.heroStart.w,l.heroStart.h,v.heroes.length===1?tone(v,'success',[.18,.72,.48,1]):tone(v,'disabled',[.3,.32,.35,1]));text('消耗体力开始',l.heroStart.x+l.heroStart.w*.5,l.heroStart.y+l.heroStart.h*.27,1.05,tone(v,'background',[.03,.1,.16,1]),l.heroStart.w*.88,'center');}
  function heroShowcaseCard(r,h,index,isSelected,v,p){var portrait,nameBar,cardFill=p.panelVariants[(index+1)%p.panelVariants.length],cardAccent=p.borderVariants[(index+2)%p.borderVariants.length];ornatePanel(r,v,cardAccent,isSelected,cardFill);nameBar={x:r.x+8,y:r.y+7,w:r.w-16,h:24};chamfer(nameBar,[.010,.032,.046,.88],6);line(nameBar.x+8,nameBar.y+nameBar.h-2,nameBar.x+nameBar.w-8,nameBar.y+nameBar.h-2,1,[cardAccent[0],cardAccent[1],cardAccent[2],.40]);text(heroDisplayName(h.uiName),r.x+r.w*.5,nameBar.y+3,.76,p.paper,nameBar.w*.90,'center','label');portrait={x:r.x+8,y:r.y+34,w:r.w-16,h:r.w-34};imageAsset(h.portraitAsset,portrait.x,portrait.y,portrait.w,portrait.h,1)||actor(r.x+r.w*.5,portrait.y+portrait.h*.52,Math.min(portrait.w,portrait.h)*.78,h.appearance,h.color);cutCorners(portrait,cardFill,10);chamferOutline(portrait,isSelected?p.primary:[cardAccent[0],cardAccent[1],cardAccent[2],.64],isSelected?2:1,10);text('等级  '+h.level,r.x+r.w*.5,r.y+r.h+8,.70,p.paper,r.w*.94,'center');text(h.roleDescription||'支援全场的英雄单位',r.x+r.w*.5,r.y+r.h+31,.64,p.paper,r.w*.96,'center');if(isSelected)selectionMark(r,v);edgeJewels(r,v);}
  function progression(l,v){
    var p=l.upgradePanel,rows=l.loadoutHeroes,cards=v.progressionCards||[],selected=v.selectedProgressionHero,preview=v.heroUpgradePreview,
      navy=[.024,.106,.149,1],cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],muted=[.557,.667,.698,1],amber=[.957,.718,.173,1],
      back={},i,h,r,chosen,art,infoX,infoW,infoY,tag,label='请选择英雄',summary=l.upgradeSummary,maxed=preview&&preview.level>=preview.maxLevel;
    for(i in v)if(Object.prototype.hasOwnProperty.call(v,i))back[i]=v[i];back.message='';back.mapDialog=null;
    mapV2(l,back);drawRect(0,l.top,l.w,l.usable,[0,0,0,.66]);
    mapSkinFrame([25,322,886,1245],p,36,navy,heroSkin,p.w/886);
    tag={x:p.x+p.w*.25,y:p.y-9,w:p.w*.50,h:29};
    mapSkinFrame([254,300,426,86],tag,35,navy,heroSkin,p.w/886);mapLabel('英雄强化',tag,16,paper);
    // Draw editable title and real balance instead of the selection skin's baked title.
    chamferOutline({x:p.x+20,y:p.y+33,w:p.w-40,h:60},cyan,1,7);
    mapLabel('选择升级英雄',{x:p.x+28,y:p.y+36,w:p.w-56,h:28},24,paper);
    mapLabel('材料  '+String(v.materials||0),{x:p.x+28,y:p.y+67,w:p.w-56,h:22},14,amber);
    for(i=0;i<cards.length&&i<rows.length;i+=1){
      h=cards[i];r=rows[i];chosen=!!(selected&&selected.id===h.id);
      mapSkinFrame(chosen?[58,585,818,260]:[58,860,818,256],r,22,navy,heroSkin,p.w/886);
      art={x:r.x+6,y:r.y+6,w:(r.w-12)*.44,h:r.h-12};
      heroSkin(96,889,326,200,art);heroBust(h,art)||actor(art.x+art.w/2,art.y+art.h/2,art.h,h.appearance,h.color);
      infoX=art.x+art.w+12;infoW=r.x+r.w-infoX-10;infoY=r.y+(r.h-79)/2;
      rect(infoX-3,r.y+10,infoW+4,r.h-20,navy);
      mapLabel(heroDisplayName(h.uiName),{x:infoX,y:infoY,w:infoW-23,h:25},18,paper,{align:'left',padding:0});
      tag={x:infoX,y:infoY+30,w:Math.min(94,infoW-6),h:22};
      heroSkin(487,975,182,50,tag);mapLabel((h.roleDescription||'战役支援').replace(/角色$/,''),tag,12,cyan);
      mapLabel('等级 '+(h.level||1),{x:infoX,y:infoY+57,w:infoW,h:22},14,muted,{align:'left',padding:0});
      heroSkin(chosen?775:776,chosen?637:914,62,62,{x:r.x+r.w-30,y:r.y+12,w:21,h:21});
    }
    chamfer(summary,[.043,.145,.204,1],5);chamferOutline(summary,[.20,.35,.41,1],1,5);
    var levelText='选择上方英雄',benefit='查看下一等级的强化效果';
    if(selected&&preview){
      levelText=maxed?'等级 '+preview.level+' · 已满级':'等级 '+preview.level+' → '+preview.nextLevel;
      benefit=(maxed?'当前攻击加成 +':'升级后攻击加成 +')+(maxed?preview.currentBonus:preview.nextBonus)+'%';
      label=maxed?'已满级':(preview.canUpgrade?'升级 · ':'材料不足 · ')+preview.cost+' 材料';
    }
    mapLabel(levelText,{x:summary.x+10,y:summary.y+7,w:summary.w-20,h:23},16,paper,{align:'left',padding:0});
    mapLabel(benefit,{x:summary.x+10,y:summary.y+34,w:summary.w-20,h:22},14,selected?cyan:muted,{align:'left',padding:0});
    towerModalButton(l.heroBack,'返回',false,true);
    towerModalButton(l.heroStart,label,true,!!(selected&&preview&&preview.canUpgrade));
    if(v.message){
      var notice={x:p.x+20,y:l.heroStart.y-34,w:p.w-40,h:28};
      chamfer(notice,navy,4);chamferOutline(notice,amber,1,4);mapLabel(v.message,notice,14,paper);
    }
  }
  function alphaColor(color,alpha){return[color[0],color[1],color[2],(color.length>3?color[3]:1)*alpha];}
  function upgradeEffects(v,b,cell){var events=v.combat.upgradeEvents||[],i,event,progress,fade,cx,cy,ring,particle,j,angle,distance,px,py,color;for(i=0;i<events.length;i+=1){event=events[i];progress=Math.min(1,event.age/event.duration);fade=Math.max(0,1-progress);cx=b.x+event.x*cell;cy=b.y+event.y*cell;color=v.combat.cardColors[event.cardId]||tone(v,'gold',[1,.82,.28,1]);ring=cell*(.42+progress*.82);frame({x:cx-ring*.5,y:cy-ring*.5,w:ring,h:ring},alphaColor(color,fade),Math.max(2,cell*(.11-progress*.06)));frame({x:cx-cell*(.32+progress*.18),y:cy-cell*(.32+progress*.18),w:cell*(.64+progress*.36),h:cell*(.64+progress*.36)},alphaColor(tone(v,'frame',[.85,1,1,1]),fade*.72),Math.max(1,cell*.05));particle=Math.max(2,cell*(.10-progress*.045));distance=cell*(.16+progress*.68);for(j=0;j<8;j+=1){angle=Math.PI*.25*j;px=cx+Math.cos(angle)*distance;py=cy+Math.sin(angle)*distance;rect(px-particle*.5,py-particle*.5,particle,particle,alphaColor(j%2?color:tone(v,'frame',[.9,1,1,1]),fade));}text('升级成功',cx,cy-cell*(.82+progress*.32),.58,alphaColor(tone(v,'gold',[1,.85,.25,1]),fade),cell*2.4,'center');}}
  function attackEffects(v,b,cell){var events=v.combat.attackEvents||[],configs=v.presentation&&v.presentation.combatEffects||{},i,event,cfg,progress,fade,sx,sy,tx,ty,dx,dy,distance,steps,j,ratio,width,size,px,py,color,impactColor;for(i=0;i<events.length;i+=1){event=events[i];cfg=configs[event.type]||{};progress=Math.min(1,event.age/event.duration);fade=Math.max(0,1-progress);sx=b.x+event.fromX*cell;sy=b.y+event.fromY*cell;tx=b.x+event.toX*cell;ty=b.y+event.toY*cell;dx=tx-sx;dy=ty-sy;distance=Math.sqrt(dx*dx+dy*dy);width=Math.max(2,cell*(Number(cfg.trailWidth)||(event.type==='hero'?.12:.07)));size=cell*(Number(cfg.impactScale)||(event.type==='hero'?.30:.18));color=cfg.color||(event.type==='hero'?[1,.76,.2,1]:[.42,.94,1,1]);impactColor=cfg.impactColor||(event.type==='hero'?[1,.34,.16,1]:[.88,1,1,1]);if(event.type==='hero'){steps=Math.max(3,Math.ceil(distance/Math.max(3,cell*.14)));for(j=0;j<=steps;j+=1){ratio=j/steps;px=sx+dx*ratio;py=sy+dy*ratio;rect(px-width*.5,py-width*.5,width,width,alphaColor(color,fade*(.45+.55*ratio)));}frame({x:tx-size*(.55+progress*.45),y:ty-size*(.55+progress*.45),w:size*(1.1+progress*.9),h:size*(1.1+progress*.9)},alphaColor(impactColor,fade),Math.max(2,width*.55));rect(tx-width*1.4,ty-width*.45,width*2.8,width*.9,alphaColor(impactColor,fade));rect(tx-width*.45,ty-width*1.4,width*.9,width*2.8,alphaColor(impactColor,fade));}else{for(j=0;j<4;j+=1){ratio=Math.max(0,progress-j*.10);px=sx+dx*ratio;py=sy+dy*ratio;rect(px-width*.5,py-width*.5,width,width,alphaColor(color,fade*(1-j*.18)));}frame({x:tx-size*.5,y:ty-size*.5,w:size,h:size},alphaColor(impactColor,fade),Math.max(1,width*.45));}}}
  function itemDisplay(l,v){var p=uiPalette(v),r=l.battleItems,size=Math.min(r.w,r.h),icon={x:r.x+(r.w-size)*.5,y:r.y+(r.h-size)*.5,w:size,h:size},art={x:0,y:0,w:0,h:0};rect(icon.x+3,icon.y+4,icon.w,icon.h,[0,0,0,.34]);rect(icon.x,icon.y,icon.w,icon.h,p.navy2);frame(icon,p.borderVariants[2],2);art={x:icon.x+2,y:icon.y+2,w:icon.w-4,h:icon.h-4};if(imageAsset('ui-item-question',art.x,art.y,art.w,art.h,1)){frame(art,[p.borderVariants[2][0],p.borderVariants[2][1],p.borderVariants[2][2],.78],1.5);return;}text('道具',icon.x+icon.w*.5,icon.y+icon.h*.20,.60,p.paper,icon.w*.84,'center');text('点击选择',icon.x+icon.w*.5,icon.y+icon.h*.66,.44,p.accent,icon.w*.88,'center');}
  function itemChoiceIcon(r,effect,color){var cx=r.x+r.w*.5,cy=r.y+r.h*.31,s=Math.min(r.w,r.h)*.22;if(effect==='clear_all_enemies'){frame({x:cx-s*.62,y:cy-s*.62,w:s*1.24,h:s*1.24},color,2);rect(cx-s*.9,cy-2,s*1.8,4,color);rect(cx-2,cy-s*.9,4,s*1.8,color);rect(cx-s*.16,cy-s*.16,s*.32,s*.32,color);}else{rect(cx-s*.72,cy+s*.16,s*.38,s*.42,color);rect(cx-s*.19,cy-s*.08,s*.38,s*.66,color);rect(cx+s*.34,cy-s*.36,s*.38,s*.94,color);rect(cx-s*.16,cy-s*.78,s*.32,s*.32,color);rect(cx-s*.42,cy-s*.53,s*.84,s*.08,color);}}
  function remoteTerrain(map,tile,r){
    var key=M3.TextureAssets.tileKey(map,tile);
    // Each server tile already includes its ground and 2.5D props. Draw it once, at its authored ratio.
    if(!imageAsset(key,r.x,r.y,r.w,r.h,1))drawRect(r.x,r.y,r.w,r.h,tile==='road'?[.27,.32,.35,1]:[.05,.22,.22,1]);
  }
  function groundShadow(x,y,w,h){var vertices=[],i,a,b;for(i=0;i<16;i+=1){a=i*Math.PI/8;b=(i+1)*Math.PI/8;vertices.push(x,y,x+Math.cos(a)*w,y+Math.sin(a)*h,x+Math.cos(b)*w,y+Math.sin(b)*h);}solid(vertices,[0,0,0,.35]);}
  function obliqueWorld(l,v){
    var c=v.combat,projection=M3.CombatProjection,g=projection.geometry(l,c.board),map=c.board.level&&c.board.level.map||v.levelPreview.map,amber=[.957,.718,.173,1],x,y,tile,p,unit,i,r,objects=[];
    // The gameplay board remains an m*n matrix. Only its screen projection changes.

    for(y=0;y<c.board.height;y+=1)for(x=0;x<c.board.width;x+=1){
      p=projection.point(g,x,y);tile=c.board.tile(x,y);
      remoteTerrain(map,tile,{x:p.x,y:p.y,w:g.cx,h:g.cy});
      if(c.selectedObstacle&&c.selectedObstacle.x===x&&c.selectedObstacle.y===y)frame({x:p.x+1,y:p.y+1,w:g.cx-2,h:g.cy-2},amber,2);
    }

    for(i=0;i<c.towers.length;i+=1)objects.push({kind:'tower',x:c.towers[i].x+.5,y:c.towers[i].y+.83,unit:c.towers[i]});
    for(i=0;i<c.heroes.length;i+=1)objects.push({kind:'hero',x:c.heroes[i].x+.5,y:c.heroes[i].y+.83,unit:c.heroes[i]});
    for(i=0;i<c.enemies.length;i+=1)objects.push({kind:'enemy',x:c.enemies[i].x,y:c.enemies[i].y+.15,unit:c.enemies[i]});
    objects.sort(function(a,b){return a.y-b.y||a.x-b.x;});
    for(i=0;i<objects.length;i+=1){
      var o=objects[i],h,w,fade=1;p=projection.point(g,o.x,o.y);unit=o.unit;
      groundShadow(p.x,p.y,g.cx*(o.kind==='enemy'?.22:.30),g.cy*.11);
      if(o.kind==='enemy'){
        fade=unit.dying?Math.max(0,1-(unit.deathAge||0)/(unit.deathDuration||.45)):1;
        h=g.cx*(c.unitRenderScales[unit.unitId]||.72)*1.15;w=h;
        if(!(M3.EnemyAnimations&&M3.EnemyAnimations.draw(imageRegion,c.unitAssets[unit.unitId],unit,c.elapsed,p.x-w/2,p.y-h*.85,w,h,fade)))imageAssetContain(c.unitAssets[unit.unitId],p.x-w/2,p.y-h*.85,w,h,fade);
        if(!unit.dying){drawRect(p.x-g.cx*.27,p.y-h*.88,g.cx*.54,4,[.025,.06,.08,1]);drawRect(p.x-g.cx*.27,p.y-h*.88,g.cx*.54*Math.max(0,unit.hp/unit.maxHp),3,[.70,.22,.47,1]);}
      }else{
        h=g.cx*(o.kind==='hero'?1.38:1.48);w=h;
        r={x:p.x-w/2,y:p.y-h*.91,w:w,h:h};
        if(!(M3.DefenderAnimations&&M3.DefenderAnimations.draw(imageRegion,unit,c.elapsed,r.x,r.y,r.w,r.h,1,c.units&&c.units[unit.unitId])))imageAssetContain(o.kind==='tower'?towerLevelAsset(v,unit.unitId,unit.level):c.unitAssets[unit.unitId],r.x,r.y,r.w,r.h,1);
        if(c.selectedTower&&unit.x===c.selectedTower.x&&unit.y===c.selectedTower.y&&o.kind==='tower')chamferOutline({x:p.x-g.cx*.40,y:p.y-g.cy*.4,w:g.cx*.8,h:g.cy*.55},amber,2,4);
        if((unit.level||1)>1)mapLabel('Lv'+unit.level,{x:p.x-16,y:p.y+1,w:32,h:14},10,amber);
      }
    }
    for(i=0;i<(c.attackEvents||[]).length;i+=1){var ev=c.attackEvents[i];if(M3.DefenderAnimations&&M3.DefenderAnimations.drawEffect(imageRegion,ev,{x:g.x,y:g.y,point:function(x,y){var p=projection.point(g,x,y);return{x:p.x,y:p.y};}},g.cx))continue;if(ev.type==='income')continue;var from=projection.point(g,ev.fromX,ev.fromY),to=projection.point(g,ev.toX,ev.toY),alpha=Math.max(0,1-ev.age/ev.duration);if(ev.sourceUnitId==='tower-4'){var t=1-alpha,mx=from.x+(to.x-from.x)*t,my=from.y+(to.y-from.y)*t-g.cx*.45-Math.sin(t*Math.PI)*g.cx*.7;diamond(mx,my,5,5,[1,.64,.17,alpha]);}else line(from.x,from.y-g.cx*.58,to.x,to.y-g.cx*.28,ev.type==='hero'?1.5:2,[.24,.9,1,alpha]);}
    for(i=0;i<(c.damageEvents||[]).length;i+=1){var ev=c.damageEvents[i];p=projection.point(g,ev.x,ev.y);mapLabel(String(ev.value),{x:p.x-18,y:p.y-g.cx*.65-ev.age*16,w:36,h:18},12,[1,.72,.30,Math.max(0,1-ev.age/ev.duration)]);}
  }
  // Share the exact armor skins used by the hero selection screen. Fixed corner sizes never stretch.
  function battleArmor(r,selected,fill){
    mapSkinFrame(selected?[58,585,818,260]:[58,860,818,256],r,22,fill||[.024,.106,.149,1],heroSkin,.43);
  }
  function battleOuterArmor(r){mapSkinFrame([58,860,818,256],r,22,[.024,.106,.149,1],heroSkin,.65);}
  function battlePrice(r,cost){
    chamfer(r,[.01,.045,.065,1],5);chamferOutline(r,[.24,.43,.48,1],1,5);
    var size=Math.min(18,r.h-4),value=String(cost),tw=Math.min(r.w-25,Math.max(14,value.length*11)),start=r.x+(r.w-tw-size-5)/2;
    battleHudIcon('coin',start,r.y+(r.h-size)/2,size,[.957,.718,.173,1]);mapLabel(value,{x:start+size+5,y:r.y,w:tw,h:r.h},16,[.957,.718,.173,1],{padding:0});
  }
  function battleDeploymentCard(r,assetKey,name,cost,selected,hero){
    var paper=[.835,.957,.937,1],cyan=[.278,.863,.906,1];
    battleArmor(r,selected);
    if(hero){var portrait=Math.min(r.h-14,r.w*.42),art={x:r.x+7,y:r.y+7,w:portrait,h:r.h-14},tx=art.x+art.w+7,infoW=r.x+r.w-tx-8;
      battleArmor(art,false);imageAssetContain(assetKey,art.x+7,art.y+7,art.w-14,art.h-14,1);
      mapLabel(name,{x:tx,y:r.y+8,w:infoW,h:23},17,cyan,{align:'left',padding:0});
      mapLabel('战役支援',{x:tx,y:r.y+33,w:infoW,h:20},14,[.45,.66,.72,1],{align:'left',padding:0});
      battlePrice({x:tx,y:r.y+61,w:Math.min(92,infoW),h:27},cost);
    }else{
      imageAssetContain(assetKey,r.x+9,r.y+10,r.w-18,r.h-60,1);
      mapLabel(name,{x:r.x+9,y:r.y+r.h-46,w:r.w-18,h:20},13,cyan,{padding:0});
      battlePrice({x:r.x+10,y:r.y+r.h-28,w:r.w-20,h:21},cost);
    }
  }
  function battleCommand(r,label,primary){
    var support=label==='支援',pause=label==='暂停',resume=label==='继续',ink=[.012,.05,.075,1],cyan=[.278,.863,.906,1],accent=support?[.71,.36,.89,1]:cyan;
    battleArmor(r,false,support?[.14,.035,.24,1]:[.055,.60,.72,1]);
    chamferOutline({x:r.x+4,y:r.y+4,w:r.w-8,h:r.h-8},accent,2,5);
    var inner={x:r.x+10,y:r.y+9,w:r.w-20,h:r.h-18},labelW=40,iconW=support?23:19,gap=8,start=inner.x+(inner.w-labelW-iconW-gap)/2;
    if(support){mapLabel('?',{x:start,y:inner.y-1,w:iconW,h:inner.h+2},30,[.84,.54,1,1],{padding:0});mapLabel(label,{x:start+iconW+gap,y:inner.y,w:labelW,h:inner.h},16,[.93,.76,1,1],{padding:0});}
    else if(pause||resume){
      if(resume)solid([start,inner.y+3,start+17,inner.y+inner.h/2,start,inner.y+inner.h-3],ink);
      else{chamfer({x:start,y:inner.y+3,w:6,h:inner.h-6},ink,2);chamfer({x:start+11,y:inner.y+3,w:6,h:inner.h-6},ink,2);}
      mapLabel(label,{x:start+iconW+gap,y:inner.y,w:labelW,h:inner.h},16,ink,{padding:0});
    }else mapLabel(label,inner,16,ink,{padding:0});
  }
  function battleInspection(l,v){
    var info=v.combat.selectedTower||v.combat.selectedObstacle;if(!info)return;
    var tower=!!v.combat.selectedTower,r=l.towerPanel,paper=[.835,.957,.937,1],amber=[.957,.718,.173,1],cyan=[.278,.863,.906,1];
    battleArmor(r,false);
    mapLabel(tower?info.name+' Lv'+info.level+'/'+info.levelCap:'障碍地块',{x:r.x+12,y:r.y+8,w:r.w-124,h:24},16,paper,{align:'left',padding:0});
    mapLabel(tower?info.bonusLabel+'加成 +'+info.bonusValue:'清除后可部署防御塔',{x:r.x+12,y:r.y+33,w:r.w-124,h:20},12,cyan,{align:'left',padding:0});
    mapLabel('花费 '+info.cost,{x:r.x+12,y:r.y+56,w:r.w-124,h:20},14,amber,{align:'left',padding:0});
    battleCommand(l.towerUpgrade,tower?(info.level>=info.levelCap?'已满级':'升级'):'清除',tower?info.canUpgrade:info.canClear);
  }
  // Repeat unscaled mechanical modules instead of stretching the source scene's perimeter.
  function battleScenePatch(sx,sy,sw,sh,r){return imageRegion('battle-scene-surround',r.x,r.y,r.w,r.h,sx/258,1-sy/258,(sx+sw)/258,1-(sy+sh)/258,[1,1,1,1],1,false,0);}
  function battleRepeat(sx,sy,sw,sh,r,scale){var x,y,w,h,tw=sw*scale,th=sh*scale;for(y=0;y<r.h;y+=th)for(x=0;x<r.w;x+=tw){w=Math.min(tw,r.w-x);h=Math.min(th,r.h-y);battleScenePatch(sx,sy,w/scale,h/scale,{x:r.x+x,y:r.y+y,w:w,h:h});}}
  function battleEnvironment(l){
    var area={x:4,y:l.top+4,w:l.w-8,h:l.usable-8},y,x;
    battleRepeat(83,104,32,32,area,1.5);
    drawRect(area.x,area.y,area.w,area.h,[.012,.035,.05,.64]);
    // Industrial floor panels and side conduits connect HUD, battlefield and deployment dock.
    for(y=l.top+118;y<l.heroBarY-12;y+=60){
      for(x=20;x<l.w-20;x+=62){rect(x,y,56,1,[.22,.33,.36,.4]);rect(x,y,1,52,[.22,.33,.36,.35]);rect(x+4,y+5,2,2,[.43,.48,.45,.55]);}
    }
    battleRepeat(20,78,22,74,{x:0,y:l.top+40,w:16,h:l.usable-40},.72);
    battleRepeat(216,78,22,74,{x:l.w-16,y:l.top+40,w:16,h:l.usable-40},.72);
    battleRepeat(22,19,210,48,{x:12,y:l.top+106,w:l.w-24,h:30},.65);

  }
  function battleFieldGround(l,v){
    var r=l.battleArena,aspect=640/720,viewAspect=r.w/r.h,u=1,vspan=1;
    // A single fixed scene covers the arena, with proportional center cropping.
    if(viewAspect>aspect)vspan=aspect/viewAspect;else u=viewAspect/aspect;
    imageRegion('battle-arena-background',r.x,r.y,r.w,r.h,(1-u)/2,(1+vspan)/2,(1+u)/2,(1-vspan)/2,[1,1,1,1],1,false,0);
  }
  function battle(l,v){var b=l.board,cell=l.cell,x,y,t,e,i,r,col,path={},p,dmg,progress,palette=uiPalette(v),mp=v.combat.mapPresentation||{},style=mp.style||{},tile,gap=style.tileGap||1,inset,count=v.combat.deckIds.length;
    drawRect(0,l.top,l.w,l.usable,[.024,.106,.149,1]);battleEnvironment(l);battleBackdrop(l,v);
    var arena=l.battleArena;
    battleFieldGround(l,v);
    var sx=gl.drawingBufferWidth/l.w,sy=gl.drawingBufferHeight/l.h;
    gl.enable(gl.SCISSOR_TEST);gl.scissor(Math.round(l.board.x*sx),Math.round((l.h-l.board.y-l.board.h)*sy),Math.round(l.board.w*sx),Math.round(l.board.h*sy));
    try{
      obliqueWorld(l,v);
      // Field overlays share the board clip and render before notices and HUD.
      if(M3.RouteGuide)M3.RouteGuide.draw(v);
      if(M3.DeploymentHints)M3.DeploymentHints.draw(v);
    }finally{gl.disable(gl.SCISSOR_TEST);}
    battleOuterArmor({x:6,y:l.heroBarY-10,w:l.w-12,h:l.top+l.usable-l.heroBarY+6});
    for(i=0;i<v.combat.heroIds.length;i+=1){var heroId=v.combat.heroIds[i];r=l.battleHeroCard(i,v.combat.heroIds.length,count);battleDeploymentCard(r,v.combat.heroAssets[heroId]||v.combat.unitAssets[v.combat.heroUnits[heroId]],heroDisplayName(v.combat.heroNames[heroId]),0,v.combat.selectedHero===heroId,true);}
    for(i=0;i<count;i+=1){var cardId=v.combat.deckIds[i];r=l.battleTowerCard(i,count);battleDeploymentCard(r,v.combat.cardAssets[cardId]||towerLevelAsset(v,v.combat.cardUnits[cardId],1),v.combat.cardNames[cardId],v.combat.cardCosts[cardId],v.combat.selectedCard===cardId,false);}
    battleCommand(l.battleItems,'支援',false);
    battleMessagePanel(l,v);if(!v.paused)battleCommand(l.pauseButton,'暂停',false);battleInspection(l,v);if(v.paused){drawRect(l.board.x,l.board.y,l.board.w,l.board.h,[.01,.025,.04,.60]);var pauseBox={x:l.w*.18,y:l.board.y+l.board.h*.5-46,w:l.w*.64,h:92};battleArmor(pauseBox,false);mapLabel('游戏暂停',{x:pauseBox.x,y:pauseBox.y+10,w:pauseBox.w,h:30},22,[.835,.957,.937,1]);mapLabel('点击继续恢复对局',{x:pauseBox.x,y:pauseBox.y+47,w:pauseBox.w,h:24},14,[.278,.863,.906,1]);battleCommand(l.pauseButton,'继续',true);}
  }
  function itemModalLegacy(l,v){var palette=uiPalette(v),modal=l.itemModal,choiceColor,choiceFill,action,i,r,item;rect(0,l.top,l.w,l.usable,[.005,.018,.035,.88]);rect(modal.x+5,modal.y+7,modal.w,modal.h,[0,0,0,.36]);rect(modal.x,modal.y,modal.w,modal.h,palette.panelVariants[1]||tone(v,'panel',[.025,.08,.12,.99]));frame(modal,palette.cyan,2);rect(modal.x,modal.y,modal.w,6,palette.primary);text('战术补给',l.w*.5,modal.y+20,.68,palette.cyan,modal.w*.84,'center');text('选择本局支援',l.w*.5,modal.y+48,1.38,palette.paper,modal.w*.86,'center','title');text('二选一 · 不占用地图位置',l.w*.5,modal.y+82,.68,palette.muted,modal.w*.86,'center');rect(modal.x+modal.w*.08,modal.y+108,modal.w*.84,1,alphaColor(palette.cyan,.34));for(i=0;i<2;i+=1){r=l.itemChoices[i];item=v.battleItemChoices[i];choiceColor=i?palette.violet:palette.primary;choiceFill=i?[.18,.075,.22,.98]:[.035,.19,.19,.98];rect(r.x+4,r.y+5,r.w,r.h,[0,0,0,.28]);rect(r.x,r.y,r.w,r.h,choiceFill);frame(r,choiceColor,3);rect(r.x,r.y,r.w,6,choiceColor);if(item){itemChoiceIcon(r,item.effect,choiceColor);text(item.displayName||(item.effect==='clear_all_enemies'?'清除怪物':'经济强化'),r.x+r.w*.5,r.y+r.h*.48,.98,palette.paper,r.w*.88,'center');text(item.description||(item.effect==='clear_all_enemies'?'清除当前全部怪物':'提高本局经济收益'),r.x+r.w*.5,r.y+r.h*.63,.64,palette.muted,r.w*.88,'center');action={x:r.x+r.w*.04,y:r.y+r.h*.75,w:r.w*.92,h:r.h*.20};rect(action.x,action.y,action.w,action.h,i?palette.buttonViolet:palette.buttonGreen);frame(action,choiceColor,2);text('观看广告',action.x+action.w*.5,action.y+action.h*.08,.58,palette.paper,action.w*.90,'center','compactButton');text('立即使用',action.x+action.w*.5,action.y+action.h*.52,.58,palette.paper,action.w*.90,'center','compactButton');}}rect(l.itemSkip.x,l.itemSkip.y,l.itemSkip.w,l.itemSkip.h,palette.buttonBlue);frame(l.itemSkip,palette.cyan,2);text('暂不使用',l.itemSkip.x+l.itemSkip.w*.5,l.itemSkip.y+l.itemSkip.h*.24,.82,palette.paper,l.itemSkip.w*.84,'center','compactButton');}
  function mapShortcutFallback(kind,cx,cy,size,accent){
    var half=size*.34;
    if(kind==='video'){
      chamferOutline({x:cx-half,y:cy-half*.72,w:half*2,h:half*1.44},accent,1.4,3);
      solid([cx-half*.24,cy-half*.38,cx+half*.42,cy,cx-half*.24,cy+half*.38],accent);
    }else if(kind==='share'){
      line(cx-half,cy+half*.7,cx+half*.65,cy-half*.65,2,accent);
      line(cx+half*.65,cy-half*.65,cx+half*.65,cy+half*.08,2,accent);
      line(cx+half*.65,cy-half*.65,cx-half*.08,cy-half*.65,2,accent);
    }else if(kind==='energy')solid([cx+half*.35,cy-half,cx-half*.65,cy+half*.12,cx-half*.05,cy+half*.12,cx-half*.35,cy+half,cx+half*.65,cy-half*.12,cx+half*.05,cy-half*.12],accent);
    else{diamond(cx,cy,half*1.4,half*1.8,accent);line(cx-half*.4,cy,cx,cy-half*.4,2,[.94,.97,.98,1]);line(cx,cy-half*.4,cx+half*.4,cy,2,[.94,.97,.98,1]);}
  }
  function mapMetalPanel(r,accent,fill){
    var steel=[.45,.51,.55,1],light=[.66,.74,.78,1],cut=5,i,x,y;
    chamfer({x:r.x+2,y:r.y+3,w:r.w,h:r.h},[0,0,0,.65],cut);
    chamfer(r,fill||[.043,.145,.204,.98],cut);
    chamferOutline(r,steel,2,cut);
    chamferOutline({x:r.x+3,y:r.y+3,w:r.w-6,h:r.h-6},[accent[0],accent[1],accent[2],.45],.8,3);
    line(r.x+8,r.y+1,r.x+r.w-8,r.y+1,.8,light);
    for(i=0;i<4;i+=1){
      x=i%2?r.x+r.w-5:r.x+5;y=i<2?r.y+6:r.y+r.h-7;
      rect(x-1.5,y-1.5,3,3,light);rect(x-1,y,2,1,[.08,.15,.19,1]);
    }
  }
  // Reference art is used only for independent skins, icons and terrain swatches.
  // No reference card, map thumbnail, currency or lock state is drawn as a composite.
  function mapSkin(sx,sy,sw,sh,r,opacity){
    return imageRegion('ui-map-reference',r.x,r.y,r.w,r.h,sx/286,1-sy/618,(sx+sw)/286,1-(sy+sh)/618,[1,1,1,1],opacity===undefined?1:opacity,false,0);
  }
  function mapSkinFrame(source,r,border,fill,skin,pixelScale){
    skin=skin||mapSkin;
    var s=pixelScale||M3.UILayout.get().mapScale||1,b=Math.min(border*s,r.w*.2,r.h*.2),i,j,
      dx=[r.x,r.x+b,r.x+r.w-b],dy=[r.y,r.y+b,r.y+r.h-b],dw=[b,r.w-2*b,b],dh=[b,r.h-2*b,b],
      sx=[source[0],source[0]+border,source[0]+source[2]-border],sy=[source[1],source[1]+border,source[1]+source[3]-border],
      sw=[border,source[2]-2*border,border],sh=[border,source[3]-2*border,border],ready=true;
    rect(r.x,r.y,r.w,r.h,fill||[.024,.106,.149,1]);
    for(j=0;j<3;j+=1)for(i=0;i<3;i+=1)if(i!==1||j!==1)ready=skin(sx[i],sy[j],sw[i],sh[j],{x:dx[i],y:dy[j],w:dw[i],h:dh[j]})&&ready;
    if(!ready)mapMetalPanel(r,[.278,.863,.906,1],fill);
  }
  function mapTacticalPreview(r,level){
    var m=level&&level.map,cw,x0,y0,x,y;
    rect(r.x,r.y,r.w,r.h,[.055,.10,.10,1]);
    if(!m||!m.tiles||!m.width||!m.height)return;
    cw=Math.min((r.w-6)/m.width,(r.h-6)/m.height);
    x0=r.x+(r.w-cw*m.width)*.5;y0=r.y+(r.h-cw*m.height)*.5;
    for(y=0;y<m.height;y+=1)for(x=0;x<m.width;x+=1)
      remoteTerrain(m,m.tiles[y*m.width+x],{x:x0+x*cw,y:y0+y*cw,w:cw,h:cw});
    frame(r,[.27,.43,.44,1],1);
  }
  function mapLabel(value,r,size,color,options){
    if(M3.BitmapFont&&M3.BitmapFont.drawLabel&&M3.BitmapFont.drawLabel(M3.Renderer,value,r,size,color,options))return;
    text(value,r.x+r.w*.5,r.y+(r.h-size)*.5,size/16,color,r.w-4,'center','cardBody');
  }
  function mapStatusFrame(r,accent){
    var cut=2,arm=Math.min(5,r.h*.22),x=r.x,y=r.y,w=r.w,h=r.h;
    chamfer({x:x+1,y:y+1,w:w,h:h},[0,0,0,.7],cut);
    chamfer(r,[.018,.075,.10,.98],cut);
    chamferOutline(r,[accent[0],accent[1],accent[2],.42],.7,cut);
    // Four terminal brackets echo the reference, leaving an uncluttered text well.
    line(x+2,y,x+arm+2,y,1.5,accent);line(x,y+2,x,y+arm+2,1.5,accent);
    line(x+w-arm-2,y,x+w-2,y,1.5,accent);line(x+w,y+2,x+w,y+arm+2,1.5,accent);
    line(x+2,y+h,x+arm+2,y+h,1.5,accent);line(x,y+h-arm-2,x,y+h-2,1.5,accent);
    line(x+w-arm-2,y+h,x+w-2,y+h,1.5,accent);line(x+w,y+h-arm-2,x+w,y+h-2,1.5,accent);
  }
  function mapResourceFrame(r,accent){
    chamfer({x:r.x+1,y:r.y+1,w:r.w,h:r.h},[0,0,0,.8],3);
    chamfer(r,[.024,.07,.09,1],3);chamferOutline(r,accent,1,3);
    chamferOutline({x:r.x+2,y:r.y+2,w:r.w-4,h:r.h-4},[accent[0],accent[1],accent[2],.28],.6,1);
    line(r.x+4,r.y+1,r.x+r.w-4,r.y+1,.75,[1,.88,.62,.8]);
  }
  function mapShortcut(r,v,key,label,value,accent,kind){
    var s=M3.UILayout.get().mapScale||1,art=kind==='video'?[24,567,25,24]:kind==='share'?[91,561,29,28]:kind==='energy'?[164,561,24,29]:[230,560,30,31],
      icon={x:r.x+r.w*.5-14*s,y:r.y+10*s,w:28*s,h:28*s},badge;
    mapSkin(art[0],art[1],art[2],art[3],icon);
    if(value!==null){
      badge={x:icon.x+22*s,y:r.y+4*s,w:Math.max(25,M3.BitmapFont.measureLabel(String(value),12,.15)+6),h:Math.max(18,12*s)};
      mapResourceFrame(badge,accent);
      mapLabel(String(value),badge,12,accent,{spacing:.15,padding:3});
    }
    mapLabel(label,{x:r.x+2,y:r.y+r.h-32,w:r.w-4,h:22},16,[.64,.94,.96,1]);
  }
  function mapV2(l,v){
    var s=l.mapScale,entries=v.levelEntries||[],energyCfg=v.systems&&v.systems.M14_energy||{},
      cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],muted=[.557,.667,.698,1],amber=[.957,.718,.173,1],navy=[.024,.106,.149,1],
      top=l.mapList.y,bottom=top+l.mapList.h,i,item,node,level,r,preview,active,badge,action,name,titleY,parts,lines,j,scroll=v.mapScroll||0,
      scaleX=gl.drawingBufferWidth/l.w,scaleY=gl.drawingBufferHeight/l.h;
    rect(0,l.top,l.w,l.usable,navy);
    // One continuous sky and rail crop, excluding the original navigation icons.
    // The sky crop has no buildings that would distort when widened.
    mapSkin(111,0,40,24,{x:0,y:l.top,w:l.w,h:26*s});
    mapSkin(112,26,25,5,{x:0,y:l.top+26*s,w:l.w,h:5*s});
    mapSkin(0,31,15,587,{x:0,y:l.top+l.mapTopH,w:15*s,h:l.usable-l.mapTopH});
    mapSkin(271,31,15,587,{x:l.w-15*s,y:l.top+l.mapTopH,w:15*s,h:l.usable-l.mapTopH});
    mapSkin(43,8,67,22,l.mapBrand);
    if(!mapSkin(20,31,246,62,l.mapHeader)){
      mapMetalPanel(l.mapHeader,cyan,navy);
      text('未来都市战图',l.w*.5,l.mapHeader.y+12,2.5,paper,l.mapHeader.w-20,'center','title');
      text('选择已解锁的关卡',l.w*.5,l.mapHeader.y+53,.9,cyan,l.mapHeader.w-20,'center');
    }
    mapSkinFrame([7,94,272,458],l.mapShell,6,navy);
    mapLabel('全部关卡',{x:l.mapSection.x,y:l.mapSection.y,w:68*s,h:18*s},16,cyan);
    mapLabel('共'+(v.totalLevelCount||entries.length)+'关',{x:l.mapSection.x+l.mapSection.w-62*s,y:l.mapSection.y,w:62*s,h:18*s},16,cyan);
    line(l.mapSection.x+72*s,l.mapSection.y+9*s,l.mapSection.x+l.mapSection.w-63*s,l.mapSection.y+9*s,.65,[.16,.43,.46,1]);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(Math.floor((l.mapList.x-1)*scaleX),Math.floor((l.h-bottom)*scaleY),Math.ceil((l.mapList.w+2)*scaleX),Math.ceil(l.mapList.h*scaleY));
    for(i=0;i<entries.length;i+=1){
      item=entries[i];node=item.node||{};level=item.level||{};r=l.levelCard(i,scroll);
      if(r.y+r.h<=top||r.y>=bottom)continue;
      active=!!node.unlocked;
      mapSkinFrame([16,122,122,170],r,4,navy);
      parts=M3.MapUI.content(l,r);preview=parts.preview;
      mapTacticalPreview(preview,level);
      if(!active){
        rect(preview.x,preview.y,preview.w,preview.h,[.01,.025,.04,.43]);
        var lock={x:preview.x+preview.w*.5-25*s,y:preview.y+preview.h*.5-25*s,w:50*s,h:50*s};
        lockIcon(lock,[.66,.74,.78,1]);
      }
      badge={x:preview.x+preview.w-39*s,y:preview.y+3*s,w:Math.max(48,37*s),h:Math.max(20,16*s)};
      badge.x=preview.x+preview.w-badge.w-2*s;
      mapStatusFrame(badge,active?cyan:[.65,.78,.82,1]);
      mapLabel(active?'可挑战':'未解锁',badge,12,active?cyan:paper,{padding:4,spacing:.25});
      name=String(level.uiName||node.displayName||'城市防线').replace(/\s*[·•—]\s*第.*关\s*$/,'');
      mapLabel('第'+(i+1)+'关',parts.number,18,cyan,{padding:0});
      line(parts.divider.x,parts.divider.y,parts.divider.x+parts.divider.w,parts.divider.y,.7,[.16,.43,.46,1]);
      lines=M3.MapUI.wrap(name,14,parts.name.w);
      for(j=0;j<lines.length;j+=1)mapLabel(lines[j],{x:parts.name.x,y:parts.name.y+(parts.name.h-lines.length*16)/2+j*16,w:parts.name.w,h:16},14,cyan,{padding:0});
      if(!active)mapLabel('完成上一关解锁',parts.hint,12,muted,{spacing:.2,padding:0});
      action=parts.action;
      mapSkinFrame(active?[22,263,112,24]:[22,435,112,23],action,3,active?amber:[.35,.43,.48,1]);
      mapLabel('进入关卡',action,16.5,active?navy:[.70,.77,.80,1],{spacing:.6});
    }
    gl.disable(gl.SCISSOR_TEST);
    mapSkinFrame([5,553,276,64],l.mapDock,6,navy);
    for(i=1;i<4;i+=1)line(l.energyAd.x+l.energyAd.w*i,l.mapDock.y+16*s,l.energyAd.x+l.energyAd.w*i,l.mapDock.y+53*s,.7,[.17,.53,.57,1]);
    mapShortcut(l.energyAd,v,'','看广告','+'+(Number(energyCfg.ad_refill_amount)||5),amber,'video');
    mapShortcut(l.energyShare,v,'','分享','+'+(Number(energyCfg.share_refill_amount)||3),amber,'share');
    mapShortcut(l.energyCurrent,v,'','体力',v.energy,paper,'energy');
    mapShortcut(l.mapUpgrade,v,'','英雄强化',null,cyan,'hero');
    if(v.message){
      var notice={x:l.w*.10,y:l.mapDock.y-38,w:l.w*.80,h:30};
      chamfer(notice,[.024,.106,.149,.97],4);chamferOutline(notice,amber,1,4);
      text(v.message,l.w*.5,notice.y+7,.9,paper,notice.w-16,'center','label');
    }
  }
  function mapDialog(l,v){
    var d=v.mapDialog,r=l.mapDialog,lines=d.lines||[],i,j,button,row,wrapped,lineH=20,
      navy=[.024,.106,.149,1],cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],muted=[.557,.667,.698,1],
      labels={home:'指挥中心',menu:'作战终端',help:'行动指南',energy:'补给情报',exit:'离开确认',exited:'行动结束'},
      contentTop=r.y+104,contentBottom=l.mapDialogActions[0].y-14,rowH=Math.min(58,(contentBottom-contentTop)/Math.max(1,lines.length)),title={x:r.x+24,y:r.y+31,w:r.w-48,h:46};
    drawRect(0,l.top,l.w,l.usable,[0,0,0,.66]);
    mapSkinFrame([25,322,886,1245],r,36,navy,heroSkin,r.w/886);
    var tab={x:r.x+r.w*.25,y:r.y-9,w:r.w*.5,h:29};
    mapSkinFrame([254,300,426,86],tab,35,navy,heroSkin,r.w/886);mapLabel(labels[d.kind]||'作战终端',tab,16,paper);
    // One code-drawn title circuit fits dynamic headings without distorting text.
    chamferOutline({x:title.x-4,y:title.y-6,w:title.w+8,h:58},[cyan[0],cyan[1],cyan[2],.6],1,8);
    mapLabel(d.title,title,26,paper);
    for(i=0;i<lines.length;i+=1){
      row={x:r.x+20,y:contentTop+i*rowH,w:r.w-40,h:rowH-6};
      chamfer(row,[.035,.14,.19,1],5);chamferOutline(row,[.13,.32,.37,1],1,5);
      var badge={x:row.x+8,y:row.y+(row.h-22)/2,w:24,h:22};
      mapStatusFrame(badge,cyan);mapLabel(String(i+1),badge,12,cyan);
      wrapped=M3.MapUI.wrap(lines[i],14,row.w-52);
      for(j=0;j<wrapped.length&&j<2;j+=1)mapLabel(wrapped[j],{x:row.x+42,y:row.y+(row.h-Math.min(2,wrapped.length)*lineH)/2+j*lineH,w:row.w-50,h:lineH},14,paper,{align:'left',padding:0});
    }
    for(i=0;i<d.actions.length;i+=1){
      button=l.mapDialogActions[i];
      // Amber is the action, steel is the secondary return/close control.
      mapSkinFrame(i===0?[478,1415,387,102]:[68,1415,387,102],button,20,navy,heroSkin,.5);
      // Source centers stay empty so each live label is centered without a baked-in arrow.
      var inside={x:button.x+10,y:button.y+6,w:button.w-20,h:button.h-12};
      heroSkin(i===0?540:125,1438,140,45,inside);
      mapLabel(d.actions[i],button,18,i===0?navy:paper);
    }
    heroSkin(798,329,100,92,{x:l.mapDialogClose.x+8,y:l.mapDialogClose.y+8,w:32,h:32});
  }
  function detailLegend(r,level,p){
    var map=level.map||{},types=['spawn','goal','hero_slot'],labels=['敌人入口','核心基地','英雄部署'],colors=[p.violet,[.86,.71,.36,1],p.cyan],groupW=r.w/3,i,x,key;
    for(i=0;i<types.length;i+=1){
      x=r.x+groupW*i+10;key=map.tileAssets&&map.tileAssets[types[i]];
      if(!imageAsset(key,x,r.y+7,24,24,1)){diamond(x+12,r.y+19,14,14,colors[i]);diamond(x+12,r.y+19,7,7,p.navy);}
      text(labels[i],x+31,r.y+13,.61,[.82,.87,.80,1],groupW-38,'left','body');
    }
  }
  function detailGlassPanel(r,opacity,warm){
    chamfer({x:r.x+1,y:r.y+2,w:r.w,h:r.h},[.015,.018,.015,.07],10);
    chamfer(r,warm?[.10,.095,.075,opacity]:[.035,.045,.040,opacity],10);
    chamferOutline(r,warm?[.86,.81,.65,.34]:[.82,.87,.80,.28],1,10);
    line(r.x+15,r.y+1,r.x+r.w-15,r.y+1,.7,[.96,.97,.89,.23]);
  }
  function detailGlassButton(r,label,primary){
    chamfer(r,primary?[.68,.69,.56,.22]:[.15,.18,.16,.18],8);
    chamferOutline(r,primary?[.88,.86,.69,.48]:[.82,.87,.80,.30],1,8);
    text(label,r.x+r.w*.5,r.y+(r.h-18)*.5,1.02,[.97,.97,.91,1],r.w*.88,'center','button');
  }
  function briefingSkin(sx,sy,sw,sh,r){
    return imageRegion('ui-level-briefing',r.x,r.y,r.w,r.h,sx/853,1-sy/1844,(sx+sw)/853,1-(sy+sh)/1844,[1,1,1,1],1,false,0);
  }
  function briefingButton(r,label,primary){
    var navy=[.024,.106,.149,1],paper=[.835,.957,.937,1];
    mapSkinFrame(primary?[336,1690,490,113]:[28,1690,292,113],r,25,primary?[.957,.718,.173,1]:[.29,.38,.45,1],briefingSkin,.45);
    mapLabel(label,{x:r.x+8,y:r.y,w:r.w-16,h:r.h},18,primary?navy:paper);
  }
  function detailV2(l,v){
    var level=v.levelPreview||{},header=l.detailHeader,mapFrame=l.detailMapFrame,desc=l.detailObjective,
      cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],muted=[.557,.667,.698,1],amber=[.957,.718,.173,1],navy=[.024,.106,.149,1],
      title=String(level.uiName||'关卡详情').replace(/\s*[·•]\s*第\s*[\d\s-]+\s*关\s*$/,''),objective=String(level.objective||level.description||'守住防线'),
      badge={x:header.x+header.w-94,y:header.y+(header.h-36)/2,w:78,h:36},nameRect={x:header.x+18,y:header.y+14,w:header.w-128,h:header.h-28},i,j,parts;
    sceneBackdrop(l,v,null,1,true);drawRect(0,l.top,l.w,l.usable,[0,0,0,.66]);
    // Component crops omit the concept artwork's static map, names and sample numbers.
    briefingSkin(83,59,230,88,{x:14,y:l.top+10,w:110,h:36});
    var tab={x:130,y:l.top+13,w:l.w<360?106:132,h:30};
    mapSkinFrame([322,88,320,70],tab,22,navy,briefingSkin,.4);mapLabel('关卡简报',tab,16,cyan);
    mapSkinFrame([22,159,809,193],header,30,navy,briefingSkin,.45);
    var titleSize=l.w<360?28:42,titleGap=12,
      titleW=Math.min(M3.BitmapFont.measureLabel(title,titleSize),header.w-badge.w-titleGap-36),
      titleX=header.x+(header.w-titleW-titleGap-badge.w)/2;
    nameRect={x:titleX,y:header.y+10,w:titleW,h:header.h-20};badge.x=titleX+titleW+titleGap;
    mapStatusFrame(badge,cyan);mapLabel('第'+(v.difficulty||1)+'关',badge,18,cyan);
    parts=M3.MapUI.wrap(title,titleSize,nameRect.w);
    var titleLine=Math.min(titleSize+2,nameRect.h/Math.min(2,parts.length));
    for(i=0;i<Math.min(2,parts.length);i+=1)mapLabel(parts[i],{x:nameRect.x,y:nameRect.y+(nameRect.h-Math.min(2,parts.length)*titleLine)/2+i*titleLine,w:nameRect.w,h:titleLine},Math.min(titleSize,titleLine),paper,{align:'left',padding:0});
    mapSkinFrame([22,355,809,1032],mapFrame,30,navy,briefingSkin,.45);
    mapLabel('战术地图',{x:mapFrame.x+18,y:mapFrame.y+(l.w<360?4:8),w:100,h:26},18,cyan,{align:'left',padding:0});
    line(mapFrame.x+130,mapFrame.y+23,mapFrame.x+mapFrame.w-22,mapFrame.y+23,1,[.13,.43,.47,1]);
    mapPreview(l.detailPreview,level,v);
    var legend=l.detailLegend,group=legend.w/3,types=['spawn','goal','hero_slot'],labels=['敌人入口','核心基地','英雄部署'],colors=[[.68,.30,.95,1],amber,cyan];
    for(i=0;i<3;i+=1){
      var legendSize=l.w<360?12:14,labelW=M3.BitmapFont.measureLabel(labels[i],legendSize),
        x=legend.x+i*group+(group-24-6-labelW)/2,key=level.map&&level.map.tileAssets&&level.map.tileAssets[types[i]];
      if(!imageAssetContain(key,x,legend.y+4,24,24,1))diamond(x+12,legend.y+16,14,14,colors[i]);
      mapLabel(labels[i],{x:x+30,y:legend.y,w:labelW,h:32},legendSize,paper,{align:'left',padding:0});
    }
    mapSkinFrame([22,1385,809,232],desc,24,navy,briefingSkin,.5);
    mapLabel('关卡目标',{x:desc.x+18,y:desc.y+9,w:120,h:24},18,cyan,{align:'left',padding:0});
    var objectiveSize=l.w<360?14:16,objectiveLine=l.w<360?18:22,
      bodyTop=desc.y+38,bodyH=desc.h-48,iconSize=l.w<360?36:44,
      objectiveX=desc.x+72,objectiveW=desc.w-88;
    briefingSkin(96,1483,82,80,{x:desc.x+18,y:bodyTop+(bodyH-iconSize)/2,w:iconSize,h:iconSize});
    parts=M3.MapUI.wrap(objective,objectiveSize,objectiveW);
    var objectiveLines=Math.min(2,parts.length),copyH=objectiveLines*objectiveLine+5+18,copyY=bodyTop+(bodyH-copyH)/2;
    for(i=0;i<objectiveLines;i+=1)mapLabel(parts[i],{x:objectiveX,y:copyY+i*objectiveLine,w:objectiveW,h:objectiveLine},objectiveSize,paper);
    mapLabel('先选择英雄，再搭配四座防御塔',{x:objectiveX,y:copyY+objectiveLines*objectiveLine+5,w:objectiveW,h:18},12,muted);
    var flow=l.detailFlow,flowLabels=['关卡简报','选择英雄','搭配防御塔'],flowW=flow.w/3;
    for(j=0;j<3;j+=1){
      var flowSize=l.w<360?10:12,flowTextW=M3.BitmapFont.measureLabel(flowLabels[j],flowSize),
        flowX=flow.x+j*flowW+(flowW-14-17-flowTextW)/2,cx=flowX+6,cy=flow.y+flow.h/2,
        statusColor=j===0?cyan:muted,k,a,b;
      for(k=0;k<16;k+=1){a=k*Math.PI/8;b=(k+1)*Math.PI/8;line(cx+6*Math.cos(a),cy+6*Math.sin(a),cx+6*Math.cos(b),cy+6*Math.sin(b),2,statusColor);}
      if(j===0)chamfer({x:cx-2,y:cy-2,w:4,h:4},cyan,1);
      mapLabel(flowLabels[j],{x:flowX+17,y:flow.y,w:flowTextW,h:flow.h},flowSize,statusColor,{padding:0});
      if(j<2)mapLabel('→',{x:flow.x+(j+1)*flowW-14,y:flow.y,w:18,h:flow.h},12,cyan);
    }
    briefingButton(l.detailBack,'返回',false);briefingButton(l.detailStart,'选择出战英雄',true);
    briefingSkin(741,76,85,75,{x:l.detailClose.x+7,y:l.detailClose.y+7,w:34,h:34});
  }
  function loadoutPanel(r,selected){
    chamfer(r,selected?[.095,.10,.075,.82]:[.035,.042,.043,.72],9);
    chamferOutline(r,selected?[.88,.82,.62,.90]:[.74,.77,.72,.30],selected?1.8:1,9);
  }
  function loadoutCheck(r){
    var x=r.x+r.w-22,y=r.y+16;
    chamfer({x:x-10,y:y-10,w:20,h:20},[.82,.78,.60,.96],5);
    line(x-5,y,x-1,y+4,2,[.10,.14,.12,1]);line(x-1,y+4,x+6,y-5,2,[.10,.14,.12,1]);
  }
  function loadoutHeader(l,title,hint,count,step,section){
    var y=l.top+Math.max(42,Math.min(47,l.usable*.052));
    rect(0,l.top,l.w,l.usable,[.018,.022,.025,.28]);
    text((section||'出战准备')+'  ·  '+step,l.w*.045,y,.54,[.77,.80,.73,1],l.w*.9,'left');
    text(title,l.w*.045,y+23,1.42,[.97,.96,.91,1],l.w*.76,'left','title');
    text(hint,l.w*.045,y+57,.60,[.77,.79,.75,1],l.w*.76,'left');
    if(count)text(count,l.w*.955,y+28,.91,[.89,.85,.68,1],l.w*.18,'right','label');
  }
  function loadoutButton(r,label,primary,enabled){
    var available=enabled!==false;
    chamfer(r,primary?(available?[.30,.32,.24,.82]:[.065,.075,.075,.78]):[.04,.05,.05,.72],8);
    chamferOutline(r,primary&&available?[.86,.82,.64,.68]:[.68,.73,.69,.28],1,8);
    text(label,r.x+r.w*.5,r.y+(r.h-18)*.5,.90,available?[.96,.95,.88,1]:[.52,.58,.55,1],r.w*.9,'center','button');
  }
  function towerSkin(sx,sy,sw,sh,r){
    return imageRegion('ui-tower-interface',r.x,r.y,r.w,r.h,sx/286,1-sy/618,(sx+sw)/286,1-(sy+sh)/618,[1,1,1,1],1,false,0);
  }
  function towerBlueprint(r){
    var s=M3.Layout.w/286,tile=40*s,x,y,w,h;
    for(y=0;y<r.h;y+=tile)for(x=0;x<r.w;x+=tile){w=Math.min(tile,r.w-x);h=Math.min(tile,r.h-y);towerSkin(40,211,w/s,h/s,{x:r.x+x,y:r.y+y,w:w,h:h});}
  }
  function towerSelectionMark(r,selected){
    var x=r.x+r.w-16,y=r.y+15,c=selected?[.957,.718,.173,1]:[.38,.72,.76,1],i,a,b,vertices=[];
    if(towerSkin(selected?244:116,184,18,18,{x:x-10,y:y-10,w:20,h:20}))return;
    for(i=0;i<12;i+=1){a=i*Math.PI/6;b=(i+1)*Math.PI/6;if(selected)vertices.push(x,y,x+9*Math.cos(a),y+9*Math.sin(a),x+9*Math.cos(b),y+9*Math.sin(b));else line(x+8*Math.cos(a),y+8*Math.sin(a),x+8*Math.cos(b),y+8*Math.sin(b),1,c);}
    if(selected){solid(vertices,c);line(x-4,y,x-1,y+3,2,[.03,.10,.13,1]);line(x-1,y+3,x+5,y-4,2,[.03,.10,.13,1]);}
  }
  function towerModalButton(r,label,primary,enabled,fontSize){
    var amber=[.957,.718,.173,1],steel=enabled?[.45,.54,.58,1]:[.27,.34,.39,1],navy=[.024,.106,.149,1];
    if(!towerSkin(primary&&enabled?146:20,496,121,31,r))mapMetalPanel(r,amber,primary&&enabled?amber:steel);
    mapLabel(label,r,fontSize||18,enabled?navy:[.28,.36,.40,1]);
  }
  function deckV2(l,v){
    var rows=l.towerCards,chosen={},i,j,r,c,art,selected,back={},p=l.towerModal,
      cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],muted=[.557,.667,.698,1],amber=[.957,.718,.173,1],navy=[.024,.106,.149,1],
      ready=v.deckValid&&v.heroes.length===1,required=v.deckSize||4,tag,coinX,costW;
    for(i in v)if(Object.prototype.hasOwnProperty.call(v,i))back[i]=v[i];back.message='';back.mapDialog=null;
    mapV2(l,back);drawRect(0,l.top,l.w,l.usable,[0,0,0,.66]);
    mapSkinFrame([8,107,270,431],p,10,navy,towerSkin);
    tag={x:p.x+p.w*.25,y:p.y-9,w:p.w*.50,h:29};
    mapSkinFrame([78,97,130,29],tag,10,navy,towerSkin);mapLabel('出战准备 2 / 2',tag,16,paper);
    // Keep the complete title circuit border instead of cropping only its text and bottom line.
    towerSkin(26,128,230,43,{x:p.x+24,y:p.y+27,w:p.w-48,h:(p.w-48)*43/230});
    var subtitle='选择'+required+'座防御塔',subtitleW=M3.BitmapFont.measureLabel(subtitle,16)+12;
    rect(l.w*.5-subtitleW*.5,p.y+70,subtitleW,22,navy);
    mapLabel(subtitle,{x:p.x+28,y:p.y+70,w:p.w-56,h:22},16,cyan);
    // Close control stays above the complete title artwork and its circuit border.
    towerSkin(244,108,35,31,{x:l.towerClose.x+8,y:l.towerClose.y+8,w:32,h:32});

    (v.deck||[]).forEach(function(id){chosen[id]=true;});
    for(i=0;i<rows.length;i+=1){
      r=rows[i];c=v.cards[i];if(!c)continue;selected=!!chosen[c.id];
      mapSkinFrame(selected?[145,177,122,98]:[19,177,122,98],r,6,[.028,.115,.16,1],towerSkin);
      art={x:r.x+8,y:r.y+26,w:r.w-16,h:r.h-49};
      towerBlueprint(art);
      mapLabel(c.uiName||('防御塔 '+(i+1)),{x:r.x+8,y:r.y+4,w:r.w-35,h:22},18,paper,{align:'left',padding:0});
      imageAssetContain(c.portraitAsset,art.x,art.y,art.w,art.h,1)||actor(r.x+r.w*.5,art.y+art.h*.5,Math.min(art.w,art.h)*.8,c.appearance,c.color);
      costW=M3.BitmapFont.measureLabel(String(c.purchaseCost),14)+22;coinX=r.x+r.w-costW-6;
      var coinVertices=[],angle,nextAngle,k,cx=coinX+7,cy=r.y+r.h-14;
      for(k=0;k<12;k+=1){angle=k*Math.PI/6;nextAngle=(k+1)*Math.PI/6;coinVertices.push(cx,cy,cx+6*Math.cos(angle),cy+6*Math.sin(angle),cx+6*Math.cos(nextAngle),cy+6*Math.sin(nextAngle));}
      solid(coinVertices,amber);line(cx-2,cy-3,cx-2,cy+2,1,[1,.90,.48,1]);
      mapLabel(String(c.purchaseCost),{x:coinX+16,y:r.y+r.h-24,w:costW-16,h:20},14,paper,{align:'right',padding:0});
      mapLabel(c.roleDescription||'通用防御单位',{x:r.x+8,y:r.y+r.h-23,w:Math.max(35,coinX-r.x-12),h:18},12,muted,{align:'left',padding:0,spacing:0});
      towerSelectionMark(r,selected);
    }
    mapLabel('已选 '+v.deck.length+' / '+required,l.towerCounter,16,v.deck.length===required?cyan:paper);
    towerModalButton(l.towerPrev,'上一步',false,true);
    towerModalButton(l.towerStart,'开始战斗',true,ready);
    if(v.message){
      var notice={x:p.x+18,y:l.towerCounter.y-31,w:p.w-36,h:28};
      chamfer(notice,navy,4);chamferOutline(notice,amber,1,4);mapLabel(v.message,notice,13,paper);
    }
  }
  function heroUpgradeHeader(l,v,selected,preview,rows){
    var margin=l.w*.045,y=l.top+Math.max(50,Math.min(58,l.usable*.065)),balance={x:l.w-margin-110,y:y-5,w:110,h:34},summary={x:margin,y:y+36,w:l.w-margin*2,h:Math.min(56,rows[0].y-y-46)},compact=summary.h<44,name=selected?heroDisplayName(selected.uiName):'选择下方英雄',level='',benefit='查看下一等级的强化效果';
    rect(0,l.top,l.w,l.usable,[.018,.022,.025,.28]);
    text('英雄升级',margin,y,1.36,[.97,.96,.91,1],l.w*.55,'left','title');
    chamfer(balance,[.13,.15,.12,.65],6);
    chamferOutline(balance,[.78,.77,.62,.30],.8,6);
    text('材料',balance.x+10,balance.y+11,.55,[.74,.77,.70,1],36,'left');
    text(String(v.materials||0),balance.x+balance.w-10,balance.y+7,.85,[.94,.88,.68,1],60,'right','label');
    chamfer(summary,[.05,.065,.06,.70],7);
    if(selected&&preview){
      level=preview.level>=preview.maxLevel?'等级 '+preview.level+' · 已满级':'等级 '+preview.level+' 升至 '+preview.nextLevel;
      benefit=(preview.level>=preview.maxLevel?'当前攻击加成 +':'升级后攻击加成 +')+(preview.level>=preview.maxLevel?preview.currentBonus:preview.nextBonus)+'%';
    }
    text(name,summary.x+12,summary.y+(compact?4:8),compact?.58:.72,[.91,.94,.88,1],summary.w*.54,'left','label');
    if(level)text(level,summary.x+summary.w-12,summary.y+(compact?5:9),compact?.48:.55,[.69,.76,.68,1],summary.w*.43,'right');
    text(benefit,summary.x+12,summary.y+(compact?19:32),compact?.50:.61,selected?[.88,.83,.62,1]:[.62,.70,.64,1],summary.w-24,'left');
  }
  function loadoutHeroCard(r,h,selected){
    var art={x:r.x+10,y:r.y+10,w:r.h-20,h:r.h-20},infoX=art.x+art.w+16,infoW=r.x+r.w-infoX-18,badge;
    loadoutPanel(r,selected);
    imageAssetContain(h.portraitAsset,art.x,art.y,art.w,art.h,1)||actor(art.x+art.w*.5,art.y+art.h*.5,art.h*.85,h.appearance,h.color);
    text(heroDisplayName(h.uiName),infoX,r.y+r.h*.22,1.03,[.97,.96,.91,1],infoW-12,'left','title');
    text(h.roleDescription||'支援全场的英雄单位',infoX,r.y+r.h*.45,.62,[.74,.79,.73,1],infoW,'left');
    badge={x:infoX,y:r.y+r.h*.70,w:78,h:21};
    chamfer(badge,[.30,.33,.28,.40],4);
    text('等级 '+h.level,badge.x+9,badge.y+4,.55,[.89,.85,.68,1],badge.w-14,'left','label');
    if(selected)loadoutCheck(r);
  }
  function heroSkin(sx,sy,sw,sh,r){
    return imageRegion('ui-hero-interface',r.x,r.y,r.w,r.h,sx/935,1-sy/1683,(sx+sw)/935,1-(sy+sh)/1683,[1,1,1,1],1,false,0);
  }
  function heroBust(h,r){
    var key=h.portraitAsset,image=M3.TextureAssets.get(key),meta=M3.TextureAssets.meta(key),region=meta&&meta.render&&meta.render.region||[0,0,1,1],sw=image&&(image.naturalWidth||image.width),sh=image&&(image.naturalHeight||image.height),c,u0,v0,u1,v1;
    if(!sw||!sh)return false;
    c=M3.MapUI.heroPortraitRegion(h,sw*(region[2]-region[0])/(sh*(region[3]-region[1])),r.w/r.h);
    u0=region[0]+c[0]*(region[2]-region[0]);u1=region[0]+c[2]*(region[2]-region[0]);v0=region[1]+c[1]*(region[3]-region[1]);v1=region[1]+c[3]*(region[3]-region[1]);
    return imageRegion(key,r.x,r.y,r.w,r.h,u0,1-v0,u1,1-v1,[1,1,1,1],1,false,0);
  }
  function heroSelectV2(l,v){
    var p=l.heroModal,rows=l.heroModalCards,back={},i,h,r,selected,art,infoX,infoW,infoY,tag,
      navy=[.024,.106,.149,1],cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],muted=[.557,.667,.698,1];
    for(i in v)if(Object.prototype.hasOwnProperty.call(v,i))back[i]=v[i];back.message='';back.mapDialog=null;
    mapV2(l,back);drawRect(0,l.top,l.w,l.usable,[0,0,0,.66]);
    // Sample only independent UI components; the reference map and blank portrait placeholders are never drawn.
    mapSkinFrame([25,322,886,1245],p,36,navy,heroSkin,p.w/886);
    tag={x:p.x+p.w*.25,y:p.y-9,w:p.w*.50,h:29};
    mapSkinFrame([254,300,426,86],tag,35,navy,heroSkin,p.w/886);mapLabel('出战准备 1 / 2',tag,16,paper);
    heroSkin(83,397,765,152,{x:p.x+23,y:p.y+27,w:p.w-46,h:(p.w-46)*152/765});
    var subW=M3.BitmapFont.measureLabel('选择一名英雄',16)+16;
    rect(l.w/2-subW/2,p.y+70,subW,22,navy);mapLabel('选择一名英雄',{x:p.x+28,y:p.y+70,w:p.w-56,h:22},16,cyan);
    // Close control stays above the complete title artwork and its circuit border.
    heroSkin(798,329,100,92,{x:l.heroClose.x+8,y:l.heroClose.y+8,w:32,h:32});
    for(i=0;i<rows.length;i+=1){
      h=v.heroCards[i];if(!h)continue;r=rows[i];selected=(v.heroes||[]).indexOf(h.id)!==-1;
      // Nine-slicing keeps the outer armor crisp while the live portrait and labels fit each screen.
      mapSkinFrame(selected?[58,585,818,260]:[58,860,818,256],r,22,navy,heroSkin,p.w/886);
      art={x:r.x+6,y:r.y+6,w:(r.w-12)*.44,h:r.h-12};
      heroSkin(96,889,326,200,art);heroBust(h,art)||actor(art.x+art.w/2,art.y+art.h/2,art.h,h.appearance,h.color);
      infoX=art.x+art.w+12;infoW=r.x+r.w-infoX-10;infoY=r.y+(r.h-79)/2;
      // Clear the generated placeholder UI; all text and selected state are live.
      rect(infoX-3,r.y+10,infoW+4,r.h-20,navy);
      mapLabel(heroDisplayName(h.uiName),{x:infoX,y:infoY,w:infoW-23,h:25},18,paper,{align:'left',padding:0});
      tag={x:infoX,y:infoY+30,w:Math.min(94,infoW-6),h:22};
      heroSkin(487,975,182,50,tag);mapLabel((h.roleDescription||'战役支援').replace(/角色$/,''),tag,12,cyan);
      mapLabel('等级 '+(h.level||1),{x:infoX,y:infoY+57,w:infoW,h:22},14,muted,{align:'left',padding:0});
      heroSkin(selected?775:776,selected?637:914,62,62,{x:r.x+r.w-30,y:r.y+12,w:21,h:21});
    }
    heroSkin(68,1415,387,102,l.heroCancel);mapLabel('取消',l.heroCancel,18,paper);
    heroSkin(v.heroes.length===1?478:68,1415,387,102,l.heroNext);
    mapLabel('下一步',{x:l.heroNext.x,y:l.heroNext.y,w:l.heroNext.w-25,h:l.heroNext.h},18,v.heroes.length===1?navy:muted);
  }
  function progressionV2(l,v){progression(l,v);}
  function settlementLabel(value,r,size,face,raised,options){
    var shifted={x:r.x,y:r.y,w:r.w,h:r.h};
    if(raised){
      shifted.y=r.y+3;mapLabel(value,shifted,size,[.015,.045,.065,1],options);
      shifted.y=r.y+2;mapLabel(value,shifted,size,[face[0]*.36,face[1]*.36,face[2]*.36,1],options);
      shifted.y=r.y-1;mapLabel(value,shifted,size,[Math.min(1,face[0]+.25),Math.min(1,face[1]+.2),Math.min(1,face[2]+.2),1],options);
    }
    mapLabel(value,r,size,face,options);
    shifted.y=r.y;shifted.x=r.x+.55;mapLabel(value,shifted,size,face,options);
  }
  function settlementAction(r,label,primary,enabled,key){
    var navy=[.024,.106,.149,1],color=enabled?navy:[.28,.36,.40,1],size=18,
      labelW=M3.BitmapFont.measureLabel(label,size)+8,icon=enabled?28:0,gap=enabled?8:0,
      start=r.x+(r.w-labelW-icon-gap)/2;
    if(!towerSkin(primary&&enabled?146:20,496,121,31,r))mapMetalPanel(r,[.957,.718,.173,1],primary?[.957,.718,.173,1]:[.45,.54,.58,1]);
    if(enabled)imageAssetContain(key,start,r.y+(r.h-28)/2,28,28,1);
    settlementLabel(label,{x:start+icon+gap,y:r.y,w:labelW,h:r.h},size,color,false);
  }
  function resultV2(l,v){
    var win=v.result==='win',data=v.resultData||{},panel=l.resultPanel,rewards=l.resultRewards,
      cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],muted=[.557,.667,.698,1],amber=[.957,.718,.173,1],navy=[.024,.106,.149,1],red=[.851,.341,.333,1],
      i,r,tag,button=l.resultDouble,back=l.resultButton;
    if(v.combat)battle(l,v);else sceneBackdrop(l,v,null,1,true);
    drawRect(0,l.top,l.w,l.usable,[0,0,0,.68]);
    mapSkinFrame([25,322,886,1245],panel,36,navy,heroSkin,panel.w/886);
    tag={x:panel.x+panel.w*.25,y:panel.y-10,w:panel.w*.5,h:30};
    mapSkinFrame([254,300,426,86],tag,35,navy,heroSkin,panel.w/886);mapLabel('战斗结算',tag,18,paper);
    imageAssetContain(win?'ui-settlement-win-v2':'ui-settlement-lose-v2',l.resultBadge.x,l.resultBadge.y,l.resultBadge.w,l.resultBadge.h,1);
    settlementLabel(win?copy(v,'resultWin','守护成功'):copy(v,'resultLose','防线失守'),{x:panel.x+24,y:panel.y+panel.h*.29,w:panel.w-48,h:36},30,win?[.60,.98,1,1]:[1,.43,.40,1],true);
    mapLabel(win?'防线稳固 · 奖励已结算':'防线失守 · 成长仍会保留',{x:panel.x+20,y:panel.y+panel.h*.37,w:panel.w-40,h:22},14,paper);
    for(i=0;i<2;i+=1){
      r=rewards[i];mapSkinFrame([58,860,818,256],r,22,navy,heroSkin,panel.w/886);
      settlementLabel(i?'成长经验':'局外货币',{x:r.x+6,y:r.y+5,w:r.w-12,h:22},16,paper,false);
      imageAssetContain(i?'ui-settlement-experience-v2':'ui-settlement-coins-v2',r.x+r.w/2-32,r.y+29,64,54,1);
      settlementLabel('+'+(i?(data.xp||0):(data.outerCurrency||0)),{x:r.x+8,y:r.y+r.h-32,w:r.w-16,h:26},24,i?cyan:amber,true);
    }
    settlementLabel('奖励将用于英雄强化与永久成长',{x:panel.x+18,y:panel.y+panel.h*.70,w:panel.w-36,h:22},13,paper,false);
    settlementAction(button,data.doubled?'双倍奖励已领取':'观看广告 · 奖励翻倍',false,!data.doubled,'ui-settlement-video-v2');
    settlementAction(back,copy(v,'resultAction','返回地图'),true,true,'ui-settlement-map-v2');
  }
  function battleHudRects(l){var gap=5,w=(l.w-24-gap*2)/3,y=l.battleHudTop;return[{x:12,y:y,w:w,h:56},{x:12+w+gap,y:y,w:w,h:56},{x:12+2*(w+gap),y:y,w:w,h:56}];}
  function battleHudIcon(type,x,y,size,color){
    var cx=x+size*.5,cy=y+size*.5,ink=[.012,.05,.075,1],cyan=[.278,.863,.906,1];
    if(type==='coin'){
      chamfer({x:x+1,y:y+2,w:size-2,h:size-2},[.36,.20,.025,1],size*.23);
      chamfer({x:x+2,y:y,w:size-4,h:size-3},[.98,.74,.15,1],size*.22);
      chamferOutline({x:x+4,y:y+2,w:size-8,h:size-7},[1,.88,.36,1],1.5,size*.17);
      chamfer({x:x+7,y:y+5,w:size-14,h:size-13},[.86,.55,.08,1],size*.10);line(x+size*.30,y+size*.23,x+size*.65,y+size*.23,1,[1,.91,.43,1]);line(x+size*.25,y+size*.30,x+size*.25,y+size*.62,1,[1,.91,.43,1]);line(x+size*.70,y+size*.38,x+size*.70,y+size*.70,1,[.65,.34,.015,1]);return;
    }
    if(type==='wave'){
      solid([x+size*.12,y+size*.12,x+size*.34,y+size*.18,cx,y+size*.30,cx,y+size*.30,x+size*.66,y+size*.18,x+size*.88,y+size*.12,x+size*.88,y+size*.12,x+size*.96,y+size*.48,x+size*.78,y+size*.72,x+size*.78,y+size*.72,x+size*.22,y+size*.72,x+size*.04,y+size*.48,x+size*.04,y+size*.48,x+size*.12,y+size*.12,cx,y+size*.30,cx,y+size*.30,x+size*.88,y+size*.12,x+size*.78,y+size*.72,cx,y+size*.30,x+size*.78,y+size*.72,x+size*.22,y+size*.72,cx,y+size*.30,x+size*.22,y+size*.72,x+size*.04,y+size*.48],cyan);
      solid([x+size*.20,y+size*.40,x+size*.43,y+size*.46,x+size*.32,y+size*.57,x+size*.57,y+size*.46,x+size*.80,y+size*.40,x+size*.68,y+size*.57],ink);
      for(var i=0;i<3;i++)rect(x+size*(.28+i*.17),y+size*.67,size*.10,size*.25,cyan);return;
    }
    var points=[[cx,y+size*.08],[x+size*.90,y+size*.24],[x+size*.85,y+size*.65],[cx,y+size*.94],[x+size*.15,y+size*.65],[x+size*.10,y+size*.24]],i,next;
    for(i=0;i<points.length;i++){next=(i+1)%points.length;solid([cx,cy,points[i][0],points[i][1],points[next][0],points[next][1]],cyan);}
    for(i=0;i<points.length;i++){points[i]=[cx+(points[i][0]-cx)*.72,cy+(points[i][1]-cy)*.72];}for(i=0;i<points.length;i++){next=(i+1)%points.length;line(points[i][0],points[i][1],points[next][0],points[next][1],2,ink);}
  }
  function battleHudText(v,r,label,value,accent,icon){
    var small=r.w<110,iconSize=small?26:32,offset=small?36:43;
    battleHudIcon(icon,r.x+8,r.y+(r.h-iconSize)/2,iconSize,accent);
    mapLabel(label,{x:r.x+offset,y:r.y+5,w:r.w-offset-5,h:19},small?12:14,[.278,.863,.906,1],{padding:0});
    mapLabel(small?String(value).replace(/ /g,''):String(value),{x:r.x+offset-2,y:r.y+26,w:r.w-offset-3,h:25},small?18:22,icon==='coin'?[.957,.718,.173,1]:[.835,.957,.937,1],{padding:0});
  }
  function battleBackdrop(l,v){
    var panels=battleHudRects(l),i,cyan=[.278,.863,.906,1];
    battleRepeat(22,19,210,48,{x:6,y:l.top,w:l.w-12,h:42},.9);
    mapSkinFrame([43,8,67,22],{x:16,y:l.top+5,w:142,h:34},5,[.024,.106,.149,1],mapSkin,1.2);mapLabel('启元传说',{x:20,y:l.top+7,w:134,h:28},20,cyan);
    for(i=0;i<3;i++)mapSkinFrame([16,122,122,170],panels[i],4,[.024,.106,.149,1],mapSkin,1.5);
    battleHudText(v,panels[0],'金币',v.combat.gold,cyan,'coin');battleHudText(v,panels[1],'波次',v.combat.wave+' / '+v.combat.waveCount,cyan,'wave');battleHudText(v,panels[2],'基地生命',v.combat.baseHp,cyan,'base');
  }
  function battleBoardFrame(l,v){var p=uiPalette(v),r={x:l.board.x,y:l.board.y,w:l.board.w,h:l.board.h};chamferOutline(r,p.frame,2,8);chamferOutline({x:r.x+2,y:r.y+2,w:r.w-4,h:r.h-4},[p.cyan[0],p.cyan[1],p.cyan[2],.78],1,6);diamond(r.x+r.w*.5,r.y,10,10,p.accent);diamond(r.x+r.w*.5,r.y+r.h,10,10,p.primary);diamond(r.x,r.y+r.h*.5,8,8,p.frame);diamond(r.x+r.w,r.y+r.h*.5,8,8,p.frame);}
  // Coordinates refer to the approved 941 x 1672 concept, packed as an 800 x 1080 crop.
  function supportSkin(sx,sy,sw,sh,r){
    return imageRegion('ui-support-dossier',r.x,r.y,r.w,r.h,(sx-70)/800,1-(sy-260)/1080,(sx+sw-70)/800,1-(sy+sh-260)/1080,[1,1,1,1],1,false,0);
  }
  function supportButton(r,purple,label,secondary){
    var source=secondary?[287,1178,367,113]:[purple?502:133,1022,307,96],
      fill=secondary?[.025,.075,.12,1]:purple?[.075,.025,.15,1]:[.015,.14,.16,1],
      ink=[.87,.96,1,1],size=r.w<125?12:14,groupW=6*size+17,start=r.x+(r.w-groupW)/2;
    mapSkinFrame(source,r,18,fill,supportSkin,.60);
    if(!secondary){
      chamfer({x:start,y:r.y+r.h/2-8,w:16,h:16},purple?[.64,.47,.93,1]:[.32,.87,.96,1],2);
      solid([start+6,r.y+r.h/2-4,start+6,r.y+r.h/2+4,start+12,r.y+r.h/2],[.015,.04,.08,1]);
      mapLabel(label,{x:start+21,y:r.y+5,w:groupW-17,h:r.h-10},size,ink,{padding:0,spacing:0});
    }else mapLabel(label,{x:r.x+12,y:r.y+6,w:r.w-24,h:r.h-12},18,ink,{padding:0});
  }
  function itemModalV2(l,v){
    var modal=l.itemModal,navy=[.018,.045,.075,1],paper=[.85,.95,1,1],cyan=[.25,.87,.97,1],
      i,r,item,clear,art,artH,nameY,description,lines,j,action,crestW=Math.min(136,modal.w*.36);
    rect(0,l.top,l.w,l.usable,[.003,.01,.018,.78]);
    mapSkinFrame([70,365,800,970],modal,32,navy,supportSkin,.64);
    supportSkin(334,260,272,155,{x:l.w/2-crestW/2,y:modal.y-crestW*.38,w:crestW,h:crestW*155/272});
    mapLabel('选择本局支援',{x:modal.x+24,y:modal.y+38,w:modal.w-48,h:34},l.w<360?23:27,paper,{padding:0});
    line(modal.x+modal.w*.20,modal.y+77,modal.x+modal.w*.80,modal.y+77,1.5,cyan);
    mapLabel(v.lowHealthItemWarning?'当前血量低，推荐使用道具':'二选一 · 不占用地图位置',{x:modal.x+16,y:modal.y+81,w:modal.w-32,h:22},13,v.lowHealthItemWarning?[1,.48,.36,1]:[.58,.75,.85,1],{padding:0});
    for(i=0;i<2;i+=1){
      r=l.itemChoices[i];item=v.battleItemChoices[i];if(!item)continue;
      clear=item.effect==='clear_all_enemies';action=l.itemActions[i];
      mapSkinFrame([clear?473:96,581,375,572],r,36,clear?[.045,.018,.095,1]:[.012,.075,.085,1],supportSkin,.58);
      artH=Math.min((r.w-24)*282/310,r.h-150);
      art={x:r.x+12,y:r.y+14,w:r.w-24,h:artH};
      supportSkin(clear?505:130,620,310,282,art);
      nameY=r.y+14+artH+7;
      mapLabel(item.displayName||(clear?'清除怪物':'经济强化'),{x:r.x+8,y:nameY,w:r.w-16,h:26},l.w<360?17:20,clear?[.84,.74,1,1]:[1,.78,.26,1],{padding:0});
      description=String(item.description||(clear?'清除当前地图全部怪物':'本局经济收益提高25%')).replace(/(\d)\s+(?=\d|%)/g,'$1');
      lines=M3.MapUI.wrap(description,12,r.w-22);
      for(j=0;j<Math.min(2,lines.length);j+=1)mapLabel(lines[j],{x:r.x+11,y:nameY+29+j*17,w:r.w-22,h:17},12,[.62,.78,.87,1],{padding:0,spacing:0});
      supportButton(action,clear,'观看广告使用',false);
    }
    supportButton(l.itemSkip,false,'暂不使用',true);
  }
  function loadingScreen(l,v,failed){
    // Keep the entire reference composition visible, including its title and hero silhouettes.
    var coverW=Math.min(l.w,l.usable*414/896),coverH=coverW*896/414,
      cover={x:(l.w-coverW)*.5,y:l.top+(l.usable-coverH)*.5,w:coverW,h:coverH},unit=coverW/414,
      panel={x:cover.x+9*unit,y:cover.y+coverH*.833,w:coverW-18*unit,h:coverH*.141},
      phase=v.loadingPhase,progress=v.loadingProgress||{ratio:0,total:0},value=Number(progress.ratio),
      ratio=isFinite(value)?Math.max(0,Math.min(1,value)):0,known=phase==='assets'&&progress.total>0||phase==='render',
      cyan=[.278,.863,.906,1],paper=[.835,.957,.937,1],steel=[.45,.51,.55,1],
      accent=failed?[.851,.341,.333,1]:cyan,label=failed?'资源加载失败':phase==='render'?'正在准备画面…':phase==='assets'?'正在加载游戏…':'正在读取配置…',
      x=cover.x+43*unit,barY=panel.y+53*unit,width=coverW-86*unit,barH=24*unit,
      count=24,gap=3*unit,inset=5*unit,cell=(width-inset*2-gap*(count-1))/count,
      i,fill,travel=(Math.sin(M3._now()*.0018)+1)*.5,imageReady;
    if(gl&&gl.disable)gl.disable(gl.SCISSOR_TEST);
    rect(0,l.top,l.w,l.usable,[.024,.106,.149,1]);
    imageReady=loadingBackground(cover);
    if(!imageReady){
      text('启元传说',l.w*.5,cover.y+coverH*.09,3.2*unit,paper,coverW*.86,'center','title');
      text('防线系统启动中',l.w*.5,cover.y+coverH*.20,1*unit,cyan,coverW*.80,'center');
    }
    // Opaque runtime terminal replaces ALL sample copy and the baked-in 68% bar.
    chamfer(panel,[.043,.145,.204,1],7*unit);
    chamferOutline(panel,steel,2*unit,7*unit);
    chamferOutline({x:panel.x+5*unit,y:panel.y+5*unit,w:panel.w-10*unit,h:panel.h-10*unit},[.10,.25,.29,1],unit,4*unit);
    line(panel.x+20*unit,panel.y+2*unit,panel.x+panel.w-20*unit,panel.y+2*unit,unit,[.66,.74,.78,1]);
    for(i=0;i<4;i+=1){
      var boltX=i%2?panel.x+panel.w-9*unit:panel.x+9*unit,boltY=i<2?panel.y+12*unit:panel.y+panel.h-12*unit;
      rect(boltX-3*unit,boltY-3*unit,6*unit,6*unit,steel);
      rect(boltX-2*unit,boltY,4*unit,unit,[.024,.106,.149,1]);
    }
    mapLabel(label,{x:x+4*unit,y:panel.y+18*unit,w:width-80*unit,h:24*unit},16*unit,accent,{align:'left',padding:0});
    if(phase==='render')ratio=1;
    mapLabel(failed?'失败':known?Math.round(ratio*100)+'%':'连接中',{x:x+width-74*unit,y:panel.y+18*unit,w:70*unit,h:24*unit},14*unit,paper,{align:'right',padding:0});
    chamfer({x:x,y:barY,w:width,h:barH},[.024,.106,.149,1],4*unit);
    chamferOutline({x:x,y:barY,w:width,h:barH},[.66,.74,.78,1],unit,4*unit);
    chamferOutline({x:x+2*unit,y:barY+2*unit,w:width-4*unit,h:barH-4*unit},[.12,.36,.40,1],unit,2*unit);
    for(i=0;i<count;i+=1){
      var cellX=x+inset+i*(cell+gap);
      rect(cellX,barY+inset,cell,barH-inset*2,[.065,.20,.24,1]);
      fill=failed?0:known?Math.max(0,Math.min(1,ratio*count-i)):Math.max(0,1-Math.abs(i-travel*(count-1))/3);
      if(fill>0){
        rect(cellX,barY+inset,cell*fill,barH-inset*2,accent);
        rect(cellX,barY+inset,cell*fill,2*unit,[.63,.98,.97,1]);
      }
    }
    mapLabel(failed?'轻触屏幕，重新连接':'搭配防御塔，守住城市防线',{x:cover.x+coverW*.105,y:panel.y+87*unit,w:coverW*.79,h:20*unit},14*unit,failed?accent:paper);
    line(x,panel.y+101*unit,x+17*unit,panel.y+101*unit,unit,cyan);
    line(x+width-17*unit,panel.y+101*unit,x+width,panel.y+101*unit,unit,cyan);
  }
  function loadingBackground(r){
    var key='ui-loading-background',image=M3.TextureAssets&&M3.TextureAssets.get(key);
    if(!image||!(image.naturalWidth||image.width)||!(image.naturalHeight||image.height))return false;
    return imageRegion(key,r.x,r.y,r.w,r.h,0,1,1,0,[1,1,1,1],1,false,0);
  }
  function prepareAssets(keys){
    var i,key,error;
    if(gl.getError)gl.getError();
    for(i=0;i<(keys||[]).length;i+=1){
      key=keys[i];
      if(!imageAsset(key,-4,-4,1,1,0))throw new Error('图片无法渲染: '+key);
      error=gl.getError&&gl.getError();
      if(error&&error!==gl.NO_ERROR)throw new Error('图片渲染失败: '+key+' ('+error+')');
    }
  }
  function battleMessagePanel(l,v){
    var r=l.waveNotice,state=M3.BattleMessages.sample(v,M3._now()),item=state.item,
      navy=[.024,.106,.149,1],paper=[.835,.957,.937,1],amber=[.957,.718,.173,1],
      danger=item.kind==='boss'||item.kind==='error',accent=danger?[1,.38,.32,1]:item.kind==='crisis'?amber:[.278,.863,.906,1],
      alpha=state.opacity,infoX=r.x+64,infoW=r.w-82,y=r.y+6+state.offset,lines=M3.MapUI.wrap(item.body,13,infoW),i,x,
      sx=gl.drawingBufferWidth/l.w,sy=gl.drawingBufferHeight/l.h;
    // The terminal frame remains visible; only its contents animate.
    chamfer({x:r.x+3,y:r.y+4,w:r.w,h:r.h},[0,0,0,.35],8);
    mapSkinFrame([58,860,818,256],r,22,navy,heroSkin,.42);
    line(r.x+10,r.y+11,r.x+10,r.y+r.h-11,1.5,accent);
    line(r.x+r.w-10,r.y+11,r.x+r.w-10,r.y+r.h-11,1.5,accent);
    for(i=0;i<3;i+=1){x=r.x+r.w-43+i*8;solid([x,r.y+r.h-9,x+5,r.y+r.h-9,x+10,r.y+r.h-15,x+5,r.y+r.h-15],amber);}
    gl.enable(gl.SCISSOR_TEST);gl.scissor(Math.round((r.x+8)*sx),Math.round((l.h-r.y-r.h+5)*sy),Math.round((r.w-16)*sx),Math.round((r.h-10)*sy));
    try{
      if(item.kind==='error'){
        chamfer({x:r.x+23,y:r.y+17+state.offset,w:25,h:25},alphaColor(accent,alpha*.15),4);
        rect(r.x+34,r.y+21+state.offset,3,11,alphaColor(accent,alpha));rect(r.x+34,r.y+35+state.offset,3,3,alphaColor(accent,alpha));
      }else imageAssetContain(item.kind==='boss'?'ui-wave-boss-v1':'ui-wave-radar-v1',r.x+12,r.y+8+state.offset,44,44,alpha);
      settlementLabel(item.title,{x:infoX,y:y,w:infoW,h:21},l.w<360?16:18,alphaColor(accent,alpha),false,{align:'left',padding:0});
      for(i=0;i<Math.min(2,lines.length);i+=1)mapLabel(lines[i],{x:infoX,y:y+24+i*13,w:infoW,h:14},13,alphaColor(paper,alpha),{align:'left',padding:0});
    }finally{gl.disable(gl.SCISSOR_TEST);}
  }
  function draw(context,v){var l=M3.UILayout.get(),bg=tone(v,'background',[.05,.07,.1,1]);init(context);gl.viewport(0,0,context.drawingBufferWidth,context.drawingBufferHeight);gl.clearColor(bg[0],bg[1],bg[2],bg.length>3?bg[3]:1);gl.clear(gl.COLOR_BUFFER_BIT);if(v.state==='BOOT')loadingScreen(l,v,false);else if(v.state==='LOADING'){if(v.loadingPhase==='render'){try{prepareAssets(v.assetKeys);mapV2(l,v);if(gl.getError&&gl.getError()!==gl.NO_ERROR)throw new Error('地图画面渲染失败');loadingScreen(l,v,false);if(M3.Game&&M3.Game.assetsRendered)M3.Game.assetsRendered();}catch(error){if(M3.Game&&M3.Game.assetRenderFailed)M3.Game.assetRenderFailed(error);loadingScreen(l,{loadingError:error&&error.message||'图片渲染失败'},true);}}else loadingScreen(l,v,false);}else if(v.state==='LOAD_ERROR')loadingScreen(l,v,true);else if(v.state==='HOME')home(l,v);else if(v.state==='WORLD_MAP')mapV2(l,v);else if(v.state==='LEVEL_DETAIL')detailV2(l,v);else if(v.state==='PROGRESSION')progression(l,v);else if(v.state==='DECK_SELECT')deckV2(l,v);else if(v.state==='HERO_SELECT')heroSelectV2(l,v);else if(v.state==='BATTLE')battle(l,v);else if(v.state==='RESULT')resultV2(l,v);if(v.state==='BATTLE'&&v.itemMenuOpen)itemModalV2(l,v);if(v.mapDialog)mapDialog(l,v);if(v.message){if(v.state!=='BATTLE'&&v.state!=='WORLD_MAP'&&v.state!=='DECK_SELECT'&&v.state!=='HERO_SELECT'&&v.state!=='PROGRESSION')text(v.message,l.w*.5,l.top+l.usable*.94,.75,[1,1,1,1],l.w*.9,'center');}}
  M3.Renderer={draw:draw,rect:rect,triangles:solid,imageRegion:imageRegion,terminal:{
    // Tutorial panels need a continuous rail; the hero skin has a transparent title notch.
    panel:function(r){
      var steel=[.45,.51,.55,1],light=[.73,.82,.86,1],dark=[.13,.23,.29,1],i,x,y;
      mapMetalPanel(r,[.278,.863,.906,1],[.043,.145,.204,1]);
      chamferOutline({x:r.x+5,y:r.y+5,w:r.w-10,h:r.h-10},dark,2,5);
      line(r.x+12,r.y+2,r.x+r.w-12,r.y+2,2,light);
      line(r.x+12,r.y+r.h-2,r.x+r.w-12,r.y+r.h-2,2,steel);
      for(i=0;i<4;i+=1){
        x=i%2?r.x+r.w-13:r.x+3;y=i<2?r.y+3:r.y+r.h-13;
        chamfer({x:x,y:y,w:10,h:10},steel,2);
        line(x+2,y+1,x+8,y+1,1,light);
        rect(x+4,y+4,3,3,[.03,.09,.12,1]);rect(x+4,y+4,2,1,light);
      }
    },
    tag:function(r){mapMetalPanel(r,[.278,.863,.906,1],[.16,.26,.33,1]);},
    label:mapLabel,button:towerModalButton,line:line,image:imageAssetContain
  }};
})();
