# Oh My Workflow Design Handoff

- Change: terrain-depth-preview
- Phase: design
- Mode: compact
- Context hash: 8f34fa45dc3692e69e5440161fc9e06844f993f5cd068e94707a39b8c2c8c964

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/terrain-depth-preview/proposal.md

- Source: openspec/changes/terrain-depth-preview/proposal.md
- Lines: 1-17
- SHA256: b9062283ccec4a88de35a61cb9cf031e54be1ce7cc95bd4775d0fcf4a53b3373

```md
## Why
用户已确认以生成的概念图试做可试玩的立体地块。现有平铺草地缺乏高低差、道路衔接和接地感。

## What Changes
- 添加本地苔藓、道路、岩壁、平台图集。
- 渲染连续地面及仅在地形交界出现的岩壁、路沿和阴影。
- 地图预览与战斗使用同一地形绘制方式，保留原坐标和点击布局。
- 本地试用，可关闭效果回到原地块；不发布 CDN。

## Capabilities
### New Capabilities
- `terrain-depth`: 地块立体呈现及贴图加载回退。
### Modified Capabilities
无。

## Impact
客户端渲染、资源登记、H5 和小游戏加载入口。不会改写关卡、波次、寻路、碰撞、射程或服务端发布数据。
```

## openspec/changes/terrain-depth-preview/design.md

- Source: openspec/changes/terrain-depth-preview/design.md
- Lines: 1-20
- SHA256: be1eb40924b27ccdf60aa46627f563e773119b9dbd7fc1db038af011d60e6832

```md
## Context
现有 WebGL 渲染器逐格铺图，地块不参与碰撞以外的高度计算。用户已确认概念效果并要求试做。本仓库原无独立 OpenSpec 根；已建立本地根避免写入父目录其他项目任务。

## Goals / Non-Goals
实现贴图烘焙的浅高度差，采用现有矩形网格。只做视觉层，不改变游戏坐标、数值或 CDN。

## Decisions
- 一个压缩本地图集通过 AssetManager 加载，四个区域为草地、道路、岩壁与平台。无需增加请求接口。
- 独立 TerrainDepth 绘制模块：先平铺地面，再按邻接关系绘制岩壁与路沿，再叠加现有传送门、基地、英雄位与障碍。
- 同类草地不画内边，草地向南接道路时显示侧面，其余方向使用接缝阴影。保留原网格与可点击范围。
- 预览与战斗复用同一函数。贴图未就绪或禁用时返回旧渲染。浏览器 terrain=flat 可对比。
- 本地资源按需加载，不加入启动强制成功条件，避免影响现有游戏启动。

## Risks / Trade-offs
- 静态贴图不能表现真实旋转视角，效果定位为浅立体美术。
- 小屏细节过密 → 降低地面明度、控制岩壁高度，浏览器截图实测。
- 图集增加安装包 → 压缩到 1024 JPEG，运行现有 6 MB 打包检查。

## Migration Plan
本地源码试用，不提交发布，不替换 CDN。关闭 TerrainDepth.enabled 或浏览器 terrain=flat 恢复旧地块。
```

## openspec/changes/terrain-depth-preview/tasks.md

- Source: openspec/changes/terrain-depth-preview/tasks.md
- Lines: 1-6
- SHA256: 67558f18ab855dc26a8847165bc27ebd467d6b2484f218db8ecf67d2d2012b4c

```md
## 1. 地形实现
- [ ] 1.1 接入本地图集与邻接地形绘制，通过邻接、清障和无数据修改测试。
- [ ] 1.2 地图预览和战斗共享绘制，H5 与小游戏入口同时加载，语法检查通过。
## 2. 验证
- [ ] 2.1 检查原图回退与游戏交互，浏览器检查截图及控制台。
- [ ] 2.2 全部现有测试与 6 MB 打包检查通过，交付本地预览地址与截图。
```

## openspec/changes/terrain-depth-preview/specs/terrain-depth/spec.md

- Source: openspec/changes/terrain-depth-preview/specs/terrain-depth/spec.md
- Lines: 1-17
- SHA256: 6afc6d61ec88ad33b434137e6149d126d1b0cee8a9d6b922d7cfae5940300d82

```md
## Purpose
在保留现有塔防关卡逻辑、格子点击位置和网络发布数据的前提下，通过地面贴图、邻接边缘、平台厚度与阴影提供可试玩的浅立体视觉效果，并允许资源未就绪时继续显示原有地图。

## ADDED Requirements
### Requirement: 地形连续与玩法不变
客户端 SHALL 在相邻同类草地之间保持连续，仅在地形交界显示边缘；地图预览和战斗 SHALL 使用相同规则且不修改关卡数据。
#### Scenario: 草地围绕拐弯道路
- **WHEN** 地图包含草地、转弯道路、障碍与建造位
- **THEN** 地形交界显示厚度，同类草地没有内部岩壁，路径和建造坐标保持原样。
#### Scenario: 障碍清除
- **WHEN** 玩家清除障碍
- **THEN** 视觉反映当前棋盘地块而非旧配置。
### Requirement: 非阻塞加载与对比
客户端 SHALL 在图集未加载或关闭效果时显示原有地块。
#### Scenario: 图集不可用
- **WHEN** 本地图集尚未加载或加载失败
- **THEN** 游戏继续采用原地块，启动流程不被阻断。
```

