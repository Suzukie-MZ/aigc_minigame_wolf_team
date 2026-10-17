---
change: terrain-depth-preview
design-doc: docs/superpowers/specs/2026-10-17-terrain-depth.md
base-ref: 284ca68022702de9a6b5504b4bc2a8c21e68c44f
---

用户确认：先看生成效果后，明确要求“按照这版方案给我改一下”。本次本地试做属于该确认范围。

1. 先验证地形邻接与资源缺失回退，独立实现 TerrainDepth；不涉及游戏数值。
2. 在现有资源加载器登记本地图集，地图预览和战斗先尝试新渲染，失败后保留旧路径。
3. 同步 H5 和小游戏入口，检查测试和打包，实际浏览器试玩并截图。
4. 不提交推送、不部署、不上传 CDN；保留原接口和完整试玩回退。
