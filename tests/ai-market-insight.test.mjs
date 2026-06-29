import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMarketInsightMessages,
  buildSearchAssistantMessages,
  getLlmConfig,
  normalizeMarketInsight,
  normalizeSearchAssistant,
  parseJsonObject,
  sanitizeCandidateForModel,
} from "../server/llm-gateway.mjs";

const candidate = {
  id: "candidate_chenyu_001",
  name: "陈屿",
  role: "Java 后端开发工程师 · 上海 · 7 年经验",
  city: "上海",
  years: 7,
  stack: "Java / Spring Boot / Redis / Kafka / MySQL",
  tags: ["Java", "Spring Boot", "支付风控", "高并发", "金融科技"],
  summary: ["7 年 Java 后端经验", "负责支付风控规则引擎"],
  matchEvidence: [{ label: "支付风控经验", level: "strong", score: 94 }],
  keyProject: { name: "支付风控规则引擎", summary: "支撑高并发交易场景" },
  contacts: {
    phone: "13800000000",
    email: "chenyu@example.com",
    wechat: "chenyu_tech",
  },
};

test("sanitizeCandidateForModel removes contact details and keeps market signals", () => {
  const sanitized = sanitizeCandidateForModel(candidate);

  assert.equal(sanitized.name, "陈屿");
  assert.equal(sanitized.city, "上海");
  assert.deepEqual(sanitized.tags, ["Java", "Spring Boot", "支付风控", "高并发", "金融科技"]);
  assert.equal(sanitized.contacts, undefined);
  assert.equal(JSON.stringify(sanitized).includes("13800000000"), false);
  assert.equal(JSON.stringify(sanitized).includes("chenyu@example.com"), false);
  assert.equal(JSON.stringify(sanitized).includes("chenyu_tech"), false);
});

test("buildMarketInsightMessages states the MVP has no real-time market feed", () => {
  const messages = buildMarketInsightMessages(candidate);
  const text = messages.map((message) => message.content).join("\n");

  assert.match(text, /没有实时外部薪资数据源/);
  assert.match(text, /仅供招聘沟通参考/);
  assert.match(text, /monthly_salary_range/);
  assert.match(text, /annual_package_range/);
  assert.match(text, /boss_summary/);
  assert.doesNotMatch(text, /chenyu@example\.com/);
});

test("parseJsonObject parses plain JSON and fenced JSON", () => {
  assert.deepEqual(parseJsonObject('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJsonObject('```json\n{"b":2}\n```'), { b: 2 });
});

test("normalizeMarketInsight fills required safe defaults", () => {
  const normalized = normalizeMarketInsight({
    market_position: "中高级 Java 后端",
    salary_drivers: ["支付风控"],
  });

  assert.equal(normalized.market_position, "中高级 Java 后端");
  assert.equal(normalized.level, "待确认");
  assert.equal(normalized.scarcity, "待确认");
  assert.equal(normalized.monthly_salary_range, "待确认");
  assert.deepEqual(normalized.salary_drivers, ["支付风控"]);
  assert.deepEqual(normalized.risk_factors, ["需要结合面试和实时市场数据确认。"]);
  assert.match(normalized.disclaimer, /仅供招聘沟通参考/);
});

test("normalizeSearchAssistant fills assistant defaults", () => {
  const normalized = normalizeSearchAssistant({ answer: "建议先看支付风控经验。" });

  assert.equal(normalized.answer, "建议先看支付风控经验。");
  assert.deepEqual(normalized.suggestions, ["补充城市偏好", "补充经验年限", "说明必须具备的业务场景"]);
});

test("getLlmConfig reports missing backend configuration without exposing secrets", () => {
  const missing = getLlmConfig({});
  assert.equal(missing.configured, false);
  assert.equal(missing.reason, "missing_api_key");
  assert.equal(missing.apiKey, undefined);

  const configured = getLlmConfig({
    DEERRECALL_LLM_API_KEY: "secret-key",
    DEERRECALL_LLM_MODEL: "model-name",
    DEERRECALL_LLM_BASE_URL: "https://example.com/v1",
  });
  assert.equal(configured.configured, true);
  assert.equal(configured.apiKey, "secret-key");
  assert.equal(configured.model, "model-name");
  assert.equal(configured.baseUrl, "https://example.com/v1");
});

test("buildSearchAssistantMessages keeps DeerSearch scoped to recruiting search", () => {
  const messages = buildSearchAssistantMessages("找支付风控 Java 后端");
  const text = messages.map((message) => message.content).join("\n");

  assert.match(text, /DeerSearch/);
  assert.match(text, /招聘/);
  assert.match(text, /suggestions/);
});

test("buildSearchAssistantMessages includes recent DeerSearch context without overexposing history", () => {
  const messages = buildSearchAssistantMessages("继续看上海候选人", [
    {
      query: "找支付风控 Java 后端",
      answer: "优先看支付风控和高并发经验。",
      suggestions: ["只看上海", "补充年限"],
    },
    {
      query: "市场上做 Java 的人薪资水平",
      answer: "建议结合城市和年限确认。",
      suggestions: ["限定城市", "限定年限"],
    },
    {
      query: "只看杭州",
      answer: "已缩小到杭州候选人。",
      suggestions: ["看 5 年以上"],
    },
  ]);
  const payload = JSON.parse(messages[1].content);

  assert.equal(payload.user_message, "继续看上海候选人");
  assert.equal(payload.recent_context.length, 2);
  assert.equal(payload.recent_context[0].query, "市场上做 Java 的人薪资水平");
  assert.equal(payload.recent_context[1].query, "只看杭州");
  assert.doesNotMatch(messages[1].content, /找支付风控 Java 后端/);
});

test("buildSearchAssistantMessages includes sanitized local recall context for AI search", () => {
  const messages = buildSearchAssistantMessages(
    "找产品实习生文件夹里的简历",
    [],
    {
      mode: "ai_rerank",
      query: "找产品实习生文件夹里的简历",
      intent: { sourceKeyword: "产品实习生", asksForList: true },
      local_candidates: [
        {
          id: "candidate_product_001",
          name: "陈小鹿",
          role: "产品实习生 · 北京",
          sourceName: "产品实习生",
          resumeFileName: "陈小鹿_产品实习生.pdf",
          tags: ["产品", "PRD"],
          summary: ["用户访谈和 PRD 撰写"],
          localSearchScore: 91,
          resumeText: "完整简历正文不应发给搜索助手",
          contacts: { phone: "13800000000", email: "candidate@example.com" },
        },
      ],
    }
  );
  const payload = JSON.parse(messages[1].content);
  const text = messages.map((message) => message.content).join("\n");

  assert.equal(payload.local_search_context.mode, "ai_rerank");
  assert.equal(payload.local_search_context.local_candidates.length, 1);
  assert.equal(payload.local_search_context.local_candidates[0].id, "candidate_product_001");
  assert.equal(payload.local_search_context.local_candidates[0].resumeText, undefined);
  assert.equal(payload.local_search_context.local_candidates[0].contacts, undefined);
  assert.deepEqual(payload.output_schema.ranked_ids, ["candidate id in best order"]);
  assert.doesNotMatch(text, /13800000000|candidate@example\.com|完整简历正文/);
});
