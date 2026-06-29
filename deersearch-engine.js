(function initDeerSearchEngine(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DeerRecallSearch = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createDeerSearchEngine() {
  const knownTerms = [
    "产品实习生",
    "产品经理",
    "中后台",
    "B端",
    "SaaS",
    "PRD",
    "原型",
    "用户访谈",
    "竞品分析",
    "Java",
    "支付风控",
    "高并发",
    "金融科技",
    "Python",
    "数据分析",
    "运营",
    "算法",
    "前端",
    "后端",
    "IoT",
    "AI",
  ];

  const stopWords = new Set([
    "帮我",
    "一下",
    "找",
    "查找",
    "搜索",
    "查看",
    "列出",
    "简历",
    "候选人",
    "文件夹",
    "来源",
    "目录",
    "里面",
    "中的",
    "里的",
    "都有",
    "哪些",
    "都有哪些",
    "一下从",
    "从",
    "在",
    "中",
    "里",
    "下",
    "会写",
  ]);

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[，。！？；：、,.!?;:()[\]【】"'“”‘’]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeCompact(value) {
    return normalizeText(value).replace(/\s+/g, "");
  }

  function unique(items) {
    return Array.from(new Set((items || []).filter(Boolean)));
  }

  function cleanKeyword(value) {
    let keyword = String(value || "").trim();
    keyword = keyword.replace(/^(帮我|请|麻烦|找一下|查一下|看一下|从|在)+/, "");
    keyword = keyword.replace(/(文件夹|目录|来源|批次|里面|中的|里的|下|中|里|的简历|简历)$/g, "");
    return keyword.trim();
  }

  function extractSourceKeyword(query) {
    const text = String(query || "").trim();
    const patterns = [
      /从\s*([^，。,.!?！？]{1,40}?)(?:文件夹|目录|来源|批次)(?:中|里|下|里面|中的|里的|的)?/,
      /^在\s*([^，。,.!?！？]{1,40}?)(?:文件夹|目录|来源|批次)(?:中|里|下|里面|中的|里的|的)?/,
      /(?:来源|导入批次|导入来源)(?:是|为|:|：)?\s*([^，。,.!?！？]{1,40})/,
      /([^，。,.!?！？]{2,40})(?:文件夹|目录)(?:中|里|下|里面|中的|里的|的)?/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const keyword = cleanKeyword(match?.[1]);
      if (keyword) return keyword;
    }
    return "";
  }

  function extractKnownTerms(query) {
    const compact = normalizeCompact(query);
    return knownTerms.filter((term) => compact.includes(normalizeCompact(term)));
  }

  function extractFreeTextTerms(query) {
    return normalizeText(query)
      .split(/\s+/)
      .map(cleanKeyword)
      .filter((term) => term.length >= 2 && !stopWords.has(term))
      .filter((term) => !/^[的了和或与及都有哪些中里下从在]+$/.test(term));
  }

  function parseSearchQuery(query) {
    const rawQuery = String(query || "").trim();
    const sourceKeyword = extractSourceKeyword(rawQuery);
    const asksForList = /(有哪些|都有哪些|列出|查看|名单|简历)/.test(rawQuery);
    const keywords = unique([
      sourceKeyword,
      ...extractKnownTerms(rawQuery),
      ...extractFreeTextTerms(rawQuery),
    ]);
    return {
      rawQuery,
      mode: sourceKeyword && asksForList ? "source_list" : sourceKeyword ? "source_search" : "keyword_search",
      sourceKeyword,
      keywords,
      asksForList,
    };
  }

  function fieldText(candidate, fields) {
    return fields.map((field) => {
      const value = candidate?.[field];
      if (Array.isArray(value)) return value.join(" ");
      if (value && typeof value === "object") return Object.values(value).join(" ");
      return value || "";
    }).join(" ");
  }

  function candidateSourceText(candidate) {
    return fieldText(candidate, ["sourceName", "source", "resumePath"]);
  }

  function candidateMainText(candidate) {
    return fieldText(candidate, [
      "name",
      "title",
      "role",
      "shortRole",
      "city",
      "company",
      "project",
      "experience",
      "stack",
      "tags",
      "summary",
      "resumeFileName",
      "resumeText",
    ]);
  }

  function containsTerm(text, term) {
    if (!term) return false;
    return normalizeCompact(text).includes(normalizeCompact(term));
  }

  function scoreCandidate(candidate, intent) {
    const evidence = [];
    let score = 0;

    if (intent.sourceKeyword) {
      const sourceMatched = containsTerm(candidateSourceText(candidate), intent.sourceKeyword)
        || containsTerm(fieldText(candidate, ["resumeFileName"]), intent.sourceKeyword);
      if (!sourceMatched && intent.mode === "source_list") return null;
      if (sourceMatched) {
        score += 120;
        evidence.push(`来源命中：${intent.sourceKeyword}`);
      }
    }

    const keywordHits = [];
    for (const keyword of intent.keywords) {
      if (keyword === intent.sourceKeyword) continue;
      if (containsTerm(fieldText(candidate, ["name"]), keyword)) {
        score += 90;
        keywordHits.push(keyword);
      } else if (containsTerm(candidateSourceText(candidate), keyword)) {
        score += 70;
        keywordHits.push(keyword);
      } else if (containsTerm(fieldText(candidate, ["resumeFileName"]), keyword)) {
        score += 60;
        keywordHits.push(keyword);
      } else if (containsTerm(fieldText(candidate, ["title", "role", "shortRole"]), keyword)) {
        score += 55;
        keywordHits.push(keyword);
      } else if (containsTerm(fieldText(candidate, ["tags", "stack"]), keyword)) {
        score += 42;
        keywordHits.push(keyword);
      } else if (containsTerm(fieldText(candidate, ["summary", "project", "experience"]), keyword)) {
        score += 28;
        keywordHits.push(keyword);
      } else if (containsTerm(fieldText(candidate, ["resumeText"]), keyword)) {
        score += 14;
        keywordHits.push(keyword);
      }
    }

    if (keywordHits.length) evidence.push(`关键词命中：${unique(keywordHits).join("、")}`);
    if (!intent.sourceKeyword && !keywordHits.length) return null;
    if (score <= 0) return null;

    return {
      score,
      evidence,
    };
  }

  function buildChips(intent, candidates) {
    const chips = [];
    if (intent.sourceKeyword) chips.push({ id: "source", label: `来源：${intent.sourceKeyword}` });
    if (intent.asksForList) chips.push({ id: "parsed", label: "已解析简历" });
    for (const keyword of intent.keywords) {
      if (chips.length >= 5) break;
      if (keyword && keyword !== intent.sourceKeyword) chips.push({ id: `keyword-${chips.length}`, label: keyword });
    }
    if (!chips.length && candidates.length) chips.push({ id: "local", label: "本地人才库" });
    return chips;
  }

  function buildAssistant(intent, total, engine = "local") {
    const modeLabel = engine === "ai" ? "AI 增强搜索" : "本地搜索模式";
    if (intent.sourceKeyword && total > 0) {
      return {
        answer: `${modeLabel}：我已按来源“${intent.sourceKeyword}”筛选，找到 ${total} 份已解析简历。`,
        suggestions: ["查看原始简历", "继续按岗位或城市缩小范围", "检查导入来源详情"],
      };
    }
    if (intent.sourceKeyword && total === 0) {
      return {
        answer: `${modeLabel}：没有在“${intent.sourceKeyword}”来源中找到已解析简历。`,
        suggestions: ["检查该文件夹是否已导入", "查看解析任务状态", "换一个来源关键词"],
      };
    }
    if (total > 0) {
      return {
        answer: `${modeLabel}：我已在本地人才库中按“${intent.rawQuery}”检索，找到 ${total} 位相关候选人。`,
        suggestions: ["补充来源文件夹", "补充城市或年限", "查看匹配最高的简历"],
      };
    }
    return {
      answer: `${modeLabel}：没有找到匹配“${intent.rawQuery}”的候选人。`,
      suggestions: ["放宽关键词", "检查是否已导入简历", "换一个岗位或来源名称"],
    };
  }

  function toResultCandidate(candidate, match, index) {
    const localSearchScore = Math.min(99, Math.max(35, Math.round(45 + match.score / 3)));
    return {
      ...candidate,
      localSearchScore,
      matchScore: localSearchScore,
      matchNote: match.evidence.join("；") || "本地字段命中",
      searchIndex: index,
    };
  }

  function searchLocalCandidates(query, candidates = []) {
    const intent = parseSearchQuery(query);
    const matched = [];

    candidates.forEach((candidate, index) => {
      const match = scoreCandidate(candidate, intent);
      if (match) matched.push(toResultCandidate(candidate, match, index));
    });

    matched.sort((a, b) => {
      if (b.localSearchScore !== a.localSearchScore) return b.localSearchScore - a.localSearchScore;
      return (a.searchIndex || 0) - (b.searchIndex || 0);
    });

    const assistant = buildAssistant(intent, matched.length, "local");
    const emptyMessage = matched.length ? "" : assistant.answer.replace(/^本地搜索模式：/, "");

    return {
      engine: "local",
      intent,
      candidates: matched,
      total: matched.length,
      chips: buildChips(intent, matched),
      assistant,
      emptyMessage,
    };
  }

  function sanitizeCandidateForAi(candidate) {
    return {
      id: candidate.id,
      name: candidate.name,
      role: candidate.role || candidate.title || "",
      city: candidate.city || "",
      years: candidate.years || "",
      sourceName: candidate.sourceName || candidate.source || "",
      resumeFileName: candidate.resumeFileName || "",
      tags: Array.isArray(candidate.tags) ? candidate.tags.slice(0, 8) : [],
      summary: Array.isArray(candidate.summary) ? candidate.summary.slice(0, 4) : [],
      matchNote: candidate.matchNote || "",
      localSearchScore: candidate.localSearchScore || candidate.matchScore || 0,
    };
  }

  function buildAiRerankPayload(query, localResult) {
    return {
      mode: "ai_rerank",
      query: String(query || ""),
      intent: localResult?.intent || parseSearchQuery(query),
      local_candidates: (localResult?.candidates || []).slice(0, 30).map(sanitizeCandidateForAi),
      output_schema: {
        ranked_ids: ["candidate id in best order"],
        answer: "一句中文解释",
        suggestions: ["后续筛选建议"],
      },
    };
  }

  return {
    buildAiRerankPayload,
    parseSearchQuery,
    searchLocalCandidates,
  };
});
