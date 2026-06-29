const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyAiRerankResult,
  buildAiRerankPayload,
  parseSearchQuery,
  searchLocalCandidates,
} = require("../deersearch-engine.js");

const candidates = [
  {
    id: "candidate_product_intern_001",
    name: "陈小鹿",
    title: "产品实习生",
    role: "产品实习生 · 北京 · 1 年",
    sourceName: "产品实习生",
    resumeFileName: "陈小鹿_产品实习生.pdf",
    resumePath: "/Users/hr/简历/产品实习生/陈小鹿_产品实习生.pdf",
    tags: ["产品", "实习生", "PRD"],
    summary: ["参与竞品分析、用户访谈和 PRD 撰写。"],
    resumeText: "产品实习生，负责竞品分析、用户访谈、需求整理、PRD 文档。",
    years: 1,
    city: "北京",
  },
  {
    id: "candidate_java_001",
    name: "王后端",
    title: "Java 后端开发工程师",
    role: "Java 后端开发工程师 · 上海 · 6 年",
    sourceName: "Java后端候选人_5月",
    resumeFileName: "王后端_Java后端.pdf",
    resumePath: "/Users/hr/简历/Java后端候选人_5月/王后端_Java后端.pdf",
    tags: ["Java", "支付风控", "高并发"],
    summary: ["负责支付风控交易链路。"],
    resumeText: "6 年 Java 后端经验，支付风控，高并发，Spring Boot。",
    years: 6,
    city: "上海",
  },
];

test("parseSearchQuery recognizes source folder list requests", () => {
  const intent = parseSearchQuery("帮我找一下从产品实习生文件夹中的简历都有哪些");

  assert.equal(intent.mode, "source_list");
  assert.equal(intent.sourceKeyword, "产品实习生");
  assert.ok(intent.keywords.includes("产品实习生"));
});

test("searchLocalCandidates filters by source folder without returning Java defaults", () => {
  const result = searchLocalCandidates("帮我找一下从产品实习生文件夹中的简历都有哪些", candidates);

  assert.deepEqual(result.candidates.map((candidate) => candidate.id), ["candidate_product_intern_001"]);
  assert.equal(result.total, 1);
  assert.equal(result.engine, "local");
  assert.ok(result.chips.some((chip) => chip.label === "来源：产品实习生"));
  assert.match(result.assistant.answer, /来源“产品实习生”/);
  assert.doesNotMatch(result.assistant.answer, /Java|支付风控|高并发/);
});

test("searchLocalCandidates returns an empty state instead of all candidates", () => {
  const result = searchLocalCandidates("不存在的文件夹中的简历都有哪些", candidates);

  assert.deepEqual(result.candidates, []);
  assert.equal(result.total, 0);
  assert.match(result.emptyMessage, /没有在“不存在的”来源中找到已解析简历/);
});

test("searchLocalCandidates supports regular keyword search across local resume fields", () => {
  const result = searchLocalCandidates("找产品经理或产品实习生，会写 PRD", candidates);

  assert.equal(result.candidates[0].id, "candidate_product_intern_001");
  assert.ok(result.candidates[0].localSearchScore > candidates[1].localSearchScore || !result.candidates.some((item) => item.id === "candidate_java_001"));
  assert.ok(result.chips.some((chip) => /产品实习生|PRD/.test(chip.label)));
});

test("buildAiRerankPayload sends sanitized local recall candidates only", () => {
  const localResult = searchLocalCandidates("找产品实习生", candidates);
  const payload = buildAiRerankPayload("找产品实习生", localResult);

  assert.equal(payload.mode, "ai_rerank");
  assert.equal(payload.local_candidates.length, 1);
  assert.equal(payload.local_candidates[0].id, "candidate_product_intern_001");
  assert.equal(payload.local_candidates[0].resumeText, undefined);
  assert.equal(payload.local_candidates[0].contacts, undefined);
});

test("applyAiRerankResult reorders local candidates and attaches AI explanations", () => {
  const localResult = searchLocalCandidates("找产品实习生或 Java 后端", candidates);
  const result = applyAiRerankResult(localResult, {
    answer: "AI 已按真实岗位相关性重排。",
    suggestions: ["优先看产品实习经历"],
    ranked_ids: ["candidate_java_001", "candidate_product_intern_001", "missing_candidate"],
    candidate_insights: [
      {
        id: "candidate_java_001",
        match_summary: "有后端经验，但和产品实习生目标较弱。",
        strengths: ["有工程背景"],
        concerns: ["没有产品实习经历"],
        score: 62,
      },
      {
        id: "candidate_product_intern_001",
        match_summary: "简历体现产品实习、PRD 和用户访谈经历。",
        strengths: ["产品实习", "PRD"],
        concerns: ["经验年限较短"],
        score: 91,
      },
    ],
  });

  assert.equal(result.engine, "ai");
  assert.deepEqual(result.candidates.map((candidate) => candidate.id), [
    "candidate_java_001",
    "candidate_product_intern_001",
  ]);
  assert.equal(result.candidates[0].matchScore, 62);
  assert.equal(result.candidates[0].aiMatchSummary, "有后端经验，但和产品实习生目标较弱。");
  assert.deepEqual(result.candidates[1].aiStrengths, ["产品实习", "PRD"]);
  assert.deepEqual(result.candidates[1].aiConcerns, ["经验年限较短"]);
  assert.ok(result.chips.some((chip) => chip.label === "AI 增强排序"));
});
