(function () {
  var M3 = window.M3, data = M3.CombatAtlasData || {roles:{}}, FPS = 10;
  var localData=data, remoteMode=false, generation=0, diagnostic=null;
  var manifest = [], seen = {}, packagePending = null, packageFailed = false, requested = {};
  function add(atlas) {
    if (!atlas || seen[atlas.key]) return;
    seen[atlas.key] = true;
    manifest.push({key:atlas.key, type:'image', url:remoteMode?atlas.url:'subpackages/combat/'+atlas.url, version:atlas.version||data.sourceCommit, lazy:true});
  }
  function collect() { Object.keys(data.roles).forEach(function(key) {
    var role=data.roles[key];
    Object.keys(role.levels||{}).forEach(function(level){add(role.levels[level].attack);add(role.levels[level].effects);});
    Object.keys(role.directions||{}).forEach(function(direction){add(role.directions[direction]);});
    add(role.effects);
  });
  }
  collect();
  function validateRemote(value, assets) {
    function fail(message){throw new Error(message);}
    function object(v){return v&&typeof v==='object'&&!Array.isArray(v);}
    function number(v,min,max){return typeof v==='number'&&isFinite(v)&&Math.floor(v)===v&&v>=min&&v<=max;}
    function vector(v,n,min,max){return Array.isArray(v)&&v.length===n&&v.every(function(x){return number(x,min,max);});}
    var registered=Object.create(null),atlases=Object.create(null),count=0;
    (assets||[]).forEach(function(a){if(a&&a.type==='image'){if(registered[a.key])fail('duplicate image key');registered[a.key]=a;}});
    if(!object(value)||value.schemaVersion!==1||typeof value.sourceCommit!=='string'||!value.sourceCommit.length||value.sourceCommit.length>128||!object(value.roles))fail('invalid schema');
    if(value.fps!==undefined&&(typeof value.fps!=='number'||!isFinite(value.fps)||value.fps<1||value.fps>60))fail('invalid fps');
    var roles=Object.keys(value.roles);if(!roles.length||roles.length>32)fail('invalid role count');
    function frame(f,a){if(!object(f)||!vector(f.rect,4,0,8192)||!vector(f.offset,2,0,8192)||!vector(f.source,2,1,8192)||f.rect[2]<1||f.rect[3]<1||f.rect[0]+f.rect[2]>a.width||f.rect[1]+f.rect[3]>a.height||f.offset[0]+f.rect[2]>f.source[0]||f.offset[1]+f.rect[3]>f.source[1])fail('frame outside atlas or source');}
    function atlas(a){
      if(!object(a)||typeof a.key!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(a.key)||typeof a.url!=='string'||!/^https?:\/\/[^\s]+$/.test(a.url)||!number(a.width,1,8192)||!number(a.height,1,8192)||!Array.isArray(a.frames)||!a.frames.length||a.frames.length>256||(a.mirror!==undefined&&typeof a.mirror!=='boolean'))fail('invalid atlas');
      var entry=registered[a.key];if(!entry||entry.url!==a.url||entry.lazy!==true)fail('atlas missing matching lazy image');
      var identity=JSON.stringify([a.url,a.width,a.height,a.frames]);if(atlases[a.key]&&atlases[a.key]!==identity)fail('conflicting atlas key');
      if(!atlases[a.key]&&++count>256)fail('too many atlases');atlases[a.key]=identity;
      a.version=String(entry.version||value.sourceCommit);a.frames.forEach(function(f){frame(f,a);});
    }
    function effects(v,economy){atlas(v.effects);var names=economy?['pulse','resource']:['projectile','hit'];if(!object(v.effectGroups)||Object.keys(v.effectGroups).some(function(k){return names.indexOf(k)<0;}))fail('invalid effect groups');names.forEach(function(name){var frames=v.effectGroups[name];if(!Array.isArray(frames)||!frames.length||frames.length>256)fail('missing effect frames');frames.forEach(function(f){frame(f,v.effects);if(!v.effects.frames.some(function(known){return JSON.stringify(known)===JSON.stringify(f);}))fail('unknown effect frame');});});}
    roles.forEach(function(key){var role=value.roles[key];if(!/^(tower|hero)-[a-zA-Z0-9_-]{1,64}$/.test(key)||!object(role)||typeof role.name!=='string'||!role.name.length||role.name.length>100||['tower','hero','economy'].indexOf(role.kind)<0||typeof role.economy!=='boolean'||(role.economy&&role.kind==='hero'))fail('invalid role');
      if(role.kind==='hero'){if(!object(role.directions)||Object.keys(role.directions).length!==4)fail('invalid directions');['up','down','left','right'].forEach(function(d){atlas(role.directions[d]);});effects(role,false);}
      else {if(!object(role.levels)||!Object.keys(role.levels).length||Object.keys(role.levels).length>6)fail('invalid levels');Object.keys(role.levels).forEach(function(level){if(!/^[1-6]$/.test(level))fail('invalid level');var v=role.levels[level];if(!object(v))fail('invalid variant');if(!role.economy||v.attack)atlas(v.attack);effects(v,role.economy);});}
    });return value;
  }
  function configure(runtime) {
    generation+=1;requested={};packageFailed=false;packagePending=null;manifest.length=0;seen={};diagnostic=null;
    var presentation=runtime&&runtime.presentation||{};
    remoteMode=Object.prototype.hasOwnProperty.call(presentation,'combatAnimations');
    if(remoteMode){try{data=validateRemote(JSON.parse(JSON.stringify(presentation.combatAnimations)),runtime.assetManifest);}catch(error){data={roles:{}};diagnostic='远端战斗动画配置无效：'+error.message;console.warn('[DefenderAnimations]',diagnostic);}}
    else data=localData;
    FPS=data.fps||10;collect();return {mode:remoteMode?'remote':(Object.keys(localData.roles).length?'local':'static'),error:diagnostic};
  }
  function roleFor(unit) {
    var key=unit&&String(unit.imageAsset||'').replace(/-lv[1-6]$/, ''), role=data.roles[key];
    // This local art belongs to the roadshow cast, never bind a new theme by numeric ID alone.
    return role && unit.displayName===role.name && (role.economy ? unit.kind==='economy' : unit.kind===role.kind) ? key : null;
  }
  function direction(dx,dy) { return Math.abs(dx)>Math.abs(dy) ? (dx<0?'left':'right') : (dy<0?'up':'down'); }
  function variant(key,level) {
    var role=data.roles[key];
    return role && (role.kind==='hero' ? role : role.levels[String(Math.max(1,Math.min(6,Number(level)||1)))]);
  }
  function packageReady() { return remoteMode || typeof ks==='undefined' || !!(M3.SubpackageLoader&&M3.SubpackageLoader.isLoaded('combat')); }
  function ensurePackage() {
    if(packageReady())return Promise.resolve(true);
    if(packageFailed)return Promise.resolve(false);
    if(packagePending)return packagePending;
    if(!M3.SubpackageLoader)return Promise.resolve(false);
    packagePending=new Promise(function(resolve){M3.SubpackageLoader.load('combat',{
      onSuccess:function(){resolve(true);},onFail:function(){packageFailed=true;resolve(false);}
    });}).then(function(ok){packagePending=null;return ok;});
    return packagePending;
  }
  function requestKeys(keys) {
    var active=generation;return ensurePackage().then(function(ok){
      if(active!==generation)return false;
      if(ok&&M3.TextureAssets&&M3.TextureAssets.waitFor)return Promise.all(keys.map(function(key){
        if(!requested[key])requested[key]=M3.TextureAssets.waitFor([key]).catch(function(){return false;});
        return requested[key];
      }));
      return false;
    });
  }
  function preload(units) {
    var keys={};packageFailed=false;requested={};
    (units||[]).forEach(function(unit){var key=roleFor(unit),role=data.roles[key],v=variant(key,1);if(!v)return;
      if(role.kind==='hero')Object.keys(role.directions).forEach(function(dir){keys[role.directions[dir].key]=true;});
      else if(!role.economy)keys[v.attack.key]=true;
      keys[v.effects.key]=true;
    });
    return Object.keys(keys).length?requestKeys(Object.keys(keys)):Promise.resolve(false);
  }
  function record(actor,unit,target,type,elapsed,event) {
    var key=roleFor(unit),role=data.roles[key],v=variant(key,actor.level),dir=direction(target.x-(actor.x+.5),target.y-(actor.y+.5)),atlas;
    event.unitId=unit.id;event.assetKey=unit.imageAsset;event.level=actor.level||1;
    event.sourceId=(actor.heroId||actor.cardId||unit.id)+'@'+actor.x+','+actor.y;
    event.direction=dir;
    actor.combatAction=null;
    if(!v || (type==='income')!==role.economy)return;
    event.generation=generation;event.roleKey=key;event.duration=((v.effectGroups[role.economy?'pulse':'projectile']||[]).length+(v.effectGroups[role.economy?'resource':'hit']||[]).length)/FPS;
    if(type!=='income'){
      atlas=role.kind==='hero'?role.directions[dir]:v.attack;
      actor.combatAction={roleKey:key,level:event.level,direction:dir,startedAt:elapsed,generation:generation};
    }
    requestKeys(atlas?[atlas.key,v.effects.key]:[v.effects.key]);
  }
  function frameFor(actor,elapsed) {
    var action=actor&&actor.combatAction,role=action&&data.roles[action.roleKey],v=action&&variant(action.roleKey,action.level),age=action&&elapsed-action.startedAt,atlas,index;
    if(!v||action.generation!==generation||role.economy||age<0)return null;
    atlas=role.kind==='hero'?role.directions[action.direction]:v.attack;
    index=Math.floor((age+1e-8)*FPS);
    return atlas&&index<atlas.frames.length?{atlas:atlas,frame:atlas.frames[index],mirror:!!atlas.mirror}:null;
  }
  function drawFrame(imageRegion,atlas,frame,mirror,x,y,w,h,alpha) {
    if(!packageReady())return false;
    var r=frame.rect,o=frame.offset,s=frame.source,sx=w/s[0],sy=h/s[1],u0=r[0]/atlas.width,u1=(r[0]+r[2])/atlas.width;
    return imageRegion(atlas.key,x+(mirror?s[0]-o[0]-r[2]:o[0])*sx,y+o[1]*sy,r[2]*sx,r[3]*sy,mirror?u1:u0,1-r[1]/atlas.height,mirror?u0:u1,1-(r[1]+r[3])/atlas.height,[1,1,1,1],alpha,false,0);
  }
  function draw(imageRegion,actor,elapsed,x,y,w,h,alpha) {
    var f=frameFor(actor,elapsed);
    return !!f&&drawFrame(imageRegion,f.atlas,f.frame,f.mirror,x,y,w,h,alpha);
  }
  function effectFor(event) {
    var role=data.roles[event.roleKey],v=variant(event.roleKey,event.level),index=Math.floor((event.age+1e-8)*FPS),groups,first,second,frames,group;
    if(!v||event.generation!==generation||index<0)return null;
    groups=v.effectGroups;first=role.economy?'pulse':'projectile';second=role.economy?'resource':'hit';
    frames=groups[first]||[];group=first;
    if(index>=frames.length){index-=frames.length;frames=groups[second]||[];group=second;}
    return index<frames.length?{atlas:v.effects,frame:frames[index],group:group,firstDuration:(groups[first]||[]).length/FPS}:null;
  }
  function drawEffect(imageRegion,event,board,cell) {
    var f=effectFor(event),ratio,x,y,size=cell*1.4;
    if(!f)return false;
    ratio=f.group==='projectile'?Math.min(1,event.age/f.firstDuration):1;
    x=board.x+(event.fromX+(event.toX-event.fromX)*ratio)*cell;
    y=board.y+(event.fromY+(event.toY-event.fromY)*ratio)*cell;
    if(f.group==='resource')y-=Math.max(0,event.age-f.firstDuration)*cell*.6;
    return drawFrame(imageRegion,f.atlas,f.frame,false,x-size*.5,y-size*.5,size,size,1);
  }
  M3.DefenderAnimations={configure:configure,status:function(){return {mode:remoteMode?'remote':(Object.keys(localData.roles).length?'local':'static'),error:diagnostic};},manifest:manifest,roleFor:roleFor,direction:direction,preload:preload,record:record,frameFor:frameFor,draw:draw,effectFor:effectFor,drawEffect:drawEffect};
})();
