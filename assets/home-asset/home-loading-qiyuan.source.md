# 启元传说封面

- 原始参考：用户提供的 `ui设计参考/封面.webp`，286 × 618。
- 高清版本：内置 image_gen 工具参考重制，输出 853 × 1844；保持原构图、四字标题、蓝甲盾兵、紫色能量角色、绿色侦察兵、橙色机甲和城市防线。
- 运行时资源：`home-loading-qiyuan.webp`，从高清 PNG 原稿直接编码为 WebP 质量 80（非 JPEG 转码），保留 853 × 1844 尺寸；按本地主包资源加载。
- 原图中的示例加载文字和固定百分比已从高清底图中移除。渲染器绘制实时加载文字、百分比和分段进度条。
- 加载完成后自动进入关卡列表，不设置人工等待或定格进度。
- 旧的狼人队封面移至 `docs/ui-reference/archive/home-loading-wolf-team.jpg` 留档，不再计入运行时资源。
- 游戏入口：`http://127.0.0.1:8000/`。

## 本次内置 image_gen 提示词

Use case: precise-object-edit. Edit target: supplied original game cover. Create a faithful HIGH RESOLUTION restoration at 1248 x 2704 (portrait, same 414:896 ratio), not a redesign. Preserve the original composition, all three foreground heroes (blue armored shield soldier left, white-haired purple-energy specialist center, green scout right), orange mech at center, distant giant alien, ruined city, weapon beams and military pixel-art style. Preserve the large top Chinese logo EXACTLY: 启元传说. Preserve subtitle EXACTLY: 防线系统启动中. Render crisp intentional pixel clusters, readable mechanical shapes, sharp silhouette edges, refined detail, no blur, no smooth 3D, no new subjects. Match steel blue / dark cyan / military green / restrained orange palette and left-top lighting. Bottom 17%: preserve the dark industrial armored loading-terminal frame but REMOVE ALL embedded loading text, percentage, segmented progress bar and slogan from INSIDE that terminal; leave a blank stable #0B2534 surface, because the game will draw live loading UI over it. No fake percentage, no watermark. Keep layout and character identities as close as possible to the supplied image. Output a high resolution restoration, not an enlarged blurry interpolation.

注：工具实际返回尺寸为 853 × 1844，运行时使用这一尺寸。
