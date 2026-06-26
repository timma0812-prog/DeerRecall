# AI 市场画像 MVP 实施计划

> **给执行 Agent 的要求：** 按任务顺序执行。每个任务完成后先跑对应测试，再进入下一个任务。实现时继续严格遵守 Harness 交付链路：`npm run check` -> `npm run build` -> `npm run verify:dist` -> `docker build` -> `docker compose up -d` -> 部署后 smoke check。

**目标：** 给 DeerRecall 增加第一版大模型能力：候选人详情页生成“市场画像 / 薪资参考”，DeerSearch 搜索框生成轻量 AI 回答和筛选建议。

**架构：** 保持前端为原生 HTML/CSS/JavaScript。新增一个很薄的 Node runtime，同时服务 `dist/` 静态文件和 `/api/ai/*` 后端接口。API Key 只在后台环境变量里配置，前端不保存、不打包、不暴露。

**技术栈：** Node 20、Node 原生 `http`、Node 原生 `fetch`、Node built-in test runner、Docker、Docker Compose、Harness Open Source pipeline。

---

## 文件改动清单

### 新增文件

- `server/llm-gateway.mjs`：大模型配置、提示词、JSON 解析、结果归一化、模型请求封装。
- `server/server.mjs`：Node runtime，负责静态文件服务和 AI API。
- `tests/ai-market-insight.test.mjs`：AI 网关单元测试。

### 修改文件

- `tests/homepage-structure.test.js`：增加 UI、server、Docker、Compose、Harness 结构测试。
- `package.json`：增加 `start`，扩展 `check` 和 `test`。
- `.env.example`：增加大模型配置变量。
- `Dockerfile`：从 Nginx runtime 改成 Node runtime。
- `docker-compose.yml`：把 AI 配置环境变量传给容器。
- `.harness/deerrecall-ci-cd.yaml`：验证 `/health`、`/api/ai/status`、静态页面和缓存头。
- `index.html`：增加候选人市场画像卡片和 DeerSearch AI 回答卡片。
- `styles.css`：增加市场画像和 AI 回答卡片样式。
- `app.js`：增加前端 API 调用、候选人字段脱敏、结果渲染和错误状态。
- `README.md`：说明 AI 配置、运行方式、Docker Compose 和 MVP 限制。

### 删除文件

- `nginx.conf`：Node runtime 接管静态文件和 API，不再需要 Nginx 配置。

## 任务 1：先写失败测试，锁定 MVP 范围

**目标：** 先用测试定义这次要交付的能力，确保后续不会跑偏。

**文件：**

- 修改：`tests/homepage-structure.test.js`
- 新增：`tests/ai-market-insight.test.mjs`

**要测的内容：**

- 候选人详情页存在“生成市场画像”的按钮和渲染节点。
- DeerSearch 右侧存在 AI 回答区域。
- `package.json` 有 Node runtime 的 `start`、`serve`、`check`、`test` 脚本。
- Docker runtime 使用 Node，而不是 Nginx。
- Compose 传入大模型相关环境变量。
- Harness verify 检查 `/health`、`/api/ai/status`、静态页面和缓存头。
- AI 网关会脱敏候选人联系方式。
- AI 提示词明确说明“没有实时外部薪资数据源”。
- AI 返回结果会被归一化，缺字段时有安全默认值。

**新增 AI 网关测试文件的核心断言：**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMarketInsightMessages,
  buildSearchAssistantMessages,
  getLlmConfig,
  normalizeMarketInsight,
  parseJsonObject,
  sanitizeCandidateForModel,
} from "../server/llm-gateway.mjs";

test("sanitizeCandidateForModel removes contact details and keeps market signals", () => {
  const sanitized = sanitizeCandidateForModel({
    name: "陈屿",
    city: "上海",
    years: 7,
    tags: ["Java", "支付风控"],
    contacts: {
      phone: "13800000000",
      email: "chenyu@example.com",
      wechat: "chenyu_tech",
    },
  });

  assert.equal(sanitized.name, "陈屿");
  assert.equal(sanitized.city, "上海");
  assert.equal(JSON.stringify(sanitized).includes("13800000000"), false);
  assert.equal(JSON.stringify(sanitized).includes("chenyu@example.com"), false);
});

test("buildMarketInsightMessages states this MVP has no real-time market feed", () => {
  const messages = buildMarketInsightMessages({
    name: "陈屿",
    role: "Java 后端开发工程师",
    city: "上海",
    years: 7,
  });
  const text = messages.map((message) => message.content).join("\n");

  assert.match(text, /没有实时外部薪资数据源/);
  assert.match(text, /仅供招聘沟通参考/);
  assert.match(text, /monthly_salary_range/);
  assert.match(text, /boss_summary/);
});

test("normalizeMarketInsight fills safe defaults", () => {
  const normalized = normalizeMarketInsight({
    market_position: "中高级 Java 后端",
    salary_drivers: ["支付风控"],
  });

  assert.equal(normalized.market_position, "中高级 Java 后端");
  assert.equal(normalized.level, "待确认");
  assert.equal(normalized.scarcity, "待确认");
  assert.deepEqual(normalized.salary_drivers, ["支付风控"]);
  assert.match(normalized.disclaimer, /仅供招聘沟通参考/);
});

test("getLlmConfig reports missing backend configuration without exposing secrets", () => {
  const missing = getLlmConfig({});
  assert.equal(missing.configured, false);
  assert.equal(missing.reason, "missing_api_key");
  assert.equal(missing.apiKey, undefined);

  const configured = getLlmConfig({
    DEERRECALL_LLM_API_KEY: "secret-key",
    DEERRECALL_LLM_MODEL: "model-name",
  });
  assert.equal(configured.configured, true);
  assert.equal(configured.apiKey, "secret-key");
});
```

**验证命令：**

```bash
npm test
```

**预期结果：** 失败。原因是 `server/llm-gateway.mjs`、UI 节点、Node runtime、Docker 和 Harness 改动还没实现。

## 任务 2：实现 AI 网关纯函数

**目标：** 先实现不依赖网络的核心逻辑，方便测试。

**文件：**

- 新增：`server/llm-gateway.mjs`

**需要实现的导出函数：**

- `sanitizeCandidateForModel(candidate)`：候选人字段脱敏，只保留市场分析需要的字段。
- `buildMarketInsightMessages(candidate)`：生成市场画像提示词。
- `buildSearchAssistantMessages(message)`：生成 DeerSearch 助手提示词。
- `parseJsonObject(content)`：解析模型返回的 JSON，支持普通 JSON 和 ```json fenced code block。
- `normalizeMarketInsight(raw)`：把模型输出归一化为固定结构。
- `normalizeSearchAssistant(raw)`：归一化 DeerSearch 助手输出。
- `getLlmConfig(env)`：读取后端环境变量，判断是否配置完成。
- `callLlmJson(messages, config, fetchImpl)`：调用 OpenAI-compatible `/chat/completions` 接口。

**关键要求：**

- 不把手机号、邮箱、微信发给模型。
- 提示词必须说明：当前 MVP 没有实时外部薪资数据源。
- 输出必须要求模型返回合法 JSON。
- 缺字段时不能让前端崩溃，要给安全默认值。

**验证命令：**

```bash
node --test tests/ai-market-insight.test.mjs
node --check server/llm-gateway.mjs
```

**预期结果：** 通过。

## 任务 3：实现 Node runtime 和 AI API

**目标：** 用 Node 同时服务静态页面和 AI API，替代 Nginx runtime。

**文件：**

- 新增：`server/server.mjs`

**接口设计：**

```text
GET  /health
GET  /api/ai/status
POST /api/ai/market-insight
POST /api/ai/search-assistant
GET  /...
```

**接口行为：**

- `GET /health`：返回服务健康状态。
- `GET /api/ai/status`：返回 AI 是否已配置，不能暴露 API Key。
- `POST /api/ai/market-insight`：生成候选人市场画像。
- `POST /api/ai/search-assistant`：生成 DeerSearch 搜索解释和筛选建议。
- 其他 `GET` 请求：服务 `dist/` 静态文件，支持 SPA fallback 到 `index.html`。

**缓存头要求：**

- `/` 和 HTML：`Cache-Control: no-store`
- `app.js` 和 `styles.css`：`Cache-Control: no-cache, must-revalidate`

**错误处理：**

- 未配置 API Key 或模型：HTTP `503`，错误码 `llm_not_configured`。
- 请求体过大：HTTP `413`。
- JSON 非法：HTTP `400`。
- 模型超时：HTTP `504`。
- 模型服务失败：HTTP `502`。

**验证命令：**

```bash
node --check server/server.mjs
npm run build
node server/server.mjs
```

另开一个终端：

```bash
curl --fail http://127.0.0.1:8080/health
curl --fail http://127.0.0.1:8080/api/ai/status
curl --fail http://127.0.0.1:8080/
```

**预期结果：**

- `/health` 返回 `"ok":true`。
- `/api/ai/status` 在没有 API Key 时返回 `"configured":false`。
- `/` 返回 DeerRecall 页面。

## 任务 4：改造 package、Docker、Compose、Harness

**目标：** 让新 Node runtime 仍然严格跑在原 Harness 交付链路里。

**文件：**

- 修改：`package.json`
- 修改：`.env.example`
- 修改：`Dockerfile`
- 删除：`nginx.conf`
- 修改：`docker-compose.yml`
- 修改：`.harness/deerrecall-ci-cd.yaml`

### `package.json`

脚本调整为：

```json
{
  "check": "node --check app.js && node --check server/llm-gateway.mjs && node --check server/server.mjs && npm test",
  "test": "node --test tests/homepage-structure.test.js tests/ai-market-insight.test.mjs",
  "clean": "rm -rf dist",
  "build": "node scripts/build-static.mjs",
  "verify:dist": "node scripts/verify-dist.mjs",
  "serve": "npm run build && node server/server.mjs",
  "start": "node server/server.mjs"
}
```

保留现有桌面端脚本：

```json
{
  "desktop:dev": "npm run build && electron desktop/main.cjs",
  "desktop:build": "npm run build && electron-builder --config electron-builder.json --mac dir",
  "desktop:build:tauri": "tauri build"
}
```

### `.env.example`

增加：

```dotenv
DEERRECALL_LLM_API_KEY=
DEERRECALL_LLM_BASE_URL=https://api.openai.com/v1
DEERRECALL_LLM_MODEL=
DEERRECALL_LLM_TIMEOUT_MS=30000
```

### `Dockerfile`

改成 Node runtime：

```Dockerfile
ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE}

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/ ./server/
COPY dist/ ./dist/

ENV DEERRECALL_HOST=0.0.0.0
ENV DEERRECALL_PORT=8080

EXPOSE 8080

CMD ["node", "server/server.mjs"]
```

### `docker-compose.yml`

改成容器内固定 `8080`，宿主机端口仍由 `DEERRECALL_PORT` 控制：

```yaml
services:
  deerrecall:
    image: ${DEERRECALL_IMAGE:-deerrecall:local}
    container_name: ${DEERRECALL_CONTAINER:-deerrecall}
    ports:
      - "${DEERRECALL_PORT:-8080}:8080"
    environment:
      DEERRECALL_HOST: 0.0.0.0
      DEERRECALL_PORT: 8080
      DEERRECALL_LLM_API_KEY: ${DEERRECALL_LLM_API_KEY:-}
      DEERRECALL_LLM_BASE_URL: ${DEERRECALL_LLM_BASE_URL:-https://api.openai.com/v1}
      DEERRECALL_LLM_MODEL: ${DEERRECALL_LLM_MODEL:-}
      DEERRECALL_LLM_TIMEOUT_MS: ${DEERRECALL_LLM_TIMEOUT_MS:-30000}
    restart: unless-stopped
```

### Harness verify

部署后验证改为检查容器内 Node runtime：

```sh
docker exec "${APP_CONTAINER}" wget -qO- http://127.0.0.1:8080/health
docker exec "${APP_CONTAINER}" wget -qO- http://127.0.0.1:8080/api/ai/status
docker exec "${APP_CONTAINER}" wget -qO- http://127.0.0.1:8080/
docker exec "${APP_CONTAINER}" wget -qS --spider http://127.0.0.1:8080/app.js
docker exec "${APP_CONTAINER}" wget -qS --spider http://127.0.0.1:8080/styles.css
```

**验证命令：**

```bash
npm test
```

**预期结果：** Runtime 相关测试通过；前端 UI 测试可能仍然失败，等任务 5 和任务 6 完成。

## 任务 5：候选人详情页接入“市场画像”

**目标：** 在候选人详情页右侧助手中，让 HR 可以点击生成市场画像和薪资参考。

**文件：**

- 修改：`index.html`
- 修改：`styles.css`
- 修改：`app.js`

### 页面结构

在每个 `.candidate-resume-assistant` 中增加市场画像卡片：

```html
<section class="panel-card candidate-side-card market-insight-card" data-market-insight-card>
  <div class="market-insight-head">
    <span class="label">市场画像</span>
    <button class="secondary-action compact-action" type="button" data-market-insight-run>生成市场画像</button>
  </div>
  <p class="market-insight-status" data-market-insight-status>基于当前简历估算市场定位、薪资参考和沟通建议。</p>
  <div class="market-insight-grid" data-market-insight-result hidden>
    <p><span>市场定位</span><strong data-market-insight-position>待生成</strong></p>
    <p><span>层级</span><strong data-market-insight-level>待生成</strong></p>
    <p><span>稀缺度</span><strong data-market-insight-scarcity>待生成</strong></p>
    <p><span>月薪参考</span><strong data-market-insight-monthly>待生成</strong></p>
    <p><span>年包参考</span><strong data-market-insight-annual>待生成</strong></p>
    <p><span>置信度</span><strong data-market-insight-confidence>待生成</strong></p>
  </div>
  <div class="market-insight-section" data-market-insight-result hidden>
    <strong>影响薪资的因素</strong>
    <ul class="market-insight-list" data-market-insight-drivers></ul>
  </div>
  <div class="market-insight-section" data-market-insight-result hidden>
    <strong>需要确认的风险</strong>
    <ul class="market-insight-list" data-market-insight-risks></ul>
  </div>
  <div class="market-insight-section" data-market-insight-result hidden>
    <strong>HR 建议</strong>
    <p data-market-insight-hr>待生成</p>
  </div>
  <div class="market-insight-section" data-market-insight-result hidden>
    <strong>老板摘要</strong>
    <p data-market-insight-boss>待生成</p>
  </div>
  <small class="market-insight-disclaimer" data-market-insight-disclaimer>薪资参考由 AI 基于简历信息估算，仅供招聘沟通参考，需结合实时市场与公司薪酬策略确认。</small>
</section>
```

### 前端逻辑

`app.js` 中新增：

- `getMarketInsightCandidatePayload()`：从当前候选人中取市场分析字段，不带联系方式。
- `requestMarketInsight()`：调用 `/api/ai/market-insight`。
- `renderMarketInsight()`：把后端结果渲染到卡片。
- `setMarketInsightState()`：处理 idle、loading、ready、error 状态。

**关键要求：**

- 页面通过 `file://` 打开时，不请求 API，提示需要通过服务运行。
- 后端未配置 API Key 时，显示清晰错误。
- 失败时不影响候选人详情页其他操作。
- 打开不同候选人时，市场画像卡片回到初始状态。

**验证命令：**

```bash
npm test
```

**预期结果：** 候选人市场画像相关测试通过。

## 任务 6：DeerSearch 搜索框接入 AI 回答

**目标：** 让首页搜索框具备轻量大模型能力，同时保持当前静态搜索结果不变。

**文件：**

- 修改：`index.html`
- 修改：`styles.css`
- 修改：`app.js`

### 页面结构

在 `#resultsSide` 当前搜索卡片后增加：

```html
<section class="panel-card search-ai-card" data-search-ai-card>
  <span class="label">AI 回答</span>
  <p class="search-ai-status" data-search-ai-status>提交搜索后，小鹿会解释需求并建议下一步筛选。</p>
  <p class="search-ai-answer" data-search-ai-answer hidden></p>
  <div class="search-ai-suggestions" data-search-ai-suggestions hidden></div>
</section>
```

### 前端逻辑

`app.js` 中新增：

- `requestSearchAssistant(message)`：调用 `/api/ai/search-assistant`。
- `renderSearchAssistant(assistant)`：展示回答和建议。
- `setSearchAiState(state, message)`：处理 loading、ready、error。

在 `showResults(queryText = defaultQuery)` 末尾调用：

```js
requestSearchAssistant(normalizedQuery);
```

**关键要求：**

- 现有静态搜索结果仍然照常展示。
- AI 请求失败时，只影响右侧 AI 回答卡片。
- 后端未配置模型时，显示“AI 助手暂不可用”。

**验证命令：**

```bash
npm test
```

**预期结果：** 全部结构测试和 AI 网关测试通过。

## 任务 7：更新 README，并跑 Harness 等价验证

**目标：** 把使用方式写清楚，并用本地命令模拟 Harness 交付链路。

**文件：**

- 修改：`README.md`

### README 增加内容

增加“AI 市场画像 MVP”说明：

````markdown
## AI 市场画像 MVP

DeerRecall 现在包含一个后台 AI 网关，用于候选人市场画像 MVP。API Key 只在后台运行时配置，不会写入前端资源。

需要真实调用模型时配置：

```dotenv
DEERRECALL_LLM_API_KEY=your-api-key
DEERRECALL_LLM_BASE_URL=https://api.openai.com/v1
DEERRECALL_LLM_MODEL=your-model-name
DEERRECALL_LLM_TIMEOUT_MS=30000
```

本地运行：

```bash
DEERRECALL_LLM_API_KEY=... DEERRECALL_LLM_MODEL=... npm run serve
```

打开 `http://localhost:8080`。

第一版只基于候选人简历和模型通用知识估算薪资，不接实时外部薪资数据、不接内部薪酬基准、不保存 offer 数据。结果只作为招聘沟通参考，不能当作最终薪酬决策依据。
````

### 本地 Harness 等价验证

执行：

```bash
npm run check
npm run build
npm run verify:dist
docker build -t deerrecall:local .
DEERRECALL_IMAGE=deerrecall:local DEERRECALL_PORT=8080 docker compose up -d
docker exec deerrecall wget -qO- http://127.0.0.1:8080/health
docker exec deerrecall wget -qO- http://127.0.0.1:8080/api/ai/status
docker exec deerrecall wget -qO- http://127.0.0.1:8080/ | grep 'data-market-insight-run'
docker exec deerrecall wget -qS --spider http://127.0.0.1:8080/app.js 2>&1 | grep -qi 'cache-control: no-cache, must-revalidate'
docker exec deerrecall wget -qS --spider http://127.0.0.1:8080/styles.css 2>&1 | grep -qi 'cache-control: no-cache, must-revalidate'
docker exec deerrecall wget -qS --spider http://127.0.0.1:8080/ 2>&1 | grep -qi 'cache-control: no-store'
docker compose down
```

**预期结果：**

- `npm run check` 通过。
- `npm run build` 通过。
- `npm run verify:dist` 通过。
- Docker image 构建成功。
- Compose 启动 `deerrecall` 容器。
- `/health` 返回 `"ok":true`。
- `/api/ai/status` 在没有 API Key 时返回 `"configured":false`。
- 部署后的 HTML 包含 `data-market-insight-run`。
- JS、CSS、HTML 的缓存头检查通过。
- `docker compose down` 能清理容器。

## 最终验收

实现完成后必须满足：

- 候选人详情页能看到“生成市场画像”。
- 前端不会暴露 API Key。
- 未配置 API Key 时，页面有清晰提示，其他功能可用。
- 配置 API Key 后，能生成市场定位、薪资参考、稀缺度、薪资驱动因素、风险点、HR 建议、老板摘要。
- DeerSearch 搜索框会触发 AI 回答区域，但原静态搜索结果不变。
- `npm run check` 通过。
- `npm run build` 通过。
- `npm run verify:dist` 通过。
- Docker Compose 部署通过。
- Harness verify 不依赖真实模型 API Key。

## 暂不做

这次不做：

- JD 匹配
- 外部实时薪资数据
- 内部薪资基准对比
- 数据库存储
- AI 结果入库
- 简历文件解析
- 向量搜索
- 权限系统
- Electron 本地 API 托管
