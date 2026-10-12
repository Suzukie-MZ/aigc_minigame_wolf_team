(function () {
  // 支持直接注入完整接口，避免服务端 gameId 与快手 appId 不一致时错误拼接路由。
  window.RUNTIME_CONFIG_BASE_URL = window.RUNTIME_CONFIG_BASE_URL || '';
  window.RUNTIME_CONFIG_ENDPOINTS = window.RUNTIME_CONFIG_ENDPOINTS || {
    manifestUrl: 'http://172.23.136.112:8080/api/runtime-manifest',
    levelUrlTemplate: 'http://172.23.136.112:8080/api/levels/{levelId}'
  };
})();
