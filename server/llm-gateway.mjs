const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_DISCLAIMER = "薪资参考由 AI 基于简历信息估算，仅供招聘沟通参考，需结合实时市场与公司薪酬策略确认。";

function asText(value, fallback = "待确认") {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function asList(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
  return items.length ? items : fallback;
}

function asIdList(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item).trim()).filter(Boolean).slice(0, 30);
  return items.length ? items : fallback;
}

export function sanitizeCandidateForModel(candidate = {}) {
  return {
    id: asText(candidate.id, ""),
    name: asText(candidate.name, "候选人"),
    role: asText(candidate.role || candidate.shortRole || candidate.title),
    city: asText(candidate.city),
    years: candidate.years || "",
    source: asText(candidate.sourceName || candidate.source),
    company: asText(candidate.company),
    project: asText(candidate.project),
    experience: asText(candidate.experience),
    stack: asText(candidate.stack),
    tags: asList(candidate.tags, []),
    summary: asList(candidate.summary, []),
    matchEvidence: asList(
      (candidate.matchEvidence || []).map((item) => `${item.label || "证据"}：${item.level || "待确认"} ${item.score || ""}`),
      []
    ),
    recentExperience: candidate.recentExperience || null,
    keyProject: candidate.keyProject || null,
  };
}

export function buildMarketInsightMessages(candidate) {
  const sanitized = sanitizeCandidateForModel(candidate);
  return [
    {
      role: "system",
      content:
        "你是 DeerRecall 的招聘市场分析助手。你需要基于候选人简历信息估算市场画像和薪酬参考。当前 MVP 没有实时外部薪资数据源，也没有内部薪资基准库，所以不得声称引用了实时市场数据、招聘网站数据或公司内部薪酬数据。输出必须是合法 JSON，不要输出 Markdown。",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "生成候选人市场画像和薪酬参考，供 HR 和老板招聘沟通参考。",
          candidate: sanitized,
          output_schema: {
            market_position: "候选人市场定位",
            level: "层级判断",
            scarcity: "稀缺程度",
            monthly_salary_range: "模型估算月薪范围",
            annual_package_range: "模型估算年包范围",
            confidence: "高/中/低",
            salary_drivers: ["影响薪资的正向因素"],
            risk_factors: ["需要确认或可能压低报价的因素"],
            hr_suggestion: "HR 沟通建议",
            boss_summary: "给老板看的简短决策摘要",
            disclaimer: DEFAULT_DISCLAIMER,
          },
        },
        null,
        2
      ),
    },
  ];
}

function sanitizeSearchContext(history = []) {
  if (!Array.isArray(history)) return [];
  return history.slice(-2).map((item) => ({
    query: asText(item?.query, "").slice(0, 240),
    answer: asText(item?.answer, "").slice(0, 500),
    suggestions: asList(item?.suggestions, []).slice(0, 4),
  })).filter((item) => item.query || item.answer);
}

function sanitizeSearchCandidate(candidate = {}) {
  return {
    id: asText(candidate.id, ""),
    name: asText(candidate.name, "候选人"),
    role: asText(candidate.role || candidate.shortRole || candidate.title),
    city: asText(candidate.city),
    years: candidate.years || "",
    sourceName: asText(candidate.sourceName || candidate.source),
    resumeFileName: asText(candidate.resumeFileName, ""),
    tags: asList(candidate.tags, []),
    summary: asList(candidate.summary, []),
    matchNote: asText(candidate.matchNote, ""),
    localSearchScore: Number(candidate.localSearchScore || candidate.matchScore || 0),
  };
}

function sanitizeLocalSearchContext(localContext = null) {
  if (!localContext || typeof localContext !== "object") return null;
  const localCandidates = Array.isArray(localContext.local_candidates)
    ? localContext.local_candidates
    : localContext.candidates;
  return {
    mode: asText(localContext.mode, "ai_rerank"),
    query: asText(localContext.query, "").slice(0, 500),
    intent: {
      sourceKeyword: asText(localContext.intent?.sourceKeyword, ""),
      keywords: asList(localContext.intent?.keywords, []),
      asksForList: Boolean(localContext.intent?.asksForList),
    },
    local_candidates: (localCandidates || []).slice(0, 30).map(sanitizeSearchCandidate),
  };
}

export function buildSearchAssistantMessages(message, history = [], localContext = null) {
  const localSearchContext = sanitizeLocalSearchContext(localContext);
  return [
    {
      role: "system",
      content:
        "你是 DeerSearch 招聘搜索助手。你只围绕招聘搜索、候选人筛选、人才库查询和下一步筛选建议回答。优先基于 local_search_context.local_candidates 中的本地召回结果分析，不要编造不在本地召回列表里的候选人。可参考 recent_context 理解连续对话，但不要复述历史。输出合法 JSON，不要输出 Markdown。",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "解释用户搜索意图，并给出可执行的后续筛选建议。",
          user_message: String(message || "").slice(0, 1000),
          recent_context: sanitizeSearchContext(history),
          local_search_context: localSearchContext,
          output_schema: {
            ranked_ids: ["candidate id in best order"],
            answer: "一句到两句中文解释",
            suggestions: ["后续筛选建议 1", "后续筛选建议 2", "后续筛选建议 3"],
          },
        },
        null,
        2
      ),
    },
  ];
}

export function parseJsonObject(content) {
  const text = String(content || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(text);
}

export function normalizeMarketInsight(raw = {}) {
  return {
    market_position: asText(raw.market_position),
    level: asText(raw.level),
    scarcity: asText(raw.scarcity),
    monthly_salary_range: asText(raw.monthly_salary_range),
    annual_package_range: asText(raw.annual_package_range),
    confidence: asText(raw.confidence, "中等"),
    salary_drivers: asList(raw.salary_drivers, ["需要结合候选人项目深度、城市和实时市场数据确认。"]),
    risk_factors: asList(raw.risk_factors, ["需要结合面试和实时市场数据确认。"]),
    hr_suggestion: asText(raw.hr_suggestion, "建议先确认当前薪资、期望总包、奖金结构和到岗周期。"),
    boss_summary: asText(raw.boss_summary, "建议结合业务紧急度、面试结果和薪酬预算综合判断。"),
    disclaimer: asText(raw.disclaimer, DEFAULT_DISCLAIMER),
  };
}

export function normalizeSearchAssistant(raw = {}) {
  return {
    answer: asText(raw.answer, "我已理解你的搜索需求，可以继续补充岗位、城市、年限或行业条件来缩小范围。"),
    suggestions: asList(raw.suggestions, ["补充城市偏好", "补充经验年限", "说明必须具备的业务场景"]),
    ranked_ids: asIdList(raw.ranked_ids || raw.rankedIds, []),
  };
}

export function getLlmConfig(env = process.env) {
  const apiKey = env.DEERRECALL_LLM_API_KEY || "";
  const model = env.DEERRECALL_LLM_MODEL || "";
  const baseUrl = (env.DEERRECALL_LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const timeoutMs = Number.parseInt(env.DEERRECALL_LLM_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10);

  if (!apiKey) return { configured: false, reason: "missing_api_key", baseUrl, model, timeoutMs };
  if (!model) return { configured: false, reason: "missing_model", baseUrl, timeoutMs };

  return { configured: true, apiKey, baseUrl, model, timeoutMs };
}

export async function callLlmJson(messages, config, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const payload = {
    model: config.model,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  try {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const error = new Error(`LLM request failed with HTTP ${response.status}`);
      error.statusCode = response.status;
      error.detail = detail.slice(0, 500);
      throw error;
    }

    const data = await response.json();
    return parseJsonObject(data?.choices?.[0]?.message?.content || "{}");
  } finally {
    clearTimeout(timeout);
  }
}
