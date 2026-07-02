const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function read(file) {
  const runtimeAliases = {
    "app.js": "app-runtime.js",
    ".harness/deerrecall-ci-cd.yaml": ".harness/deerrecall-ci-cd-runtime.yaml",
    "README.md": "README-runtime.md",
    ".dockerignore": ".dockerignore-runtime",
  };
  const runtimeFile = runtimeAliases[file] || file;
  return fs.readFileSync(path.join(root, runtimeFile), "utf8");
}

function createGsapStub(overrides = {}) {
  return {
    registerPlugin() {},
    defaults() {},
    fromTo() {},
    to() {},
    timeline() {
      return {
        fromTo() {
          return this;
        },
        to() {
          return this;
        },
      };
    },
    ...overrides,
  };
}

function createFlipStub(overrides = {}) {
  return {
    getState(targets) {
      return { targets };
    },
    from() {},
    ...overrides,
  };
}

function createMotionTestEnvironment({ gsap = null, Flip = null, reduceMotion = false } = {}) {
  class TestElement {
    constructor({ children = [], connected = true, hidden = false, selectorMap = {} } = {}) {
      this.children = children;
      this.isConnected = connected;
      this.hidden = hidden;
      this.selectorMap = selectorMap;
      this.classList = {
        values: [],
        add: (...values) => {
          this.classList.values.push(...values);
        },
      };
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
      if (this.selectorMap[selector]) return this.selectorMap[selector];
      return this.children;
    }

    closest(selector) {
      return selector === ".state-hidden" && this.stateHidden ? this : null;
    }
  }

  const document = {
    documentElement: new TestElement(),
    querySelectorAll() {
      return [];
    },
  };
  const window = {
    gsap,
    Flip,
    matchMedia() {
      return { matches: reduceMotion };
    },
  };
  const context = { window, document, Element: TestElement };

  vm.runInNewContext(read("motion.js"), context);

  return { window, document, TestElement };
}

test("main page contains finalized DeerSearch empty and results states", () => {
  const html = read("index.html");

  assert.match(html, /id="emptyState"/);
  assert.match(html, /id="resultsState"/);
  assert.match(html, /让小鹿帮你找人/);
  assert.match(html, /共找到 <strong>0<\/strong> 位候选人/);
  assert.match(html, /AI 条件拆解/);
});

test("main page declares an inline favicon to keep browser QA console clean", () => {
  const html = read("index.html");

  assert.match(html, /rel="icon"/);
  assert.match(html, /data:image\/svg\+xml/);
});

test("product naming and status labels stay unified across modules", () => {
  const html = read("index.html");

  assert.match(html, /<title>DeerRecall - AI 人才库<\/title>/);
  assert.match(html, /aria-label="DeerRecall AI 招聘工作台"/);
  assert.match(html, /DeerSearch/);
  assert.match(html, /格式不支持/);
  assert.match(html, /查看导入结果/);
  assert.match(html, /来源累计/);

  assert.doesNotMatch(html, /DeerFind/);
  assert.doesNotMatch(html, /暂不支持/);
  assert.doesNotMatch(html, /查看解析任务/);
  assert.doesNotMatch(html, /前往解析任务/);
});

test("main stylesheet uses finalized three-column proportions and dark glass palette", () => {
  const css = read("styles.css");

  assert.match(css, /grid-template-columns:\s*272px minmax\(0,\s*1fr\) 410px/);
  assert.match(css, /--pink:\s*#ff4fd8/);
  assert.match(css, /\.state-hidden\s*{/);
  assert.match(css, /\.candidate-grid\s*{/);
});

test("main stylesheet ends with a complete CSS rule", () => {
  const css = read("styles.css").trim();

  assert.match(css, /\}$/);
});

test("interactive controls expose release focus and disabled states", () => {
  const css = read("styles.css");

  assert.match(css, /:where\(button,\s*a,\s*input,\s*textarea\):focus-visible/);
  assert.match(css, /outline:\s*2px solid rgba\(255,\s*130,\s*234,\s*0\.86\)/);
  assert.match(css, /button:disabled/);
  assert.match(css, /cursor:\s*not-allowed/);
});

test("primary navigation exposes the active module to assistive technology", () => {
  const html = read("index.html");
  const js = read("app.js");

  assert.match(html, /data-nav-view="talents"\s+aria-current="page"/);
  assert.match(js, /button\.setAttribute\("aria-current",\s*"page"\)/);
  assert.match(js, /button\.removeAttribute\("aria-current"\)/);
});

test("main script switches from empty state to results state on search", () => {
  const js = read("app.js");
  const html = read("index.html");

  assert.match(js, /emptyState/);
  assert.match(js, /resultsState/);
  assert.match(js, /showResults/);
  assert.match(js, /shortlistCount/);
  assert.match(html, /<script src="deersearch-engine-runtime\.js"><\/script>/);
  assert.match(js, /DeerRecallSearch\.searchLocalCandidates/);
  assert.match(js, /DeerRecallSearch\.buildAiRerankPayload/);
  assert.match(js, /DeerRecallSearch\.applyAiRerankResult/);
  assert.match(js, /localContext/);
  assert.match(js, /function applyAiSearchAssistantResult/);
  assert.match(js, /function renderSearchResultState/);
  assert.match(js, /function applySearchResultModel/);
  assert.doesNotMatch(js, /currentQueryId = "payment_risk_java_backend"/);
});

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

test("talent state change does not trigger duplicate enter animations", () => {
  const js = read("app.js");
  const setTalentFilterBody = js.match(/function setTalentFilter\(filter\) \{[\s\S]*?\n\}/)?.[0] || "";
  const showTalentStateBody = js.match(/function showTalentState\(filter = currentTalentFilter\) \{[\s\S]*?\n\}/)?.[0] || "";
  const staticStartupBody = js.match(/else \{\n  applyLocalTalentLibrary\(defaultTalentLibrary\);[\s\S]*?\n\}/)?.[0] || "";

  assert.match(setTalentFilterBody, /DeerRecallMotion\?\.enterTalentView\?\.?\(talentState\)/);
  assert.doesNotMatch(showTalentStateBody, /DeerRecallMotion\?\.enterTalentView/);
  assert.doesNotMatch(staticStartupBody, /setTalentFilter\("all"\)/);
  assert.match(staticStartupBody, /showTalentState\("all"\)/);
});

test("candidate detail motion replaces resumeRise conflicts safely", () => {
  const js = read("app.js");
  const css = read("styles.css");

  assert.match(js, /DeerRecallMotion\?\.enterResumeDetail/);
  assert.match(js, /DeerRecallMotion\?\.enterResumePanel/);
  assert.match(js, /DeerRecallMotion\?\.enterMarketInsight/);
  assert.match(js, /function getActiveCandidateResumeAssistant/);
  assert.match(js, /getActiveCandidateResumeAssistant\(\)/);
  assert.match(css, /\.motion-ready \.resume-profile-hero/);
  assert.match(css, /\.motion-ready \.resume-detail-card/);
  assert.match(css, /\.motion-ready \.resume-tab-panel/);
  assert.match(css, /animation:\s*none/);
});

test("DeerSearch default state does not seed a Java payment risk query", () => {
  const html = read("index.html");
  const js = read("app.js");

  assert.match(js, /const defaultQuery = "查看本地人才库中已解析的简历。"/);
  assert.doesNotMatch(js, /const defaultQuery = "找做过支付风控的 Java 后端/);
  assert.match(html, /id="userQuery">等待搜索本地人才库<\/div>/);
  assert.match(html, /data-search-conversation-answer>输入岗位、来源文件夹或能力关键词后，我会先在本地人才库中筛选。<\/div>/);
  assert.match(html, /data-search-result-count="0">共找到 <strong>0<\/strong> 位候选人<\/p>/);
});

test("DeerSearch onboarding explains capabilities and search tips inline", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /data-search-capability="natural"/);
  assert.match(html, /data-search-capability="semantic"/);
  assert.match(html, /data-search-capability="shortlist"/);
  assert.match(html, /data-search-capability-detail/);
  assert.match(html, /data-search-tips-toggle/);
  assert.match(html, /id="searchTipsGuide"/);
  assert.match(html, /搜索公式/);
  assert.match(html, /优先写硬条件/);

  assert.match(css, /\.cap-detail/);
  assert.match(css, /\.tips-guide/);

  assert.match(js, /const searchCapabilityButtons/);
  assert.match(js, /function showSearchCapabilityDetail/);
  assert.match(js, /function toggleSearchTips/);
});

test("DeerSearch result filters support deletion, additions, city, and sort controls", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /data-search-filter-bar/);
  assert.match(html, /data-search-filter-chip="experience"/);
  assert.match(html, /data-search-filter-add/);
  assert.match(html, /data-search-city-toggle/);
  assert.match(html, /data-search-city-label/);
  assert.match(html, /data-search-sort-toggle/);
  assert.match(html, /data-search-sort-label/);
  assert.match(html, /data-search-result-count/);
  assert.match(html, /data-search-score="92"/);
  assert.match(html, /data-search-years="7"/);

  assert.match(css, /\.filter-add/);
  assert.match(css, /\.filter-chip:disabled/);

  assert.match(js, /const searchFilterBar/);
  assert.match(js, /function removeSearchFilterChip/);
  assert.match(js, /function addSearchFilterChip/);
  assert.match(js, /function cycleSearchCity/);
  assert.match(js, /function cycleSearchSort/);
  assert.match(js, /function sortSearchCandidates/);
});

test("DeerSearch filter bar wraps before it can overlap the assistant column", () => {
  const css = read("styles.css");

  assert.match(css, /\.filter-bar\s*{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.filter-spacer\s*{[^}]*flex:\s*1 1/s);
  assert.match(css, /\.filter-action\.sort\s*{[^}]*margin-left:\s*0/s);
});

test("DeerSearch AI assistant persists and restores search conversation history", () => {
  const html = read("index.html");
  const js = read("app.js");
  const main = read("desktop/main.cjs");
  const preload = read("desktop/preload.cjs");

  assert.match(html, /data-search-ai-answer-body/);
  assert.match(html, /data-search-ai-history/);
  assert.match(html, /data-search-ai-history-empty/);
  assert.match(html, /搜索记录/);

  assert.match(js, /const SEARCH_AI_HISTORY_KEY/);
  assert.match(js, /function loadSearchAiHistory/);
  assert.match(js, /function persistSearchAiHistory/);
  assert.match(js, /function upsertSearchAiHistory/);
  assert.match(js, /function renderSearchAiHistory/);
  assert.match(js, /function restoreSearchAiHistoryItem/);
  assert.match(js, /function getSearchAiContext/);
  assert.match(js, /async function callAiApi/);
  assert.match(js, /let searchAiServiceStatus = null/);
  assert.match(js, /function getSearchAiServiceStatus/);
  assert.match(js, /\/api\/ai\/status/);
  assert.match(js, /window\.deerRecallDesktop\?\.getAiStatus/);
  assert.match(js, /window\.deerRecallDesktop\?\.requestSearchAssistant/);
  assert.match(js, /if \(status && !status\.configured\)/);
  assert.doesNotMatch(js, /window\.location\.protocol === "file:"[\s\S]*当前为本地搜索模式，未连接 AI 服务/);
  assert.match(js, /localStorage\?\.getItem\(SEARCH_AI_HISTORY_KEY\)/);
  assert.match(js, /localStorage\?\.setItem\(SEARCH_AI_HISTORY_KEY/);
  assert.match(js, /callAiApi\("search-assistant",\s*\{\s*message,\s*history:\s*getSearchAiContext/);
  assert.match(js, /AI 增强排序已应用/);
  assert.match(js, /data-ai-match-summary/);
  assert.match(js, /aiMatchSummary/);
  assert.match(js, /data-search-ai-history-id/);

  assert.match(main, /registerAiIpcHandlers/);
  assert.match(main, /ipcMain\.handle\("ai:status"/);
  assert.match(main, /ipcMain\.handle\("ai:search-assistant"/);
  assert.match(preload, /getAiStatus:\s*\(\) => ipcRenderer\.invoke\("ai:status"\)/);
  assert.match(preload, /requestSearchAssistant:\s*\(payload\) => ipcRenderer\.invoke\("ai:search-assistant",\s*payload\)/);
});

test("DeerSearch AI answer panel constrains long model text inside the right rail", () => {
  const css = read("styles.css");

  assert.match(css, /\.search-ai-answer-shell\s*{[^}]*min-width:\s*0/s);
  assert.match(css, /\.search-ai-answer-shell\s*{[^}]*max-height:\s*260px/s);
  assert.match(css, /\.search-ai-answer-body\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.search-ai-answer-body\s*{[^}]*word-break:\s*break-word/s);
  assert.match(css, /\.search-ai-card\s*{[^}]*padding:\s*14px/s);
  assert.match(css, /\.search-ai-card\s*{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.search-ai-suggestions\s*{[^}]*min-width:\s*0/s);
  assert.match(css, /\.search-ai-suggestions\s*{[^}]*display:\s*grid/s);
  assert.match(css, /\.search-ai-suggestions span\s*{[^}]*display:\s*grid/s);
  assert.match(css, /\.search-ai-suggestions span\s*{[^}]*white-space:\s*normal/s);
  assert.match(css, /\.search-ai-suggestions span::before/);
  assert.match(css, /\.search-ai-context-badge\s*{[^}]*max-width:\s*128px/s);
  assert.match(css, /\.search-ai-history-item span\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.search-ai-history-list\s*{[^}]*max-height:\s*180px/s);
  assert.match(css, /\.search-ai-history-item\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.search-ai-history-item strong\s*{[^}]*overflow-wrap:\s*anywhere/s);
});

test("resume import module exposes default, preview, loading, and finished states", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /id="importState"/);
  assert.match(html, /data-import-state="default"/);
  assert.match(html, /data-import-state="preview"/);
  assert.match(html, /data-import-state="loading"/);
  assert.match(html, /data-import-state="finished"/);
  assert.match(html, /上传文件夹/);
  assert.match(html, /开始导入/);
  assert.match(html, /导入完成/);

  assert.match(css, /\.import-workspace/);
  assert.match(css, /\.import-panel/);
  assert.match(css, /\.import-assistant/);

  assert.match(js, /showImportState/);
  assert.match(js, /importStateButtons/);
  assert.match(js, /function setImportAssistantProgress/);
  assert.match(js, /function setImportAssistantResult/);
  assert.match(js, /showImportState\("loading"\)/);
  assert.match(js, /setImportAssistantProgress\(\{\s*sourceName/);
  assert.match(js, /setImportAssistantResult\(source\)/);
});

test("resume import supports local folder selection before preview", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /data-import-drop-zone/);
  assert.match(html, /data-import-pick="folder"/);
  assert.match(html, /data-import-pick="files"/);
  assert.match(html, /data-import-picker-status/);
  assert.doesNotMatch(html, /data-import-picker-card/);
  assert.doesNotMatch(html, /连接 Desktop 选择文件夹/);
  assert.doesNotMatch(html, /data-import-source-action="desktopFolder"/);
  assert.doesNotMatch(html, /data-import-source-action="browserFolder"/);
  assert.doesNotMatch(html, /data-import-source-action="demoFolder"/);
  assert.match(html, /data-import-folder-input/);
  assert.match(html, /webkitdirectory/);
  assert.match(html, /data-import-file-input/);

  assert.match(css, /\.import-panel\.is-dragging/);

  assert.match(js, /const importFolderInput/);
  assert.match(js, /function openImportPickerCard/);
  assert.match(js, /function requestImportSource/);
  assert.match(js, /function handleImportFiles/);
  assert.match(js, /function handleImportDrop/);
});

test("desktop renderer exposes local-library mode hooks without demo folder fallback", () => {
  const html = read("index.html");
  const js = read("app.js");
  const preload = read("desktop/preload.cjs");
  const main = read("desktop/main.cjs");

  assert.match(html, /data-local-library-empty/);
  assert.match(html, /data-local-candidate-list/);
  assert.match(html, /data-local-search-list/);
  assert.match(html, /data-local-source-list/);
  assert.match(html, /data-local-task-list/);

  assert.match(js, /const isDesktopLocalLibrary/);
  assert.match(js, /const defaultTalentLibrary/);
  assert.match(js, /let localTalentLibrary/);
  assert.match(js, /async function loadLocalTalentLibrary/);
  assert.match(js, /function applyLocalTalentLibrary/);
  assert.match(js, /function renderLocalCandidates/);
  assert.match(js, /function renderLocalImportTasks/);
  assert.match(js, /applyLocalTalentLibrary\(defaultTalentLibrary\)/);
  assert.match(js, /window\.deerRecallDesktop\?\.getTalentLibrary/);
  assert.match(js, /window\.deerRecallDesktop\?\.selectImportFolder/);
  assert.match(js, /window\.deerRecallDesktop\?\.selectImportFiles/);
  assert.match(js, /window\.deerRecallDesktop\?\.importPaths/);
  assert.match(js, /window\.deerRecallDesktop\?\.importDroppedFiles/);
  assert.match(js, /window\.deerRecallDesktop\?\.getDroppedFilePaths/);
  assert.match(js, /window\.deerRecallDesktop\?\.consumeDroppedFilePaths/);
  assert.match(js, /function importDesktopSelection/);
  assert.match(js, /function importDesktopDroppedPaths/);
  assert.match(js, /function importDesktopDroppedFiles/);
  assert.match(js, /function collectDroppedResumeFiles/);
  assert.match(js, /webkitGetAsEntry/);
  assert.match(js, /\.arrayBuffer\(\)/);
  assert.match(js, /requestImportSource\("desktopFiles"\)/);
  assert.match(preload, /let lastDroppedFilePaths/);
  assert.match(preload, /window\.addEventListener\("drop"/);
  assert.match(preload, /selectImportFiles/);
  assert.match(preload, /importPaths/);
  assert.match(preload, /importDroppedFiles/);
  assert.match(preload, /getDroppedFilePaths/);
  assert.match(preload, /consumeDroppedFilePaths/);
  assert.match(preload, /text\/uri-list/);
  assert.match(main, /import:file-copies/);
  assert.match(main, /writeDroppedFilesToFolder/);
  assert.doesNotMatch(js, /getDroppedFilePaths\(files\)/);
  assert.doesNotMatch(js, /isDesktopLocalLibrary && mode === "files"/);
  assert.doesNotMatch(js, /请选择 Desktop 文件夹，普通浏览器预览可使用系统文件夹选择器。/);
  assert.doesNotMatch(js, /请使用 Desktop 文件夹选择器解析并入库/);
  assert.doesNotMatch(js, /requestImportSource\("demoFolder"\)/);

  assert.match(preload, /getTalentLibrary/);
  assert.match(preload, /selectImportFolder/);
});

test("resume import settings are stateful and affect import preview", () => {
  const html = read("index.html");
  const js = read("app.js");

  assert.match(html, /data-import-setting="scanSubfolders"/);
  assert.match(html, /data-import-setting="autoDedupe"/);
  assert.match(html, /data-import-setting="autoTalent"/);
  assert.match(html, /data-import-setting-status="scanSubfolders"/);
  assert.match(html, /data-import-stat="total"/);
  assert.match(html, /data-import-stat="parseable"/);
  assert.match(html, /data-import-source-name/);
  assert.match(html, /data-import-source-path/);
  assert.match(html, /data-import-legend="newProfiles"/);
  assert.match(html, /data-import-legend="updatedProfiles"/);
  assert.match(html, /data-import-legend="skippedDuplicates"/);
  assert.match(html, /data-import-legend="failed"/);

  assert.match(js, /const importSettings/);
  assert.match(js, /function updateImportSettingsUi/);
  assert.match(js, /function toggleImportSetting/);
  assert.match(js, /function scanImportFiles/);
  assert.match(js, /function updateImportPreview/);
  assert.match(js, /function updateImportLegend/);
  assert.match(js, /function persistImportTask/);
});

test("resume import history links open the parse task list", () => {
  const html = read("index.html");
  const js = read("app.js");

  assert.match(html, /data-import-task-open="all"/);
  assert.match(html, /data-task-summary="processing"/);
  assert.match(html, /data-task-summary="needs"/);
  assert.match(html, /查看所有导入任务/);
  assert.match(js, /const importTaskOpenButtons/);
  assert.match(js, /function openImportTasks/);
  assert.match(js, /function updateImportTaskRow/);
  assert.match(js, /function updateTaskAssistantCounts/);
  assert.match(js, /updateTaskAssistantCounts\(counts\)/);
  assert.match(js, /updateImportTaskRow\(task\)/);
  assert.match(js, /showTaskState\("overview"\)/);
  assert.match(js, /setTaskFilter\("all"\)/);
});

test("resume import escapes local file names before rendering task rows", () => {
  const js = read("app.js");

  assert.match(js, /function escapeHtml/);
  assert.match(js, /escapeHtml\(file\.name\)/);
  assert.match(js, /escapeHtml\(file\.info/);
  assert.match(js, /escapeHtml\(task\.source\)/);
});

test("parse task module exposes task filters, grouped list, and assistant states", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /id="taskState"/);
  assert.match(html, /data-task-filter="all"/);
  assert.match(html, /data-task-filter="processing"/);
  assert.match(html, /data-task-filter="completed"/);
  assert.match(html, /data-task-filter="needs"/);
  assert.match(html, /data-task-panel="overview"/);
  assert.match(html, /data-task-panel="detail"/);
  assert.match(html, /data-task-panel="result"/);
  assert.match(html, /需处理/);
  assert.match(html, /正在解析/);
  assert.match(html, /最近完成/);
  assert.doesNotMatch(html, /data-task-panel="error"/);
  assert.doesNotMatch(html, /data-task-panel-target="error"/);
  assert.doesNotMatch(html, /需要处理/);

  assert.match(css, /\.task-workspace/);
  assert.match(css, /\.task-row/);
  assert.match(css, /\.task-assistant/);

  assert.match(js, /showTaskState/);
  assert.match(js, /taskFilterButtons/);
});

test("parse task issue and detail actions open separate internal task views", () => {
  const html = read("index.html");
  const js = read("app.js");

  assert.match(html, /data-task-view="list"/);
  assert.match(html, /data-task-view="issue"/);
  assert.match(html, /data-task-view="detail"/);
  assert.match(html, /data-task-panel="issue"/);
  assert.match(html, /data-task-open="issue"\s+data-task-id="customer_backend_001"/);
  assert.match(html, /data-task-open="detail"\s+data-task-id="customer_backend_001"/);
  assert.match(html, /data-task-return="list"/);
  assert.match(html, /data-task-return="detail"/);

  assert.match(js, /let currentTaskView = "list"/);
  assert.match(js, /let selectedTaskId = null/);
  assert.match(js, /function openTaskIssue\(taskId\)/);
  assert.match(js, /function openTaskDetail\(taskId\)/);
  assert.match(js, /function returnTaskList\(\)/);
  assert.match(js, /dataset\.taskOpen/);
});

test("parse task module keeps long task and assistant content inside the app shell", () => {
  const css = read("styles.css");

  assert.match(css, /\.task-list\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.side-state\s*{[^}]*height:\s*100%/s);
  assert.match(css, /\.side-state\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.assistant-panel\s*{[^}]*overflow:\s*hidden/s);
});

test("parse task mobile layout avoids task row overflow", () => {
  const css = read("styles.css");

  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.task-workspace\s*{[^}]*padding:\s*24px 14px/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.task-tabs\s*{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.task-row\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.task-title-line\s*{[^}]*flex-direction:\s*column/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.task-stats\s*{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.task-row-actions\s*{[^}]*justify-content:\s*flex-start/s);
});

test("search results mobile layout avoids filter and card overflow", () => {
  const css = read("styles.css");

  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.results-main\s*{[^}]*padding:\s*24px 14px/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.results-header\s*{[^}]*align-items:\s*flex-start/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.filter-bar\s*{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.filter-action\.sort\s*{[^}]*margin-left:\s*0/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.candidate-grid\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.candidate-top\s*{[^}]*align-items:\s*flex-start/s);
});

test("search results desktop cards avoid vertical compression", () => {
  const css = read("styles.css");

  assert.match(css, /\.candidate-grid\s*{[^}]*grid-auto-rows:\s*minmax\(292px,\s*auto\)/s);
  assert.match(css, /\.candidate-grid\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.candidate-card\s*{[^}]*min-height:\s*292px/s);
  assert.match(css, /\.candidate-card\s*{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.filter-spacer\s*{[^}]*background:\s*transparent/s);
});

test("talent library module exposes overview, recent, saved, pending, and duplicate views", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /id="talentState"/);
  assert.match(html, /data-nav-view="talents"/);
  assert.match(html, /data-talent-filter="all"/);
  assert.match(html, /data-talent-filter="recent"/);
  assert.match(html, /data-talent-filter="saved"/);
  assert.match(html, /data-talent-filter="pending"/);
  assert.match(html, /data-talent-filter="duplicate"/);
  assert.match(html, /data-talent-view="recent"/);
  assert.match(html, /data-talent-view="saved"/);
  assert.match(html, /data-talent-view="pending"/);
  assert.match(html, /data-talent-view="duplicate"/);
  assert.match(html, /最近导入来源/);
  assert.match(html, /标签云/);
  assert.match(html, /缺失字段分布/);
  assert.match(html, /重复分析/);

  assert.match(css, /\.talent-workspace/);
  assert.match(css, /\.talent-list/);
  assert.match(css, /\.talent-assistant/);

  assert.match(js, /showTalentState/);
  assert.match(js, /setTalentFilter/);
  assert.match(js, /talentFilterButtons/);
});

test("talent library keeps long lists inside the app shell", () => {
  const css = read("styles.css");

  assert.match(css, /\.talent-workspace\s*{[^}]*height:\s*100%/s);
  assert.match(css, /\.talent-list\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.talent-assistant\s*{[^}]*height:\s*100%/s);
});

test("talent library mobile layout avoids fixed desktop overflow", () => {
  const css = read("styles.css");

  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.talent-workspace\s*{[^}]*padding:\s*24px 14px/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.talent-tabs-row\s*{[^}]*align-items:\s*stretch/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.talent-tabs\s*{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.talent-row,\s*\.pending-row,\s*\.saved-row,\s*\.import-source-row\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.talent-actions\s*{[^}]*justify-content:\s*flex-start/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.talent-pagination\s*{[^}]*flex-direction:\s*column/s);
});

test("talent assistant distinguishes panel-only targets from tab filters", () => {
  const js = read("app.js");

  assert.match(js, /const talentFilters = new Set/);
  assert.match(js, /talentFilters\.has\(target\)/);
});

test("talent library P0 detail pages cover duplicate merge and pending completion flows", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /id="talentDuplicateDetailState"/);
  assert.match(html, /id="talentPendingCompleteState"/);
  assert.match(html, /data-talent-open="duplicateDetail"/);
  assert.match(html, /data-talent-open="pendingComplete"/);
  assert.match(html, /data-talent-detail-return/);
  assert.match(html, /重复候选人差异详情/);
  assert.match(html, /字段差异矩阵/);
  assert.match(html, /合并决策/);
  assert.match(html, /待完善资料补全/);
  assert.match(html, /缺失字段核验/);
  assert.match(html, /AI 补全建议/);
  assert.match(html, /保存补全/);

  assert.match(css, /\.talent-detail-workspace/);
  assert.match(css, /\.duplicate-diff-grid/);
  assert.match(css, /\.field-comparison-table/);
  assert.match(css, /\.pending-complete-grid/);
  assert.match(css, /\.completion-form-grid/);
  assert.match(css, /\.talent-detail-assistant/);

  assert.match(js, /const talentDuplicateDetailState = document\.querySelector\("#talentDuplicateDetailState"\)/);
  assert.match(js, /const talentPendingCompleteState = document\.querySelector\("#talentPendingCompleteState"\)/);
  assert.match(js, /function openTalentDuplicateDetail\(\)/);
  assert.match(js, /function openTalentPendingComplete\(\)/);
  assert.match(js, /function closeTalentDetail\(\)/);
  assert.match(js, /currentView = "talentDuplicateDetail"/);
  assert.match(js, /currentView = "talentPendingComplete"/);
  assert.match(js, /const talentOpenButtons = document\.querySelectorAll\("\[data-talent-open\]"\)/);
  assert.match(js, /talentOpenButtons\.forEach/);
  assert.match(js, /event\.target\.closest\("\[data-talent-open\]"\)/);
});

test("P1 pages cover source detail, import follow-up, filters, candidate actions, and settings", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /id="talentSourceDetailState"/);
  assert.match(html, /id="importActionState"/);
  assert.match(html, /id="talentAdvancedFilterState"/);
  assert.match(html, /id="talentCandidateActionsState"/);
  assert.match(html, /id="settingsState"/);

  assert.match(html, /data-talent-open="sourceDetail"/);
  assert.match(html, /data-import-open="searchImported"/);
  assert.match(html, /data-talent-open="advancedFilter"/);
  assert.match(html, /data-talent-open="candidateActions"/);
  assert.match(html, /data-nav-view="settings"/);

  assert.match(html, /来源批次详情/);
  assert.match(html, /批次入库概览/);
  assert.match(html, /候选人清单/);
  assert.match(html, /导入后续动作/);
  assert.match(html, /新导入候选人搜索/);
  assert.match(html, /智能去重与合并/);
  assert.match(html, /高级筛选/);
  assert.match(html, /职位与经验/);
  assert.match(html, /候选人操作台/);
  assert.match(html, /危险操作/);
  assert.match(html, /AI 解析设置/);
  assert.match(html, /保存设置/);

  assert.match(css, /\.talent-source-workspace/);
  assert.match(css, /\.import-action-workspace/);
  assert.match(css, /\.talent-filter-workspace/);
  assert.match(css, /\.talent-actions-workspace/);
  assert.match(css, /\.settings-workspace/);
  assert.match(css, /\.p1-detail-assistant/);

  assert.match(js, /const talentSourceDetailState = document\.querySelector\("#talentSourceDetailState"\)/);
  assert.match(js, /const importActionState = document\.querySelector\("#importActionState"\)/);
  assert.match(js, /const talentAdvancedFilterState = document\.querySelector\("#talentAdvancedFilterState"\)/);
  assert.match(js, /const talentCandidateActionsState = document\.querySelector\("#talentCandidateActionsState"\)/);
  assert.match(js, /const settingsState = document\.querySelector\("#settingsState"\)/);
  assert.match(js, /function openTalentSourceDetail\(/);
  assert.match(js, /function openImportAction\(/);
  assert.match(js, /function openTalentAdvancedFilter\(/);
  assert.match(js, /function openTalentCandidateActions\(/);
  assert.match(js, /function showSettingsState\(\)/);
  assert.match(js, /currentView = "talentSourceDetail"/);
  assert.match(js, /currentView = "importAction"/);
  assert.match(js, /currentView = "talentAdvancedFilter"/);
  assert.match(js, /currentView = "talentCandidateActions"/);
  assert.match(js, /currentView = "settings"/);
  assert.match(js, /const importOpenButtons = document\.querySelectorAll\("\[data-import-open\]"\)/);
  assert.match(js, /event\.target\.closest\("\[data-import-open\]"\)/);
});

test("P2 pages cover export center, shortlist, tags, failure detail, and search filters", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /id="exportCenterState"/);
  assert.match(html, /id="shortlistState"/);
  assert.match(html, /id="tagManagerState"/);
  assert.match(html, /id="taskFailureDetailState"/);
  assert.match(html, /id="searchFilterState"/);

  assert.match(html, /data-export-open="candidateList"/);
  assert.match(html, /data-export-open="sourceList"/);
  assert.match(html, /data-export-open="savedList"/);
  assert.match(html, /data-export-open="pendingList"/);
  assert.match(html, /data-export-open="failedList"/);
  assert.match(html, /data-shortlist-open="manager"/);
  assert.match(html, /data-shortlist-open="saved"/);
  assert.match(html, /data-tag-open="candidate"/);
  assert.match(html, /data-tag-open="imported"/);
  assert.match(html, /data-task-failure-open="file"/);
  assert.match(html, /data-search-filter-open="advanced"/);

  assert.match(html, /导出中心/);
  assert.match(html, /导出字段/);
  assert.match(html, /短名单管理/);
  assert.match(html, /候选人分组/);
  assert.match(html, /标签管理/);
  assert.match(html, /AI 标签建议/);
  assert.match(html, /失败文件处理详情/);
  assert.match(html, /失败原因解释/);
  assert.match(html, /搜索条件编辑/);
  assert.match(html, /相似候选人条件/);

  assert.match(css, /\.p2-workspace/);
  assert.match(css, /\.export-center-workspace/);
  assert.match(css, /\.shortlist-workspace/);
  assert.match(css, /\.tag-manager-workspace/);
  assert.match(css, /\.task-failure-workspace/);
  assert.match(css, /\.search-filter-workspace/);
  assert.match(css, /\.p2-detail-assistant/);

  assert.match(js, /const exportCenterState = document\.querySelector\("#exportCenterState"\)/);
  assert.match(js, /const shortlistState = document\.querySelector\("#shortlistState"\)/);
  assert.match(js, /const tagManagerState = document\.querySelector\("#tagManagerState"\)/);
  assert.match(js, /const taskFailureDetailState = document\.querySelector\("#taskFailureDetailState"\)/);
  assert.match(js, /const searchFilterState = document\.querySelector\("#searchFilterState"\)/);
  assert.match(js, /function hideP2Views\(\)/);
  assert.match(js, /function showP2Shell\(/);
  assert.match(js, /function openExportCenter\(/);
  assert.match(js, /function openShortlistManager\(/);
  assert.match(js, /function openTagManager\(/);
  assert.match(js, /function openTaskFailureDetail\(/);
  assert.match(js, /function openSearchFilter\(/);
  assert.match(js, /currentView = "exportCenter"/);
  assert.match(js, /currentView = "shortlistManager"/);
  assert.match(js, /currentView = "tagManager"/);
  assert.match(js, /currentView = "taskFailureDetail"/);
  assert.match(js, /currentView = "searchFilter"/);
});

test("P2 pages keep operational UI responsive inside the shared shell", () => {
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(css, /\.p2-workspace\s*{[^}]*height:\s*100%/s);
  assert.match(css, /\.p2-body-grid\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.p2-table-row\s*{[^}]*min-width:\s*0/s);
  assert.match(css, /\.p2-detail-assistant\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /\.p2-workspace\s*{[^}]*overflow:\s*visible/s);
  assert.match(css, /\.p2-body-grid,\s*\.p2-two-column,\s*\.p2-three-column\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);

  assert.match(js, /const p2Assistants = document\.querySelectorAll\("\.p2-detail-assistant"\)/);
  assert.match(js, /event\.target\.closest\("\[data-export-open\]"\)/);
  assert.match(js, /event\.target\.closest\("\[data-shortlist-open\]"\)/);
  assert.match(js, /event\.target\.closest\("\[data-tag-open\]"\)/);
  assert.match(js, /event\.target\.closest\("\[data-task-failure-open\]"\)/);
  assert.match(js, /event\.target\.closest\("\[data-search-filter-open\]"\)/);
});

test("P2 UI closeout keeps dense operation panels aligned and readable", () => {
  const html = read("index.html");
  const css = read("styles.css");

  assert.match(html, /class="p2-table p2-table-three"/);
  assert.match(css, /\.p2-table-three \.p2-table-row\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.p2-file-card\s*{[^}]*grid-template-columns:\s*78px minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.p2-panel\s*{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.p2-body-grid\s*{[^}]*scrollbar-gutter:\s*stable/s);
  assert.match(css, /\.p2-workspace \.primary-action,\s*\.p2-workspace \.secondary-action\s*{[^}]*max-width:\s*100%/s);
  assert.match(css, /\.p2-card-list section,\s*\.p2-suggestion-list p,\s*\.p2-file-card\s*{[^}]*overflow:\s*hidden/s);
});

test("P0 P1 and P2 pages share the Harness visual tokens", () => {
  const css = read("styles.css");

  assert.match(css, /--detail-page-padding:\s*48px 36px 28px/);
  assert.match(css, /--detail-page-gap:\s*16px/);
  assert.match(css, /--detail-card-radius:\s*8px/);
  assert.match(css, /--detail-panel-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.07\)/);
  assert.match(css, /\.talent-detail-workspace,\s*\.p1-workspace,\s*\.p2-workspace\s*{[^}]*padding:\s*var\(--detail-page-padding\)/s);
  assert.match(css, /\.talent-detail-card,\s*\.p1-panel,\s*\.p2-panel\s*{[^}]*border-radius:\s*var\(--detail-card-radius\)/s);
  assert.match(css, /\.p2-table-row span\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.talent-detail-workspace,\s*\.p1-workspace,\s*\.p2-workspace,\s*\.candidate-resume-workspace\s*{[^}]*padding:\s*24px 14px/s);
});

test("P2 action pages expose visible state updates for Harness review", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /data-p2-action-status="export"/);
  assert.match(html, /data-shortlist-card/);
  assert.match(html, /data-tag-token-box/);
  assert.match(html, /data-tag-action-status/);
  assert.match(html, /data-failure-action-status/);
  assert.match(html, /data-search-filter-status/);

  assert.match(css, /\.p2-action-status/);
  assert.match(css, /\.p2-card-list section\.is-removed/);
  assert.match(css, /\.p2-token-box span\.is-added/);

  assert.match(js, /function setP2ActionStatus\(/);
  assert.match(js, /function refreshShortlistManager\(/);
  assert.match(js, /function applySuggestedTag\(/);
  assert.match(js, /function handleP2Action\(action,\s*triggerButton = null\)/);
  assert.match(js, /triggerButton\?\.closest\("\[data-shortlist-card\]"\)/);
  assert.match(js, /setP2ActionStatus\("searchFilter"/);
});

test("P0 P1 and P2 scope stays limited to the approved priority set", () => {
  const source = `${read("index.html")}\n${read("app.js")}\n${read("styles.css")}`;

  assert.doesNotMatch(source, /\bP3\b/);
  assert.doesNotMatch(source, /\bP4\b/);
});

test("candidate resume detail view is shared by search and talent library entries", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /id="candidateResumeState"/);
  assert.match(html, /CV_candidate_resume_detail/);
  assert.match(html, /data-candidate-resume-entry="search"/);
  assert.match(html, /data-candidate-resume-entry="talent"/);
  assert.match(html, /data-candidate-resume-entry="task"/);
  assert.match(html, /data-candidate-id="candidate_chenyu_001"/);
  assert.match(html, /data-candidate-resume-view="summary"/);
  assert.match(html, /data-candidate-resume-view="archive"/);
  assert.match(html, /匹配证据/);
  assert.match(html, /打开原文件/);
  assert.match(html, /候选人助手/);
  assert.match(html, /返回搜索结果/);
  assert.match(html, /返回人才库/);
  assert.match(html, /返回任务详情/);
  assert.match(html, /打开完整简历/);

  assert.match(css, /\.candidate-resume-workspace/);
  assert.match(css, /\.resume-detail-card/);
  assert.match(css, /\.candidate-resume-assistant/);
  assert.match(css, /\.resume-evidence-list/);

  assert.match(js, /let currentView = "candidateResumeDetail"/);
  assert.match(js, /let selectedCandidateId = null/);
  assert.match(js, /let candidateResumeEntry = "talent"/);
  assert.match(js, /let resumeReturnContext = null/);
  assert.match(js, /function openCandidateResume\(candidateId/);
  assert.match(js, /function closeCandidateResume\(\)/);
  assert.match(js, /entry === "task"/);
  assert.match(js, /returnTaskDetail\(\)/);
});

test("candidate resume detail tabs expose full content panels and switching logic", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  for (const view of ["summary", "archive", "experience", "projects", "contact", "source"]) {
    assert.match(html, new RegExp(`data-candidate-resume-view="${view}"`));
    assert.match(html, new RegExp(`data-candidate-resume-panel="${view}"`));
  }

  assert.match(html, /原始文件信息/);
  assert.match(html, /工作经历时间线/);
  assert.match(html, /项目证据/);
  assert.match(html, /联系方式状态/);
  assert.match(html, /标签来源/);
  assert.match(html, /data-candidate-resume-preview/);
  assert.match(html, /data-candidate-raw-text/);
  assert.match(html, /data-candidate-file-path/);
  assert.match(html, /data-candidate-work-experiences/);
  assert.match(html, /data-candidate-projects/);
  assert.match(html, /data-candidate-tag-sources/);

  assert.match(css, /\.resume-tab-panel/);
  assert.match(css, /\.resume-tab-panel\.is-active/);
  assert.match(css, /\.resume-timeline/);
  assert.match(css, /\.resume-source-grid/);

  assert.match(js, /const candidateResumePanels = document\.querySelectorAll\("\[data-candidate-resume-panel\]"\)/);
  assert.match(js, /function renderCandidateArchive\(candidate/);
  assert.match(js, /function renderCandidateWorkExperiences\(candidate/);
  assert.match(js, /function renderCandidateProjects\(candidate/);
  assert.match(js, /function renderCandidateContacts\(candidate/);
  assert.match(js, /function renderCandidateTagSources\(candidate/);
  assert.match(js, /function showCandidateResumePanel\(viewName = "summary"\)/);
  assert.match(js, /panel\.classList\.toggle\("is-active"/);
  assert.match(js, /panel\.classList\.toggle\("state-hidden"/);
});

test("desktop resume file actions are wired through Electron IPC", () => {
  const main = read("desktop/main.cjs");
  const preload = read("desktop/preload.cjs");
  const js = read("app.js");

  assert.match(main, /ipcMain\.handle\("resume:open-file"/);
  assert.match(main, /shell\.openPath\(filePath\)/);
  assert.match(main, /ipcMain\.handle\("resume:show-in-folder"/);
  assert.match(main, /shell\.showItemInFolder\(filePath\)/);

  assert.match(preload, /openResumeFile:\s*\(filePath\) => ipcRenderer\.invoke\("resume:open-file",\s*filePath\)/);
  assert.match(preload, /showResumeInFolder:\s*\(filePath\) => ipcRenderer\.invoke\("resume:show-in-folder",\s*filePath\)/);

  assert.doesNotMatch(js, /本地文件操作已模拟/);
  assert.match(js, /window\.deerRecallDesktop\?\.openResumeFile/);
  assert.match(js, /window\.deerRecallDesktop\?\.showResumeInFolder/);
  assert.match(js, /candidate\.resumeText/);
});

test("candidate resume detail stays usable on narrow viewports", () => {
  const css = read("styles.css");

  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /\.app-window\s*{[^}]*min-width:\s*0/s);
  assert.match(css, /\.app-window\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.candidate-resume-workspace \.resume-profile-hero\s*{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /\.resume-tab-panel\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.resume-project-grid,\s*\.resume-source-grid\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
});

test("candidate resume actions stay scoped to local desktop library", () => {
  const js = read("app.js");
  const getCandidateRecordBody = js.match(/function getCandidateRecord\(candidateId = selectedCandidateId\) \{[\s\S]*?\n\}/)?.[0] || "";
  const openTalentCandidateActionsBody = js.match(/function openTalentCandidateActions\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  const resumeOpenDelegates = js.split('const resumeButton = event.target.closest(".candidate-resume-open")').length - 1;

  assert.match(getCandidateRecordBody, /const localCandidates = getLocalCandidates\(\)/);
  assert.match(getCandidateRecordBody, /localCandidates\.find\(\(candidate\) => candidate\.id === candidateId\)/);
  assert.doesNotMatch(getCandidateRecordBody, /candidateRecords\[candidateId\] \|\| getLocalCandidates\(\)\[0\]/);
  assert.doesNotMatch(openTalentCandidateActionsBody, /selectedCandidateId = selectedCandidateId \|\| "candidate_chenyu_001"/);
  assert.equal(resumeOpenDelegates, 1);
});

test("desktop shell does not force horizontal overflow below wide desktop widths", () => {
  const css = read("styles.css");
  const desktopMedia = css.match(/@media \(max-width:\s*1500px\)\s*{([\s\S]*?)\n}\n\n@media \(max-width:\s*760px\)/)?.[1] || "";

  assert.match(desktopMedia, /\.app-window\s*{[^}]*min-width:\s*0/s);
  assert.match(desktopMedia, /\.app-window\s*{[^}]*width:\s*100%/s);
  assert.match(desktopMedia, /\.app-window\s*{[^}]*grid-template-columns:\s*248px minmax\(0,\s*1fr\) 360px/s);
  assert.match(desktopMedia, /\.talent-kpis\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(desktopMedia, /\.talent-kpi span\s*{[^}]*white-space:\s*nowrap/s);
  assert.match(desktopMedia, /\.talent-tabs-row\s*{[^}]*flex-wrap:\s*wrap/s);
  assert.match(desktopMedia, /\.talent-sort\s*{[^}]*flex:\s*0 0 auto/s);
  assert.match(desktopMedia, /\.talent-row\s*{[^}]*grid-template-columns:\s*58px minmax\(0,\s*1fr\)/s);
  assert.match(desktopMedia, /\.talent-source,\s*\.talent-actions\s*{[^}]*grid-column:\s*2/s);
  assert.match(desktopMedia, /\.candidate-resume-workspace \.resume-detail-grid\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(desktopMedia, /\.candidate-resume-workspace \.resume-tabs button\s*{[^}]*flex:\s*1 1 0/s);
  assert.match(desktopMedia, /\.resume-summary-panel\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(desktopMedia, /\.resume-summary-panel \.resume-summary-card\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(desktopMedia, /\.market-insight-head\s*{[^}]*flex-direction:\s*column/s);
  assert.match(desktopMedia, /\.side-state\s*{[^}]*overflow-x:\s*hidden/s);
});

test("project exposes npm scripts for Harness-compatible static delivery", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.check, "node --check app-runtime.js && node --check motion.js && node --check server/llm-gateway.mjs && node --check server/server.mjs && node --check desktop/ai-gateway.cjs && npm test");
  assert.equal(pkg.scripts.test, "node --test tests/homepage-structure.test.js tests/ai-market-insight.test.mjs tests/local-resume-library.test.cjs tests/desktop-ai-gateway.test.cjs tests/deersearch-engine-runtime.test.cjs");
  assert.equal(pkg.scripts.clean, "rm -rf dist");
  assert.equal(pkg.scripts.build, "node scripts/build-static-runtime.mjs");
  assert.equal(pkg.scripts["verify:dist"], "node scripts/verify-dist-runtime.mjs");
  assert.equal(pkg.scripts.serve, "npm run build && node server/server.mjs");
  assert.equal(pkg.scripts.start, "node server/server.mjs");
});

test("project exposes desktop packaging scripts for local macOS builds", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.main, "desktop/main.cjs");
  assert.equal(pkg.scripts["desktop:dev"], "npm run build && electron desktop/main.cjs");
  assert.equal(pkg.scripts["desktop:build"], "npm run build && electron-builder --config electron-builder.json --mac dir");
  assert.equal(pkg.scripts["desktop:build:trial"], "npm run build && CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --config electron-builder.json --mac dmg");
  assert.equal(pkg.scripts["desktop:build:tauri"], "tauri build");
  assert.equal(pkg.devDependencies["@tauri-apps/cli"], "^2.11.3");
  assert.equal(pkg.devDependencies.electron, "^42.5.0");
  assert.equal(pkg.devDependencies["electron-builder"], "^26.15.3");
  assert.equal(pkg.dependencies.mammoth, "^1.12.0");
  assert.equal(pkg.dependencies["pdf-parse"], "^2.4.5");
});

test("electron desktop wrapper reuses the static dist artifact", () => {
  const main = read("desktop/main.cjs");
  const preload = read("desktop/preload.cjs");
  const builder = JSON.parse(read("electron-builder.json"));

  assert.match(main, /BrowserWindow/);
  assert.match(main, /importFolderToLibrary/);
  assert.match(main, /loadLibrary/);
  assert.match(main, /function getDatabasePath\(\)/);
  assert.match(main, /loadFile\(path\.join\(__dirname, "\.\.", "dist", "index\.html"\)\)/);
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /preload: path\.join\(__dirname, "preload\.cjs"\)/);
  assert.match(main, /ipcMain\.handle\("import:select-folder"/);
  assert.match(main, /dialog\.showOpenDialog/);
  assert.match(preload, /contextBridge\.exposeInMainWorld\("deerRecallDesktop"/);
  assert.match(preload, /getTalentLibrary/);
  assert.match(preload, /ipcRenderer\.invoke\("library:get"\)/);
  assert.match(preload, /selectImportFolder/);
  assert.match(preload, /ipcRenderer\.invoke\("import:select-folder"\)/);
  assert.equal(builder.appId, "com.deerrecall.app");
  assert.equal(builder.productName, "DeerRecall");
  assert.equal(builder.mac.identity, null);
  assert.deepEqual(builder.mac.target, ["dir", "dmg"]);
  assert.match(builder.files.join(","), /desktop\/\*\*\/\*\.cjs/);
  assert.match(builder.files.join(","), /server\/llm-gateway\.mjs/);
  assert.match(builder.files.join(","), /node_modules\/\*\*\//);
  assert.match(builder.files.join(","), /dist\/\*\*\//);
});

test("tauri desktop wrapper is available for a later small-runtime build", () => {
  const config = JSON.parse(read("src-tauri/tauri.conf.json"));
  const cargo = read("src-tauri/Cargo.toml");
  const main = read("src-tauri/src/main.rs");

  assert.equal(config.productName, "DeerRecall");
  assert.equal(config.identifier, "com.deerrecall.app");
  assert.equal(config.build.beforeBuildCommand, "npm run build");
  assert.equal(config.build.frontendDist, "../dist");
  assert.equal(config.app.windows[0].title, "DeerRecall");
  assert.equal(config.bundle.active, true);
  assert.match(config.bundle.targets.join(","), /app/);
  assert.match(cargo, /name = "deerrecall"/);
  assert.match(cargo, /tauri = /);
  assert.match(main, /tauri::Builder::default\(\)/);
});

test("static build script copies runtime assets and excludes development-only folders", () => {
  const script = read("scripts/build-static-runtime.mjs");

  assert.match(script, /const root = path\.resolve/);
  assert.match(script, /const dist = path\.join\(root, "dist"\)/);
  assert.match(script, /"index\.html"/);
  assert.match(script, /"app-runtime\.js"/);
  assert.match(script, /"deersearch-engine-runtime\.js"/);
  assert.match(script, /"styles\.css"/);
  assert.match(script, /path\.basename\(src\) !== "\.DS_Store"/);
  assert.doesNotMatch(script, /"demos"/);
  assert.doesNotMatch(script, /"finalized"/);
  assert.doesNotMatch(script, /"docs"/);
  assert.doesNotMatch(script, /"tests"/);
  assert.doesNotMatch(script, /"output"/);
});

test("main page loads local motion runtime before application scripts", () => {
  const html = read("index.html");

  const gsapIndex = html.indexOf('<script src="vendor/gsap.min.js"></script>');
  const flipIndex = html.indexOf('<script src="vendor/Flip.min.js"></script>');
  const motionIndex = html.indexOf('<script src="motion.js"></script>');
  const searchIndex = html.indexOf('<script src="deersearch-engine-runtime.js"></script>');
  const appIndex = html.indexOf('<script src="app-runtime.js"></script>');

  assert.ok(gsapIndex > -1);
  assert.ok(flipIndex > gsapIndex);
  assert.ok(motionIndex > flipIndex);
  assert.ok(searchIndex > motionIndex);
  assert.ok(appIndex > searchIndex);
});

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

test("motion Flip hooks execute DOM mutations exactly once without depending on animation", () => {
  const noAnimation = createMotionTestEnvironment();
  const fallbackContainer = new noAnimation.TestElement();
  let fallbackMutations = 0;

  assert.equal(
    noAnimation.window.DeerRecallMotion.flipSearchCards(fallbackContainer, () => {
      fallbackMutations += 1;
    }),
    true,
  );
  assert.equal(fallbackMutations, 1);

  const reducedMotion = createMotionTestEnvironment({
    gsap: createGsapStub(),
    Flip: createFlipStub(),
    reduceMotion: true,
  });
  const reducedContainer = new reducedMotion.TestElement();
  let reducedMutations = 0;

  assert.equal(
    reducedMotion.window.DeerRecallMotion.flipFilterChips(reducedContainer, () => {
      reducedMutations += 1;
    }),
    true,
  );
  assert.equal(reducedMutations, 1);

  const flipFailure = createMotionTestEnvironment({
    gsap: createGsapStub(),
    Flip: createFlipStub({
      getState() {
        throw new Error("Flip state unavailable");
      },
    }),
  });
  const failureContainer = new flipFailure.TestElement({
    children: [new flipFailure.TestElement()],
  });
  let failureMutations = 0;

  assert.doesNotThrow(() => {
    assert.equal(
      flipFailure.window.DeerRecallMotion.flipSearchCards(failureContainer, () => {
        failureMutations += 1;
      }),
      true,
    );
  });
  assert.equal(failureMutations, 1);
});

test("motion entry hooks skip empty animation targets cleanly", () => {
  let fromToCalls = 0;
  let timelineFromToCalls = 0;
  const gsap = createGsapStub({
    fromTo() {
      fromToCalls += 1;
    },
    timeline() {
      return {
        fromTo() {
          timelineFromToCalls += 1;
          return this;
        },
        to() {
          return this;
        },
      };
    },
  });
  const { window, TestElement } = createMotionTestEnvironment({ gsap });
  const emptyRoot = new TestElement();
  const emptyImportPanel = new TestElement();
  const importRoot = new TestElement({
    selectorMap: {
      '[data-import-state="finished"]': [emptyImportPanel],
    },
  });

  assert.equal(window.DeerRecallMotion.enterSearchResults(emptyRoot), false);
  assert.equal(window.DeerRecallMotion.enterImportState("finished", importRoot), false);
  assert.equal(window.DeerRecallMotion.enterTalentView(emptyRoot), false);
  assert.equal(window.DeerRecallMotion.enterResumeDetail(emptyRoot), false);
  assert.equal(window.DeerRecallMotion.enterMarketInsight(emptyRoot), false);
  assert.equal(fromToCalls, 0);
  assert.equal(timelineFromToCalls, 0);
});

test("motion Flip hooks skip empty animation targets without replaying mutations", () => {
  let getStateCalls = 0;
  let fromCalls = 0;
  const { window, TestElement } = createMotionTestEnvironment({
    gsap: createGsapStub(),
    Flip: createFlipStub({
      getState(targets) {
        getStateCalls += 1;
        return { targets };
      },
      from() {
        fromCalls += 1;
      },
    }),
  });
  const emptyContainer = new TestElement();
  let mutations = 0;

  assert.equal(
    window.DeerRecallMotion.flipSearchCards(emptyContainer, () => {
      mutations += 1;
    }),
    true,
  );
  assert.equal(mutations, 1);
  assert.equal(getStateCalls, 0);
  assert.equal(fromCalls, 0);
});

test("motion scan layer is scoped to the search results surface", () => {
  const css = read("styles.css");

  assert.match(css, /\.results-main\s*{[^}]*position:\s*relative/s);
  assert.match(css, /\.results-main\s*{[^}]*isolation:\s*isolate/s);
  assert.match(css, /\.results-main > :not\(\.motion-scan-layer\)\s*{[^}]*z-index:\s*1/s);
});

test("Neon Talent OS visual delivery is explicit in the UI layer", () => {
  const css = read("styles.css");

  assert.match(css, /--signal-cyan:\s*#3ff6e8/);
  assert.match(css, /--signal-magenta:\s*#ff4fd8/);
  assert.match(css, /\.app-window::after\s*{/);
  assert.match(css, /@keyframes signalDrift/);
  assert.match(css, /\.candidate-card::before\s*{/);
  assert.match(css, /\.candidate-card:hover\s*{/);
  assert.match(css, /\.talent-row::before\s*{/);
  assert.match(css, /\.candidate-resume-workspace \.resume-profile-hero::after\s*{/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/s);
});

test("front-end design delivery document records Chinese acceptance surfaces", () => {
  const doc = read("docs/superpowers/design-delivery/2026-07-01-neon-talent-os-visual-delivery.md");
  const screenshotPaths = [
    "docs/superpowers/design-delivery/screenshots/neon-talent-os-search.png",
    "docs/superpowers/design-delivery/screenshots/neon-talent-os-library.png",
    "docs/superpowers/design-delivery/screenshots/neon-talent-os-detail.png",
  ];

  assert.match(doc, /视觉命题/);
  assert.match(doc, /DeerSearch/);
  assert.match(doc, /人才库/);
  assert.match(doc, /候选人详情/);
  assert.match(doc, /Electron/);
  assert.match(doc, /screenshots\/neon-talent-os-search\.png/);
  assert.match(doc, /screenshots\/neon-talent-os-library\.png/);
  assert.match(doc, /screenshots\/neon-talent-os-detail\.png/);
  screenshotPaths.forEach((file) => {
    const screenshot = fs.statSync(path.join(root, file));
    assert.ok(screenshot.isFile());
    assert.ok(screenshot.size > 1000);
  });
});

test("project exposes local motion runtime assets for static delivery", () => {
  const pkg = JSON.parse(read("package.json"));
  const build = read("scripts/build-static-runtime.mjs");
  const verify = read("scripts/verify-dist-runtime.mjs");
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

test("static dist verification rejects missing or extra runtime assets", () => {
  const script = read("scripts/verify-dist-runtime.mjs");

  assert.match(script, /const expectedRuntimeAssets = new Set/);
  assert.match(script, /"index\.html"/);
  assert.match(script, /"app-runtime\.js"/);
  assert.match(script, /"deersearch-engine-runtime\.js"/);
  assert.match(script, /"motion\.js"/);
  assert.match(script, /"styles\.css"/);
  assert.match(script, /"vendor\/gsap\.min\.js"/);
  assert.match(script, /"vendor\/Flip\.min\.js"/);
  assert.match(script, /listRuntimeEntries/);
  assert.match(script, /missingAssets/);
  assert.match(script, /extraAssets/);
  assert.match(script, /nonFileAssets/);
  assert.match(script, /process\.exitCode = 1/);
});

test("docker runtime serves built dist assets and AI API with Node", () => {
  const dockerfile = read("Dockerfile");

  assert.match(dockerfile, /ARG NODE_IMAGE=public\.ecr\.aws\/docker\/library\/node:20-alpine/);
  assert.match(dockerfile, /FROM \$\{NODE_IMAGE\}/);
  assert.match(dockerfile, /COPY server\/ \.\/server\//);
  assert.match(dockerfile, /COPY dist\/ \.\/dist\//);
  assert.match(dockerfile, /EXPOSE 8080/);
  assert.match(dockerfile, /CMD \["node", "server\/server\.mjs"\]/);
});

test("docker compose defines a single configurable DeerRecall service", () => {
  const compose = read("docker-compose.yml");
  const env = read(".env.example");

  assert.match(compose, /services:/);
  assert.match(compose, /deerrecall:/);
  assert.match(compose, /image: \$\{DEERRECALL_IMAGE:-deerrecall:local\}/);
  assert.match(compose, /container_name: \$\{DEERRECALL_CONTAINER:-deerrecall\}/);
  assert.match(compose, /"\$\{DEERRECALL_PORT:-8080\}:8080"/);
  assert.match(compose, /DEERRECALL_LLM_API_KEY: \$\{DEERRECALL_LLM_API_KEY:-\}/);
  assert.match(compose, /DEERRECALL_LLM_BASE_URL: \$\{DEERRECALL_LLM_BASE_URL:-https:\/\/api\.openai\.com\/v1\}/);
  assert.match(compose, /DEERRECALL_LLM_MODEL: \$\{DEERRECALL_LLM_MODEL:-\}/);
  assert.match(compose, /restart: unless-stopped/);

  assert.match(env, /DEERRECALL_IMAGE=deerrecall:local/);
  assert.match(env, /DEERRECALL_PORT=8080/);
  assert.match(env, /DEERRECALL_LLM_API_KEY=/);
  assert.match(env, /DEERRECALL_LLM_TIMEOUT_MS=30000/);
});

test("harness pipeline runs test, build, image, deploy, and verify stages", () => {
  const pipeline = read(".harness/deerrecall-ci-cd.yaml");

  assert.match(pipeline, /version: 1/);
  assert.match(pipeline, /kind: pipeline/);
  assert.match(pipeline, /name: test/);
  assert.match(pipeline, /npm run check/);
  assert.match(pipeline, /name: build_static/);
  assert.match(pipeline, /npm run build/);
  assert.match(pipeline, /npm run verify:dist/);
  assert.match(pipeline, /name: build_image/);
  assert.match(pipeline, /path: \/var\/run\/docker\.sock/);
  assert.match(pipeline, /mount:/);
  assert.match(pipeline, /docker build -t \$\{DEERRECALL_IMAGE:-deerrecall:local\} \./);
  assert.match(pipeline, /name: deploy_compose/);
  assert.match(pipeline, /docker compose up -d/);
  assert.match(pipeline, /name: verify_deploy/);
  assert.match(pipeline, /set -eu/);
  assert.match(pipeline, /APP_CONTAINER="\$\{DEERRECALL_CONTAINER:-deerrecall\}"/);
  assert.match(pipeline, /READY=0/);
  assert.match(pipeline, /for attempt in \$\(seq 1 20\)/);
  assert.match(pipeline, /sleep 1/);
  assert.match(pipeline, /test "\$\{READY\}" = "1"/);
  assert.match(pipeline, /docker exec "\$\{APP_CONTAINER\}" wget -qO-/);
  assert.doesNotMatch(pipeline, /curlimages\/curl/);
  assert.match(pipeline, /http:\/\/127\.0\.0\.1:8080\/health/);
  assert.match(pipeline, /http:\/\/127\.0\.0\.1:8080\/api\/ai\/status/);
  assert.match(pipeline, /grep -q "id=\\"resultsState\\""/);
  assert.match(pipeline, /grep -q "id=\\"candidateResumeState\\""/);
  assert.match(pipeline, /grep -q "data-market-insight-run"/);
  assert.match(pipeline, /motion\.js/);
  assert.match(pipeline, /vendor\/gsap\.min\.js/);
  assert.match(pipeline, /vendor\/Flip\.min\.js/);
  assert.match(pipeline, /deersearch-engine-runtime\.js/);
  assert.match(pipeline, /grep -qi "cache-control: no-cache, must-revalidate"/);
});

test("ignore files keep generated and local-only content out of source and docker context", () => {
  const gitignore = read(".gitignore");
  const dockerignore = read(".dockerignore");

  assert.match(gitignore, /node_modules\//);
  assert.match(gitignore, /dist\//);
  assert.match(gitignore, /\.env/);
  assert.match(gitignore, /\.playwright-cli\//);
  assert.match(gitignore, /output\//);

  assert.match(dockerignore, /\.git/);
  assert.match(dockerignore, /node_modules/);
  assert.match(dockerignore, /docs/);
  assert.match(dockerignore, /demos/);
  assert.match(dockerignore, /finalized/);
  assert.match(dockerignore, /homepage-demo\.html/);
  assert.match(dockerignore, /homepage-full-demo\.html/);
  assert.match(dockerignore, /tests/);
  assert.match(dockerignore, /output/);
  assert.doesNotMatch(dockerignore, /^dist$/m);
});

test("readme documents local, compose, and Harness workflows", () => {
  const readme = read("README.md");

  assert.match(readme, /npm test/);
  assert.match(readme, /npm run build/);
  assert.match(readme, /npm run desktop:build/);
  assert.match(readme, /npm run desktop:build:trial/);
  assert.match(readme, /release\/electron\/mac-arm64\/DeerRecall\.app/);
  assert.match(readme, /release\/electron\/DeerRecall-0\.1\.0-arm64\.dmg/);
  assert.match(readme, /未签名的本地 macOS app/);
  assert.match(readme, /用户不需要安装 Electron/);
  assert.match(readme, /第一版试用包启动时人才库为空/);
  assert.match(readme, /Library\/Application Support\/deerrecall\/talent-library\.json/);
  assert.match(readme, /PDF \/ DOCX \/ TXT \/ Markdown/);
  assert.match(readme, /配置模型 Key 后，Electron 桌面端可以直接启用 DeerSearch AI 回答和候选人市场画像/);
  assert.match(readme, /Library\/Application Support\/deerrecall\/\.env/);
  assert.match(readme, /docker build -t deerrecall:local \./);
  assert.match(readme, /docker compose up -d/);
  assert.match(readme, /Harness Open Source/);
  assert.match(readme, /\/var\/run\/docker\.sock/);
  assert.match(readme, /DEERRECALL_PORT/);
  assert.match(readme, /docker compose logs --tail=100 deerrecall/);
  assert.match(readme, /生产发布护栏/);
  assert.match(readme, /构建产物不包含设计参考资料/);
  assert.match(readme, /deersearch-engine-runtime\.js/);
  assert.match(readme, /创建 release tag/);
  assert.match(readme, /JS、CSS 和搜索引擎脚本使用 `no-cache, must-revalidate`/);
  assert.match(readme, /AI 市场画像 MVP/);
  assert.match(readme, /DEERRECALL_LLM_API_KEY/);
  assert.match(readme, /DEERRECALL_LLM_MODEL/);
  assert.match(readme, /薪资参考/);
});

test("candidate detail exposes AI market insight controls and render targets", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");
  const preload = read("desktop/preload.cjs");

  assert.match(html, /data-market-insight-run/);
  assert.match(html, /data-market-insight-status/);
  assert.match(html, /data-market-insight-position/);
  assert.match(html, /data-market-insight-level/);
  assert.match(html, /data-market-insight-scarcity/);
  assert.match(html, /data-market-insight-monthly/);
  assert.match(html, /data-market-insight-annual/);
  assert.match(html, /data-market-insight-confidence/);
  assert.match(html, /data-market-insight-drivers/);
  assert.match(html, /data-market-insight-risks/);
  assert.match(html, /data-market-insight-hr/);
  assert.match(html, /data-market-insight-boss/);
  assert.match(html, /薪资参考由 AI 基于简历信息估算/);

  assert.match(css, /\.market-insight-card/);
  assert.match(css, /\.market-insight-grid/);
  assert.match(css, /\.market-insight-list/);

  assert.match(js, /const marketInsightButtons/);
  assert.match(js, /function getMarketInsightCandidatePayload/);
  assert.match(js, /function requestMarketInsight/);
  assert.match(js, /function renderMarketInsight/);
  assert.match(js, /\/api\/ai\/market-insight/);
  assert.match(js, /window\.deerRecallDesktop\?\.requestMarketInsight/);
  assert.doesNotMatch(js, /AI 能力需要通过本地服务或 Docker 运行时打开/);
  assert.match(preload, /requestMarketInsight:\s*\(payload\) => ipcRenderer\.invoke\("ai:market-insight",\s*payload\)/);
});

test("DeerSearch exposes an AI assistant response area without replacing static results", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("app.js");

  assert.match(html, /data-search-ai-card/);
  assert.match(html, /data-search-ai-status/);
  assert.match(html, /data-search-ai-answer/);
  assert.match(html, /data-search-ai-suggestions/);

  assert.match(css, /\.search-ai-card/);

  assert.match(js, /function requestSearchAssistant/);
  assert.match(js, /\/api\/ai\/search-assistant/);
  assert.match(js, /function showResults\(queryText = defaultQuery,\s*options = \{\}\)/);
  assert.match(js, /resultsState\.classList\.remove\("state-hidden"\)/);
});

test("project exposes Node AI gateway runtime scripts", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.start, "node server/server.mjs");
  assert.equal(pkg.scripts.test, "node --test tests/homepage-structure.test.js tests/ai-market-insight.test.mjs tests/local-resume-library.test.cjs tests/desktop-ai-gateway.test.cjs tests/deersearch-engine-runtime.test.cjs");
  assert.match(pkg.scripts.check, /node --check server\/server\.mjs/);
  assert.match(pkg.scripts.check, /node --check server\/llm-gateway\.mjs/);
  assert.match(pkg.scripts.check, /node --check desktop\/ai-gateway\.cjs/);
  assert.equal(pkg.scripts.serve, "npm run build && node server/server.mjs");
});

test("docker runtime serves static assets and AI API through Node", () => {
  const dockerfile = read("Dockerfile");
  const compose = read("docker-compose.yml");
  const env = read(".env.example");

  assert.match(dockerfile, /ARG NODE_IMAGE=public\.ecr\.aws\/docker\/library\/node:20-alpine/);
  assert.match(dockerfile, /FROM \$\{NODE_IMAGE\}/);
  assert.match(dockerfile, /COPY server\/ \.\/server\//);
  assert.match(dockerfile, /COPY dist\/ \.\/dist\//);
  assert.match(dockerfile, /EXPOSE 8080/);
  assert.match(dockerfile, /CMD \["node", "server\/server\.mjs"\]/);

  assert.match(compose, /"\$\{DEERRECALL_PORT:-8080\}:8080"/);
  assert.match(compose, /DEERRECALL_LLM_API_KEY: \$\{DEERRECALL_LLM_API_KEY:-\}/);
  assert.match(compose, /DEERRECALL_LLM_BASE_URL: \$\{DEERRECALL_LLM_BASE_URL:-https:\/\/api\.openai\.com\/v1\}/);
  assert.match(compose, /DEERRECALL_LLM_MODEL: \$\{DEERRECALL_LLM_MODEL:-\}/);

  assert.match(env, /DEERRECALL_LLM_API_KEY=/);
  assert.match(env, /DEERRECALL_LLM_BASE_URL=https:\/\/api\.openai\.com\/v1/);
  assert.match(env, /DEERRECALL_LLM_MODEL=/);
  assert.match(env, /DEERRECALL_LLM_TIMEOUT_MS=30000/);
});

test("Harness verifies Node health, static shell, cache headers, and AI status", () => {
  const pipeline = read(".harness/deerrecall-ci-cd.yaml");

  assert.match(pipeline, /npm run check/);
  assert.match(pipeline, /npm run verify:dist/);
  assert.match(pipeline, /docker build -t \$\{DEERRECALL_IMAGE:-deerrecall:local\} \./);
  assert.match(pipeline, /wget -qO- http:\/\/127\.0\.0\.1:8080\/health/);
  assert.match(pipeline, /wget -qO- http:\/\/127\.0\.0\.1:8080\/api\/ai\/status/);
  assert.match(pipeline, /configured/);
  assert.match(pipeline, /wget -qS --spider http:\/\/127\.0\.0\.1:8080\/deersearch-engine-runtime\.js/);
  assert.match(pipeline, /wget -qS --spider http:\/\/127\.0\.0\.1:8080\/motion\.js/);
  assert.match(pipeline, /wget -qS --spider http:\/\/127\.0\.0\.1:8080\/vendor\/gsap\.min\.js/);
  assert.match(pipeline, /wget -qS --spider http:\/\/127\.0\.0\.1:8080\/vendor\/Flip\.min\.js/);
  assert.match(pipeline, /cache-control: no-cache, must-revalidate/);
  assert.match(pipeline, /cache-control: no-store/);
});
