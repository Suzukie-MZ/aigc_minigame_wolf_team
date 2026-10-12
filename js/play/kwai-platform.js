(function () {
  'use strict';

  var root = typeof GameGlobal !== 'undefined' ? GameGlobal :
    (typeof window !== 'undefined' ? window : this);
  var M3 = root.M3 = root.M3 || {};
  var initialized = false;
  var active = true;
  var launchOptions = {};
  var bannerAllowed = false;
  var bannerShown = false;
  var bannerAttempting = false;
  var bannerTimer = null;
  var bannerAttemptTimer = null;
  var bannerLastError = '';
  var bannerPermanentlyDisabled = false;
  var startedAt = Date.now();
  var BANNER_READY_MS = 32500;
  var BANNER_RETRY_MS = 35000;
  var BANNER_ATTEMPT_TIMEOUT_MS = 8000;

  function clearBannerTimer() {
    if (bannerTimer !== null && typeof clearTimeout === 'function') clearTimeout(bannerTimer);
    bannerTimer = null;
    if (bannerAttemptTimer !== null && typeof clearTimeout === 'function') clearTimeout(bannerAttemptTimer);
    bannerAttemptTimer = null;
  }

  function hideBanner() {
    clearBannerTimer();
    bannerShown = false;
    bannerAttempting = false;
    if (M3.Layout) M3.Layout.bottomPadding = 0;
    if (root.KwaiAd && typeof root.KwaiAd.hideBanner === 'function') root.KwaiAd.hideBanner();
  }

  function permanentlyDisableBanner() {
    if (bannerPermanentlyDisabled) {
      if (M3.Layout) M3.Layout.bottomPadding = 0;
      return;
    }
    bannerPermanentlyDisabled = true;
    bannerAllowed = false;
    hideBanner();
    // hide() 只隐藏广告内容，部分真机版本仍会保留原生白色承载层。
    // 当前游戏不展示 Banner，因此直接销毁实例并锁定本次启动不再创建。
    if (root.KwaiAd && typeof root.KwaiAd.onBannerUserClose === 'function') {
      root.KwaiAd.onBannerUserClose();
    }
  }

  function scheduleBanner(delay) {
    if (!bannerAllowed || typeof setTimeout !== 'function') return;
    clearBannerTimer();
    bannerTimer = setTimeout(function () { bannerTimer = null; showBannerNow(); }, Math.max(0,delay));
  }

  function bannerSucceeded() {
    if (!bannerAllowed) return;
    bannerAttempting = false;
    bannerShown = true;
    bannerLastError = '';
    if (bannerAttemptTimer !== null && typeof clearTimeout === 'function') clearTimeout(bannerAttemptTimer);
    bannerAttemptTimer = null;
    if (typeof console !== 'undefined' && console.log) console.log('[M3 Banner] show success');
  }

  function bannerFailed(err) {
    if (!bannerAllowed) return;
    bannerAttempting = false;
    bannerShown = false;
    bannerLastError = err && (err.errMsg || err.message) || 'unknown';
    if (M3.Layout) M3.Layout.bottomPadding = 0;
    if (bannerAttemptTimer !== null && typeof clearTimeout === 'function') clearTimeout(bannerAttemptTimer);
    bannerAttemptTimer = null;
    if (typeof console !== 'undefined' && console.warn) console.warn('[M3 Banner] show failed, retry in 35s:',bannerLastError);
    scheduleBanner(BANNER_RETRY_MS);
  }

  function showBannerNow() {
    if (!bannerAllowed || bannerShown || bannerAttempting || !root.KwaiAd || typeof root.KwaiAd.showBanner !== 'function') return;
    bannerAttempting = true;
    if (typeof console !== 'undefined' && console.log) console.log('[M3 Banner] show attempt');
    root.KwaiAd.showBanner(function (height) {
      bannerSucceeded();
      if (bannerAllowed && M3.Layout) M3.Layout.bottomPadding = Math.max(0, Number(height) || 0);
    }, bannerSucceeded, bannerFailed);
    if (typeof setTimeout === 'function') bannerAttemptTimer = setTimeout(function () { bannerAttemptTimer=null;if(bannerAttempting)bannerFailed({errMsg:'show timeout'}); },BANNER_ATTEMPT_TIMEOUT_MS);
  }

  function setBannerAllowed(allowed) {
    allowed = !!allowed;
    if (typeof GameGlobal === 'undefined') return;
    if (!allowed) { permanentlyDisableBanner(); return; }
    if (bannerPermanentlyDisabled) return;
    if (bannerAllowed === allowed) return;
    bannerAllowed = allowed;
    var delay = Math.max(0, startedAt + BANNER_READY_MS - Date.now());
    if (!delay) { showBannerNow(); return; }
    scheduleBanner(delay);
  }

  function init() {
    if (initialized) return;
    initialized = true;

    if (root.KwaiRender && typeof root.KwaiRender.setPreferredFramesPerSecond === 'function') {
      root.KwaiRender.setPreferredFramesPerSecond(60);
    }

    // GameGlobal 只在小游戏运行时存在，避免 H5 预览触发平台 API 警告。
    if (typeof GameGlobal === 'undefined' || !root.KwaiBase) return;
    if (typeof root.KwaiBase.getLaunchOptions === 'function') {
      launchOptions = root.KwaiBase.getLaunchOptions() || {};
    }
    if (typeof root.KwaiBase.onHide === 'function') {
      root.KwaiBase.onHide(function () { active = false; });
    }
    if (typeof root.KwaiBase.onShow === 'function') {
      root.KwaiBase.onShow(function (options) {
        active = true;
        if (options) launchOptions = options;
      });
    }
  }

  M3.KwaiPlatform = {
    init: init,
    isActive: function () { return active; },
    getLaunchOptions: function () { return launchOptions; },
    setBannerAllowed: setBannerAllowed,
    getBannerDebugStatus: function () { return { allowed:bannerAllowed,shown:bannerShown,attempting:bannerAttempting,permanentlyDisabled:bannerPermanentlyDisabled,lastError:bannerLastError }; }
  };
})();
