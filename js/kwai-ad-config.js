// js/kwai-ad-config.js（最先加载，在 kwai-event-bus.js 之后）
window.KwaiAdConfig = {
  rewardedAdUnitId:     '2300062146_01',
  interstitialAdUnitId: '',
  bannerAdUnitId:       '2300062146_02',
};
if (typeof GameGlobal !== 'undefined') GameGlobal.KwaiAdConfig = window.KwaiAdConfig;
