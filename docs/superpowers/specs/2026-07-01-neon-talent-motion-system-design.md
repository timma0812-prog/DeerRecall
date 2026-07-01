# Neon Talent 动效系统设计

## 摘要

DeerRecall 将新增一套产品级动效系统，让当前静态招聘工作台更年轻、更灵动、更有 AI 产品感，同时保持现有前端架构兼容。

已确认的方向是 **Level 2: Neon Talent OS**：

- 视觉主张：AI 控制台气质，使用霓虹信号光、暗色玻璃质感、克制的扫描瞬间。
- 交互主张：候选人卡片和任务行像人才流一样运动，重点体现在搜索、筛选、排序、导入和详情切换。
- 产品边界：动效要让产品显得智能、有生命力，但不能降低招聘信息密度，也不能破坏现有桌面端和静态运行时。

本设计覆盖 DeerSearch、简历导入、人才库、候选人简历详情四条核心体验。不重做应用外壳，不改变产品信息架构，不引入 React/Vite。

## 目标

- 通过有质感、可感知的动效，让产品更吸引年轻个人用户。
- 保持现有静态前端系统：`index.html`、`styles.css`、`app.js`、`deersearch-engine.js`。
- 以本地静态资源方式接入 GSAP，不使用 CDN。
- 保持 Electron、Tauri、Docker、Node 静态服务和 Harness 发布链路兼容。
- 动效必须是渐进增强：缺少 GSAP 或用户开启 reduced motion 时，产品仍然完整可用。
- 建立视觉 QA 标准，防止边框不协调、出框、布局跳动、重叠或裁切。

## 非目标

- 不迁移到 React、Vue、Vite、Next.js 或其他构建体系。
- 不使用 CDN 托管的动画库。
- 不做完整应用外壳重设计。
- 动效不改变业务逻辑、搜索排序、导入结果、本地持久化、AI 请求或 Electron IPC 行为。
- 不在招聘工作台里做营销页式滚动叙事。
- 不加入干扰高频招聘工作的常驻装饰动画。

## 当前前端约束

DeerRecall 当前是静态浏览器应用，并带有桌面端包装：

- `index.html` 加载相对路径静态脚本。
- `styles.css` 负责全部视觉样式。
- `app.js` 负责 UI 状态、事件处理、本地人才库渲染、AI 请求和桌面端 IPC 调用。
- `deersearch-engine.js` 负责本地搜索和 AI rerank 辅助逻辑。
- `scripts/build-static.mjs` 将严格限定的运行时资源复制到 `dist`。
- `scripts/verify-dist.mjs` 会拒绝缺失、多余、空文件或非法运行时资源。
- Electron 通过 `file://` 加载 `dist/index.html`。
- Tauri 指向 `../dist`。
- Docker 服务预构建的 `dist`。
- Harness 运行 `npm run check`、`npm run build`、`npm run verify:dist`。

任何动效实现都必须遵守这套契约。

## 架构

新增一层很薄的静态动效层：

```text
vendor/gsap.min.js
vendor/Flip.min.js
motion.js
```

建议脚本加载顺序：

```html
<script src="vendor/gsap.min.js"></script>
<script src="vendor/Flip.min.js"></script>
<script src="motion.js"></script>
<script src="deersearch-engine.js"></script>
<script src="app.js"></script>
```

`motion.js` 暴露一个浏览器全局对象：

```javascript
window.DeerRecallMotion = {
  enterView(name, root),
  enterSearchResults(root),
  flipSearchCards(mutator),
  flipFilterChips(mutator),
  enterImportState(state, root),
  updateImportProgress(nodes, value),
  enterTalentView(root),
  pulseTalentSelection(item),
  enterResumeDetail(root),
  enterResumePanel(root),
  enterMarketInsight(root)
};
```

API 保持小而明确。`app.js` 仍是状态事实来源。`motion.js` 只对已经存在或刚渲染出的 DOM 做动画。

`app.js` 中所有调用都使用 optional chaining：

```javascript
window.DeerRecallMotion?.enterSearchResults?.(resultsState);
```

所有动效方法在以下情况必须安全 no-op：

- `window.gsap` 缺失。
- 用户启用 `prefers-reduced-motion: reduce`。
- 目标元素不存在。
- 目标元素已隐藏或已脱离 DOM。

## GSAP 使用规则

GSAP 用于时间线编排、分批入场、进度数值补间和 Flip 布局转场。

优先使用不会触发布局重排的属性：

- `x`
- `y`
- `scale`
- `autoAlpha`
- `opacity`
- 只用于光效强度或 transform-safe 视觉的 CSS 变量

避免动画这些属性：

- `width`
- `height`
- `top`
- `left`
- `margin`
- `padding`
- grid template 值
- 滚动容器尺寸

只在 `motion.js` 中注册一次 `Flip`，并且仅在插件存在时注册：

```javascript
if (window.gsap && window.Flip) {
  window.gsap.registerPlugin(window.Flip);
}
```

不要 monkey-patch 现有全局函数。优先在 `app.js` 的现有状态函数里加入显式 hook。

## 视觉语言

整体气质应是 **AI 控制台 + 动态候选人流**。

可以克制使用这些视觉母题：

- DeerSearch 转场中的扫描光。
- 活跃候选人或活跃导入状态上的霓虹边缘光。
- 候选人卡片分批入场。
- 卡片和行重排时使用平滑 Flip。
- 导入完成时短促完成 pulse。
- 简历详情分层 reveal。

避免：

- 永久在线的动态背景。
- 一个面板里出现多个互相竞争的霓虹色。
- 悬浮在操作 UI 上方的大型装饰物。
- 会挡住点击或覆盖候选人信息的动效。
- 不统一的边框、圆角或阴影。

## 设计系统约束

动效必须保持现有工作台结构和视觉纪律：

- 本次动效功能不改变主三栏工作台比例。
- 不添加卡片套卡片。
- 不引入不一致的圆角。
- 卡片圆角不超过现有产品模式，除非当前组件已经使用更大圆角。
- 线宽要与当前玻璃 UI 视觉一致。
- 动画元素必须留在父容器裁切和布局边界内。
- 动画不得制造横向 overflow。
- 动画过程中，文本不得覆盖前后内容。
- 按钮和交互控件在动画期间仍必须可点击。
- 装饰性动画层使用 `pointer-events: none`。
- 强霓虹效果只用于活跃或转场状态，不铺满每张卡。
- 搜索、导入、人才库、简历详情使用统一时长和缓动，让动效像同一套系统。

## 核心体验 1：DeerSearch

### 用户感受

提交查询应该像让 AI 系统扫描本地人才宇宙。结果出现时，要像系统正在识别、排序并锁定候选人。

### 动效顺序

1. 提交搜索：
   - Query bubble 快速出现。
   - AI 回答区域淡入并轻微滑入。
   - 结果区出现一道克制扫描光。

2. 渲染结果：
   - 候选人卡片分批入场。
   - 高匹配候选人的分数徽标 pulse 一次。
   - 标签在卡片主体文本之后出现。

3. 排序和筛选：
   - 已存在候选人卡片使用 GSAP Flip 移动到新位置。
   - 如果不和 `hidden` 属性冲突，隐藏卡片可做淡出和轻微压缩；否则只做入场和重排。
   - 筛选 chip 在新增、移除、重新渲染时使用 Flip。

### 技术 Hook

- `showResults(queryText, options)`
- `applySearchResultModel(result)`
- `renderSearchResultState(result)`
- `sortSearchCandidates()`
- `applySearchResultFilters()`
- `addSearchFilterChip()`
- `removeSearchFilterChip(button)`
- `renderSearchFilterChips(chips)`

### 稳定选择器

- `#resultsState`
- `[data-local-search-list]`
- `.candidate-card[data-search-score]`
- `[data-search-filter-bar]`
- `[data-search-filter-chip]`
- `[data-search-sort-toggle]`
- `[data-search-city-toggle]`
- `[data-search-conversation-answer]`

### 护栏

- 不为了动画延迟真实搜索结果渲染。
- AI 还未完成时，不制造“排序已经完成”的误导。
- 不用会导致右侧栏 overflow 的方式动画长 AI 文本。

## 核心体验 2：简历导入

### 用户感受

导入流程应该像可见的 AI 处理管线：选择本地来源、检查文件、解析文本、加入候选人、暴露问题。

### 动效顺序

1. 默认状态：
   - 拖拽区域在 drag 状态下做轻微边框/光感抬升。
   - 导入方式按钮给出即时 hover/press 反馈。

2. 预检状态：
   - 来源名称和路径先 reveal。
   - 指标卡做短促数值补间。
   - 支持、重复、失败等数值保持可读且稳定。

3. Loading 状态：
   - 进度条在真实值之间补间。
   - 当前文件行纵向分批进入。
   - 保留现有 CSS spinner 和导入图标浮动，除非它们与 GSAP 冲突。

4. 完成状态：
   - 完成 badge pulse 一次。
   - 结果统计整体 reveal。
   - 主下一步操作给一个短促焦点提示。

### 技术 Hook

- `showImportState(nextState)`
- `openImportPickerCard(mode)`
- `handleImportFiles(fileList, options)`
- `applyDesktopImportResult(selectedImport, fallbackMessage)`
- `setImportAssistantProgress(payload)`
- `setImportAssistantResult(source)`
- `updateImportPreview(source)`

### 稳定选择器

- `#importState`
- `[data-import-state]`
- `[data-import-drop-zone]`
- `[data-import-stat]`
- `[data-import-loading-progress]`
- `[data-import-loading-percent]`
- `[data-import-loading-file]`
- `[data-import-open]`

### 护栏

- 不把文件数量动画做得太慢，避免用户不信任进度。
- 用户拖拽时，不移动拖拽区域本体。
- 不用动画阻塞 Electron 文件选择器调用。
- 不在状态值之外制造假进度。

## 核心体验 3：人才库

### 用户感受

人才库应该像动态候选人流。筛选和选择候选人时，要保持空间连续性，让用户理解发生了什么变化。

### 动效顺序

1. 打开人才库：
   - KPI 行快速 reveal。
   - 当前列表行做克制分批入场。
   - 右侧 assistant panel 在列表上下文出现后淡入。

2. 切换人才 tab：
   - Tab 状态立即变化。
   - 新列表行原地 reveal。
   - 右侧 panel 内容交叉淡入或纵向 reveal。

3. 选择候选人：
   - 选中行出现霓虹边缘 pulse。
   - 右侧 panel 做短促 reveal。

4. 排序或移动任务行：
   - 现有元素 append 或 move 时使用 Flip。
   - `innerHTML` 重建导致元素身份丢失时，使用简单分批入场。

### 技术 Hook

- `showTalentState(filter)`
- `setTalentFilter(filter)`
- `showTalentPanel(panelName)`
- `selectTalentItem(item)`
- `renderLocalTalentRows(candidates)`
- `renderLocalSources(library)`
- `renderLocalImportTasks(library)`
- `updateImportTaskRow(task)`

### 稳定选择器

- `#talentState`
- `[data-talent-view]`
- `[data-talent-item]`
- `[data-talent-filter]`
- `[data-talent-panel]`
- `[data-local-candidate-list]`
- `[data-local-source-list]`
- `[data-local-task-list]`

### 护栏

- 不让行元素动画到滚动容器外。
- 选中 pulse 不增加行高。
- 不降低候选人标签或来源元数据的信息密度。
- 可用时使用 `data-candidate-id` 和 `data-task-id` 这样的 key。

## 核心体验 4：候选人简历详情

### 用户感受

打开候选人详情应该像聚焦进入一个候选人画像。Hero、匹配分、标签、tab 和详情卡片按清晰层级展开。

### 动效顺序

1. 打开详情：
   - 简历 hero 最先进入。
   - 头像、姓名、状态、匹配分和操作按钮按顺序 reveal。
   - 详情卡片做短促 stagger。

2. 切换详情 tab：
   - Tab 状态立即变化。
   - 新 panel 使用 `autoAlpha` 和小幅 `y` reveal。
   - 旧 panel 由现有状态逻辑隐藏，不等待长离场动画。

3. 市场画像：
   - Loading 状态使用轻微 pulse。
   - 完成后结果区从上到下 reveal。

### 技术 Hook

- `openCandidateResume(candidateId, options)`
- `showCandidateResumePanel(viewName)`
- `updateCandidateResume(candidate)`
- `setMarketInsightState(state, message)`
- `renderMarketInsight(insight)`

### 稳定选择器

- `#candidateResumeState`
- `[data-candidate-resume-panel]`
- `[data-candidate-resume-tab]`
- `.resume-profile-hero`
- `.resume-detail-card`
- `[data-market-insight-card]`
- `[data-market-insight-result]`

### 护栏

- 当 GSAP 接管简历详情动效时，替换或禁用现有 `resumeRise` CSS 动画。
- 不用影响滚动阅读的方式动画简历文档预览。
- 不在 focus/ARIA 状态更新前隐藏可聚焦控件。

## Reduced Motion 与降级

`motion.js` 必须检测 reduced motion：

```javascript
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

当 reduced motion 开启时：

- 页面和 panel 转场即时完成。
- 跳过 Flip 重排动画。
- 进度值立即更新。
- 保留的 CSS 动画通过 CSS reduced-motion block 禁用或最小化。

如果 GSAP 或 Flip 加载失败：

- 所有应用函数继续运行。
- 不抛出错误。
- 现有 CSS 布局和状态 class 继续工作。

## 构建与运行时资源契约

运行时资源需要更新为：

```text
index.html
styles.css
deersearch-engine.js
app.js
motion.js
vendor/gsap.min.js
vendor/Flip.min.js
```

必须更新：

- `index.html`：按确认顺序加入脚本。
- `scripts/build-static.mjs`：复制 `motion.js` 和 `vendor/`。
- `scripts/verify-dist.mjs`：校验顶层文件和递归 vendor 文件。
- `package.json`：给 `npm run check` 加上 `node --check motion.js`。
- `tests/homepage-structure.test.js`：断言脚本顺序、资源契约、reduced motion 护栏、静态发布更新。
- `README.md`：记录本地动效运行时资源和离线行为。
- `.harness/deerrecall-ci-cd.yaml`：增加 `motion.js` 和 vendor 脚本的 smoke/cache 检查。

不能只依赖 `npm install gsap`。没有 bundler 时，npm 依赖不会自动进入静态浏览器运行时。

## Harness 要求

Harness 必须继续运行现有 pipeline 顺序：

```text
npm run check -> npm run build -> npm run verify:dist -> docker build -> docker compose up -d -> release smoke checks
```

新增发布 smoke check：

- `/motion.js`
- `/vendor/gsap.min.js`
- `/vendor/Flip.min.js`

所有 JS 和 CSS 运行时资源继续沿用现有 no-cache 策略，直到未来引入 hash 文件名。

## Worktree 与 Subagent 开发流程

开发在隔离 worktree 中进行：

```text
.worktrees/codex/neon-talent-motion-system
```

分支：

```text
codex/neon-talent-motion-system
```

主工作区除了已经提交的 ignore 规则外保持干净。

实施计划使用 subagent-driven development：

1. 构建/静态资源契约 worker。
2. 动效运行时 API worker。
3. DeerSearch 与 Flip worker。
4. 导入与人才库 worker。
5. 候选人详情与市场画像 worker。
6. 最终兼容性和视觉 QA reviewer。

Worker 尽量拥有互不重叠的文件范围，并且不能回滚其他 worker 的修改。

## ROPE 工作模型

本项目将 “rope” 作为把设计和实现绑在一起的工作纪律：

- **R**equirements：年轻用户、Level 2 Neon Talent OS、四条核心流程、现有前端兼容。
- **O**ptions：本地 vendor GSAP、独立 `motion.js`、显式 app hook、reduced-motion 降级。
- **P**lan：写任务级实施计划后再改代码。
- **E**xecute：使用 worktree、Harness 门禁和 subagent review loop 执行。

如果后续需要某个具体 ROPE 工具或框架，必须先确认本地可用且兼容当前静态应用，再加入实施计划。

## 测试策略

必须运行的自动化检查：

```bash
npm test
npm run check
npm run build
npm run verify:dist
```

需要新增或更新测试：

- `index.html` 脚本顺序。
- `motion.js` 存在且被语法检查。
- build script 复制 `motion.js` 和 `vendor/`。
- dist verification 期望并校验 vendor 资源。
- Harness 检查新增静态资源。
- JS 和 CSS 存在 reduced-motion 降级。
- 动效 hook 是可选增强，不替换业务逻辑。

必须做手动或浏览器辅助 QA：

- 桌面宽屏：三栏 shell 保持对齐。
- 常规桌面：卡片、面板、右侧栏不重叠。
- 窄屏：动画不制造横向 overflow。
- DeerSearch：提交、排序、筛选、城市筛选、AI 回答历史恢复。
- 导入：默认、预检、loading、完成、取消、拖拽。
- 人才库：tab、行选择、来源视图、待完善和疑似重复视图。
- 候选人详情：从搜索和人才库打开、切换 tab、运行市场画像。
- Reduced motion：所有流程在动效关闭时仍可用。
- Electron 文件加载：`vendor/` 和 `motion.js` 可从 `file://` 加载。

## 视觉 QA 清单

完成前必须验证：

- 动画过程中，没有组件移出父容器。
- 没有新增横向滚动条。
- 动画过程中，文本不覆盖相邻内容。
- 按钮不被动画 overlay 遮挡。
- 动画 overlay 使用 `pointer-events: none`。
- 边框、圆角与 DeerRecall 现有表面一致。
- Hover、focus、active 状态仍清晰可见。
- 候选人卡片在 hover、筛选、排序、入场时尺寸稳定。
- 人才行选中 pulse 不改变行高。
- 导入进度和指标不撑大父面板。
- 简历详情卡片不和现有滚动容器冲突。

## 风险与缓解

### 风险：`.state-hidden` 使用 `display: none !important`

GSAP 无法在元素已经 display-none 后做动画。

缓解：

- 第一阶段聚焦 reveal 后的入场动画。
- 只在元素变化前后都存在身份时使用 Flip。
- 复杂离场动画等状态显示逻辑集中化后再做。

### 风险：`hidden` 属性影响 Flip 离场

搜索城市筛选通过 `hidden` 隐藏卡片。

缓解：

- 可行时在隐藏前捕获 Flip state。
- 如果 hidden 状态冲突，优先做重排和入场动画，不强做离场。

### 风险：`innerHTML` 重建列表导致元素身份丢失

多个 render 函数会重建列表，导致 DOM 身份不可保留。

缓解：

- 重建列表使用分批入场。
- 只在节点被移动的场景使用 Flip，例如排序和任务行移动。

### 风险：GSAP 与 CSS `resumeRise` 冲突

现有简历详情 CSS 动画使用 opacity 和 transform。

缓解：

- GSAP 接管简历详情动效时，禁用或隔离 `resumeRise`。
- 如果 GSAP 缺失，保留 CSS fallback。

### 风险：离线桌面运行时缺少 vendor 资源

Electron 和 Tauri 从静态文件加载。

缓解：

- 提交 vendor 文件。
- 校验 `dist/vendor/gsap.min.js` 和 `dist/vendor/Flip.min.js`。
- Harness smoke-check vendor 文件。

## 验收标准

功能可验收的条件：

- DeerRecall 拥有本地、渐进增强的 GSAP 动效层。
- DeerSearch、导入、人才库、候选人详情都具备 Level 2 动效。
- 现有前端架构仍保持静态且桌面端兼容。
- 所有自动化测试和静态构建校验通过。
- Harness 资源检查包含新增运行时文件。
- Reduced motion 可用。
- 视觉 QA 未发现 overflow、边框不一致、出框动画或遮挡交互的 overlay。
