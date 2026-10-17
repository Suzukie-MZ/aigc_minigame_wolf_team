(function () {
  var M3=window.M3,entries={},handles={},sources={},fallbackEntries={};
  function remote(url){return /^https?:\/\//.test(url||'');}
  function runtimeArtwork(key){return key==='battle-scene-surround'||key==='pixel-terrain-25d'||key==='pixel-units-25d'||key==='demo-scene'||/^(tile[-_]|tower[-_]|hero[-_])/.test(key||'');}
  function start(item,cacheKey,onFail,onSuccess){
    if(remote(item.url)){
      if(M3.CdnLoader&&!handles[cacheKey])handles[cacheKey]=M3.CdnLoader.loadImage(cacheKey,item.url,'runtime-images',{onSuccess:function(image){if(onSuccess)onSuccess(image);},onFail:function(error){console.warn('[TextureAssets] remote image failed',item.key,item.url,error&&error.message||'load failed');if(onFail)onFail(error);}}).catch(function(){delete handles[cacheKey];return null;});
    }else if(M3.AssetManager){
      var current=M3.AssetManager.getState&&M3.AssetManager.getState(cacheKey);
      if(current&&current.failed&&M3.AssetManager.retry)M3.AssetManager.retry(cacheKey);
      if(!handles[cacheKey])handles[cacheKey]=M3.AssetManager.acquire('image',cacheKey,item.url,'runtime-images');
    }
  }
  function fallbackKey(item,manifest){
    var scenes=manifest&&manifest.presentation&&manifest.presentation.sceneAssets||{},key;
    if(fallbackEntries[item.key])return item.key;
    for(key in scenes)if(Object.prototype.hasOwnProperty.call(scenes,key)&&scenes[key]===item.key)return 'demo-scene';
    if(/^tile[-_]/.test(item.key)){if(/road/.test(item.key))return 'tile-road';if(/spawn/.test(item.key))return 'tile-spawn';if(/goal/.test(item.key))return 'tile-goal';if(/obstacle/.test(item.key))return 'tile-obstacle';if(/hero/.test(item.key))return 'tile-hero-slot';if(/tower|build/.test(item.key))return 'tile-tower-slot';return 'tile-grass';}
    return 'hero-1';
  }
  function startEntry(entry){
    start(entry.item,entry.cacheKey,function(){entry.failed=true;entry.ready=false;},function(){entry.failed=false;entry.ready=true;});
  }
  function loadRemaining(){Object.keys(entries).forEach(function(key){startEntry(entries[key]);});}
  function configure(manifest,initialKeys){
    var defaults=(M3.NeutralConfig&&M3.NeutralConfig.manifest&&M3.NeutralConfig.manifest.assetManifest||[]).slice(0),list=(manifest&&manifest.assetManifest||[]).slice(0),builtin=(M3.UIIconAssets&&M3.UIIconAssets.manifest||[]).concat(M3.EnemyAnimations&&M3.EnemyAnimations.manifest||[],M3.DeathParticles&&M3.DeathParticles.manifest||[],M3.CombatProjection&&M3.CombatProjection.manifest||[]),defaultIndex={},listed={},required=[],i,item,cacheKey,sourceKey,fallback;
    // Only bundled files may be fallback resources. Snapshot network URLs belong to
    // old development releases; missing split-manifest keys must wait for the extra manifest.
    // UI art must remain available even when a remote manifest omits it or its files fail.
    for(i=0;i<defaults.length;i+=1)defaultIndex[defaults[i].key]=i;
    for(i=0;i<list.length;i+=1)listed[list[i].key]=true;
    for(i=0;i<builtin.length;i+=1){
      item=builtin[i];
      if(defaultIndex[item.key]!==undefined)defaults[defaultIndex[item.key]]=item;else defaults.push(item);
      if(!listed[item.key])list.push(item);else if(M3.UIIconAssets&&M3.UIIconAssets.manifest.indexOf(item)!==-1){for(var li=0;li<list.length;li+=1)if(list[li].key===item.key)list[li]=item;}
    }
    entries={};fallbackEntries={};sources={};
    for(i=0;i<defaults.length;i+=1){item=defaults[i];if(!item||item.type!=='image'||!item.key||!item.url||remote(item.url)||runtimeArtwork(item.key)&&listed[item.key]||initialKeys&&initialKeys.indexOf(item.key)<0)continue;sourceKey=item.url+'@'+(item.version||'1');cacheKey=sources[sourceKey]||'default:'+item.key+'@'+(item.version||'1');sources[sourceKey]=cacheKey;fallbackEntries[item.key]={cacheKey:cacheKey,item:item};start(item,cacheKey);}
    for(i=0;i<list.length;i+=1){
      item=list[i];
      if(!item||item.type!=='image'||!item.key||!item.url)continue;
      sourceKey=item.url+'@'+(item.version||'1');
      cacheKey=sources[sourceKey]||item.key+'@'+(item.version||'1');
      sources[sourceKey]=cacheKey;
      fallback=runtimeArtwork(item.key)?null:fallbackEntries[fallbackKey(item,manifest)];
      entries[item.key]={cacheKey:cacheKey,item:item,fallback:fallback||null,failed:false,ready:false};
      if(initialKeys?initialKeys.indexOf(item.key)>=0:runtimeArtwork(item.key)||/^subpackages\/monsters\//.test(item.url))required.push(item.key);
      if(!initialKeys||initialKeys.indexOf(item.key)>=0)startEntry(entries[item.key]);
    }
    return required;
  }
  function addAssets(list,onlyMissing){
    (list||[]).forEach(function(item){
      var existing,sourceKey,cacheKey;
      if(!item||item.type!=='image'||!item.key||!item.url)return;
      existing=entries[item.key];
      if(onlyMissing&&existing)return;
      if(existing&&existing.item.url===item.url&&(existing.item.version||'1')===(item.version||'1'))return;
      sourceKey=item.url+'@'+(item.version||'1');
      cacheKey=sources[sourceKey]||item.key+'@'+(item.version||'1');sources[sourceKey]=cacheKey;
      // Registration stores addresses only. Rendering/waitFor starts the actual image request.
      entries[item.key]={cacheKey:cacheKey,item:item,fallback:null,failed:false,ready:false};
    });
  }
  function readyImage(cacheKey){
    return Promise.resolve(handles[cacheKey]).then(function(){
      if(!M3.AssetManager)throw new Error('资源管理器不可用');
      if(M3.AssetManager.loaded(cacheKey))return M3.AssetManager.get(cacheKey);
      return M3.AssetManager.ready(cacheKey);
    }).then(function(image){
      if(!image||!M3.AssetManager.loaded(cacheKey))throw new Error('image not ready');
      return image;
    });
  }
  function waitFor(keys){
    return Promise.all((keys||[]).map(function(key){
      var entry=entries[key];
      if(!entry)return Promise.reject(new Error('资源未配置: '+key));
      startEntry(entry);
      return readyImage(entry.cacheKey).then(function(image){
        entry.failed=false;entry.ready=true;return image;
      }).catch(function(error){
        entry.failed=true;entry.ready=false;
        // UI files may fail to decode on native devices. The bundled PNG atlas
        // is already a valid rendering source and must also satisfy readiness.
        if(entry.fallback&&entry.fallback.cacheKey!==entry.cacheKey)return readyImage(entry.fallback.cacheKey);
        throw error;
      }).then(function(){return key;},function(error){
        console.error('[TextureAssets] required image failed',key,entry.item.url,error&&error.message||error);
        throw new Error('图片加载失败: '+key);
      });
    }));
  }
  function resolved(key){var entry=entries[key],fallback;if(!entry||!M3.AssetManager)return null;if(!entry.failed&&(entry.ready||M3.AssetManager.loaded(entry.cacheKey)))return{cacheKey:entry.cacheKey,item:entry.item};fallback=entry.fallback;if(fallback&&M3.AssetManager.loaded(fallback.cacheKey))return fallback;return null;}
  function get(key){var configured=entries[key],current=M3.AssetManager&&M3.AssetManager.getState&&configured&&M3.AssetManager.getState(configured.cacheKey),entry;if(current&&current.failed)configured.failed=true;if(configured&&!configured.failed&&!handles[configured.cacheKey])startEntry(configured);entry=resolved(key);return entry?M3.AssetManager.get(entry.cacheKey):M3.LoadingAssets&&M3.LoadingAssets.get(key)||null;}
  function progress(keys){var loaded=0,total=(keys||[]).length,i;for(i=0;i<total;i+=1)if(resolved(keys[i]))loaded+=1;return{loaded:loaded,total:total,ratio:total?loaded/total:0};}
  function tileKey(map,tileType){var key=map&&map.tileAssets&&map.tileAssets[tileType];return key&&entries[key]?key:'';}
  M3.TextureAssets={configure:configure,addAssets:addAssets,loadRemaining:loadRemaining,waitFor:waitFor,progress:progress,get:get,tileKey:tileKey,cacheKey:function(key){var entry=resolved(key);return entry&&entry.cacheKey||M3.LoadingAssets&&M3.LoadingAssets.cacheKey(key)||key;},meta:function(key){var entry=resolved(key);return entry&&entry.item||entries[key]&&entries[key].item||M3.LoadingAssets&&M3.LoadingAssets.meta(key)||null;},has:function(key){return!!entries[key];}};
})();
