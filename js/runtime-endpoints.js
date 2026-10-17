(function () {
  // 固定入口指向最新发布；关卡和素材地址由清单提供，不绑定历史版本。
  window.RUNTIME_CONFIG_BASE_URL = window.RUNTIME_CONFIG_BASE_URL || '';
  window.RUNTIME_CONFIG_ENDPOINTS = window.RUNTIME_CONFIG_ENDPOINTS || {
    manifestUrl: 'https://p1-ad.adkwai.com/udata/pkg/KS-GAME/ksgame_wolves/runtime-manifest.json'
  };
})();
