const test = require("node:test");
const assert = require("node:assert/strict");
const DeerRecallSearch = require("../deersearch-engine-runtime.js");

const candidates = [
  {
    id: "candidate_chenyu_001",
    name: "陈屿",
    title: "Java 后端开发工程师",
    city: "上海",
    years: 7,
    sourceName: "FinTech_Backend_2026",
    resumeFileName: "陈屿_Java后端.pdf",
    tags: ["Java", "支付风控", "高并发", "金融科技"],
    summary: ["参与支付风控规则引擎建设，负责高并发交易链路。"],
    resumeText: "Spring Boot Redis Kafka 分布式 支付风控",
  },
  {
    id: "candidate_product_001",
    name: "林青",
    title: "产品经理",
    city: "杭州",
    years: 4,
    sourceName: "Product_PM_2026",
    tags: ["PRD", "用户访谈"],
    summary: ["负责中后台产品规划。"],
  },
];

test("searchLocalCandidates ranks matching local candidates and builds chips", () => {
  const result = DeerRecallSearch.searchLocalCandidates("找支付风控 Java 后端 高并发", candidates);

  assert.equal(result.engine, "local");
  assert.equal(result.total, 1);
  assert.equal(result.candidates[0].id, "candidate_chenyu_001");
  assert.ok(result.candidates[0].localSearchScore >= 70);
  assert.match(result.assistant.answer, /本地搜索模式/);
  assert.ok(result.chips.some((chip) => chip.label.includes("Java")));
});

test("searchLocalCandidates tolerates natural-language seniority and city preferences", () => {
  const result = DeerRecallSearch.searchLocalCandidates("找做过支付风控的 Java 后端，5 年以上，优先上海 / 杭州 / 深圳。", candidates);

  assert.equal(result.total, 1);
  assert.equal(result.candidates[0].id, "candidate_chenyu_001");
  assert.ok(result.candidates[0].localSearchScore >= 70);
});

test("searchLocalCandidates returns an actionable empty state", () => {
  const result = DeerRecallSearch.searchLocalCandidates("算法 推荐系统", candidates);

  assert.equal(result.total, 0);
  assert.equal(result.candidates.length, 0);
  assert.match(result.emptyMessage, /没有找到匹配/);
  assert.ok(result.assistant.suggestions.length > 0);
});

test("AI rerank payload and result preserve local candidates", () => {
  const localResult = DeerRecallSearch.searchLocalCandidates("Java 支付风控", candidates);
  const payload = DeerRecallSearch.buildAiRerankPayload("Java 支付风控", localResult);

  assert.equal(payload.query, "Java 支付风控");
  assert.equal(payload.local_candidates[0].id, "candidate_chenyu_001");

  const reranked = DeerRecallSearch.applyAiRerankResult(localResult, {
    ranked_ids: ["candidate_chenyu_001"],
    candidate_insights: [
      {
        id: "candidate_chenyu_001",
        match_summary: "支付风控证据完整。",
        strengths: ["Java", "高并发"],
        concerns: ["需确认离职时间"],
        score: 94,
      },
    ],
  });

  assert.equal(reranked.candidates[0].aiRank, 1);
  assert.equal(reranked.candidates[0].localSearchScore, 94);
  assert.match(reranked.candidates[0].aiMatchSummary, /支付风控/);
});
