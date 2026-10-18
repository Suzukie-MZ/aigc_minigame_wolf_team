(function () {
  var M3 = window.M3 = window.M3 || {};

  // ─────────────────────────────────────────────────────────────────────────
  // 【快手小游戏环境文件加载】
  // 快手不走 index.html，由根目录 game.js require 本文件，再由此处按序加载依赖。
  // H5 浏览器走 index.html 的 <script> 标签，不进入本分支。
  // AI 生成游戏时按实际文件和依赖顺序填写，子文件夹用相对路径（如 './utils/helper.js'）。
  // ─────────────────────────────────────────────────────────────────────────
  if (typeof require === 'function') {
    require('./m3-init.js'); // 必须第一行：初始化 M3.Layout 等全局基础参数
    require('../standard/asset-manager.js'); // 统一资源管理器（引用计数 + 分组释放），所有图片必须经此加载
    require('../standard/kwai-event-bus.js'); // 事件总线（平台能力基础，勿删）
    require('../standard/subpackage-loader.js'); // 分包加载器（按需加载 + 并行预加载）
    require('../standard/cdn-loader.js'); // CDN 资源加载器（下载缓存 + 路径替换）
    require('../standard/game-logger.js'); // 重要日志输出（仅 error / touch 等输出，普通 log 抑制）
    require('./kwai-ad-config.js'); // 广告位配置（平台能力基础，勿删）
    require('../api/kwai-login.js'); // 用户登录
    require('../api/kwai-ad.js');    // 广告（激励 / 插屏 / Banner）
    require('../api/kwai-share.js'); // 分享
    require('../api/kwai-base.js');  // 生命周期 / 启动参数
    require('../api/kwai-render.js');// 帧率控制
    require('../api/kwai-network.js');
    require('../api/kwai-storage.js');
    require('../api/kwai-subpackage.js'); // 怪物资源子包
    // ↓ 其他平台能力模块按需引入（根据游戏功能选择）
    // require('../api/kwai-ui.js');         // Toast / Modal / Loading / 胶囊按钮布局
    // require('../api/kwai-network.js');    // HTTP 请求 / 下载 / 上传 / WebSocket
    // require('../api/kwai-storage.js');    // 本地数据缓存
    // require('../api/kwai-file.js');       // 文件系统
    // require('../api/kwai-media.js');      // 视频 / 音频 / 图片管理
    // require('../api/kwai-device.js');     // 传感器 / 键盘 / 网络状态 / 振动
    // require('../api/kwai-open.js');       // 用户信息 / 授权 / Feed 流直出
    // require('../api/kwai-record.js');     // 对局回放录制
    // require('../api/kwai-repost.js');     // 主动转发
    // require('../api/kwai-shortcut.js');   // 添加到桌面
    // require('../api/kwai-siderbar.js');   // 侧边栏
    // require('../api/kwai-commonuse.js');  // 设为常用
    // require('../api/kwai-official.js');   // 官方号 / CP 服务号
    // require('../api/kwai-game-community.js');  // 游戏圈
    // require('../api/kwai-subpackage.js');      // 分包加载
    // require('../api/kwai-data-analysis.js');   // 数据分析上报
    //↓ 游戏文件（按依赖顺序填入，禁止在子文件内再写 require）
    require('./runtime-endpoints.js');
    require('./play/kwai-platform.js');
    require('./play/neutral-config.js');
    require('./play/config-validator.js');
    require('./play/template-rules.js');
    require('./play/feature-system.js');
    require('./play/reward-system.js');
    require('./play/save-data.js');
    require('./play/deck.js');
    require('./play/progression.js');
    require('./play/bonds.js');
    require('./play/world-map.js');
    require('./play/runtime-config.js');
    require('./play/board.js');
    require('./play/combat.js');
    require('./play/combat-features.js');
    require('./play/platform-compliance.js');
    require('./render/ui-layout.js');
    require('./scene/scene-models.js');
    require('./render/glyphs.js');
    require('./render/font-cn-main-data.js');
    require('./render/ui-font-hd-data.js');
    require('./render/ui-icon-assets.js');
    require('./render/enemy-animations.js');
    require('./render/defender-animations.js');
    require('./render/texture-assets.js');
    require('./render/bitmap-font.js');
    require('./render/loading-assets.js');
    require('./render/map-ui-model.js');
    require('./render/combat-projection.js');
    require('./render/battle-messages.js');
    require('./render/renderer.js');
    require('./render/tile-render-hook.js');
    require('./render/route-guide.js');
    require('./render/deployment-hints.js');
    require('./render/tutorial-overlay.js');
    require('./play/tutorial.js');
    require('./play/game.js');
    require('./play/game-features.js');
    require('./play/input.js');
  }

  var canvas = window.canvas;
  // 【WebGL 渲染上下文】
  // 必须使用 WebGL，禁止使用 '2d' context。
  // 优先获取 webgl2，不支持时降级到 webgl；所有绘制必须通过 WebGL API 实现。
  var gl;
  try { gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true }); } catch (e) {}
  if (!gl) {
    try { gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }); } catch (e) {}
  }
  if (!gl) { console.error('[M3] WebGL not supported'); }

  // ─────────────────────────────────────────────────────────────────────────
  // 【屏幕适配 + DPR + 安全区】
  // canvas 物理尺寸 = CSS 尺寸 × DPR，配合 setTransform 保证高清渲染。
  // M3.Layout 基础字段已由 m3-init.js 初始化，此处只负责 resize 更新。
  // 所有游戏内容的 Y 起点必须从 M3.Layout.safeTop 开始，禁止从 0 开始绘制。
  // ─────────────────────────────────────────────────────────────────────────
  function getSafeTop () {
    // 快手小游戏环境：从系统信息读取安全区
    if (typeof ks !== 'undefined' && ks.getSystemInfoSync) {
      try {
        var info = ks.getSystemInfoSync();
        return (info.safeArea && info.safeArea.top) ? info.safeArea.top : 0;
      } catch (e) { return 0; }
    }
    return 0;
  }

  // 记录上一次的画布尺寸，仅当尺寸真正变化时才重建 backing store。
  // 【关键修复】canvas.width/height 每帧赋值会重新分配整块画布缓冲区，
  // 在全屏浏览器（大画布 + 高 DPR）下会周期性露出未初始化的 GPU 显存，
  // 表现为「红色全屏定时闪动」；手机画布小、开销低故不复现。
  var _lastCssW = 0, _lastCssH = 0, _lastDpr = 0;
  function resize () {
    // KS 小游戏由 game.json 锁定竖屏；浏览器调试固定使用 414×896 竖屏逻辑分辨率。
    var isKS = typeof ks !== 'undefined' || (typeof window.__kwaiGameEnv !== 'undefined');
    var cssW, cssH, dpr, systemInfo;
    if (isKS) {
      // 快手真机的标准字段是 pixelRatio；部分 Web 适配层只暴露
      // devicePixelRatio，不能只读取其中一个，否则真机会退化为 1x 画布。
      if (typeof ks !== 'undefined' && ks.getSystemInfoSync) {
        try { systemInfo = ks.getSystemInfoSync(); } catch (e) { systemInfo = null; }
      }
      cssW = systemInfo && systemInfo.windowWidth || window.innerWidth;
      cssH = systemInfo && systemInfo.windowHeight || window.innerHeight;
      dpr = systemInfo && (systemInfo.pixelRatio || systemInfo.devicePixelRatio);
    } else {
      // 浏览器调试：从 html 元素读取固定竖屏分辨率。
      var _htmlEl = document.documentElement;
      cssW = parseInt(_htmlEl.getAttribute('data-debug-w') || '414', 10);
      cssH = parseInt(_htmlEl.getAttribute('data-debug-h') || '896', 10);
    }
    dpr = Number(dpr || window.devicePixelRatio || 1);
    // H5 预览至少使用 2x 缓冲区；真机遵循设备 DPR，上限 3x 控制 GPU 内存。
    dpr = Math.max(isKS ? 1 : 2, Math.min(3, dpr));

    M3.Layout.safeTop = getSafeTop();
    M3.Layout.bottomPadding = systemInfo && systemInfo.safeArea ? Math.max(0, cssH - systemInfo.safeArea.bottom) : 0;
    M3.Layout.usableH = cssH - M3.Layout.safeTop - M3.Layout.bottomPadding;

    // 尺寸/DPR 未变化时，跳过昂贵的画布重建，避免全屏浏览器周期性红屏闪动
    if (cssW === _lastCssW && cssH === _lastCssH && dpr === _lastDpr) return;
    _lastCssW = cssW; _lastCssH = cssH; _lastDpr = dpr;

    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    // WebGL viewport 同步物理像素尺寸
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    // 更新布局参数
    M3.Layout.w = cssW;
    M3.Layout.h = cssH;
    M3.Layout.dpr = dpr;
  }
  resize();
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 【统一时间源】
  // M3._now 已由 m3-init.js 定义，此处无需重复。
  // 所有主循环和动画逻辑统一使用 M3._now()，禁止直接调用 performance.now()。
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // 【占位绘制】
  // 仅用于模版验证，AI 生成游戏后此函数应被 render.js 中的 WebGL 绘制逻辑替代。
  // 所有绘制必须使用 WebGL API（gl.clearColor / gl.clear / shader / drawArrays 等），
  // 禁止使用 Canvas 2D API（ctx.fillRect / ctx.fillText / ctx.drawImage 等）。
  // ─────────────────────────────────────────────────────────────────────────
  function draw() {
    if (!gl) return;
    M3.Game.ensureStarted();
    M3.Game.update();
    M3.Renderer.draw(gl, M3.SceneModels.snapshot());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 【主循环】
  // 每帧先 resize（幂等，尺寸未变时开销极低），再执行绘制。
  // AI 生成游戏后将 draw() 替换为 M3.Game.update() + M3.Render.draw() 等调用。
  // ─────────────────────────────────────────────────────────────────────────
  function loop() {
    resize();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
