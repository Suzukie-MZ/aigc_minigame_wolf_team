# 2.5D 地块本地试用

- 新版：http://127.0.0.1:8091/
- 原版对比：http://127.0.0.1:8091/?terrain=flat
- 如本地服务停止：在本仓库运行 `python3 -m http.server 8091 --bind 127.0.0.1`。
- 512×512 地形 JPEG + 256×256 透明 PNG 水晶岩石，共 206,007 字节；只覆盖本地绘制，未改 CDN 配置。
- 草地连续铺设；地形交界按相邻格子绘制侧壁、路沿和阴影；建造位使用立体平台。特殊入口/基地/英雄位保留现有主题图。
- 障碍跟随当前棋盘变化；寻路、点击、射程、波次与存档逻辑保持原样。
- 图集加载失败或尚未完成时使用原地块；浏览器 `terrain=flat` 恢复原有地形呈现。

## 验证（2026-10-17）

- Node 测试 35/35 通过（31 项原测试、4 项地形测试）。
- JS 语法与 git diff 空白检查通过；OpenSpec strict 校验通过。
- 实际浏览器已显示地图列表、详情和战斗中新地形；已看到建塔后的战斗画面。
- 随后浏览器连接中断，最终压缩图集及侧壁高度微调未完成新的视觉复核，截图未保存；不能据此宣称真机验收。
- 本地试玩 HTTP 返回 200。
- 打包脚本未通过：原工作树检查包含 .git；干净运行目录也因全部资源超过脚本的 6,000,000 字节限制失败。Git HEAD 同范围资源基线 13,746,635 字节；本次 13,958,097 字节。该超限是原有问题，本次净增加 211,462 字节，未放宽体积检查。
- 不推送、不部署、不更新 CDN，也未生成可提审安装包。

## 双底座修复（2026-10-17）

- 战斗地形接入当前防御塔坐标；空建造位保留平台，已建塔位置仅绘制地面，再由单位层绘制塔图片自带底座。移除后恢复平台，地图预览保持空位平台。
- 新增 3 项回归测试，全部测试 38/38 通过；JS 语法和 diff 检查通过。
- 实际浏览器进入第一关、选塔、选英雄并建造守望棱塔，已确认额外平台消失，旁边空建造位的平台保留。页面控制台未记录 error。
- 效果截图：/tmp/tower-single-base.jpg。本次没有新增图片资源，未重新执行原先超限的打包检查。

## 空平台与塔底座透视统一（2026-10-17）

- 用内置 imagegen 参照本地守望棱塔 Lv1 和震荡重炮 Lv1 制作 `assets/terrain-depth/tower-foundation.png`，256×256 透明 PNG，46,833 字节。
- 空塔位使用低纵深、水平前沿、灰钢与黄色护角的独立底座；按完整透明画布绘制，与塔使用同一个格子原点和底部锚点。英雄位仍保留原有专用标识。
- 加载未完成时回退平台也压缩到格子下部，避免旧满格平台闪现。建塔后的单底座规则继续保留。
- 全部测试 40/40 通过，语法与 diff 检查通过；透明通道已确认。浏览器观察到空位和守望棱塔在同一行前沿对齐；地图预览截图 `/tmp/tower-foundation-preview.jpg`。控制台无 error。
- 仍为本地预览，没有提交、部署或 CDN 发布。此前已知的 6 MB 安装包超限未在本次处理。

### 素材制作提示词

内置 imagegen 编辑；第一张参照为守望棱塔 Lv1，第二张为震荡重炮 Lv1；透明背景。

Create a precise edited game sprite: EMPTY tower construction foundation, based on the FIRST reference tower sprite. Second reference confirms shared camera angle and platform material. Remove the entire tall tower structure from the first sprite, reconstruct the flat exposed top of its existing bottommost steel foundation. Keep the foundation's EXACT projected perspective, horizontal front edge, shape, proportions, scale and position on the original square canvas. This is a low front-facing 3/4 elevated camera with zero sideways rotation; NOT diamond isometric, NOT top-down. On a square transparent canvas the platform footprint should extend approximately x=9% to91%, y=57% to97%, back edge at y57% from x19% to81%, front edge at y94% from x9% to91%, bottom thickness to y97%. Entire upper 55% canvas MUST stay transparent, not center the platform vertically or enlarge it to fill the canvas. Low trapezoidal rectangular grey steel slab with slightly clipped corners; dark visible vertical front thickness, bolts, restrained yellow/orange hazard corner markings matching the tower base, subtle cyan small recessed accents. Flat empty center with a very subdued square mounting socket engraved flush into metal. No tower, no pedestal, no raised machine, no grass, no terrain, no backdrop, no text, no glow cloud. Match original crisp low resolution pixel-art rendering, grey metal and amber accents. Output one single sprite on true transparent background, 1024x1024. Goal: game switches this empty base sprite to original tower sprite in exactly the same square cell without any camera angle, base outline, scale or anchor jump.


## 全地块视角统一（2026-10-17）

- 英雄部署台、出生入口、基地、障碍物接入同一套斜俯视图集，英雄位不再叠加旧满格方形平台。
- 草地与道路通过半高纹理条压短视觉纵深，网格位置和完整覆盖保持不变；塔位/英雄位与草地连为同一地面，统一向下的前沿厚度和接触阴影。
- 特殊图集未就绪时保留原图回退，英雄位/入口/基地的回退图也压缩到底部。地图预览与战斗继续共享 TerrainDepth。
- 这是矩形棋盘上的贴图浅立体效果，未改变棋盘投影、寻路或点击坐标。
- 全部 45 项测试通过（包含同期其他修改新增的测试），本次相关地形测试 12 项通过；语法、diff 检查通过。浏览器地图详情确认所有特殊地块、连续地面和道路，无 console error。
- 效果截图：/tmp/terrain-perspective-unified.jpg。
- 新素材：assets/terrain-depth/terrain-markers.png，512×512 透明 PNG；由内置 imagegen 根据已接受底座与原主题标记制作。没有提交、部署或 CDN 发布。
- 发现已有独立修改：runtime-config.js、runtime-endpoints.js、runtime-cdn-endpoints.test.js，属于清单读取更新，本任务未改写这些文件。

### 全地块图集提示词

Create a production game sprite atlas, EXACT 2x2 equal square cells on a 1024x1024 TRUE TRANSPARENT canvas. Four independent sprites, no text, no borders between cells. Reference1 is the approved empty tower foundation and is the absolute camera/scale/anchor reference. References2-4 are identity/color references for hero placement, spawn portal and goal. Reference5 is rock identity. EVERY sprite must have same low elevated front-facing 3/4 camera with horizontal front edge, zero sideways rotation, NOT diamond isometric, NOT vertical top-down. In EACH 512square cell keep projected floor footprint around local x8%-92%, local y54%-97%; wide trapezoid with narrow back, wider horizontal front, dark low front wall. Keep local upper half mostly transparent except taller objects. Do not enlarge or vertically center floor sprites; empty space is intentional so they align with original tower sprite.
TOP LEFT: hero deployment platform, grey metal and yellow corners matching reference1, flat luminous cyan ellipse projected onto floor, cyan shield emblem engraved on surface in the SAME foreshortened perspective (not a vertical standing circle). No hero. TOP RIGHT: spawn portal, same platform footprint and camera, violet elliptical vortex lying flat on platform, purple rim with minimal low wisps, not a vertical portal. BOTTOM LEFT: goal base, same footprint and camera, low armored octagonal reactor dais, amber gold corner armor and cyan central energy aperture foreshortened into ellipse. Height only local y40%-97%, no tower. BOTTOM RIGHT: obstacle, dark blue rocky crystal cluster like reference5 but in crisp pixelart matching reference1, cyan crystals, no surrounding slab or square ground, bottom anchored local y97%, occupied width80%, highest point local y22%. Unified light upper left, restrained shadows within footprint, crisp pixel-art edges rather than photorealistic shading. Make four easily distinguishable game markers with identical shared perspective and ground-contact height. Transparent background throughout.
