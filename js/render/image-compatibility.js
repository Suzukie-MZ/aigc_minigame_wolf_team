// Pixel-identical PNG alternatives, loaded only if the original image fails.
// Keep startup art in main; load other alternatives after their subpackage is ready.
(function () {
  window.M3.ImageCompatibility = {
    "assets/home-asset/home-loading-qiyuan.webp": "assets/home-asset/home-loading-qiyuan.png",
    "subpackages/ui-images/assets/Image/ui/ui-map-reference.webp": "subpackages/ui-compat-map/assets/ui-map-reference.png",
    "subpackages/ui-images/assets/Image/ui/ui-level-briefing-v1.webp": "subpackages/ui-compat-map/assets/ui-level-briefing-v1.png",
    "subpackages/ui-images/assets/Image/ui/ui-tower-interface-v1.webp": "subpackages/ui-compat-panels/assets/ui-tower-interface-v1.png",
    "subpackages/ui-images/assets/Image/ui/ui-hero-interface-v1.webp": "subpackages/ui-compat-panels/assets/ui-hero-interface-v1.png",
    "subpackages/battle-images/assets/Image/ui/pixel-terrain-25d-v1.webp": "subpackages/battle-images/assets/Image/ui/pixel-terrain-25d-v1.png",
    "subpackages/battle-images/assets/Image/ui/pixel-units-25d-v1.webp": "subpackages/battle-images/assets/Image/ui/pixel-units-25d-v1.png",
    "subpackages/battle-images/assets/Image/ui/battle-scene-surround.webp": "subpackages/battle-images/assets/Image/ui/battle-scene-surround.png"
  };
})();
