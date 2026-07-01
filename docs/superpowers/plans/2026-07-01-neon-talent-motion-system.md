# Neon Talent 动效系统实施计划

> **给 agentic workers：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务执行本计划。步骤使用 checkbox（`- [ ]`）语法追踪。

**目标：** 在不改变 DeerRecall 现有静态前端架构的前提下，新增本地 GSAP 动效层，让 DeerSearch、简历导入、人才库、候选人详情具备 Level 2 Neon Talent OS 动效体验。

**架构：** 继续使用当前 `index.html + styles.css + app.js + deersearch-engine.js` 静态系统。新增本地 `vendor/` 运行时文件和独立 `motion.js`，由 `app.js` 在关键状态变化后通过 optional chaining 调用动效 hook。所有动效都是渐进增强，GSAP 缺失或 reduced motion 时不影响业务逻辑。

**技术栈：** 静态 HTML/CSS/JS、GSAP 3.15.0、GSAP Flip、Node 测试、Electron/Tauri 静态 `dist`、Harness pipeline。

---

## 文件结构

### 新增文件

- `motion.js`：DeerRecall 动效运行时，暴露 `window.DeerRecallMotion`。
- `vendor/gsap.min.js`：本地 GSAP core runtime，从 `gsap@3.15.0` 复制。
- `vendor/Flip.min.js`：本地 GSAP Flip plugin，从 `gsap@3.15.0` 复制。

### 修改文件

- `index.html`：在 `deersearch-engine.js` 和 `app.js` 前加载 vendor 与 `motion.js`。
- `styles.css`：新增 reduced-motion 降级、GSAP 接管后的 CSS 动画冲突隔离、动效 overlay/光效基础类。
- `app.js`：在现有状态函数中加入显式动效 hook；不改变业务逻辑。
- `scripts/build-static.mjs`：复制 `motion.js` 与 `vendor/` 到 `dist`。
- `scripts/verify-dist.mjs`：校验新增顶层文件与 vendor 文件。
- `package.json`：`npm run check` 增加 `node --check motion.js`。
- `package-lock.json`：记录 `gsap@3.15.0` 依赖。
- `tests/homepage-structure.test.js`：增加资源契约、脚本顺序、动效 hook、reduced-motion、Harness 检查断言。
- `.harness/deerrecall-ci-cd.yaml`：新增 `/motion.js`、`/vendor/gsap.min.js`、`/vendor/Flip.min.js` smoke/cache 检查。
- `README.md`：记录本地动效运行时、离线兼容和验证命令。

### 不修改

- `deersearch-engine.js`：搜索业务和 AI rerank 不属于动效范围。
- `desktop/*.cjs`：Electron IPC 不属于动效范围。
- `server/llm-gateway.mjs`：AI 网关不属于动效范围。

---

## Task 1：静态资源契约与本地 GSAP vendor

**文件：**

- 创建：`vendor/gsap.min.js`
- 创建：`vendor/Flip.min.js`
- 修改：`package.json`
- 修改：`package-lock.json`
- 修改：`index.html`
- 修改：`scripts/build-static.mjs`
- 修改：`scripts/verify-dist.mjs`
- 修改：`tests/homepage-structure.test.js`
- 修改：`.harness/deerrecall-ci-cd.yaml`
- 修改：`README.md`

### 步骤

- [ ] **Step 1：先写失败测试，锁定脚本顺序和资源契约**

在 `tests/homepage-structure.test.js` 的静态发布相关测试附近新增测试：

```javascript
test("main page loads local motion runtime before application scripts", () => {
  const html = read("index.html");

  const gsapIndex = html.indexOf('<script src="vendor/gsap.min.js"></script>');
  const flipIndex = html.indexOf('<script src="vendor/Flip.min.js"></script>');
  const motionIndex = html.indexOf('<script src="motion.js"></script>');
  const searchIndex = html.indexOf('<script src="deersearch-engine.js"></script>');
  const appIndex = html.indexOf('<script src="app.js"></script>');

  assert.ok(gsapIndex > -1);
  assert.ok(flipIndex > gsapIndex);
  assert.ok(motionIndex > flipIndex);
  assert.ok(searchIndex > motionIndex);
  assert.ok(appIndex > searchIndex);
});

test("project exposes local motion runtime assets for static delivery", () => {
  const pkg = JSON.parse(read("package.json"));
  const build = read("scripts/build-static.mjs");
  const verify = read("scripts/verify-dist.mjs");
  const harness = read(".harness/deerrecall-ci-cd.yaml");
  const readme = read("README.md");

  assert.match(pkg.scripts.check, /node --check motion\.js/);
  assert.match(build, /"motion\.js"/);
  assert.match(build, /"vendor"/);
  assert.match(verify, /"motion\.js"/);
  assert.match(verify, /"vendor\/gsap\.min\.js"/);
  assert.match(verify, /"vendor\/Flip\.min\.js"/);
  assert.match(harness, /http:\/\/127\.0\.0\.1:8080\/motion\.js/);
  assert.match(harness, /http:\/\/127\.0\.0\.1:8080\/vendor\/gsap\.min\.js/);
  assert.match(harness, /http:\/\/127\.0\.0\.1:8080\/vendor\/Flip\.min\.js/);
  assert.match(readme, /motion\.js/);
  assert.match(readme, /vendor\/gsap\.min\.js/);
});
```

- [ ] **Step 2：运行测试并确认失败**

运行：

```bash
npm test -- tests/homepage-structure.test.js
```

预期：失败，原因包括 `motion.js`、vendor 脚本、构建脚本和 Harness 检查尚不存在。

- [ ] **Step 3：安装并固定 GSAP 版本**

运行：

```bash
npm install gsap@3.15.0
```

预期：

- `package.json` 新增 `gsap` 依赖。
- `package-lock.json` 更新。
- `node_modules/gsap/dist/gsap.min.js` 存在。
- `node_modules/gsap/dist/Flip.min.js` 存在。

- [ ] **Step 4：复制本地 vendor 文件**

运行：

```bash
mkdir -p vendor
cp node_modules/gsap/dist/gsap.min.js vendor/gsap.min.js
cp node_modules/gsap/dist/Flip.min.js vendor/Flip.min.js
```

随后检查文件非空：

```bash
test -s vendor/gsap.min.js
test -s vendor/Flip.min.js
```

预期：两个 `test -s` 命令退出码为 0。

- [ ] **Step 5：更新 `index.html` 脚本顺序**

把页面底部脚本从：

```html
<script src="deersearch-engine.js"></script>
<script src="app.js"></script>
```

改为：

```html
<script src="vendor/gsap.min.js"></script>
<script src="vendor/Flip.min.js"></script>
<script src="motion.js"></script>
<script src="deersearch-engine.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 6：更新 `scripts/build-static.mjs`**

将 assets 列表改为包含 `motion.js` 和 `vendor`：

```javascript
const assets = [
  "index.html",
  "deersearch-engine.js",
  "app.js",
  "motion.js",
  "styles.css",
  "vendor",
];
```

保留当前 `cp(..., { recursive: true, filter })` 逻辑。

- [ ] **Step 7：更新 `scripts/verify-dist.mjs` 支持 vendor 文件**

将当前 `expectedAssets` 改为 `expectedRuntimeAssets`，并按相对路径递归校验：

```javascript
const expectedRuntimeAssets = new Set([
  "index.html",
  "deersearch-engine.js",
  "app.js",
  "motion.js",
  "styles.css",
  "vendor/gsap.min.js",
  "vendor/Flip.min.js",
]);
```

新增递归收集函数：

```javascript
async function listRuntimeFiles(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listRuntimeFiles(fullPath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      files.push(`${relativePath}__NON_FILE__`);
    }
  }

  return files;
}
```

用 `actualRuntimeAssets = await listRuntimeFiles(dist)` 替代当前只读顶层目录的 `actualAssets` 逻辑，并继续检查：

- 缺失文件。
- 多余文件。
- 空文件。
- 非文件项。

- [ ] **Step 8：更新 `package.json` check 脚本**

将：

```json
"check": "node --check app.js && node --check server/llm-gateway.mjs && node --check server/server.mjs && node --check desktop/ai-gateway.cjs && npm test"
```

改为：

```json
"check": "node --check app.js && node --check motion.js && node --check server/llm-gateway.mjs && node --check server/server.mjs && node --check desktop/ai-gateway.cjs && npm test"
```

- [ ] **Step 9：更新 Harness smoke check**

在 `.harness/deerrecall-ci-cd.yaml` 的 `verify_deploy` 阶段加入：

```sh
grep -q "motion.js" /tmp/deerrecall-index.html
grep -q "vendor/gsap.min.js" /tmp/deerrecall-index.html
grep -q "vendor/Flip.min.js" /tmp/deerrecall-index.html

docker exec "${APP_CONTAINER}" wget -qS --spider http://127.0.0.1:8080/motion.js 2>&1 | grep -qi "cache-control: no-cache, must-revalidate"
docker exec "${APP_CONTAINER}" wget -qS --spider http://127.0.0.1:8080/vendor/gsap.min.js 2>&1 | grep -qi "cache-control: no-cache, must-revalidate"
docker exec "${APP_CONTAINER}" wget -qS --spider http://127.0.0.1:8080/vendor/Flip.min.js 2>&1 | grep -qi "cache-control: no-cache, must-revalidate"
```

- [ ] **Step 10：更新 README**

在本地命令或生产发布护栏附近增加：

````markdown
## 前端动效运行时

DeerRecall 的 Neon Talent 动效系统使用本地静态运行时：

```text
motion.js
vendor/gsap.min.js
vendor/Flip.min.js
```

这些文件会随 `npm run build` 复制到 `dist/`，Electron、Tauri、Docker 和 Harness 都从 `dist/` 加载，不依赖 CDN。发布前继续运行：

```bash
npm run check
npm run build
npm run verify:dist
```
````

- [ ] **Step 11：运行测试和构建验证**

运行：

```bash
npm test -- tests/homepage-structure.test.js
npm run build
npm run verify:dist
```

预期：

- `homepage-structure.test.js` 通过。
- `dist/motion.js` 存在且非空。
- `dist/vendor/gsap.min.js` 存在且非空。
- `dist/vendor/Flip.min.js` 存在且非空。

- [ ] **Step 12：提交**

运行：

```bash
git add package.json package-lock.json index.html scripts/build-static.mjs scripts/verify-dist.mjs tests/homepage-structure.test.js .harness/deerrecall-ci-cd.yaml README.md vendor/gsap.min.js vendor/Flip.min.js
git commit -m "feat: add local motion runtime assets"
```

---

## Task 2：实现 `motion.js` 基础 API 与 reduced-motion 降级

**文件：**

- 创建：`motion.js`
- 修改：`styles.css`
- 修改：`tests/homepage-structure.test.js`

### 步骤

- [ ] **Step 1：先写失败测试，锁定动效 API 和 reduced-motion 护栏**

在 `tests/homepage-structure.test.js` 新增：

```javascript
test("motion runtime exposes safe progressive enhancement hooks", () => {
  const js = read("motion.js");
  const css = read("styles.css");

  assert.match(js, /window\.DeerRecallMotion/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /window\.gsap/);
  assert.match(js, /window\.Flip/);
  assert.match(js, /registerPlugin\(window\.Flip\)/);
  assert.match(js, /function canAnimate/);
  assert.match(js, /enterSearchResults/);
  assert.match(js, /flipSearchCards/);
  assert.match(js, /flipFilterChips/);
  assert.match(js, /enterImportState/);
  assert.match(js, /updateImportProgress/);
  assert.match(js, /enterTalentView/);
  assert.match(js, /pulseTalentSelection/);
  assert.match(js, /enterResumeDetail/);
  assert.match(js, /enterResumePanel/);
  assert.match(js, /enterMarketInsight/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.motion-scan-layer/);
  assert.match(css, /pointer-events:\s*none/);
});
```

- [ ] **Step 2：运行测试并确认失败**

运行：

```bash
npm test -- tests/homepage-structure.test.js
```

预期：失败，原因是 `motion.js` 和 CSS 动效类尚未实现。

- [ ] **Step 3：创建 `motion.js` 基础结构**

创建 `motion.js`：

```javascript
(function () {
  const reduceMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const gsap = window.gsap;
  const Flip = window.Flip;

  if (gsap && Flip) {
    gsap.registerPlugin(window.Flip);
  }

  if (gsap) {
    gsap.defaults({ duration: 0.38, ease: "power2.out" });
    document.documentElement.classList.add("motion-ready");
  }

  function prefersReducedMotion() {
    return Boolean(reduceMotionQuery?.matches);
  }

  function canAnimate(target) {
    if (!gsap || prefersReducedMotion()) return false;
    if (!target) return false;
    if (target instanceof Element) return target.isConnected;
    return true;
  }

  function toArray(selectorOrNodes, root = document) {
    if (!selectorOrNodes) return [];
    if (typeof selectorOrNodes === "string") return Array.from(root.querySelectorAll(selectorOrNodes));
    if (selectorOrNodes instanceof Element) return [selectorOrNodes];
    return Array.from(selectorOrNodes).filter(Boolean);
  }

  function enterView(name, root) {
    if (!canAnimate(root)) return false;
    const targets = toArray("[data-motion-enter], .motion-enter", root);
    gsap.fromTo(targets.length ? targets : root, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.04, overwrite: "auto" });
    return true;
  }

  function enterSearchResults(root) {
    if (!canAnimate(root)) return false;
    const cards = toArray(".candidate-card[data-search-score]:not([hidden])", root);
    const scan = root.querySelector(".motion-scan-layer");
    const timeline = gsap.timeline({ defaults: { duration: 0.34, ease: "power2.out" } });

    if (scan) {
      timeline.fromTo(scan, { autoAlpha: 0, xPercent: -22 }, { autoAlpha: 1, xPercent: 22, duration: 0.42 }, 0)
        .to(scan, { autoAlpha: 0, duration: 0.18 }, ">");
    }

    timeline.fromTo(cards, { autoAlpha: 0, y: 18, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.055, clearProps: "transform,opacity,visibility" }, scan ? 0.12 : 0);
    return true;
  }

  function flipContainer(container, mutator, targetsSelector) {
    if (!container || typeof mutator !== "function") return false;
    if (!gsap || !Flip || prefersReducedMotion()) {
      mutator();
      return false;
    }

    const targets = targetsSelector ? toArray(targetsSelector, container) : Array.from(container.children);
    const state = Flip.getState(targets);
    mutator();
    Flip.from(state, {
      duration: 0.42,
      ease: "power2.inOut",
      absolute: false,
      nested: true,
      prune: true,
      stagger: 0.025,
    });
    return true;
  }

  function flipSearchCards(container, mutator) {
    return flipContainer(container, mutator, ".candidate-card[data-search-score]");
  }

  function flipFilterChips(container, mutator) {
    return flipContainer(container, mutator, "[data-search-filter-chip]");
  }

  function enterImportState(state, root) {
    if (!canAnimate(root)) return false;
    const panel = root.querySelector(`[data-import-state="${state}"]`);
    if (!panel) return false;
    const targets = toArray(".import-hero-icon, h2, .import-muted, .import-metric, .result-stat, .import-actions", panel);
    gsap.fromTo(targets, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.045, overwrite: "auto", clearProps: "transform,opacity,visibility" });
    return true;
  }

  function updateImportProgress(nodes, value) {
    const targets = toArray(nodes);
    if (!targets.length || !gsap || prefersReducedMotion()) return false;
    gsap.to(targets, { width: `${value}%`, duration: 0.32, ease: "power2.out", overwrite: "auto" });
    return true;
  }

  function enterTalentView(root) {
    if (!canAnimate(root)) return false;
    const rows = toArray("[data-talent-item]", root).filter((row) => !row.closest(".state-hidden"));
    gsap.fromTo(rows, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.035, overwrite: "auto", clearProps: "transform,opacity,visibility" });
    return true;
  }

  function pulseTalentSelection(item) {
    if (!canAnimate(item)) return false;
    gsap.fromTo(item, { boxShadow: "0 0 0 0 rgba(139,244,81,0)" }, { boxShadow: "0 0 0 2px rgba(139,244,81,0.28), 0 0 28px rgba(139,244,81,0.18)", duration: 0.24, yoyo: true, repeat: 1, overwrite: "auto", clearProps: "boxShadow" });
    return true;
  }

  function enterResumeDetail(root) {
    if (!canAnimate(root)) return false;
    const targets = toArray(".resume-profile-hero, .resume-tabs, .resume-detail-card", root);
    gsap.fromTo(targets, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.045, overwrite: "auto", clearProps: "transform,opacity,visibility" });
    return true;
  }

  function enterResumePanel(root) {
    if (!canAnimate(root)) return false;
    const activePanel = root.querySelector(".resume-tab-panel.is-active");
    if (!activePanel) return false;
    gsap.fromTo(activePanel, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, overwrite: "auto", clearProps: "transform,opacity,visibility" });
    return true;
  }

  function enterMarketInsight(root) {
    if (!canAnimate(root)) return false;
    const targets = toArray("[data-market-insight-result]", root).filter((node) => !node.hidden);
    gsap.fromTo(targets, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, stagger: 0.04, overwrite: "auto", clearProps: "transform,opacity,visibility" });
    return true;
  }

  window.DeerRecallMotion = {
    enterView,
    enterSearchResults,
    flipSearchCards,
    flipFilterChips,
    enterImportState,
    updateImportProgress,
    enterTalentView,
    pulseTalentSelection,
    enterResumeDetail,
    enterResumePanel,
    enterMarketInsight,
    prefersReducedMotion,
  };
})();
```

- [ ] **Step 4：新增 CSS reduced-motion 与扫描层基础样式**

在 `styles.css` 全局基础区附近加入：

```css
.motion-scan-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.motion-scan-layer::before {
  content: "";
  position: absolute;
  left: -24%;
  top: 8%;
  width: 68%;
  height: 84%;
  transform: rotate(-9deg);
  background: linear-gradient(90deg, transparent, rgba(100, 239, 155, 0.16), rgba(255, 79, 216, 0.18), transparent);
  filter: blur(18px);
}

.motion-ready .resume-profile-hero,
.motion-ready .resume-detail-card,
.motion-ready .resume-tab-panel {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 5：运行语法和结构测试**

运行：

```bash
node --check motion.js
npm test -- tests/homepage-structure.test.js
```

预期：两个命令通过。

- [ ] **Step 6：提交**

运行：

```bash
git add motion.js styles.css tests/homepage-structure.test.js
git commit -m "feat: add DeerRecall motion runtime"
```

---

## Task 3：DeerSearch 动效接入与 Flip 重排

**文件：**

- 修改：`index.html`
- 修改：`app.js`
- 修改：`tests/homepage-structure.test.js`

### 步骤

- [ ] **Step 1：先写失败测试，锁定 DeerSearch hook**

在 `tests/homepage-structure.test.js` 新增：

```javascript
test("DeerSearch wires motion hooks without replacing search logic", () => {
  const html = read("index.html");
  const js = read("app.js");

  assert.match(html, /<div class="motion-scan-layer" aria-hidden="true"><\/div>/);
  assert.match(js, /DeerRecallMotion\?\.enterSearchResults/);
  assert.match(js, /DeerRecallMotion\?\.flipSearchCards/);
  assert.match(js, /DeerRecallMotion\?\.flipFilterChips/);
  assert.match(js, /function sortSearchCandidates\(\)/);
  assert.match(js, /DeerRecallSearch\.searchLocalCandidates/);
  assert.match(js, /DeerRecallSearch\.applyAiRerankResult/);
});
```

- [ ] **Step 2：运行测试并确认失败**

运行：

```bash
npm test -- tests/homepage-structure.test.js
```

预期：失败，因为 scan layer 和 DeerSearch motion hook 尚未接入。

- [ ] **Step 3：在 `resultsState` 中加入扫描层**

在 `index.html` 的：

```html
<section class="main-state results-main state-hidden" id="resultsState" aria-label="搜索结果">
```

后面加入：

```html
<div class="motion-scan-layer" aria-hidden="true"></div>
```

确认该层不包裹任何交互控件。

- [ ] **Step 4：`showResults` 渲染完成后触发结果入场**

在 `showResults()` 中 `requestSearchAssistant(...)` 前加入：

```javascript
window.DeerRecallMotion?.enterSearchResults?.(resultsState);
```

该调用必须放在 `applySearchResultModel(localResult);` 之后，因为候选人卡片需要先存在。

- [ ] **Step 5：重写 `sortSearchCandidates()` 的 DOM mutation 边界**

将 `sortSearchCandidates()` 中直接 append 的逻辑包成 mutator：

```javascript
function sortSearchCandidates() {
  if (!searchCandidateGrid) return;
  const sortConfig = searchSortOptions[currentSearchSortIndex] || searchSortOptions[0];
  const sortedCards = [...searchCandidateCards].sort((a, b) => {
    const aValue = Number(a.dataset[`search${sortConfig.key[0].toUpperCase()}${sortConfig.key.slice(1)}`] || 0);
    const bValue = Number(b.dataset[`search${sortConfig.key[0].toUpperCase()}${sortConfig.key.slice(1)}`] || 0);
    if (bValue !== aValue) return bValue - aValue;
    return Number(a.dataset.searchIndex || 0) - Number(b.dataset.searchIndex || 0);
  });

  const applySort = () => {
    sortedCards.forEach((card) => searchCandidateGrid.append(card));
  };

  if (!window.DeerRecallMotion?.flipSearchCards?.(searchCandidateGrid, applySort)) {
    applySort();
  }
}
```

- [ ] **Step 6：给筛选 chip 添加 Flip 边界**

在 `removeSearchFilterChip(button)` 中，将 `button?.remove()` 包成：

```javascript
const removeChip = () => button?.remove();
if (!window.DeerRecallMotion?.flipFilterChips?.(searchFilterBar, removeChip)) {
  removeChip();
}
```

在 `addSearchFilterChip()` 中，将 `searchFilterAddButton.before(...)` 包成：

```javascript
const addChip = () => searchFilterAddButton.before(createSearchFilterChip(nextFilter));
if (!window.DeerRecallMotion?.flipFilterChips?.(searchFilterBar, addChip)) {
  addChip();
}
```

在 `renderSearchFilterChips(chips)` 中，保持现有渲染逻辑，不强行 Flip，因为该函数会批量重建 chip。

- [ ] **Step 7：运行测试**

运行：

```bash
node --check app.js
npm test -- tests/homepage-structure.test.js
```

预期：通过。

- [ ] **Step 8：提交**

运行：

```bash
git add index.html app.js tests/homepage-structure.test.js
git commit -m "feat: animate DeerSearch result flow"
```

---

## Task 4：简历导入与人才库动效接入

**文件：**

- 修改：`app.js`
- 修改：`tests/homepage-structure.test.js`

### 步骤

- [ ] **Step 1：先写失败测试，锁定导入和人才库 hook**

在 `tests/homepage-structure.test.js` 新增：

```javascript
test("import and talent library wire motion hooks to existing state functions", () => {
  const js = read("app.js");

  assert.match(js, /DeerRecallMotion\?\.enterImportState/);
  assert.match(js, /DeerRecallMotion\?\.updateImportProgress/);
  assert.match(js, /DeerRecallMotion\?\.enterTalentView/);
  assert.match(js, /DeerRecallMotion\?\.pulseTalentSelection/);
  assert.match(js, /function showImportState/);
  assert.match(js, /function setImportAssistantProgress/);
  assert.match(js, /function showTalentState/);
  assert.match(js, /function setTalentFilter/);
  assert.match(js, /function selectTalentItem/);
});
```

- [ ] **Step 2：运行测试并确认失败**

运行：

```bash
npm test -- tests/homepage-structure.test.js
```

预期：失败，因为 hook 尚未接入。

- [ ] **Step 3：在 `showImportState(nextState)` 末尾加入状态入场**

在 `setActiveNav("import");` 后加入：

```javascript
window.DeerRecallMotion?.enterImportState?.(nextState, importState);
```

这只做 reveal，不改变 panel 的显示隐藏逻辑。

- [ ] **Step 4：让导入进度条支持 GSAP tween 和 fallback**

在 `setImportAssistantProgress(...)` 中替换进度条更新块。

将：

```javascript
document.querySelectorAll("[data-import-loading-progress]").forEach((node) => {
  node.style.width = `${safePercent}%`;
});
```

改为：

```javascript
const progressNodes = document.querySelectorAll("[data-import-loading-progress]");
if (!window.DeerRecallMotion?.updateImportProgress?.(progressNodes, safePercent)) {
  progressNodes.forEach((node) => {
    node.style.width = `${safePercent}%`;
  });
}
```

- [ ] **Step 5：在 `showTalentState(filter)` 末尾加入人才库入场**

在 `setActiveNav("talents");` 后加入：

```javascript
window.DeerRecallMotion?.enterTalentView?.(talentState);
```

- [ ] **Step 6：在 `setTalentFilter(filter)` 切换后加入列表入场**

在 `selectTalentItem(firstItem);` 后加入：

```javascript
window.DeerRecallMotion?.enterTalentView?.(talentState);
```

- [ ] **Step 7：在 `selectTalentItem(item)` 中加入选中 pulse**

在选中 class 更新后加入：

```javascript
window.DeerRecallMotion?.pulseTalentSelection?.(item);
```

不要在 `item` 为空时调用。

- [ ] **Step 8：运行测试**

运行：

```bash
node --check app.js
npm test -- tests/homepage-structure.test.js
```

预期：通过。

- [ ] **Step 9：提交**

运行：

```bash
git add app.js tests/homepage-structure.test.js
git commit -m "feat: animate import and talent flows"
```

---

## Task 5：候选人详情、市场画像与 CSS 冲突隔离

**文件：**

- 修改：`app.js`
- 修改：`styles.css`
- 修改：`tests/homepage-structure.test.js`

### 步骤

- [ ] **Step 1：先写失败测试，锁定候选人详情 hook 和 CSS 隔离**

在 `tests/homepage-structure.test.js` 新增：

```javascript
test("candidate detail motion replaces resumeRise conflicts safely", () => {
  const js = read("app.js");
  const css = read("styles.css");

  assert.match(js, /DeerRecallMotion\?\.enterResumeDetail/);
  assert.match(js, /DeerRecallMotion\?\.enterResumePanel/);
  assert.match(js, /DeerRecallMotion\?\.enterMarketInsight/);
  assert.match(css, /\.motion-ready \.resume-profile-hero/);
  assert.match(css, /\.motion-ready \.resume-detail-card/);
  assert.match(css, /\.motion-ready \.resume-tab-panel/);
  assert.match(css, /animation:\s*none/);
});
```

- [ ] **Step 2：运行测试并确认失败**

运行：

```bash
npm test -- tests/homepage-structure.test.js
```

预期：失败，因为详情 hook 尚未接入。

- [ ] **Step 3：在 `openCandidateResume(candidateId, options)` 末尾加入详情入场**

在 `updateCandidateResume(candidate);` 后加入：

```javascript
window.DeerRecallMotion?.enterResumeDetail?.(candidateResumeState);
```

- [ ] **Step 4：在 `showCandidateResumePanel(viewName)` 末尾加入 panel reveal**

在 `candidateResumePanels.forEach(...)` 后加入：

```javascript
window.DeerRecallMotion?.enterResumePanel?.(candidateResumeState);
```

- [ ] **Step 5：在 `renderMarketInsight(insight)` 完成后加入结果 reveal**

在 `setMarketInsightState("ready", "已生成市场画像。");` 后加入：

```javascript
window.DeerRecallMotion?.enterMarketInsight?.(candidateResumeState);
```

- [ ] **Step 6：确认 CSS 冲突隔离存在**

确认 `styles.css` 中已经有 Task 2 添加的：

```css
.motion-ready .resume-profile-hero,
.motion-ready .resume-detail-card,
.motion-ready .resume-tab-panel {
  animation: none;
}
```

如果 Task 2 未覆盖 `.resume-tab-panel`，补上这一项。

- [ ] **Step 7：运行测试**

运行：

```bash
node --check app.js
npm test -- tests/homepage-structure.test.js
```

预期：通过。

- [ ] **Step 8：提交**

运行：

```bash
git add app.js styles.css tests/homepage-structure.test.js
git commit -m "feat: animate candidate detail flow"
```

---

## Task 6：完整验证、视觉 QA 与发布门禁

**文件：**

- 修改：`docs/superpowers/plans/2026-07-01-neon-talent-motion-system.md`（勾选完成项）
- 按 QA 结果必要时修改：`motion.js`
- 按 QA 结果必要时修改：`styles.css`
- 按 QA 结果必要时修改：`app.js`

### 步骤

- [ ] **Step 1：运行完整自动化门禁**

运行：

```bash
npm test
npm run check
npm run build
npm run verify:dist
```

预期：

- `npm test`：86 个以上测试通过。
- `npm run check`：包含 `node --check motion.js` 且通过。
- `npm run build`：生成 `dist`。
- `npm run verify:dist`：确认新增资源存在且无多余文件。

- [ ] **Step 2：启动本地服务做浏览器 QA**

运行：

```bash
npm run serve
```

打开：

```text
http://localhost:8080
```

检查以下流程：

- DeerSearch：提交搜索、排序、城市筛选、添加/删除筛选 chip。
- 简历导入：默认、预检、loading、完成。
- 人才库：切换 tab、选择候选人、打开来源视图。
- 候选人详情：从搜索和人才库打开，切换 tab，运行市场画像。

- [ ] **Step 3：浏览器控制台检查**

在浏览器 DevTools console 执行：

```javascript
document.documentElement.scrollWidth <= document.documentElement.clientWidth
```

预期：返回 `true`。

再执行：

```javascript
Boolean(window.DeerRecallMotion)
```

预期：返回 `true`。

- [ ] **Step 4：视觉 QA 检查清单**

逐项确认：

- 主三栏布局不变形。
- 右侧栏不被扫描光或卡片动画遮挡。
- 候选人卡片排序时不出框。
- 筛选 chip 添加/删除时不撑破筛选栏。
- 导入进度条不撑大父面板。
- 人才库行选中 pulse 不改变行高。
- 简历详情卡片 reveal 不影响滚动阅读。
- 没有新增横向滚动条。
- 动画 overlay 不挡按钮点击。
- 边框、圆角、阴影与现有 UI 一致。

- [ ] **Step 5：reduced-motion QA**

在浏览器模拟 `prefers-reduced-motion: reduce` 后重复检查：

- 搜索可用。
- 导入可用。
- 人才库切换可用。
- 简历详情可用。
- 控制台无 JS error。

预期：动效减少或关闭，但功能不变。

- [ ] **Step 6：Electron 静态资源检查**

运行：

```bash
npm run build
npm run desktop:dev
```

预期：

- Electron 应用打开 `dist/index.html`。
- 页面无 vendor 资源 404。
- `window.DeerRecallMotion` 存在。
- 本地文件夹选择仍可触发。

- [ ] **Step 7：最终代码检查**

运行：

```bash
git status --short
git diff --check
```

预期：

- `git diff --check` 无输出。
- 只有本动效系统相关文件被修改。

- [ ] **Step 8：提交 QA 修正**

如果 Step 2-7 发现视觉或兼容问题，修正后提交：

```bash
git add motion.js styles.css app.js tests/homepage-structure.test.js README.md .harness/deerrecall-ci-cd.yaml scripts/build-static.mjs scripts/verify-dist.mjs package.json package-lock.json index.html
git commit -m "fix: stabilize motion system visual QA"
```

如果没有额外修正，不创建空提交。

---

## Subagent 执行分工

使用 `superpowers:subagent-driven-development` 时按以下顺序派发，不并行修改同一文件范围。

1. **资源契约 worker**
   - 负责 Task 1。
   - 文件范围：`vendor/`、`package.json`、`package-lock.json`、`index.html`、`scripts/`、`.harness/`、`README.md`、`tests/homepage-structure.test.js`。

2. **动效运行时 worker**
   - 负责 Task 2。
   - 文件范围：`motion.js`、`styles.css`、`tests/homepage-structure.test.js`。

3. **DeerSearch worker**
   - 负责 Task 3。
   - 文件范围：`index.html`、`app.js`、`tests/homepage-structure.test.js`。

4. **导入与人才库 worker**
   - 负责 Task 4。
   - 文件范围：`app.js`、`tests/homepage-structure.test.js`。

5. **候选人详情 worker**
   - 负责 Task 5。
   - 文件范围：`app.js`、`styles.css`、`tests/homepage-structure.test.js`。

6. **最终 QA reviewer**
   - 负责 Task 6。
   - 文件范围：只读优先；如需修复，先报告具体文件和原因，再由主 agent 或指定 worker 修改。

每个 worker 必须知道：当前仓库可能存在其他 worker 的修改，不能回滚他人变更，必须围绕自己的文件范围工作。

---

## 完成标准

本计划完成时必须满足：

- `docs/superpowers/specs/2026-07-01-neon-talent-motion-system-design.md` 为中文。
- `docs/superpowers/plans/2026-07-01-neon-talent-motion-system.md` 为中文。
- `motion.js` 存在并通过 `node --check motion.js`。
- `vendor/gsap.min.js` 和 `vendor/Flip.min.js` 被复制进 `dist/vendor/`。
- DeerSearch、导入、人才库、候选人详情都有显式 motion hook。
- GSAP 缺失或 reduced motion 时，产品功能不受影响。
- `npm test`、`npm run check`、`npm run build`、`npm run verify:dist` 全部通过。
- Harness pipeline 检查新增静态资源。
- 视觉 QA 未发现出框、重叠、横向 overflow、边框/圆角不协调或 overlay 挡交互。
