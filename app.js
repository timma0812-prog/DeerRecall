const emptyState = document.querySelector("#emptyState");
const resultsState = document.querySelector("#resultsState");
const importState = document.querySelector("#importState");
const taskState = document.querySelector("#taskState");
const talentState = document.querySelector("#talentState");
const talentSourceDetailState = document.querySelector("#talentSourceDetailState");
const talentDuplicateDetailState = document.querySelector("#talentDuplicateDetailState");
const talentPendingCompleteState = document.querySelector("#talentPendingCompleteState");
const importActionState = document.querySelector("#importActionState");
const talentAdvancedFilterState = document.querySelector("#talentAdvancedFilterState");
const talentCandidateActionsState = document.querySelector("#talentCandidateActionsState");
const settingsState = document.querySelector("#settingsState");
const candidateResumeState = document.querySelector("#candidateResumeState");
const exportCenterState = document.querySelector("#exportCenterState");
const shortlistState = document.querySelector("#shortlistState");
const tagManagerState = document.querySelector("#tagManagerState");
const taskFailureDetailState = document.querySelector("#taskFailureDetailState");
const searchFilterState = document.querySelector("#searchFilterState");
const emptySide = document.querySelector("#emptySide");
const resultsSide = document.querySelector("#resultsSide");
const emptySearchForm = document.querySelector("#emptySearchForm");
const refineSearchForm = document.querySelector("#refineSearchForm");
const emptySearchInput = document.querySelector("#emptySearchInput");
const refineSearchInput = document.querySelector("#refineSearchInput");
const userQuery = document.querySelector("#userQuery");
const currentQuery = document.querySelector("#currentQuery");
const shortlistCount = document.querySelector("#shortlistCount");
const shortlistText = document.querySelector("#shortlistText");
const selectedCandidates = new Set();
const navButtons = document.querySelectorAll("[data-nav-view]");
const importPanels = document.querySelectorAll("[data-import-state]");
const importSidePanels = document.querySelectorAll("[data-import-side]");
const importStateButtons = document.querySelectorAll("[data-target-state]");
const importOpenButtons = document.querySelectorAll("[data-import-open]");
const importActionCards = document.querySelectorAll("[data-import-action-card]");
const taskAssistantPanels = document.querySelectorAll("[data-task-panel]");
const taskFilterButtons = document.querySelectorAll("[data-task-filter]");
const taskPanelButtons = document.querySelectorAll("[data-task-panel-target]");
const taskRows = document.querySelectorAll("[data-task-item]");
const taskViews = document.querySelectorAll("[data-task-view]");
const taskOpenButtons = document.querySelectorAll("[data-task-open]");
const taskReturnButtons = document.querySelectorAll("[data-task-return]");
const taskResolveButtons = document.querySelectorAll("[data-task-resolve]");
const taskIssueList = document.querySelector("[data-task-issue-list]");
const taskDetailList = document.querySelector("[data-task-detail-list]");
const talentAssistantPanels = document.querySelectorAll("[data-talent-panel]");
const talentFilterButtons = document.querySelectorAll("[data-talent-filter]");
const talentPanelButtons = document.querySelectorAll("[data-talent-panel-target]");
const talentViews = document.querySelectorAll("[data-talent-view]");
const talentItems = document.querySelectorAll("[data-talent-item]");
const talentStars = document.querySelectorAll(".talent-star");
const talentOpenButtons = document.querySelectorAll("[data-talent-open]");
const talentDetailReturnButtons = document.querySelectorAll("[data-talent-detail-return]");
const talentDetailActionButtons = document.querySelectorAll("[data-talent-detail-action]");
const talentDetailAssistants = document.querySelectorAll(".talent-detail-assistant");
const p1Assistants = document.querySelectorAll(".p1-detail-assistant");
const p1ReturnButtons = document.querySelectorAll("[data-p1-return]");
const p1ActionButtons = document.querySelectorAll("[data-p1-action]");
const importActionRunButtons = document.querySelectorAll("[data-import-action-run]");
const p2Assistants = document.querySelectorAll(".p2-detail-assistant");
const p2ReturnButtons = document.querySelectorAll("[data-p2-return]");
const p2ActionButtons = document.querySelectorAll("[data-p2-action]");
const exportOpenButtons = document.querySelectorAll("[data-export-open]");
const exportScopeButtons = document.querySelectorAll("[data-export-scope-option]");
const shortlistOpenButtons = document.querySelectorAll("[data-shortlist-open]");
const tagOpenButtons = document.querySelectorAll("[data-tag-open]");
const taskFailureOpenButtons = document.querySelectorAll("[data-task-failure-open]");
const searchFilterOpenButtons = document.querySelectorAll("[data-search-filter-open]");
const candidateResumeAssistants = document.querySelectorAll(".candidate-resume-assistant");
const candidateResumeTabs = document.querySelectorAll("[data-candidate-resume-tab]");
const candidateResumePanels = document.querySelectorAll("[data-candidate-resume-panel]");
const candidateResumeReturnButtons = document.querySelectorAll("[data-candidate-resume-return]");
const resumeActionButtons = document.querySelectorAll("[data-resume-action]");
const searchCapabilityButtons = document.querySelectorAll("[data-search-capability]");
const searchCapabilityDetail = document.querySelector("[data-search-capability-detail]");
const searchTipsToggle = document.querySelector("[data-search-tips-toggle]");
const searchTipsGuide = document.querySelector("#searchTipsGuide");
const searchFilterBar = document.querySelector("[data-search-filter-bar]");
const searchFilterAddButton = document.querySelector("[data-search-filter-add]");
const searchCityToggle = document.querySelector("[data-search-city-toggle]");
const searchCityLabel = document.querySelector("[data-search-city-label]");
const searchSortToggle = document.querySelector("[data-search-sort-toggle]");
const searchSortLabel = document.querySelector("[data-search-sort-label]");
const searchResultCountLine = document.querySelector("[data-search-result-count]");
const searchCandidateGrid = document.querySelector(".candidate-grid");
const searchCandidateCards = Array.from(document.querySelectorAll(".candidate-grid [data-search-score]"));

const defaultQuery = "找做过支付风控的 Java 后端，最好有高并发项目经验。";
const searchCityOptions = ["城市不限", "上海", "杭州", "深圳", "北京"];
const searchSortOptions = [
  { label: "按匹配度排序", key: "score" },
  { label: "按经验年限排序", key: "years" },
];
const searchExtraFilters = [
  { id: "complete", label: "资料完整" },
  { id: "recent-import", label: "近 30 天导入" },
  { id: "exclude-duplicate", label: "排除疑似重复" },
];
const searchCapabilityCopy = {
  natural: {
    title: "自然语言搜人",
    text: "直接写岗位、技能、业务场景和限制条件，系统会把一句话拆成可执行的搜索条件。",
  },
  semantic: {
    title: "简历语义匹配",
    text: "不只匹配关键词，还会读取项目经历、职责描述和行业上下文，找出表达不同但能力相近的人选。",
  },
  shortlist: {
    title: "候选人短名单",
    text: "把当前认可的人选临时收集起来，后续可统一复制摘要、导出或继续做相似候选人搜索。",
  },
};
const talentFilters = new Set(["all", "recent", "saved", "pending", "duplicate"]);
const candidateRecords = {
  candidate_chenyu_001: {
    id: "candidate_chenyu_001",
    name: "陈屿",
    initial: "陈",
    title: "Java 后端开发工程师",
    city: "上海",
    years: 7,
    role: "Java 后端开发工程师 · 上海 · 7 年经验",
    shortRole: "Java 后端开发工程师 · 上海 · 7 年",
    score: 92,
    matchScore: 92,
    completeness: 92,
    source: "FinTech_Backend_2026",
    sourceName: "FinTech_Backend_2026",
    created: "今天 10:32",
    importedAt: "今天 10:32",
    file: "陈屿_Java后端工程师_7年.pdf",
    resumeFileName: "陈屿_Java后端工程师_7年.pdf",
    company: "某金融科技公司",
    project: "支付风控规则引擎",
    experience: "负责支付风控规则引擎、交易拦截服务和风险命中记录。",
    recentExperience: {
      company: "某金融科技公司",
      title: "高级后端工程师",
      period: "2022.06 - 至今",
      summary: "负责支付风控交易链路、规则引擎与风险命中记录服务。",
    },
    keyProject: {
      name: "支付风控规则引擎",
      summary: "参与规则配置、实时计算、交易拦截与风控日志模块，支撑高并发交易场景。",
    },
    stack: "Java / Spring Boot / Redis / Kafka / MySQL",
    matchNote: "与“支付风控 Java 后端”搜索条件匹配度较高。",
    tags: ["Java", "Spring Boot", "支付风控", "高并发", "金融科技"],
    summary: [
      "7 年 Java 后端经验，长期负责支付与风控相关系统，业务方向与当前搜索高度贴合。",
      "熟悉规则引擎、交易链路、Redis / Kafka / MySQL 等技术栈，有高并发处理经验。",
      "最近经历集中在金融科技场景，适合支付风控、交易平台、后端服务治理方向。",
    ],
    matchEvidence: [
      { label: "Java / Spring", level: "strong", score: 98 },
      { label: "支付风控经验", level: "strong", score: 94 },
      { label: "高并发项目", level: "strong", score: 88 },
      { label: "金融科技背景", level: "bonus", score: 76 },
    ],
    contacts: {
      phone: "138****5678",
      email: "chenyu@example.com",
      wechat: "chenyu_tech",
    },
  },
  "lin-xiaoran": {
    id: "lin-xiaoran",
    name: "林晓然",
    initial: "林",
    role: "高级 Java 开发工程师 · 杭州 · 6 年经验",
    shortRole: "高级 Java 开发工程师 · 杭州 · 6 年",
    score: 88,
    source: "客户A_后端简历包",
    created: "今天 09:48",
    file: "林晓然_后端架构师.docx",
    company: "客户A 金融支付团队",
    project: "风控服务拆分与性能优化",
    experience: "负责风控服务拆分、链路稳定性治理和交易高峰性能优化。",
    stack: "Java / Spring Cloud / Redis / Kafka",
    matchNote: "Java / 支付 / 微服务均命中",
    tags: ["Java", "Spring Cloud", "微服务", "Redis", "Kafka"],
    summary: [
      "6 年 Java 后端经验，熟悉金融支付和风控服务场景。",
      "负责风控服务拆分与性能优化，支撑高并发交易链路。",
      "Spring Cloud、Redis、Kafka 使用经验完整。",
      "资料有少量待补字段，适合沟通前快速确认邮箱与教育经历。",
    ],
  },
  "zhou-jing": {
    id: "zhou-jing",
    name: "周靖",
    initial: "周",
    role: "后端架构师 · 深圳 · 9 年经验",
    shortRole: "后端架构师 · 深圳 · 9 年",
    score: 84,
    source: "Java后端候选人_5月",
    created: "昨天 16:22",
    file: "周靖_后端架构师.pdf",
    company: "互联网金融平台",
    project: "支付风控平台架构升级",
    experience: "主导支付风控平台架构与服务治理，保障核心链路稳定性。",
    stack: "Java / 分布式架构 / MySQL / 性能优化",
    matchNote: "架构设计 / 高并发 / 风控平台匹配",
    tags: ["架构设计", "高并发", "分布式", "性能优化", "MySQL"],
    summary: [
      "9 年后端与架构经验，擅长平台治理和核心链路稳定性。",
      "主导过支付风控平台架构设计，适合偏技术治理角色。",
      "高并发、分布式、性能优化证据较完整。",
      "和当前搜索需求匹配，但岗位层级更偏架构方向。",
    ],
  },
  "xu-nan": {
    id: "xu-nan",
    name: "许南",
    initial: "许",
    role: "后端工程师 · 北京 · 5 年经验",
    shortRole: "后端工程师 · 北京 · 5 年",
    score: 81,
    source: "FinTech_Backend_2026",
    created: "昨天 11:05",
    file: "许南_后端工程师.pdf",
    company: "金融科技创业公司",
    project: "反欺诈与消息队列治理",
    experience: "参与反欺诈模块和消息队列治理，支持风控规则优化。",
    stack: "Java / Spring Boot / MySQL / Redis / Linux",
    matchNote: "Java / 风控 / Kafka 经验命中",
    tags: ["Java", "Spring Boot", "MySQL", "Redis", "Linux"],
    summary: [
      "5 年 Java 后端经验，有反欺诈模块和风控规则优化经历。",
      "熟悉 Spring Boot、MySQL、Redis 和 Linux 环境。",
      "高并发证据相对简洁，可作为备选候选人继续确认。",
      "当前档案存在疑似重复记录，建议先完成合并判断。",
    ],
  },
};
candidateRecords["chen-yu"] = candidateRecords.candidate_chenyu_001;
const taskRecords = {
  customer_backend_001: {
    id: "customer_backend_001",
    source: "客户A_后端简历包",
    importType: "文件夹导入",
    time: "今天 09:40",
    status: "partial_failed",
    total: 54,
    success: 42,
    failed: 8,
    unsupported: 4,
    skipped: 0,
    retryable: 5,
    newProfiles: 34,
    updatedProfiles: 8,
    files: [
      { id: "cb-01", name: "陈屿_Java后端工程师.pdf", info: "1.6 MB · PDF", ext: "PDF", status: "success", result: "已入库：陈屿" },
      { id: "cb-02", name: "李思_后端开发工程师.docx", info: "1.1 MB · DOCX", ext: "DOCX", status: "success", result: "已入库：李思" },
      { id: "cb-03", name: "张明_高级Java开发.pdf", info: "2.4 MB · PDF", ext: "PDF", status: "failed", reason: "扫描件不可读", suggestion: "转为清晰 PDF 后重试", retryable: true, selected: true },
      { id: "cb-04", name: "王晶_简历扫描件.pdf", info: "3.6 MB · PDF", ext: "PDF", status: "failed", reason: "扫描件不可读", suggestion: "使用更清晰的 PDF 或重新扫描", retryable: true, selected: true },
      { id: "cb-05", name: "赵敏_产品经理.pages", info: "1.8 MB · PAGES", ext: "PAGES", status: "unsupported", reason: "格式不支持", suggestion: "转为 PDF 或 DOCX 后重新导入", retryable: false, selected: true },
      { id: "cb-06", name: "陈晨_测试工程师.doc", info: "0 KB · DOC", ext: "DOC", status: "failed", reason: "内容为空", suggestion: "确认文件是否为空白或仅包含图片", retryable: true, selected: false },
    ],
  },
  campus_resume_001: {
    id: "campus_resume_001",
    source: "校招候选人_简历包",
    importType: "批量文件导入",
    time: "今天 08:15",
    status: "failed",
    total: 27,
    success: 16,
    failed: 6,
    unsupported: 5,
    skipped: 0,
    retryable: 4,
    newProfiles: 14,
    updatedProfiles: 2,
    files: [
      { id: "cr-01", name: "刘洋_后端实习生.pdf", info: "960 KB · PDF", ext: "PDF", status: "success", result: "已入库：刘洋" },
      { id: "cr-02", name: "周宁_算法工程师.pdf", info: "1.5 MB · PDF", ext: "PDF", status: "failed", reason: "文件损坏", suggestion: "定位原文件并替换后重试", retryable: false, selected: true },
      { id: "cr-03", name: "许然_Java开发.docx", info: "820 KB · DOCX", ext: "DOCX", status: "failed", reason: "内容为空", suggestion: "确认文件内容后重新解析", retryable: true, selected: true },
      { id: "cr-04", name: "李昊_前端工程师.pages", info: "1.2 MB · PAGES", ext: "PAGES", status: "unsupported", reason: "格式不支持", suggestion: "转为 PDF 或 DOCX 后重新导入", retryable: false, selected: true },
      { id: "cr-05", name: "王若_数据分析.pdf", info: "1.9 MB · PDF", ext: "PDF", status: "failed", reason: "扫描件不可读", suggestion: "替换为高清扫描件后重试", retryable: true, selected: false },
    ],
  },
  fintech_backend_2026: {
    id: "fintech_backend_2026",
    source: "FinTech_Backend_2026",
    importType: "文件夹导入",
    time: "今天 10:32",
    status: "processing",
    total: 126,
    success: 86,
    failed: 2,
    unsupported: 0,
    skipped: 0,
    retryable: 2,
    newProfiles: 72,
    updatedProfiles: 14,
    files: [
      { id: "fb-01", name: "张明_高级Java开发工程师.pdf", info: "2.4 MB · PDF", ext: "PDF", status: "success", result: "已入库：张明" },
      { id: "fb-02", name: "林晓然_后端架构师.docx", info: "1.4 MB · DOCX", ext: "DOCX", status: "success", result: "已入库：林晓然" },
      { id: "fb-03", name: "韩舟_支付风控.pdf", info: "2.1 MB · PDF", ext: "PDF", status: "failed", reason: "文件损坏", suggestion: "定位原文件并替换后重试", retryable: false, selected: true },
      { id: "fb-04", name: "许南_后端工程师.pdf", info: "1.8 MB · PDF", ext: "PDF", status: "failed", reason: "内容为空", suggestion: "确认文件内容后重新解析", retryable: true, selected: true },
    ],
  },
};
let currentImportState = "default";
let currentTaskPanel = "overview";
let currentTaskView = "list";
let selectedTaskId = null;
let currentView = "candidateResumeDetail";
let currentCandidateView = "summary";
let selectedCandidateId = null;
let candidateResumeEntry = "talent";
let resumeReturnContext = null;
let currentTalentPanel = "overview";
let currentTalentFilter = "all";
let currentTalentDetailView = null;
let currentImportAction = "searchImported";
let currentQueryId = "payment_risk_java_backend";
let currentExportScope = "candidateList";
let currentSearchCityIndex = 0;
let currentSearchSortIndex = 0;
let searchExtraFilterCursor = 0;
let p2ReturnContext = { view: "talents", talentFilter: "all", taskId: null, searchQuery: defaultQuery };

function hideCandidateResumeContext() {
  candidateResumeState.classList.add("state-hidden");
  candidateResumeAssistants.forEach((panel) => panel.classList.add("state-hidden"));
}

function hideTalentDetailViews() {
  talentDuplicateDetailState.classList.add("state-hidden");
  talentPendingCompleteState.classList.add("state-hidden");
  talentDetailAssistants.forEach((panel) => panel.classList.add("state-hidden"));
}

function hideP1Views() {
  talentSourceDetailState.classList.add("state-hidden");
  importActionState.classList.add("state-hidden");
  talentAdvancedFilterState.classList.add("state-hidden");
  talentCandidateActionsState.classList.add("state-hidden");
  settingsState.classList.add("state-hidden");
  p1Assistants.forEach((panel) => panel.classList.add("state-hidden"));
}

function hideP2Views() {
  exportCenterState.classList.add("state-hidden");
  shortlistState.classList.add("state-hidden");
  tagManagerState.classList.add("state-hidden");
  taskFailureDetailState.classList.add("state-hidden");
  searchFilterState.classList.add("state-hidden");
  p2Assistants.forEach((panel) => panel.classList.add("state-hidden"));
}

function hideAllAssistantContexts() {
  emptySide.classList.add("state-hidden");
  resultsSide.classList.add("state-hidden");
  importSidePanels.forEach((panel) => panel.classList.add("state-hidden"));
  taskAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  talentAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  talentDetailAssistants.forEach((panel) => panel.classList.add("state-hidden"));
  p1Assistants.forEach((panel) => panel.classList.add("state-hidden"));
  p2Assistants.forEach((panel) => panel.classList.add("state-hidden"));
  candidateResumeAssistants.forEach((panel) => panel.classList.add("state-hidden"));
}

function normalizeQuery(value) {
  const query = value.trim();
  if (!query) return defaultQuery;
  return /[。！？.!?]$/.test(query) ? query : `${query}。`;
}

function showSearchCapabilityDetail(type = "natural") {
  const copy = searchCapabilityCopy[type] || searchCapabilityCopy.natural;
  if (!searchCapabilityDetail) return;

  const title = document.createElement("strong");
  const text = document.createElement("span");
  title.textContent = copy.title;
  text.textContent = copy.text;
  searchCapabilityDetail.replaceChildren(title, text);

  searchCapabilityButtons.forEach((button) => {
    const isActive = button.dataset.searchCapability === type;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-expanded", String(isActive));
  });
}

function toggleSearchTips() {
  if (!searchTipsToggle || !searchTipsGuide) return;
  const shouldOpen = searchTipsGuide.classList.contains("state-hidden");
  searchTipsGuide.classList.toggle("state-hidden", !shouldOpen);
  searchTipsToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function getSearchFilterButtons() {
  if (!searchFilterBar) return [];
  return Array.from(searchFilterBar.querySelectorAll("[data-search-filter-chip]"));
}

function createSearchFilterChip(filter) {
  const button = document.createElement("button");
  button.className = "filter-chip";
  button.type = "button";
  button.dataset.searchFilterChip = filter.id;
  button.dataset.filterLabel = filter.label;
  button.setAttribute("aria-label", `移除筛选：${filter.label}`);
  button.innerHTML = `${filter.label} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
  return button;
}

function getNextSearchFilter() {
  const activeIds = new Set(getSearchFilterButtons().map((button) => button.dataset.searchFilterChip));
  for (let index = 0; index < searchExtraFilters.length; index += 1) {
    const filter = searchExtraFilters[(searchExtraFilterCursor + index) % searchExtraFilters.length];
    if (!activeIds.has(filter.id)) {
      searchExtraFilterCursor = (searchExtraFilterCursor + index + 1) % searchExtraFilters.length;
      return filter;
    }
  }
  return null;
}

function refreshSearchFilterAddState() {
  if (!searchFilterAddButton) return;
  const activeIds = new Set(getSearchFilterButtons().map((button) => button.dataset.searchFilterChip));
  const hasAvailableFilter = searchExtraFilters.some((filter) => !activeIds.has(filter.id));
  searchFilterAddButton.disabled = !hasAvailableFilter;
}

function removeSearchFilterChip(button) {
  const label = button?.dataset.filterLabel || button?.textContent?.trim() || "筛选条件";
  button?.remove();
  refreshSearchFilterAddState();
  showToast(`已移除筛选：${label}`);
}

function addSearchFilterChip() {
  const nextFilter = getNextSearchFilter();
  if (!nextFilter || !searchFilterAddButton) {
    refreshSearchFilterAddState();
    showToast("当前可添加的快速筛选已全部启用");
    return;
  }
  searchFilterAddButton.before(createSearchFilterChip(nextFilter));
  refreshSearchFilterAddState();
  showToast(`已添加筛选：${nextFilter.label}`);
}

function updateSearchResultCount(visibleCount) {
  if (!searchResultCountLine) return;
  searchResultCountLine.dataset.searchResultCount = String(visibleCount);
  const countNode = searchResultCountLine.querySelector("strong");
  if (countNode) countNode.textContent = String(visibleCount);
}

function applySearchResultFilters() {
  const city = searchCityOptions[currentSearchCityIndex] || searchCityOptions[0];
  let visibleCount = 0;

  searchCandidateCards.forEach((card) => {
    const cityMatched = city === "城市不限" || card.dataset.searchCity === city;
    card.hidden = !cityMatched;
    if (cityMatched) visibleCount += 1;
  });

  updateSearchResultCount(visibleCount);
}

function cycleSearchCity() {
  currentSearchCityIndex = (currentSearchCityIndex + 1) % searchCityOptions.length;
  const city = searchCityOptions[currentSearchCityIndex];
  if (searchCityLabel) searchCityLabel.textContent = city;
  applySearchResultFilters();
  showToast(city === "城市不限" ? "已显示全部城市候选人" : `已筛选城市：${city}`);
}

function sortSearchCandidates() {
  if (!searchCandidateGrid) return;
  const sortConfig = searchSortOptions[currentSearchSortIndex] || searchSortOptions[0];
  const sortedCards = [...searchCandidateCards].sort((a, b) => {
    const aValue = Number(a.dataset[`search${sortConfig.key[0].toUpperCase()}${sortConfig.key.slice(1)}`] || 0);
    const bValue = Number(b.dataset[`search${sortConfig.key[0].toUpperCase()}${sortConfig.key.slice(1)}`] || 0);
    if (bValue !== aValue) return bValue - aValue;
    return Number(a.dataset.searchIndex || 0) - Number(b.dataset.searchIndex || 0);
  });
  sortedCards.forEach((card) => searchCandidateGrid.append(card));
}

function cycleSearchSort() {
  currentSearchSortIndex = (currentSearchSortIndex + 1) % searchSortOptions.length;
  const sortConfig = searchSortOptions[currentSearchSortIndex];
  if (searchSortLabel) searchSortLabel.textContent = sortConfig.label;
  sortSearchCandidates();
  applySearchResultFilters();
  showToast(`已切换为${sortConfig.label}`);
}

function showResults(queryText = defaultQuery) {
  const normalizedQuery = normalizeQuery(queryText);
  currentView = "searchResults";
  currentQueryId = "payment_risk_java_backend";

  emptyState.classList.add("state-hidden");
  importState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  emptySide.classList.add("state-hidden");
  importSidePanels.forEach((panel) => panel.classList.add("state-hidden"));
  taskAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  talentAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  candidateResumeAssistants.forEach((panel) => panel.classList.add("state-hidden"));
  resultsState.classList.remove("state-hidden");
  resultsSide.classList.remove("state-hidden");
  setActiveNav("search");

  userQuery.textContent = normalizedQuery;
  currentQuery.textContent = normalizedQuery;
  refineSearchInput.value = "只看 5 年以上、近期在金融科技公司的候选人";
  sortSearchCandidates();
  applySearchResultFilters();
  refreshSearchFilterAddState();
}

function setActiveNav(view) {
  navButtons.forEach((button) => {
    const isActive = button.dataset.navView === view;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function showSearch() {
  currentView = "search";
  importState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  resultsState.classList.add("state-hidden");
  resultsSide.classList.add("state-hidden");
  importSidePanels.forEach((panel) => panel.classList.add("state-hidden"));
  taskAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  talentAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  candidateResumeAssistants.forEach((panel) => panel.classList.add("state-hidden"));
  emptyState.classList.remove("state-hidden");
  emptySide.classList.remove("state-hidden");
  setActiveNav("search");
}

function showImportState(nextState = currentImportState) {
  currentView = "import";
  currentImportState = nextState;
  emptyState.classList.add("state-hidden");
  resultsState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  emptySide.classList.add("state-hidden");
  resultsSide.classList.add("state-hidden");
  taskAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  talentAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  candidateResumeAssistants.forEach((panel) => panel.classList.add("state-hidden"));
  importState.classList.remove("state-hidden");

  importPanels.forEach((panel) => {
    panel.classList.toggle("state-hidden", panel.dataset.importState !== nextState);
  });
  importSidePanels.forEach((panel) => {
    panel.classList.toggle("state-hidden", panel.dataset.importSide !== nextState);
  });
  setActiveNav("import");
}

function getTaskRecord(taskId = selectedTaskId) {
  return taskRecords[taskId] || taskRecords.customer_backend_001;
}

function getTaskStats(task) {
  const issueFiles = task.files.filter((file) => file.status === "failed" || file.status === "unsupported");
  const selectedIssues = issueFiles.filter((file) => file.selected).length;
  const selectedRetryable = issueFiles.filter((file) => file.selected && file.retryable).length;
  const successRate = task.total > 0 ? `${((task.success / task.total) * 100).toFixed(1)}%` : "0%";

  return {
    total: task.total,
    success: task.success,
    failed: task.failed,
    unsupported: task.unsupported,
    skipped: task.skipped,
    retryable: task.retryable,
    pendingIssues: task.failed + task.unsupported,
    selectedIssues,
    selectedRetryable,
    newProfiles: task.newProfiles,
    updatedProfiles: task.updatedProfiles,
    successRate,
  };
}

function updateTaskText(task) {
  document.querySelectorAll("[data-task-text]").forEach((node) => {
    const key = node.dataset.taskText;
    if (key === "issueSelection") return;
    node.textContent = task[key] || "";
  });
  document.querySelectorAll('[data-task-panel="detail"] [data-task-open]').forEach((button) => {
    button.dataset.taskId = task.id;
  });
}

function updateTaskMetrics(task) {
  const stats = getTaskStats(task);
  document.querySelectorAll("[data-task-metric]").forEach((node) => {
    const key = node.dataset.taskMetric;
    if (Object.prototype.hasOwnProperty.call(stats, key)) {
      node.textContent = stats[key];
    }
  });

  document.querySelectorAll("[data-task-progress]").forEach((node) => {
    node.style.width = stats.successRate;
  });

  const issueSelection = document.querySelector('[data-task-text="issueSelection"]');
  if (issueSelection) {
    issueSelection.textContent = `已选择 ${stats.selectedIssues} 个文件，其中可直接重试 ${stats.selectedRetryable} 个`;
  }
}

function getStatusLabel(status) {
  if (status === "success") return "成功";
  if (status === "failed") return "失败";
  if (status === "unsupported") return "格式不支持";
  if (status === "ignored") return "已忽略";
  return "解析中";
}

function getTaskCandidateId(file) {
  if (file.candidateId) return file.candidateId;
  const matchedCandidate = Object.values(candidateRecords).find((candidate) => {
    return file.name.includes(candidate.name) || file.result?.includes(candidate.name);
  });
  return matchedCandidate?.id || "candidate_chenyu_001";
}

function renderTaskIssueList(task) {
  if (!taskIssueList) return;
  const issueFiles = task.files.filter((file) => file.status === "failed" || file.status === "unsupported");
  taskIssueList.innerHTML = issueFiles
    .map(
      (file) => `
        <article class="task-file-row" data-task-file-id="${file.id}">
          <span><input type="checkbox" ${file.selected ? "checked" : ""} aria-label="选择 ${file.name}" /></span>
          <span class="task-file-name"><em>${file.ext}</em><strong>${file.name}</strong><small>${file.info}</small></span>
          <span><mark class="${file.status === "unsupported" ? "warning" : "danger"}">${file.reason}</mark></span>
          <span>${file.suggestion}</span>
          <span class="task-row-actions">
            <button type="button">定位文件</button>
            <button type="button" data-task-failure-open="file" data-task-file-id="${file.id}">详情</button>
            <button type="button" data-task-file-resolve="${file.retryable ? "retry" : "replace"}" data-task-file-id="${file.id}">${file.retryable ? "尝试解析" : "替换文件"}</button>
            <button type="button" data-task-file-resolve="ignore" data-task-file-id="${file.id}">忽略</button>
          </span>
        </article>
      `
    )
    .join("");
}

function renderTaskDetailList(task) {
  if (!taskDetailList) return;
  taskDetailList.innerHTML = task.files
    .map(
      (file) => `
        <article class="task-file-row" data-task-file-id="${file.id}">
          <span class="task-file-name"><em>${file.ext}</em><strong>${file.name}</strong></span>
          <span>${file.info}</span>
          <span><mark class="${file.status}">${getStatusLabel(file.status)}</mark></span>
          <span>${file.result || file.reason || "等待解析"}</span>
          <span class="task-row-actions">
            ${
              file.status === "success"
                ? `<button class="candidate-resume-open" type="button" data-candidate-id="${getTaskCandidateId(file)}" data-candidate-resume-entry="task" data-task-id="${task.id}">查看候选人</button>`
                : `<button type="button" data-task-open="issue" data-task-id="${task.id}">查看问题</button>`
            }
          </span>
        </article>
      `
    )
    .join("");
}

function refreshTaskRows(task) {
  const stats = getTaskStats(task);
  const row = document.querySelector(`[data-task-item][data-task-id="${task.id}"]`);
  if (!row) return;

  row.dataset.taskKind = stats.pendingIssues === 0 ? "completed" : row.dataset.taskKind;
  const badge = row.querySelector(".task-badge");
  if (badge && stats.pendingIssues === 0) badge.textContent = "已完成";

  const statValues = row.querySelectorAll(".task-stats strong");
  if (statValues.length >= 3) {
    statValues[0].textContent = stats.success;
    statValues[1].textContent = stats.failed;
    statValues[2].textContent = stats.unsupported;
  }
}

function renderSelectedTask() {
  if (!selectedTaskId) return;
  const task = getTaskRecord(selectedTaskId);
  updateTaskText(task);
  updateTaskMetrics(task);
  renderTaskIssueList(task);
  renderTaskDetailList(task);
  refreshTaskRows(task);
}

function showTaskPanel(panelName = currentTaskPanel) {
  currentTaskPanel = panelName;
  taskAssistantPanels.forEach((panel) => {
    panel.classList.toggle("state-hidden", panel.dataset.taskPanel !== panelName);
  });
}

function showTaskView(viewName = currentTaskView) {
  currentTaskView = viewName;
  taskViews.forEach((view) => {
    view.classList.toggle("state-hidden", view.dataset.taskView !== viewName);
  });
}

function showTaskState(panelName = currentTaskPanel) {
  currentView = "tasks";
  emptyState.classList.add("state-hidden");
  resultsState.classList.add("state-hidden");
  importState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  emptySide.classList.add("state-hidden");
  resultsSide.classList.add("state-hidden");
  importSidePanels.forEach((panel) => panel.classList.add("state-hidden"));
  talentAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  candidateResumeAssistants.forEach((panel) => panel.classList.add("state-hidden"));
  taskState.classList.remove("state-hidden");
  showTaskView(currentTaskView);
  showTaskPanel(panelName);
  setActiveNav("tasks");
}

function setTaskFilter(filter) {
  currentTaskView = "list";
  selectedTaskId = null;
  showTaskView("list");
  taskState.dataset.filter = filter;
  taskFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.taskFilter === filter);
  });

  if (filter === "all") {
    showTaskPanel("overview");
    taskRows.forEach((taskRow) => taskRow.classList.remove("is-selected"));
    return;
  }

  const row = document.querySelector(`[data-task-item][data-task-kind="${filter === "needs" ? "needs" : filter}"]`);
  if (row) {
    selectTaskRow(row);
    showTaskPanel(filter === "needs" ? "overview" : row.dataset.taskPanelTarget || "overview");
  }
}

function selectTaskRow(row) {
  if (!row) return;
  taskRows.forEach((taskRow) => taskRow.classList.toggle("is-selected", taskRow === row));
}

function selectTaskById(taskId) {
  const row = document.querySelector(`[data-task-item][data-task-id="${taskId}"]`);
  selectTaskRow(row);
}

function openTaskIssue(taskId) {
  selectedTaskId = taskId;
  currentTaskView = "issue";
  currentTaskPanel = "issue";
  selectTaskById(taskId);
  renderSelectedTask();
  showTaskState("issue");
}

function openTaskDetail(taskId) {
  selectedTaskId = taskId;
  currentTaskView = "detail";
  currentTaskPanel = "detail";
  selectTaskById(taskId);
  renderSelectedTask();
  showTaskState("detail");
}

function returnTaskList() {
  currentTaskView = "list";
  currentTaskPanel = "overview";
  selectedTaskId = null;
  taskRows.forEach((taskRow) => taskRow.classList.remove("is-selected"));
  showTaskState("overview");
}

function returnTaskDetail() {
  if (!selectedTaskId) {
    returnTaskList();
    return;
  }
  openTaskDetail(selectedTaskId);
}

function resolveTaskFiles(action, fileId) {
  if (!selectedTaskId) return;
  const task = getTaskRecord(selectedTaskId);
  const issueFiles = task.files.filter((file) => file.status === "failed" || file.status === "unsupported");
  const filesToResolve = fileId ? task.files.filter((file) => file.id === fileId) : issueFiles.filter((file) => file.selected);

  filesToResolve.forEach((file) => {
    const wasFailed = file.status === "failed";
    const wasUnsupported = file.status === "unsupported";

    if (action === "ignore" || action === "ignoreSelected") {
      file.status = "ignored";
      file.result = "已忽略";
      file.selected = false;
      if (wasFailed) task.failed = Math.max(0, task.failed - 1);
      if (wasUnsupported) task.unsupported = Math.max(0, task.unsupported - 1);
      if (file.retryable) task.retryable = Math.max(0, task.retryable - 1);
      task.skipped += 1;
      return;
    }

    if (file.retryable || action === "replace") {
      file.status = "success";
      file.result = `已入库：${file.name.split("_")[0]}`;
      file.selected = false;
      if (wasFailed) task.failed = Math.max(0, task.failed - 1);
      if (wasUnsupported) task.unsupported = Math.max(0, task.unsupported - 1);
      if (file.retryable) task.retryable = Math.max(0, task.retryable - 1);
      task.success += 1;
    }
  });

  const stats = getTaskStats(task);
  if (stats.pendingIssues === 0) task.status = "completed";
  renderSelectedTask();
}

function showTalentPanel(panelName = currentTalentPanel) {
  currentTalentPanel = panelName;
  talentAssistantPanels.forEach((panel) => {
    panel.classList.toggle("state-hidden", panel.dataset.talentPanel !== panelName);
  });
}

function setTalentFilter(filter) {
  currentTalentFilter = filter;
  talentState.dataset.filter = filter;
  talentFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.talentFilter === filter);
  });
  talentViews.forEach((view) => {
    view.classList.toggle("state-hidden", view.dataset.talentView !== filter);
  });

  const panelName = filter === "all" ? "overview" : filter;
  showTalentPanel(panelName);
  const firstItem = document.querySelector(`[data-talent-view="${filter}"] [data-talent-item]`);
  selectTalentItem(firstItem);
}

function showTalentState(filter = currentTalentFilter) {
  currentView = "talents";
  emptyState.classList.add("state-hidden");
  resultsState.classList.add("state-hidden");
  importState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  emptySide.classList.add("state-hidden");
  resultsSide.classList.add("state-hidden");
  importSidePanels.forEach((panel) => panel.classList.add("state-hidden"));
  taskAssistantPanels.forEach((panel) => panel.classList.add("state-hidden"));
  candidateResumeAssistants.forEach((panel) => panel.classList.add("state-hidden"));
  talentState.classList.remove("state-hidden");
  setTalentFilter(filter);
  setActiveNav("talents");
}

function showTalentDetailShell(detailView) {
  currentTalentDetailView = detailView;
  emptyState.classList.add("state-hidden");
  resultsState.classList.add("state-hidden");
  importState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideAllAssistantContexts();
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  setActiveNav("talents");
}

function openTalentDuplicateDetail() {
  currentView = "talentDuplicateDetail";
  currentTalentFilter = "duplicate";
  currentTalentPanel = "duplicate";
  showTalentDetailShell("duplicate");
  talentDuplicateDetailState.classList.remove("state-hidden");
  document.querySelector('[data-talent-detail-assistant="duplicate"]').classList.remove("state-hidden");
}

function openTalentPendingComplete() {
  currentView = "talentPendingComplete";
  currentTalentFilter = "pending";
  currentTalentPanel = "pending";
  showTalentDetailShell("pending");
  talentPendingCompleteState.classList.remove("state-hidden");
  document.querySelector('[data-talent-detail-assistant="pending"]').classList.remove("state-hidden");
}

function closeTalentDetail() {
  const returnFilter = currentTalentDetailView === "duplicate" ? "duplicate" : "pending";
  currentTalentDetailView = null;
  hideTalentDetailViews();
  showTalentState(returnFilter);
  showTalentPanel(returnFilter);
}

function showP1Shell(activeNav) {
  emptyState.classList.add("state-hidden");
  resultsState.classList.add("state-hidden");
  importState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideAllAssistantContexts();
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  setActiveNav(activeNav);
}

function showP1Assistant(name) {
  const panel = document.querySelector(`[data-p1-assistant="${name}"]`);
  if (panel) panel.classList.remove("state-hidden");
}

function openTalentSourceDetail() {
  currentView = "talentSourceDetail";
  currentTalentFilter = "recent";
  currentTalentPanel = "recent";
  showP1Shell("talents");
  talentSourceDetailState.classList.remove("state-hidden");
  showP1Assistant("source");
}

function updateImportAction(action) {
  currentImportAction = action || "searchImported";
  const titles = {
    searchImported: "新导入候选人搜索",
    dedupeImported: "智能去重与合并",
    tagImported: "标签与分组",
    ruleImported: "更新解析规则",
  };
  const copies = {
    searchImported: "从新导入批次直接生成搜索条件，确认候选人是否能被准确召回。",
    dedupeImported: "聚焦本批次疑似重复记录，先合并高相似候选人再进入沟通。",
    tagImported: "为新导入候选人补齐技能、来源和业务方向标签。",
    ruleImported: "根据失败文件和低置信字段，更新下一次导入的解析规则。",
  };
  document.querySelectorAll("[data-import-action-title]").forEach((node) => {
    node.textContent = titles[currentImportAction] || titles.searchImported;
  });
  document.querySelectorAll("[data-import-action-copy]").forEach((node) => {
    node.textContent = copies[currentImportAction] || copies.searchImported;
  });
  importActionCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.importActionCard === currentImportAction);
  });
}

function openImportAction(action = "searchImported") {
  currentView = "importAction";
  currentImportState = "finished";
  updateImportAction(action);
  showP1Shell("import");
  importActionState.classList.remove("state-hidden");
  showP1Assistant("importAction");
}

function openTalentAdvancedFilter() {
  currentView = "talentAdvancedFilter";
  showP1Shell("talents");
  talentAdvancedFilterState.classList.remove("state-hidden");
  showP1Assistant("filter");
}

function openTalentCandidateActions() {
  currentView = "talentCandidateActions";
  selectedCandidateId = selectedCandidateId || "candidate_chenyu_001";
  showP1Shell("talents");
  talentCandidateActionsState.classList.remove("state-hidden");
  showP1Assistant("candidateActions");
}

function showSettingsState() {
  currentView = "settings";
  showP1Shell("settings");
  settingsState.classList.remove("state-hidden");
  showP1Assistant("settings");
}

function closeP1View(target) {
  hideP1Views();
  if (target === "importFinished") {
    showImportState("finished");
    return;
  }
  if (target === "talentRecent") {
    showTalentState("recent");
    return;
  }
  showTalentState(currentTalentFilter || "all");
}

function handleP1Action(action) {
  if (action === "exportCandidate") {
    openExportCenter("candidateList", { activeNav: "talents" });
    return;
  }
  const labels = {
    applyFilter: "已应用高级筛选",
    ignoreCandidate: "已记录忽略候选人操作",
    deleteCandidate: "删除候选人需要二次确认",
    saveSettings: "设置已保存",
  };
  showToast(labels[action] || "操作已记录");
}

function handleImportActionRun(action) {
  if (action === "search") {
    showResults("只看 FinTech_Backend_2026 本次新增的 Java 后端候选人。");
    showToast("已打开新导入候选人搜索");
    return;
  }
  if (action === "tags") {
    openTagManager("imported", { activeNav: "import" });
    return;
  }
  if (action === "rules") {
    showToast("解析规则草稿已保存");
  }
}

function getActiveNav() {
  return document.querySelector("[data-nav-view].active")?.dataset.navView || "talents";
}

function captureP2ReturnContext(overrides = {}) {
  return {
    view: currentView,
    importState: currentImportState,
    importAction: currentImportAction,
    taskView: currentTaskView,
    taskPanel: currentTaskPanel,
    taskId: selectedTaskId,
    talentFilter: currentTalentFilter,
    talentPanel: currentTalentPanel,
    candidateId: selectedCandidateId,
    candidateEntry: candidateResumeEntry,
    searchQuery: currentQuery?.textContent || defaultQuery,
    activeNav: getActiveNav(),
    ...overrides,
  };
}

function showP2Assistant(name) {
  const panel = document.querySelector(`[data-p2-assistant="${name}"]`);
  if (panel) panel.classList.remove("state-hidden");
}

function showP2Shell(activeNav = "talents", assistantName = "export", returnContext = {}) {
  p2ReturnContext = returnContext;
  emptyState.classList.add("state-hidden");
  resultsState.classList.add("state-hidden");
  importState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  candidateResumeState.classList.add("state-hidden");
  hideAllAssistantContexts();
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  setActiveNav(activeNav);
  showP2Assistant(assistantName);
}

function updateExportCenter(scope = "candidateList") {
  currentExportScope = scope;
  const exportMeta = {
    candidateList: {
      title: "候选人列表",
      count: "428",
      description: "确认导出范围、字段和文件格式，生成可发给业务方的候选人列表。",
    },
    sourceList: {
      title: "来源批次",
      count: "126",
      description: "导出当前来源批次的入库结果、质量状态和候选人摘要。",
    },
    savedList: {
      title: "收藏候选人",
      count: "18",
      description: "导出已收藏候选人，适合给业务方或面试官做初筛沟通。",
    },
    pendingList: {
      title: "待完善资料",
      count: "41",
      description: "导出待完善资料清单，方便集中补全联系方式与经历字段。",
    },
    failedList: {
      title: "失败文件",
      count: "12",
      description: "导出解析失败和格式不支持文件，用于人工替换、转换和重试。",
    },
  };
  const meta = exportMeta[scope] || exportMeta.candidateList;
  document.querySelectorAll("[data-export-title]").forEach((node) => {
    node.textContent = meta.title;
  });
  document.querySelectorAll("[data-export-count]").forEach((node) => {
    node.textContent = meta.count;
  });
  document.querySelectorAll("[data-export-description]").forEach((node) => {
    node.textContent = meta.description;
  });
  exportScopeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.exportScopeOption === scope);
  });
}

function openExportCenter(scope = "candidateList", options = {}) {
  const returnContext = captureP2ReturnContext(options.returnContext || {});
  const activeNav = options.activeNav || returnContext.activeNav || (scope === "failedList" ? "tasks" : "talents");
  currentView = "exportCenter";
  updateExportCenter(scope);
  showP2Shell(activeNav, "export", returnContext);
  exportCenterState.classList.remove("state-hidden");
}

function openShortlistManager(source = "manager", options = {}) {
  const returnContext = captureP2ReturnContext(options.returnContext || {});
  currentView = "shortlistManager";
  showP2Shell(options.activeNav || returnContext.activeNav || "talents", "shortlist", returnContext);
  shortlistState.dataset.shortlistSource = source;
  refreshShortlistManager();
  shortlistState.classList.remove("state-hidden");
}

function openTagManager(source = "candidate", options = {}) {
  const returnContext = captureP2ReturnContext(options.returnContext || {});
  currentView = "tagManager";
  showP2Shell(options.activeNav || returnContext.activeNav || "talents", "tags", returnContext);
  tagManagerState.dataset.tagSource = source;
  tagManagerState.classList.remove("state-hidden");
}

function openTaskFailureDetail(fileId = "file", options = {}) {
  const returnContext = captureP2ReturnContext(options.returnContext || {});
  selectedTaskId = options.taskId || selectedTaskId || "customer_backend_001";
  currentView = "taskFailureDetail";
  currentTaskView = "issue";
  currentTaskPanel = "issue";
  renderSelectedTask();
  showP2Shell("tasks", "failure", returnContext);
  taskFailureDetailState.dataset.taskFileId = fileId;
  taskFailureDetailState.classList.remove("state-hidden");
}

function openSearchFilter(mode = "advanced", options = {}) {
  const returnContext = captureP2ReturnContext(options.returnContext || {});
  currentView = "searchFilter";
  showP2Shell("search", "searchFilter", returnContext);
  searchFilterState.dataset.searchFilterMode = mode;
  searchFilterState.classList.remove("state-hidden");
}

function setP2ActionStatus(scope, message, tone = "success") {
  const statusSelectors = {
    export: '[data-p2-action-status="export"]',
    shortlist: '[data-p2-action-status="shortlist"]',
    tag: "[data-tag-action-status]",
    failure: "[data-failure-action-status]",
    searchFilter: "[data-search-filter-status]",
  };
  const selector = statusSelectors[scope] || `[data-p2-action-status="${scope}"]`;
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = message;
    node.classList.remove("is-success", "is-warning");
    if (tone) node.classList.add(`is-${tone}`);
  });
}

function refreshShortlistManager() {
  const visibleCards = shortlistState.querySelectorAll("[data-shortlist-card]:not(.is-removed)");
  const total = Math.max(selectedCandidates.size, visibleCards.length);
  document.querySelectorAll("[data-shortlist-total]").forEach((node) => {
    node.textContent = total;
  });
  if (visibleCards.length === 0) {
    setP2ActionStatus("shortlist", "短名单已清空，可返回候选人页重新加入", "warning");
  }
}

function applySuggestedTag(triggerButton) {
  const tokenBox = document.querySelector("[data-tag-token-box]");
  const tagValue = triggerButton?.dataset.tagValue || triggerButton?.closest(".p2-suggestion-list p")?.querySelector("strong")?.textContent?.trim();
  if (!tokenBox || !tagValue) {
    setP2ActionStatus("tag", "未找到可应用的标签建议", "warning");
    showToast("未找到可应用的标签建议");
    return;
  }

  const exists = Array.from(tokenBox.querySelectorAll("span")).some((token) => token.textContent.trim() === tagValue);
  if (!exists) {
    const token = document.createElement("span");
    token.className = "is-added";
    token.textContent = tagValue;
    tokenBox.append(token);
  }

  if (triggerButton) {
    triggerButton.textContent = exists ? "已存在" : "已应用";
    triggerButton.disabled = true;
  }
  setP2ActionStatus("tag", exists ? `${tagValue} 已在当前标签中` : `${tagValue} 已加入当前标签`);
  showToast(exists ? "标签已存在" : "标签建议已应用");
}

function closeP2View() {
  const context = p2ReturnContext || {};
  hideP2Views();
  if (context.view === "candidateResumeDetail" && context.candidateId) {
    openCandidateResume(context.candidateId, { entry: context.candidateEntry || "talent" });
    return;
  }
  if (context.view === "search" || context.activeNav === "search") {
    if (context.view === "search") showSearch();
    else showResults(context.searchQuery || defaultQuery);
    return;
  }
  if (context.activeNav === "import" || context.view === "import" || context.view === "importAction") {
    if (context.view === "importAction") openImportAction(context.importAction || currentImportAction);
    else showImportState(context.importState || currentImportState);
    return;
  }
  if (context.activeNav === "tasks" || context.view === "tasks") {
    selectedTaskId = context.taskId || selectedTaskId;
    currentTaskView = context.taskView || currentTaskView;
    currentTaskPanel = context.taskPanel || currentTaskPanel;
    if (currentTaskView === "issue" && selectedTaskId) openTaskIssue(selectedTaskId);
    else if (currentTaskView === "detail" && selectedTaskId) openTaskDetail(selectedTaskId);
    else showTaskState(currentTaskPanel || "overview");
    return;
  }
  showTalentState(context.talentFilter || currentTalentFilter || "all");
  showTalentPanel(context.talentPanel || currentTalentPanel || "overview");
}

function handleP2Action(action, triggerButton = null) {
  const labels = {
    exportNow: "导出文件已生成",
    copyShortlist: "短名单已复制",
    removeShortlist: "已从短名单移除",
    applyTag: "标签建议已应用",
    saveTags: "标签已保存",
    batchTags: "标签已批量应用",
    replaceFile: "替换文件入口已预留",
    locateFile: "已定位原文件",
    applySearchFilter: "筛选条件已应用",
    saveSearch: "搜索条件已保存",
  };
  if (action === "exportNow") {
    setP2ActionStatus("export", "已生成 XLSX 文件，可在导出历史中查看");
  }
  if (action === "copyShortlist") {
    copyText("支付风控 Java 后端短名单：陈屿、林晓然、周靖", labels.copyShortlist);
    setP2ActionStatus("shortlist", "短名单内容已复制，可直接发给业务方");
    return;
  }
  if (action === "removeShortlist") {
    const card = triggerButton?.closest("[data-shortlist-card]");
    const name = card?.dataset.shortlistName || "候选人";
    card?.classList.add("is-removed");
    card?.setAttribute("aria-hidden", "true");
    refreshShortlistManager();
    setP2ActionStatus("shortlist", `${name} 已从当前短名单移除`);
  }
  if (action === "applyTag") {
    applySuggestedTag(triggerButton);
    return;
  }
  if (action === "saveTags") {
    setP2ActionStatus("tag", "当前候选人标签已保存");
  }
  if (action === "batchTags") {
    setP2ActionStatus("tag", "AI 标签建议已批量应用到本批候选人");
  }
  if (action === "replaceFile") {
    setP2ActionStatus("failure", "替换文件入口已预留，等待选择新文件", "warning");
  }
  if (action === "locateFile") {
    setP2ActionStatus("failure", "已定位到原文件所在批次");
  }
  if (action === "applySearchFilter") {
    setP2ActionStatus("searchFilter", "筛选条件已应用，正在返回搜索结果");
    showResults("找做过支付风控的 Java 后端，5 年以上，资料完整，优先上海 / 杭州 / 深圳。");
  }
  if (action === "saveSearch") {
    setP2ActionStatus("searchFilter", "搜索条件已保存，可在 DeerSearch 中复用");
  }
  showToast(labels[action] || "操作已记录");
}

function handleTalentOpenAction(action) {
  if (action === "sourceDetail") openTalentSourceDetail();
  if (action === "advancedFilter") openTalentAdvancedFilter();
  if (action === "candidateActions") openTalentCandidateActions();
  if (action === "duplicateDetail") openTalentDuplicateDetail();
  if (action === "pendingComplete") openTalentPendingComplete();
}

function handleTalentDetailAction(action) {
  const labels = {
    merge: "已按推荐策略合并简历",
    newer: "已选择保留较新版本",
    separate: "已分别保留该重复组",
    apply: "已应用 AI 补全建议",
    check: "已标记为待人工确认",
    save: "补全信息已保存",
    parse: "已加入重新解析队列",
  };
  showToast(labels[action] || "操作已记录");
}

function selectTalentItem(item) {
  if (!item) return;
  talentItems.forEach((talentItem) => talentItem.classList.toggle("is-selected", talentItem === item));
}

function updateShortlist() {
  shortlistCount.textContent = selectedCandidates.size;
  shortlistText.textContent =
    selectedCandidates.size === 0
      ? "点击候选人卡片后，小鹿会把短名单收在这里。"
      : Array.from(selectedCandidates).join("、");
}

function getCandidateRecord(candidateId = selectedCandidateId) {
  return candidateRecords[candidateId] || candidateRecords.candidate_chenyu_001;
}

function normalizeCandidateResumeEntry(entry = "talent") {
  if (entry === "talents") return "talent";
  if (entry === "tasks") return "task";
  return entry;
}

function getResumeReturnContext(entry, options = {}) {
  const context = { ...options, entry };
  if (entry === "search") {
    context.queryId = context.queryId || currentQueryId;
    context.searchQuery = context.searchQuery || currentQuery?.textContent || defaultQuery;
  }
  if (entry === "talent") {
    context.talentFilter = context.talentFilter || currentTalentFilter;
    context.talentPanel = context.talentPanel || currentTalentPanel;
  }
  if (entry === "task") {
    context.taskId = context.taskId || selectedTaskId;
  }
  return context;
}

function setResumeEntryVisibility(entry) {
  document.querySelectorAll("[data-resume-entry-only]").forEach((node) => {
    node.classList.toggle("state-hidden", node.dataset.resumeEntryOnly !== entry);
  });
}

function updateCandidateResume(candidate) {
  const title = candidate.title || candidate.shortRole?.split(" · ")[0] || candidate.role?.split(" · ")[0] || "";
  const city = candidate.city || candidate.shortRole?.split(" · ")[1] || "";
  const years = candidate.years || Number.parseInt(candidate.shortRole?.match(/(\d+)\s*年/)?.[1] || "", 10) || "";
  const role = candidate.role || `${title} · ${city} · ${years} 年经验`;
  const shortRole = candidate.shortRole || `${title} · ${city} · ${years} 年`;
  const score = candidate.matchScore || candidate.score || 0;
  const completeness = candidate.completeness || score;
  const source = candidate.sourceName || candidate.source || "";
  const importedAt = candidate.importedAt || candidate.created || "";
  const file = candidate.resumeFileName || candidate.file || "";
  const recentExperience = candidate.recentExperience || {
    company: candidate.company || "最近公司",
    title: "高级后端工程师",
    period: "最近经历",
    summary: candidate.experience || "",
  };
  const keyProject = candidate.keyProject || {
    name: candidate.project || "核心项目",
    summary: `技术栈：${candidate.stack || "待补充"}`,
  };
  const contacts = candidate.contacts || {
    phone: "138****5678",
    email: "chenyu@example.com",
    wechat: "待确认",
  };
  const evidence = candidate.matchEvidence || [
    { label: "Java / Spring", level: "strong", score: score },
    { label: "支付风控经验", level: "strong", score: Math.max(score - 4, 0) },
    { label: "高并发项目", level: "strong", score: Math.max(score - 8, 0) },
    { label: "金融科技背景", level: "bonus", score: Math.max(score - 16, 0) },
  ];

  document.querySelectorAll("[data-candidate-name]").forEach((node) => {
    node.textContent = candidate.name;
  });
  document.querySelectorAll("[data-candidate-initial]").forEach((node) => {
    node.textContent = candidate.initial || candidate.name.slice(0, 1);
  });
  document.querySelectorAll("[data-candidate-role]").forEach((node) => {
    node.textContent = role;
  });
  document.querySelectorAll("[data-candidate-short-role]").forEach((node) => {
    node.textContent = shortRole;
  });
  document.querySelectorAll("[data-candidate-score]").forEach((node) => {
    node.textContent = score;
  });
  document.querySelectorAll("[data-candidate-completeness]").forEach((node) => {
    node.textContent = `${completeness}%`;
  });
  document.querySelectorAll("[data-candidate-source]").forEach((node) => {
    node.textContent = source;
  });
  document.querySelectorAll("[data-candidate-created]").forEach((node) => {
    node.textContent = importedAt;
  });
  document.querySelectorAll("[data-candidate-file]").forEach((node) => {
    node.textContent = file;
  });
  document.querySelectorAll("[data-candidate-company]").forEach((node) => {
    node.textContent = `${recentExperience.company} · ${recentExperience.title}`;
  });
  document.querySelectorAll("[data-candidate-project]").forEach((node) => {
    node.textContent = keyProject.name;
  });
  document.querySelectorAll("[data-candidate-project-summary]").forEach((node) => {
    node.textContent = keyProject.summary;
  });
  document.querySelectorAll("[data-candidate-experience]").forEach((node) => {
    node.textContent = `${recentExperience.period}。${recentExperience.summary}`;
  });
  document.querySelectorAll("[data-candidate-stack]").forEach((node) => {
    node.textContent = candidate.stack;
  });
  document.querySelectorAll("[data-candidate-match-note]").forEach((node) => {
    node.textContent = candidate.matchNote;
  });
  document.querySelectorAll("[data-candidate-tags]").forEach((node) => {
    node.innerHTML = candidate.tags.map((tag) => `<span>${tag}</span>`).join("");
  });
  document.querySelectorAll("[data-candidate-summary]").forEach((node) => {
    node.innerHTML = candidate.summary.map((item) => `<li>${item}</li>`).join("");
  });
  document.querySelectorAll("[data-candidate-evidence]").forEach((node) => {
    node.innerHTML = `
      <h3>匹配证据</h3>
      ${evidence
        .map(
          (item) =>
            `<p style="--score: ${item.score}%"><span>${item.label}</span><i></i><strong>${item.level === "bonus" ? "加分" : "强"}</strong></p>`
        )
        .join("")}
    `;
  });
  document.querySelectorAll("[data-candidate-phone]").forEach((node) => {
    node.textContent = contacts.phone || "待补充";
  });
  document.querySelectorAll("[data-candidate-email]").forEach((node) => {
    node.textContent = contacts.email || "待补充";
  });
  document.querySelectorAll("[data-candidate-wechat]").forEach((node) => {
    node.textContent = contacts.wechat || "待补充";
  });
}

function showCandidateResumePanel(viewName = "summary") {
  currentCandidateView = viewName;
  candidateResumeTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.candidateResumeView === viewName);
  });
  candidateResumePanels.forEach((panel) => {
    const isActive = panel.dataset.candidateResumePanel === viewName;
    panel.classList.toggle("is-active", isActive);
    panel.classList.toggle("state-hidden", !isActive);
  });
}

function showToast(message) {
  const toast = document.querySelector("#appToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1600);
}

function copyText(text, message) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  showToast(message);
}

function openCandidateResume(candidateId, options = {}) {
  const entry = normalizeCandidateResumeEntry(options.entry || "talent");
  const candidate = getCandidateRecord(candidateId);
  currentView = "candidateResumeDetail";
  currentCandidateView = "summary";
  selectedCandidateId = candidate.id;
  candidateResumeEntry = entry;
  resumeReturnContext = getResumeReturnContext(entry, options);

  emptyState.classList.add("state-hidden");
  resultsState.classList.add("state-hidden");
  importState.classList.add("state-hidden");
  taskState.classList.add("state-hidden");
  talentState.classList.add("state-hidden");
  hideTalentDetailViews();
  hideP1Views();
  hideP2Views();
  hideAllAssistantContexts();

  candidateResumeState.dataset.candidateResumeEntry = entry;
  candidateResumeState.classList.remove("state-hidden");
  candidateResumeAssistants.forEach((panel) => {
    panel.classList.toggle("state-hidden", panel.dataset.candidateResumeEntry !== entry);
  });
  showCandidateResumePanel("summary");
  setResumeEntryVisibility(entry);
  const activeNav = {
    search: "search",
    talent: "talents",
    task: "tasks",
  }[entry];
  setActiveNav(activeNav);
  updateCandidateResume(candidate);
}

function closeCandidateResume() {
  const entry = candidateResumeEntry;
  const context = resumeReturnContext || {};
  hideCandidateResumeContext();
  if (entry === "search") {
    currentView = "searchResults";
    showResults(context.searchQuery || defaultQuery);
    return;
  }
  if (entry === "talent") {
    currentView = "talents";
    currentTalentFilter = context.talentFilter || currentTalentFilter;
    showTalentState(currentTalentFilter);
    showTalentPanel(context.talentPanel || currentTalentPanel);
    return;
  }
  if (entry === "task") {
    currentView = "tasks";
    currentTaskView = "detail";
    selectedTaskId = context.taskId || selectedTaskId;
    returnTaskDetail();
  }
}

function handleResumeAction(action) {
  const candidate = getCandidateRecord();
  if (action === "shortlist") {
    selectedCandidates.add(candidate.name);
    updateShortlist();
    openShortlistManager("manager", { returnContext: { view: currentView, candidateId: candidate.id, candidateEntry: candidateResumeEntry } });
    showToast(`${candidate.name} 已加入短名单`);
    return;
  }
  if (action === "copySummary" || action === "copyParse") {
    copyText(`${candidate.name}：${candidate.summary.join(" ")}`, action === "copyParse" ? "解析文本已复制" : "候选人摘要已复制");
    return;
  }
  if (action === "favorite") {
    showToast(`${candidate.name} 已收藏`);
    return;
  }
  if (action === "finder" || action === "openFile") {
    showToast("本地文件操作已模拟");
    return;
  }
  if (action === "edit") {
    openTagManager("candidate", { returnContext: { view: currentView, candidateId: candidate.id, candidateEntry: candidateResumeEntry } });
    return;
  }
  if (action === "addTag") {
    openTagManager("candidate", { returnContext: { view: currentView, candidateId: candidate.id, candidateEntry: candidateResumeEntry } });
    return;
  }
  if (action === "similar") {
    const role = candidate.title || candidate.shortRole || "后端候选人";
    const similarQuery = `查找与${candidate.name}相似的 ${role}，重点关注支付风控、高并发和金融科技背景`;
    openSearchFilter("similar", { returnContext: { view: currentView, candidateId: candidate.id, candidateEntry: candidateResumeEntry } });
    refineSearchInput.value = similarQuery;
    showToast("已生成相似候选人条件");
  }
}

function getCandidateResumeOpenOptions(button) {
  const entry = normalizeCandidateResumeEntry(button.dataset.candidateResumeEntry || "talent");
  const options = { entry };
  if (entry === "search") options.queryId = currentQueryId;
  if (entry === "talent") options.talentFilter = currentTalentFilter;
  if (entry === "task") options.taskId = button.dataset.taskId || selectedTaskId;
  return options;
}

emptySearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showResults(emptySearchInput.value);
});

refineSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showResults(refineSearchInput.value);
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    emptySearchInput.value = button.dataset.prompt;
    showResults(button.dataset.prompt);
  });
});

searchCapabilityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showSearchCapabilityDetail(button.dataset.searchCapability || "natural");
  });
});

searchTipsToggle?.addEventListener("click", toggleSearchTips);

searchFilterBar?.addEventListener("click", (event) => {
  const filterChip = event.target.closest("[data-search-filter-chip]");
  if (filterChip) {
    removeSearchFilterChip(filterChip);
    return;
  }

  if (event.target.closest("[data-search-filter-add]")) {
    addSearchFilterChip();
  }
});

searchCityToggle?.addEventListener("click", cycleSearchCity);
searchSortToggle?.addEventListener("click", cycleSearchSort);

document.querySelectorAll(".shortlist-action").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.name;
    if (selectedCandidates.has(name)) {
      selectedCandidates.delete(name);
      button.classList.remove("is-selected");
    } else {
      selectedCandidates.add(name);
      button.classList.add("is-selected");
    }
    updateShortlist();
  });
});

document.querySelectorAll(".candidate-resume-open").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openCandidateResume(button.dataset.candidateId, getCandidateResumeOpenOptions(button));
  });
});

navButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    if (button.dataset.navView === "import") {
      showImportState(currentImportState);
      return;
    }
    if (button.dataset.navView === "tasks") {
      showTaskState(currentTaskPanel);
      return;
    }
    if (button.dataset.navView === "talents") {
      showTalentState(currentTalentFilter);
      return;
    }
    if (button.dataset.navView === "settings") {
      showSettingsState();
      return;
    }
    showSearch();
  });
});

importStateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showImportState(button.dataset.targetState);
  });
});

importOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openImportAction(button.dataset.importOpen);
  });
});

taskFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showTaskState("overview");
    setTaskFilter(button.dataset.taskFilter);
  });
});

taskRows.forEach((row) => {
  row.addEventListener("click", () => {
    selectTaskRow(row);
    selectedTaskId = row.dataset.taskId || null;
    currentTaskView = "list";
    if (selectedTaskId) renderSelectedTask();
    showTaskState(row.dataset.taskPanelTarget || "overview");
  });
});

taskPanelButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const row = button.closest("[data-task-item]");
    if (row) {
      selectTaskRow(row);
      selectedTaskId = row.dataset.taskId || selectedTaskId;
      renderSelectedTask();
    }
    currentTaskView = "list";
    showTaskState(button.dataset.taskPanelTarget);
  });
});

taskOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const row = button.closest("[data-task-item]");
    const taskId = button.dataset.taskId || row?.dataset.taskId || selectedTaskId;
    if (!taskId) return;
    if (button.dataset.taskOpen === "issue") {
      openTaskIssue(taskId);
      return;
    }
    if (button.dataset.taskOpen === "detail") {
      openTaskDetail(taskId);
    }
  });
});

taskReturnButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.dataset.taskReturn === "list") {
      returnTaskList();
      return;
    }
    if (button.dataset.taskReturn === "detail") {
      returnTaskDetail();
    }
  });
});

taskResolveButtons.forEach((button) => {
  button.addEventListener("click", () => {
    resolveTaskFiles(button.dataset.taskResolve);
    if (button.closest("#taskFailureDetailState")) {
      setP2ActionStatus("failure", "已加入重新解析队列");
    }
  });
});

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-task-open]");
  if (openButton && !Array.from(taskOpenButtons).includes(openButton)) {
    event.stopPropagation();
    const taskId = openButton.dataset.taskId || selectedTaskId;
    if (openButton.dataset.taskOpen === "issue") openTaskIssue(taskId);
    if (openButton.dataset.taskOpen === "detail") openTaskDetail(taskId);
    return;
  }

  const button = event.target.closest("[data-task-file-resolve]");
  if (!button) return;
  event.stopPropagation();
  resolveTaskFiles(button.dataset.taskFileResolve, button.dataset.taskFileId);
  if (button.closest("#taskFailureDetailState")) {
    setP2ActionStatus("failure", "已加入重新解析队列");
  }
});

talentFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTalentFilter(button.dataset.talentFilter);
  });
});

talentItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    if (event.target.closest(".candidate-resume-open")) return;
    if (event.target.closest("[data-talent-open]")) return;
    selectTalentItem(item);
    showTalentPanel(item.dataset.talentPanelTarget || currentTalentPanel);
  });
});

talentPanelButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const target = button.dataset.talentPanelTarget;
    if (talentFilters.has(target)) {
      setTalentFilter(target);
      return;
    }
    showTalentPanel(target || currentTalentPanel);
  });
});

talentStars.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    button.classList.toggle("is-on");
    button.textContent = button.classList.contains("is-on") ? "★" : "☆";
  });
});

talentOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handleTalentOpenAction(button.dataset.talentOpen);
  });
});

talentDetailReturnButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    closeTalentDetail();
  });
});

talentDetailActionButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handleTalentDetailAction(button.dataset.talentDetailAction);
  });
});

p1ReturnButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    closeP1View(button.dataset.p1Return);
  });
});

p1ActionButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handleP1Action(button.dataset.p1Action);
  });
});

importActionRunButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handleImportActionRun(button.dataset.importActionRun);
  });
});

p2ReturnButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    closeP2View();
  });
});

p2ActionButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handleP2Action(button.dataset.p2Action, button);
  });
});

exportOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openExportCenter(button.dataset.exportOpen);
  });
});

exportScopeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateExportCenter(button.dataset.exportScopeOption);
  });
});

shortlistOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openShortlistManager(button.dataset.shortlistOpen);
  });
});

tagOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openTagManager(button.dataset.tagOpen);
  });
});

taskFailureOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openTaskFailureDetail(button.dataset.taskFileId || button.dataset.taskFailureOpen);
  });
});

searchFilterOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openSearchFilter(button.dataset.searchFilterOpen);
  });
});

candidateResumeTabs.forEach((button) => {
  button.addEventListener("click", () => {
    showCandidateResumePanel(button.dataset.candidateResumeView || "summary");
  });
});

candidateResumeReturnButtons.forEach((button) => {
  button.addEventListener("click", closeCandidateResume);
});

resumeActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleResumeAction(button.dataset.resumeAction);
  });
});

document.addEventListener("click", (event) => {
  const resumeButton = event.target.closest(".candidate-resume-open");
  if (!resumeButton) return;
  event.stopPropagation();
  openCandidateResume(resumeButton.dataset.candidateId, getCandidateResumeOpenOptions(resumeButton));
});

document.addEventListener("click", (event) => {
  const talentOpenButton = event.target.closest("[data-talent-open]");
  if (talentOpenButton) {
    event.stopPropagation();
    handleTalentOpenAction(talentOpenButton.dataset.talentOpen);
    return;
  }

  const returnButton = event.target.closest("[data-talent-detail-return]");
  if (returnButton) {
    event.stopPropagation();
    closeTalentDetail();
    return;
  }

  const actionButton = event.target.closest("[data-talent-detail-action]");
  if (!actionButton) return;
  event.stopPropagation();
  handleTalentDetailAction(actionButton.dataset.talentDetailAction);
});

document.addEventListener("click", (event) => {
  const importOpenButton = event.target.closest("[data-import-open]");
  if (importOpenButton) {
    event.stopPropagation();
    openImportAction(importOpenButton.dataset.importOpen);
    return;
  }

  const returnButton = event.target.closest("[data-p1-return]");
  if (returnButton) {
    event.stopPropagation();
    closeP1View(returnButton.dataset.p1Return);
    return;
  }

  const p1ActionButton = event.target.closest("[data-p1-action]");
  if (p1ActionButton) {
    event.stopPropagation();
    handleP1Action(p1ActionButton.dataset.p1Action);
    return;
  }

  const importRunButton = event.target.closest("[data-import-action-run]");
  if (!importRunButton) return;
  event.stopPropagation();
  handleImportActionRun(importRunButton.dataset.importActionRun);
});

document.addEventListener("click", (event) => {
  const exportOpenButton = event.target.closest("[data-export-open]");
  if (exportOpenButton) {
    event.stopPropagation();
    openExportCenter(exportOpenButton.dataset.exportOpen);
    return;
  }

  const shortlistOpenButton = event.target.closest("[data-shortlist-open]");
  if (shortlistOpenButton) {
    event.stopPropagation();
    openShortlistManager(shortlistOpenButton.dataset.shortlistOpen);
    return;
  }

  const tagOpenButton = event.target.closest("[data-tag-open]");
  if (tagOpenButton) {
    event.stopPropagation();
    openTagManager(tagOpenButton.dataset.tagOpen);
    return;
  }

  const taskFailureOpenButton = event.target.closest("[data-task-failure-open]");
  if (taskFailureOpenButton) {
    event.stopPropagation();
    openTaskFailureDetail(taskFailureOpenButton.dataset.taskFileId || taskFailureOpenButton.dataset.taskFailureOpen);
    return;
  }

  const searchFilterOpenButton = event.target.closest("[data-search-filter-open]");
  if (searchFilterOpenButton) {
    event.stopPropagation();
    openSearchFilter(searchFilterOpenButton.dataset.searchFilterOpen);
    return;
  }

  const p2ReturnButton = event.target.closest("[data-p2-return]");
  if (p2ReturnButton) {
    event.stopPropagation();
    closeP2View();
    return;
  }

  const p2ActionButton = event.target.closest("[data-p2-action]");
  if (!p2ActionButton) return;
  event.stopPropagation();
  handleP2Action(p2ActionButton.dataset.p2Action, p2ActionButton);
});

document.querySelectorAll("[data-nav-view-proxy]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.navViewProxy === "import") showImportState(currentImportState);
  });
});

updateShortlist();
showSearchCapabilityDetail("natural");
refreshSearchFilterAddState();
sortSearchCandidates();
applySearchResultFilters();
setTaskFilter("all");
setTalentFilter("all");
showTalentState("all");
