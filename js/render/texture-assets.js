(function () {
  var M3=window.M3,entries={},handles={},sources={},fallbackEntries={};
  function remote(url){return /^https?:\/\//.test(url||'');}
  function start(item,cacheKey,onFail,onSuccess){
    if(remote(item.url)){
      if(M3.CdnLoader&&!handles[cacheKey])handles[cacheKey]=M3.CdnLoader.loadImage(cacheKey,item.url,'runtime-images',{onSuccess:function(image){if(onSuccess)onSuccess(image);},onFail:function(error){console.warn('[TextureAssets] remote image failed',item.key,item.url,error&&error.message||'load failed');if(onFail)onFail(error);}}).catch(function(){return null;});
    }else if(M3.AssetManager&&!handles[cacheKey])handles[cacheKey]=M3.AssetManager.acquire('image',cacheKey,item.url,'runtime-images');
  }
  function fallbackKey(item,manifest){
    var scenes=manifest&&manifest.presentation&&manifest.presentation.sceneAssets||{},key;
    if(fallbackEntries[item.key])return item.key;
    for(key in scenes)if(Object.prototype.hasOwnProperty.call(scenes,key)&&scenes[key]===item.key)return 'demo-scene';
    if(/^tile[-_]/.test(item.key)){if(/road/.test(item.key))return 'tile-road';if(/spawn/.test(item.key))return 'tile-spawn';if(/goal/.test(item.key))return 'tile-goal';if(/obstacle/.test(item.key))return 'tile-obstacle';if(/hero/.test(item.key))return 'tile-hero-slot';if(/tower|build/.test(item.key))return 'tile-tower-slot';return 'tile-grass';}
    return 'hero-1';
  }
  function configure(manifest){
    var defaults=(M3.NeutralConfig&&M3.NeutralConfig.manifest&&M3.NeutralConfig.manifest.assetManifest||[]).slice(0),list=(manifest&&manifest.assetManifest||[]).slice(0),builtin=M3.UIIconAssets&&M3.UIIconAssets.manifest||[],defaultIndex={},listed={},i,item,cacheKey,sourceKey,fallback;
    // UI art must remain available even when a remote manifest omits it or its files fail.
    for(i=0;i<defaults.length;i+=1)defaultIndex[defaults[i].key]=i;
    for(i=0;i<list.length;i+=1)listed[list[i].key]=true;
    for(i=0;i<builtin.length;i+=1){
      item=builtin[i];
      if(defaultIndex[item.key]!==undefined)defaults[defaultIndex[item.key]]=item;else defaults.push(item);
      if(!listed[item.key])list.push(item);
    }
    entries={};fallbackEntries={};sources={};
    for(i=0;i<defaults.length;i+=1){item=defaults[i];if(!item||item.type!=='image'||!item.key||!item.url)continue;sourceKey=item.url+'@'+(item.version||'1');cacheKey=sources[sourceKey]||'default:'+item.key+'@'+(item.version||'1');sources[sourceKey]=cacheKey;fallbackEntries[item.key]={cacheKey:cacheKey,item:item};start(item,cacheKey);}
    for(i=0;i<list.length;i+=1){
      item=list[i];
      if(!item||item.type!=='image'||!item.key||!item.url)continue;
      sourceKey=item.url+'@'+(item.version||'1');
      cacheKey=sources[sourceKey]||item.key+'@'+(item.version||'1');
      sources[sourceKey]=cacheKey;
      fallback=fallbackEntries[fallbackKey(item,manifest)];
      entries[item.key]={cacheKey:cacheKey,item:item,fallback:fallback||null,failed:false,ready:false};
      (function(entry,currentItem,currentCacheKey){start(currentItem,currentCacheKey,function(){entry.failed=true;entry.ready=false;},function(){entry.failed=false;entry.ready=true;});})(entries[item.key],item,cacheKey);
    }
  }
  function resolved(key){var entry=entries[key],fallback;if(!entry||!M3.AssetManager)return null;if(!entry.failed&&(entry.ready||M3.AssetManager.loaded(entry.cacheKey)))return{cacheKey:entry.cacheKey,item:entry.item};fallback=entry.fallback;if(fallback&&M3.AssetManager.loaded(fallback.cacheKey))return fallback;return null;}
  function get(key){var entry=resolved(key);return entry?M3.AssetManager.get(entry.cacheKey):null;}
  function tileKey(map,tileType){var key=map&&map.tileAssets&&map.tileAssets[tileType];return key&&entries[key]?key:'';}
  M3.TextureAssets={configure:configure,get:get,tileKey:tileKey,cacheKey:function(key){var entry=resolved(key);return entry&&entry.cacheKey||key;},meta:function(key){var entry=resolved(key);return entry&&entry.item||entries[key]&&entries[key].item||null;},has:function(key){return!!entries[key];}};
})();
