const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 30000;

function stripDotenvQuotes(value) {
  const text = String(value || "").trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseDotenvContent(content = "") {
  return String(content)
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return values;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) return values;
      values[match[1]] = stripDotenvQuotes(match[2]);
      return values;
    }, {});
}

function readDotenvFile(filePath) {
  if (!filePath) return {};
  try {
    return parseDotenvContent(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function readDotenvFiles(configPaths = []) {
  return configPaths.reduce((values, filePath) => {
    return { ...values, ...readDotenvFile(filePath) };
  }, {});
}

function getDesktopLlmConfig(options = {}) {
  const env = options.env || process.env;
  const configValues = {
    ...readDotenvFiles(options.configPaths || []),
    ...(options.configValues || {}),
    ...env,
  };
  const apiKey = configValues.DEERRECALL_LLM_API_KEY || "";
  const model = configValues.DEERRECALL_LLM_MODEL || "";
  const baseUrl = (configValues.DEERRECALL_LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const timeoutMs = Number.parseInt(configValues.DEERRECALL_LLM_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10);
  const safeStatus = {
    ok: true,
    configured: Boolean(apiKey && model),
    reason: apiKey ? (model ? null : "missing_model") : "missing_api_key",
    baseUrl,
    model: model || null,
  };

  if (!apiKey) return { configured: false, reason: "missing_api_key", baseUrl, model, timeoutMs, safeStatus };
  if (!model) return { configured: false, reason: "missing_model", baseUrl, timeoutMs, safeStatus };
  return { configured: true, apiKey, baseUrl, model, timeoutMs, safeStatus };
}

function createDesktopAiGateway(options = {}) {
  let llmGatewayPromise = null;

  function getConfig() {
    return getDesktopLlmConfig(options);
  }

  function getStatus() {
    return getConfig().safeStatus;
  }

  function loadLlmGateway() {
    if (!llmGatewayPromise) {
      const gatewayPath = options.llmGatewayPath || path.join(__dirname, "..", "server", "llm-gateway.mjs");
      llmGatewayPromise = import(gatewayPath);
    }
    return llmGatewayPromise;
  }

  function notConfiguredResponse(config) {
    return {
      ok: false,
      code: "llm_not_configured",
      message: config.reason,
    };
  }

  function errorResponse(error) {
    if (error?.name === "AbortError") {
      return { ok: false, code: "llm_timeout", message: "Model request timed out" };
    }
    if (error instanceof SyntaxError) {
      return { ok: false, code: "invalid_json", message: "Request or model JSON is invalid" };
    }
    return { ok: false, code: "server_error", message: error?.message || "AI 服务暂不可用" };
  }

  async function searchAssistant(payload = {}) {
    const config = getConfig();
    if (!config.configured) return notConfiguredResponse(config);

    try {
      const {
        buildSearchAssistantMessages,
        callLlmJson,
        normalizeSearchAssistant,
      } = await loadLlmGateway();
      const raw = await callLlmJson(
        buildSearchAssistantMessages(payload.message || "", payload.history || [], payload.localContext),
        config,
        options.fetchImpl || fetch
      );
      return { ok: true, assistant: normalizeSearchAssistant(raw) };
    } catch (error) {
      return errorResponse(error);
    }
  }

  async function marketInsight(payload = {}) {
    const config = getConfig();
    if (!config.configured) return notConfiguredResponse(config);

    try {
      const {
        buildMarketInsightMessages,
        callLlmJson,
        normalizeMarketInsight,
      } = await loadLlmGateway();
      const raw = await callLlmJson(
        buildMarketInsightMessages(payload.candidate || {}),
        config,
        options.fetchImpl || fetch
      );
      return { ok: true, insight: normalizeMarketInsight(raw) };
    } catch (error) {
      return errorResponse(error);
    }
  }

  return {
    getStatus,
    searchAssistant,
    marketInsight,
  };
}

module.exports = {
  createDesktopAiGateway,
  getDesktopLlmConfig,
  parseDotenvContent,
  readDotenvFile,
};
