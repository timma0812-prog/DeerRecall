const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("main page contains finalized DeerSearch empty and results states", () => {
  const html = read("index.html");

  assert.match(html, /id="emptyState"/);
  assert.match(html, /id="resultsState"/);
  assert.match(html, /让小鹿帮你找人/);
  assert.match(html, /共找到 <strong>4<\/strong> 位候选人/);
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

  assert.match(js, /emptyState/);
  assert.match(js, /resultsState/);
  assert.match(js, /showResults/);
  assert.match(js, /shortlistCount/);
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

  assert.match(css, /\.resume-tab-panel/);
  assert.match(css, /\.resume-tab-panel\.is-active/);
  assert.match(css, /\.resume-timeline/);
  assert.match(css, /\.resume-source-grid/);

  assert.match(js, /const candidateResumePanels = document\.querySelectorAll\("\[data-candidate-resume-panel\]"\)/);
  assert.match(js, /function showCandidateResumePanel\(viewName = "summary"\)/);
  assert.match(js, /panel\.classList\.toggle\("is-active"/);
  assert.match(js, /panel\.classList\.toggle\("state-hidden"/);
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

test("project exposes npm scripts for Harness-compatible static delivery", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.check, "node --check app.js && npm test");
  assert.equal(pkg.scripts.test, "node --test tests/homepage-structure.test.js");
  assert.equal(pkg.scripts.clean, "rm -rf dist");
  assert.equal(pkg.scripts.build, "node scripts/build-static.mjs");
  assert.equal(pkg.scripts["verify:dist"], "node scripts/verify-dist.mjs");
  assert.equal(pkg.scripts.serve, "npx --yes http-server dist -p 8080");
});

test("static build script copies runtime assets and excludes development-only folders", () => {
  const script = read("scripts/build-static.mjs");

  assert.match(script, /const root = path\.resolve/);
  assert.match(script, /const dist = path\.join\(root, "dist"\)/);
  assert.match(script, /"index\.html"/);
  assert.match(script, /"app\.js"/);
  assert.match(script, /"styles\.css"/);
  assert.match(script, /path\.basename\(src\) !== "\.DS_Store"/);
  assert.doesNotMatch(script, /"demos"/);
  assert.doesNotMatch(script, /"finalized"/);
  assert.doesNotMatch(script, /"docs"/);
  assert.doesNotMatch(script, /"tests"/);
  assert.doesNotMatch(script, /"output"/);
});

test("static dist verification rejects missing or extra runtime assets", () => {
  const script = read("scripts/verify-dist.mjs");

  assert.match(script, /const expectedAssets = new Set/);
  assert.match(script, /"index\.html"/);
  assert.match(script, /"app\.js"/);
  assert.match(script, /"styles\.css"/);
  assert.match(script, /missingAssets/);
  assert.match(script, /extraAssets/);
  assert.match(script, /process\.exitCode = 1/);
});

test("docker runtime serves built dist assets with nginx", () => {
  const dockerfile = read("Dockerfile");
  const nginx = read("nginx.conf");

  assert.match(dockerfile, /ARG NGINX_IMAGE=nginx:1\.27-alpine/);
  assert.match(dockerfile, /FROM \$\{NGINX_IMAGE\}/);
  assert.match(dockerfile, /COPY nginx\.conf \/etc\/nginx\/conf\.d\/default\.conf/);
  assert.match(dockerfile, /COPY dist\/ \/usr\/share\/nginx\/html\//);
  assert.match(dockerfile, /EXPOSE 80/);

  assert.match(nginx, /listen 80/);
  assert.match(nginx, /try_files \$uri \$uri\/ \/index\.html/);
  assert.match(nginx, /location ~\* \\\.\(css\|js\)\$/);
  assert.match(nginx, /Cache-Control "no-cache, must-revalidate"/);
  assert.match(nginx, /Cache-Control "no-store"/);
  assert.doesNotMatch(nginx, /immutable/);
});

test("docker compose defines a single configurable DeerRecall service", () => {
  const compose = read("docker-compose.yml");
  const env = read(".env.example");

  assert.match(compose, /services:/);
  assert.match(compose, /deerrecall:/);
  assert.match(compose, /image: \$\{DEERRECALL_IMAGE:-deerrecall:local\}/);
  assert.match(compose, /container_name: \$\{DEERRECALL_CONTAINER:-deerrecall\}/);
  assert.match(compose, /"\$\{DEERRECALL_PORT:-8080\}:80"/);
  assert.match(compose, /restart: unless-stopped/);

  assert.match(env, /DEERRECALL_IMAGE=deerrecall:local/);
  assert.match(env, /DEERRECALL_PORT=8080/);
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
  assert.match(pipeline, /docker exec "\$\{APP_CONTAINER\}" wget -qO-/);
  assert.doesNotMatch(pipeline, /curlimages\/curl/);
  assert.match(pipeline, /grep -q "id=\\"resultsState\\""/);
  assert.match(pipeline, /grep -q "id=\\"candidateResumeState\\""/);
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
  assert.match(readme, /docker build -t deerrecall:local \./);
  assert.match(readme, /docker compose up -d/);
  assert.match(readme, /Harness Open Source/);
  assert.match(readme, /\/var\/run\/docker\.sock/);
  assert.match(readme, /DEERRECALL_PORT/);
  assert.match(readme, /docker compose logs --tail=100 deerrecall/);
  assert.match(readme, /Production Release Guardrails/);
  assert.match(readme, /Build artifacts exclude design references/);
  assert.match(readme, /Create a release tag/);
  assert.match(readme, /JS and CSS use `no-cache, must-revalidate`/);
});
