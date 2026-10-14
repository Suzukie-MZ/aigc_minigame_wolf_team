(function () {
  var M3=window.M3,assets={},background={key:'ui-loading-background',url:'assets/home-asset/home-loading-wolf-team.jpg',type:'image',version:'1',render:{fit:'cover'}};
  function register(item,cacheKey){
    assets[item.key]={item:item,cacheKey:cacheKey};
    if(M3.AssetManager)M3.AssetManager.acquire('image',cacheKey,item.url,'startup');
  }
  // First-frame artwork and type are packaged locally and start before the configuration request.
  register(background,'startup:'+background.key+'@'+background.version);
  var manifest=M3.NeutralConfig&&M3.NeutralConfig.manifest,fonts=manifest&&manifest.assetManifest||[],i;
  for(i=0;i<fonts.length;i+=1)if(/^font-cn-main-/.test(fonts[i].key))register(fonts[i],'default:'+fonts[i].key+'@'+(fonts[i].version||'1'));
  if(M3.BitmapFont&&manifest)M3.BitmapFont.configure(manifest);
  M3.LoadingAssets={
    get:function(key){var entry=assets[key];return entry&&M3.AssetManager&&M3.AssetManager.loaded(entry.cacheKey)?M3.AssetManager.get(entry.cacheKey):null;},
    meta:function(key){return assets[key]&&assets[key].item||null;},
    cacheKey:function(key){return assets[key]&&assets[key].cacheKey||key;}
  };
})();
