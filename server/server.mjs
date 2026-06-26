import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildMarketInsightMessages,
  buildSearchAssistantMessages,
  callLlmJson,
  getLlmConfig,
  normalizeMarketInsight,
  normalizeSearchAssistant,
} from "./llm-gateway.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const port = Number.parseInt(process.env.DEERRECALL_PORT || "8080", 10);
const host = process.env.DEERRECALL_HOST || "0.0.0.0";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, { ok: false, code, message });
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 96_000) {
      const error = new Error("Request body too large");
      error.statusCode = 413;
      throw error;
    }
  }
  if (!body.trim()) return {};
  return JSON.parse(body);
}

async function handleMarketInsight(request, response) {
  const config = getLlmConfig();
  if (!config.configured) {
    sendError(response, 503, "llm_not_configured", config.reason);
    return;
  }

  const body = await readJsonBody(request);
  const raw = await callLlmJson(buildMarketInsightMessages(body.candidate || {}), config);
  sendJson(response, 200, { ok: true, insight: normalizeMarketInsight(raw) });
}

async function handleSearchAssistant(request, response) {
  const config = getLlmConfig();
  if (!config.configured) {
    sendError(response, 503, "llm_not_configured", config.reason);
    return;
  }

  const body = await readJsonBody(request);
  const raw = await callLlmJson(buildSearchAssistantMessages(body.message || ""), config);
  sendJson(response, 200, { ok: true, assistant: normalizeSearchAssistant(raw) });
}

function getSafeStaticPath(urlPathname) {
  const pathname = decodeURIComponent(urlPathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const requestedPath = path.normalize(path.join(dist, relative));
  const relativeToDist = path.relative(dist, requestedPath);
  if (relativeToDist.startsWith("..") || path.isAbsolute(relativeToDist)) {
    return path.join(dist, "index.html");
  }
  return requestedPath;
}

async function serveStatic(request, response) {
  const url = new URL(request.url, "http://localhost");
  let filePath = getSafeStaticPath(url.pathname);

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    filePath = path.join(dist, "index.html");
  }

  const ext = path.extname(filePath);
  const cache = ext === ".html" ? "no-store" : ext === ".js" || ext === ".css" ? "no-cache, must-revalidate" : "no-cache";
  const content = await readFile(filePath);
  response.writeHead(200, {
    "Content-Type": contentTypes.get(ext) || "application/octet-stream",
    "Cache-Control": cache,
  });
  response.end(request.method === "HEAD" ? undefined : content);
}

async function route(request, response) {
  const url = new URL(request.url, "http://localhost");

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "deerrecall", runtime: "node" });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/ai/status") {
      const config = getLlmConfig();
      sendJson(response, 200, {
        ok: true,
        configured: config.configured,
        reason: config.configured ? null : config.reason,
        baseUrl: config.baseUrl,
        model: config.model || null,
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/ai/market-insight") {
      await handleMarketInsight(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/ai/search-assistant") {
      await handleSearchAssistant(request, response);
      return;
    }
    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response);
      return;
    }
    sendError(response, 405, "method_not_allowed", "Unsupported request method");
  } catch (error) {
    if (error.name === "AbortError") {
      sendError(response, 504, "llm_timeout", "Model request timed out");
      return;
    }
    if (error.statusCode === 413) {
      sendError(response, 413, "request_too_large", "Request body too large");
      return;
    }
    if (error instanceof SyntaxError) {
      sendError(response, 400, "invalid_json", "Request or model JSON is invalid");
      return;
    }
    const status = error.statusCode && error.statusCode >= 400 ? 502 : 500;
    sendError(response, status, "server_error", error.message || "Unexpected server error");
  }
}

createServer(route).listen(port, host, () => {
  console.log(`DeerRecall runtime listening on http://${host}:${port}`);
});
