# Neon Talent OS 前端设计交付说明

## 视觉命题

DeerRecall 不再只是普通招聘后台，而是一套年轻个人用户会愿意长期使用的 Talent Signal OS：暗色玻璃底、青绿/洋红信号线、候选人卡片流、轻量动效反馈。

## 本次可见交付

1. DeerSearch
   - 搜索结果卡片加入信号边、青绿匹配分、双色标签和悬浮抬升。
   - 扫描光层被限制在结果区内，不阻挡点击。
   - 空结果和有结果状态都不会触发 GSAP 空目标 warning。

2. 人才库
   - 候选人行加入信号流选中态和悬浮态。
   - 首屏只触发一次人才库入场动效，避免重复闪动。
   - 保留原有密度和招聘工作台效率，不改业务结构。

3. 候选人详情
   - 详情头部加入信号网格、青绿匹配/完整度徽章和更强的科技感层级。
   - 原始简历、AI 摘要、市场画像右栏保持可读，不让装饰层遮挡内容。

4. Electron
   - Electron 包内已包含 `dist/motion.js`、`vendor/gsap.min.js`、`vendor/Flip.min.js`。
   - 设计结果随静态 `dist` 一起进入 Electron app。

## 截图验收

截图目录：

- `docs/superpowers/design-delivery/screenshots/neon-talent-os-search.png`
- `docs/superpowers/design-delivery/screenshots/neon-talent-os-library.png`
- `docs/superpowers/design-delivery/screenshots/neon-talent-os-detail.png`

验收时请重点看：

- 第一眼是否能看出比旧版更强的科技感。
- 搜索结果是否有“卡片流”的层次和交互反馈。
- 人才库行流是否有清晰的选中态、悬浮态和信号边。
- 人才库和详情页是否保持招聘工作台的清晰信息密度。
- 视觉层是否没有出框、遮挡点击或破坏文字可读性。

## 兼容性边界

本次仍遵守现有前端系统：

- 不引入 React / Vite / CDN。
- GSAP 和 Flip 使用本地 vendor 文件。
- 静态 `dist`、Docker Harness、Electron/Tauri 结构保持兼容。
- 支持 `prefers-reduced-motion: reduce`，系统减少动画时关闭信号漂移动效和 hover 位移。
