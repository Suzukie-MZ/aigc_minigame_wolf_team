# 关卡简报页实装

基于用户确认的 level-briefing-layout-v1.png。运行资源 ui-level-briefing-v1.webp 由该设计图转换（quality 88，853×1844）；只取独立边框、标识、图标与按钮，不把整图当作界面。生成来源及原始提示词见 level-briefing-layout-v1.source.md 和 level-briefing-layout-v1.prompt.txt。

关卡名称、编号、目标、地图数据和地图图例继续使用当前配置，棋盘格按实际宽高等比显示；保留原地图素材。按钮使用独立点击区域：返回/关闭回到选图，选择出战英雄进入英雄单选，之后四塔选择，最后才扣体力出战。

布局根据414×896、390×844含安全区、320×568短屏适配，主要按钮和关闭至少48px。高清字库扩展本地配置文案与目标常用字，流程箭头也纳入字库。实装截图 level-briefing-preview.png。
