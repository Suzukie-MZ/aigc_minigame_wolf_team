# TinyPNG 图片压缩

通过 https://tinypng.com/ 网页处理目录内全部 68 张现存 PNG、WebP、JPEG 图片。

- 原图合计：24,295,294 字节。
- 保留结果合计：8,281,874 字节，减少约 65.9%。
- 67 张压缩后更小并替换；1 张未缩小，保留原图。
- 格式、尺寸、帧数一致，透明图片保留透明通道；TinyPNG 使用有损压缩，像素并非完全相同。
- 图片加载、分包及 6 MB 包体限制相关 11 项自动化测试通过。
- 本次仅压缩现存图片，未恢复此前删除的资源；完整打包仍受 item-question-glass.jpeg 等已有缺失资源影响。

| 图片 | 原始字节 | 保留字节 |
|---|---:|---:|
| subpackages/monsters/assets/Image/裂隙爬兽.png | 75800 | 23076 |
| subpackages/monsters/assets/Image/终末领主.png | 105536 | 31095 |
| subpackages/monsters/assets/Image/流亡掠夺者.png | 80854 | 24730 |
| subpackages/monsters/assets/Image/幽影飞袭者.png | 77222 | 22076 |
| subpackages/battle-images/assets/Image/ui/pixel-units-25d-v1.webp | 509810 | 509810 |
| subpackages/monsters/assets/Image/咒印潜伏者.png | 87111 | 26566 |
| subpackages/battle-images/assets/Image/ui/pixel-terrain-25d-v1.webp | 287706 | 282396 |
| assets/home-asset/home-loading-qiyuan.png | 2640156 | 731121 |
| subpackages/battle-images/assets/Image/ui/battle-scene-surround.webp | 90914 | 14806 |
| subpackages/battle-images/assets/Image/ui/battle-arena-background-v1.jpg | 70514 | 67462 |
| assets/Font/font-cn-ui-hd.png | 174126 | 167792 |
| assets/Font/font-cn-main-8.png | 9401 | 3916 |
| assets/Font/font-cn-main-7.png | 157242 | 113642 |
| assets/Font/font-cn-main-6.png | 160361 | 116971 |
| assets/Font/font-cn-main-5.png | 163333 | 119828 |
| assets/Font/font-cn-main-4.png | 164642 | 119630 |
| assets/Font/font-cn-main-3.png | 162302 | 119405 |
| assets/Font/font-cn-main-2.png | 162842 | 118545 |
| assets/Font/font-cn-main-1.png | 160745 | 116166 |
| assets/Font/font-cn-main-0.png | 146799 | 107694 |
| subpackages/monsters-light/assets/Image/咒印潜伏者/咒印潜伏者_up.png | 247583 | 76487 |
| subpackages/monsters-heavy/assets/Image/重甲异兽/重甲异兽_up.png | 330227 | 111232 |
| subpackages/monsters-light/assets/Image/咒印潜伏者/咒印潜伏者_left.png | 278089 | 80359 |
| subpackages/monsters-heavy/assets/Image/重甲异兽/重甲异兽_right.png | 290368 | 92086 |
| subpackages/monsters-heavy/assets/Image/重甲异兽/重甲异兽_move.png | 371822 | 120428 |
| subpackages/monsters-heavy/assets/Image/远古战争傀儡/远古战争傀儡_up.png | 398317 | 125483 |
| subpackages/monsters-heavy/assets/Image/重甲异兽/重甲异兽_left.png | 298717 | 93875 |
| subpackages/monsters-heavy/assets/Image/远古战争傀儡/远古战争傀儡_right.png | 414643 | 122065 |
| subpackages/monsters-heavy/assets/Image/远古战争傀儡/远古战争傀儡_move.png | 453994 | 136225 |
| subpackages/monsters-heavy/assets/Image/远古战争傀儡/远古战争傀儡_left.png | 363328 | 111615 |
| subpackages/monsters-heavy/assets/Image/终末领主/终末领主_right.png | 384845 | 104271 |
| subpackages/monsters-heavy/assets/Image/终末领主/终末领主_up.png | 354488 | 102595 |
| subpackages/monsters-heavy/assets/Image/终末领主/终末领主_left.png | 396056 | 112121 |
| subpackages/monsters-heavy/assets/Image/终末领主/终末领主_move.png | 421895 | 122623 |
| subpackages/monsters/assets/Image/重甲异兽.png | 78610 | 24938 |
| subpackages/monsters/assets/Image/远古战争傀儡.png | 97058 | 29038 |
| subpackages/monsters-light/assets/Image/流亡掠夺者/流亡掠夺者_up.png | 264635 | 80870 |
| subpackages/monsters-light/assets/Image/流亡掠夺者/流亡掠夺者_right.png | 313311 | 90826 |
| subpackages/monsters-light/assets/Image/流亡掠夺者/流亡掠夺者_move.png | 301583 | 89023 |
| subpackages/monsters-light/assets/Image/流亡掠夺者/流亡掠夺者_left.png | 273209 | 79465 |
| subpackages/monsters-light/assets/Image/幽影飞袭者/幽影飞袭者_up.png | 295166 | 79128 |
| subpackages/monsters-light/assets/Image/幽影飞袭者/幽影飞袭者_right.png | 287013 | 79364 |
| subpackages/monsters-light/assets/Image/幽影飞袭者/幽影飞袭者_move.png | 282594 | 75898 |
| subpackages/monsters-light/assets/Image/幽影飞袭者/幽影飞袭者_left.png | 267390 | 71724 |
| subpackages/monsters-light/assets/Image/咒印潜伏者/咒印潜伏者_move.png | 281521 | 81948 |
| subpackages/monsters-light/assets/Image/咒印潜伏者/咒印潜伏者_right.png | 306066 | 88655 |
| subpackages/ui-images/assets/Image/ui/result/experience-crystal.png | 109090 | 32670 |
| subpackages/ui-images/assets/Image/ui/result/coins.png | 145156 | 46738 |
| subpackages/ui-images/assets/Image/ui/map/map-share.webp | 32484 | 8896 |
| subpackages/ui-images/assets/Image/ui/map/map-energy.webp | 23004 | 6652 |
| subpackages/ui-images/assets/Image/ui/map/map-hero-upgrade.webp | 46726 | 11192 |
| subpackages/ui-images/assets/Image/ui/item/tactical-supply.webp | 48880 | 12080 |
| subpackages/ui-images/assets/Image/ui/level-lock.webp | 2376 | 1774 |
| subpackages/ui-images/assets/Image/ui/item/economy-boost.webp | 168460 | 41458 |
| subpackages/ui-images/assets/Image/ui/item/clear-enemies.webp | 215456 | 61754 |
| subpackages/ui-images/assets/Image/ui/ui-map-terrain.png | 1116 | 689 |
| subpackages/ui-images/assets/Image/ui/ui-icons.png | 318956 | 73454 |
| subpackages/ui-images/assets/Image/ui/ui-icons.webp | 249674 | 78388 |
| subpackages/ui-images/assets/Image/ui/result/success-crest.png | 181511 | 43431 |
| subpackages/ui-images/assets/Image/ui/result/video-ticket.png | 139602 | 39776 |
| subpackages/ui-images/assets/Image/ui/result/failure-crest.png | 153607 | 42447 |
| subpackages/ui-images/assets/Image/ui/result/map-pin.png | 125296 | 35908 |
| subpackages/ui-panel-images/assets/ui-tower-interface-v1.png | 1257326 | 430302 |
| subpackages/ui-panel-images/assets/ui-hero-interface-v1.png | 1015277 | 356000 |
| subpackages/ui-map-images/assets/ui-map-reference.png | 2341569 | 659976 |
| subpackages/ui-map-images/assets/ui-level-briefing-v1.png | 2517611 | 691479 |
| subpackages/ui-images/assets/Image/ui/ui-settlement-relief-v2.png | 921120 | 177896 |
| subpackages/ui-images/assets/Image/ui/ui-wave-alert-v1.png | 741053 | 209845 |
