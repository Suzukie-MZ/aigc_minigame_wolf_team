(function () {
  var M3=window.M3,assets={},background={key:'ui-loading-background',url:'assets/home-asset/home-loading-qiyuan.webp',type:'image',version:'5',render:{fit:'contain'}};
  function register(item,cacheKey){
    assets[item.key]={item:item,cacheKey:cacheKey};
    if(M3.AssetManager)M3.AssetManager.acquire('image',cacheKey,item.url,'startup');
  }
  // First-frame artwork and type are packaged locally and start before the configuration request.
  register(background,'startup:'+background.key+'@'+background.version);
  register({key:'ui-map-terrain',url:'subpackages/ui-images/assets/Image/ui/ui-map-terrain.png',type:'image',version:'1'},'startup:ui-map-terrain@1');
  register({key:'ui-map-reference',url:'subpackages/ui-images/assets/Image/ui/ui-map-reference.webp',type:'image',version:'3'},'startup:ui-map-reference@3');
  register({key:'ui-tower-interface',url:'subpackages/ui-images/assets/Image/ui/ui-tower-interface-v1.webp',type:'image',version:'1'},'startup:ui-tower-interface@1');
  register({key:'ui-level-briefing',url:'subpackages/ui-images/assets/Image/ui/ui-level-briefing-v1.webp',type:'image',version:'1'},'startup:ui-level-briefing@1');
  register({key:'ui-hero-interface',url:'subpackages/ui-images/assets/Image/ui/ui-hero-interface-v1.webp',type:'image',version:'1'},'startup:ui-hero-interface@1');
  register({key:'font-cn-ui-hd',url:'assets/Font/font-cn-ui-hd.png'+(typeof ks==='undefined'?'?v=11':''),type:'image',version:'11'},'startup:font-cn-ui-hd@11');
  var manifest=M3.NeutralConfig&&M3.NeutralConfig.manifest,fonts=manifest&&manifest.assetManifest||[],i;
  for(i=0;i<fonts.length;i+=1)if(/^font-cn-main-/.test(fonts[i].key))register(fonts[i],'default:'+fonts[i].key+'@'+(fonts[i].version||'1'));
  if(M3.BitmapFont&&manifest)M3.BitmapFont.configure(manifest);
  M3.LoadingAssets={
    ready:function(){return Promise.all(Object.keys(assets).map(function(key){
      var entry=assets[key],current=M3.AssetManager&&M3.AssetManager.getState&&M3.AssetManager.getState(entry.cacheKey);
      if(current&&current.failed&&M3.AssetManager.retry)M3.AssetManager.retry(entry.cacheKey);
      return Promise.resolve(M3.AssetManager?M3.AssetManager.ready(entry.cacheKey):null).catch(function(cause){
        var url=cause&&cause.url||entry.item.url,reason=cause&&(cause.reason||cause.message||cause.errMsg)||'图片读取或解码失败';
        var error=new Error('图片加载失败: '+key+' ('+url+') '+reason);
        error.assetKey=key;error.url=url;error.reason=reason;error.cause=cause;
        console.error('[LoadingAssets] required image failed',key,url,cause&&cause.message||'图片读取或解码失败');
        throw error;
      });
    }));},
    get:function(key){var entry=assets[key];return entry&&M3.AssetManager&&M3.AssetManager.loaded(entry.cacheKey)?M3.AssetManager.get(entry.cacheKey):null;},
    meta:function(key){return assets[key]&&assets[key].item||null;},
    cacheKey:function(key){return assets[key]&&assets[key].cacheKey||key;}
  };
})();
