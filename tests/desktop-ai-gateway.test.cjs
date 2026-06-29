const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createDesktopAiGateway,
  getDesktopLlmConfig,
  parseDotenvContent,
} = require("../desktop/ai-gateway.cjs");

test("parseDotenvContent reads desktop AI config without shell syntax", () => {
  const parsed = parseDotenvContent(`
DEERRECALL_LLM_API_KEY="secret-token"
DEERRECALL_LLM_BASE_URL=https://api.example.com/v1
DEERRECALL_LLM_MODEL=gpt-test
DEERRECALL_LLM_TIMEOUT_MS=12000
IGNORED_LINE
`);

  assert.equal(parsed.DEERRECALL_LLM_API_KEY, "secret-token");
  assert.equal(parsed.DEERRECALL_LLM_BASE_URL, "https://api.example.com/v1");
  assert.equal(parsed.DEERRECALL_LLM_MODEL, "gpt-test");
  assert.equal(parsed.DEERRECALL_LLM_TIMEOUT_MS, "12000");
  assert.equal(parsed.IGNORED_LINE, undefined);
});

test("getDesktopLlmConfig merges env and app config without exposing secrets in status", () => {
  const config = getDesktopLlmConfig({
    env: {
      DEERRECALL_LLM_API_KEY: "env-secret",
      DEERRECALL_LLM_MODEL: "gpt-env",
    },
    configValues: {
      DEERRECALL_LLM_API_KEY: "file-secret",
      DEERRECALL_LLM_BASE_URL: "https://api.example.com/v1",
      DEERRECALL_LLM_MODEL: "gpt-file",
    },
  });

  assert.equal(config.configured, true);
  assert.equal(config.apiKey, "env-secret");
  assert.equal(config.model, "gpt-env");
  assert.equal(config.baseUrl, "https://api.example.com/v1");
  assert.deepEqual(config.safeStatus, {
    ok: true,
    configured: true,
    reason: null,
    baseUrl: "https://api.example.com/v1",
    model: "gpt-env",
  });
  assert.equal(JSON.stringify(config.safeStatus).includes("secret"), false);
});

test("desktop AI gateway returns normalized search assistant result", async () => {
  const calls = [];
  const gateway = createDesktopAiGateway({
    env: {
      DEERRECALL_LLM_API_KEY: "secret",
      DEERRECALL_LLM_BASE_URL: "https://api.example.com/v1",
      DEERRECALL_LLM_MODEL: "gpt-test",
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        async json() {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    answer: "优先看产品经理候选人。",
                    suggestions: ["只看北京", "补充行业", "确认年限"],
                    ranked_ids: ["candidate_1"],
                    candidate_insights: [{ id: "candidate_1", match_summary: "命中产品经理。", score: 91 }],
                  }),
                },
              },
            ],
          };
        },
      };
    },
  });

  assert.deepEqual(gateway.getStatus(), {
    ok: true,
    configured: true,
    reason: null,
    baseUrl: "https://api.example.com/v1",
    model: "gpt-test",
  });

  const result = await gateway.searchAssistant({
    message: "找产品经理",
    history: [],
    localContext: {
      local_candidates: [{ id: "candidate_1", name: "黄凯", role: "产品经理" }],
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.assistant.answer, "优先看产品经理候选人。");
  assert.deepEqual(result.assistant.ranked_ids, ["candidate_1"]);
  assert.equal(result.assistant.candidate_insights[0].id, "candidate_1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.example.com/v1/chat/completions");
  assert.equal(calls[0].options.headers.Authorization, "Bearer secret");
});

test("desktop AI gateway returns safe not-configured response", async () => {
  const gateway = createDesktopAiGateway({ env: {}, configValues: {} });

  assert.deepEqual(gateway.getStatus(), {
    ok: true,
    configured: false,
    reason: "missing_api_key",
    baseUrl: "https://api.openai.com/v1",
    model: null,
  });

  const result = await gateway.searchAssistant({ message: "找人" });

  assert.equal(result.ok, false);
  assert.equal(result.code, "llm_not_configured");
  assert.equal(result.message, "missing_api_key");
  assert.equal(JSON.stringify(result).includes("apiKey"), false);
});
