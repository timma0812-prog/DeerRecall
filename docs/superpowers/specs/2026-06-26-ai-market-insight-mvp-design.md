# AI 市场画像 MVP 设计说明

## 目标

给 DeerRecall 接入第一版真实大模型能力：在候选人详情页，根据当前候选人的简历信息，生成“市场画像”和“薪资参考”，帮助 HR 和老板快速判断候选人的市场层级、稀缺程度、可能薪资范围、沟通策略和推进建议。

这一版不做 JD 匹配。重点不是回答“这个人是否匹配某个岗位”，而是回答：

- 这位候选人在市场上大概属于什么层级？
- 这类背景是否稀缺？
- 这类候选人大概会有什么薪资预期？
- 哪些经历会抬高薪资？
- 哪些信息需要 HR 进一步确认？
- 老板看这份简历时应该如何判断是否继续推进？

## 当前项目状态

当前 DeerRecall 还是静态 MVP：

- `index.html` 是页面入口。
- `app.js` 里有本地候选人 seed 数据和交互逻辑。
- `styles.css` 里有所有样式。
- `tests/homepage-structure.test.js` 做页面结构测试。
- `scripts/build-static.mjs` 只把 `index.html`、`app.js`、`styles.css` 打进 `dist/`。
- Docker 当前用 Nginx 服务静态页面。
- Harness pipeline 当前流程是：测试、构建静态文件、构建 Docker 镜像、Compose 部署、部署后检查。

现在还没有后端 API、数据库、简历解析服务、向量检索、外部薪资数据源或模型服务。

## 推荐架构

把当前“纯静态 Nginx 运行时”升级为一个很薄的 Node 运行时：

```text
前端页面
  -> /api/ai/market-insight
  -> Node AI 网关
  -> 后台配置的大模型 API
  -> 结构化 JSON
  -> 页面渲染市场画像卡片
```

前端仍然保持原来的 plain HTML/CSS/JavaScript，不引入 React、Vue 或数据库。

关键原则：

- API Key 只放在后端环境变量。
- API Key 不能写进 `index.html`、`app.js`、`styles.css`。
- 构建后的 `dist/` 里不能出现 API Key。
- Harness 仍然必须能完整跑通。

## 后台配置方式

后台通过环境变量配置大模型：

```dotenv
DEERRECALL_LLM_API_KEY=你的 API Key
DEERRECALL_LLM_BASE_URL=https://api.openai.com/v1
DEERRECALL_LLM_MODEL=你要使用的模型名
DEERRECALL_LLM_TIMEOUT_MS=30000
```

说明：

- `DEERRECALL_LLM_API_KEY`：真实调用模型时必填。
- `DEERRECALL_LLM_BASE_URL`：使用 OpenAI-compatible 接口，默认是 `https://api.openai.com/v1`。
- `DEERRECALL_LLM_MODEL`：由你在后台配置。
- `DEERRECALL_LLM_TIMEOUT_MS`：模型请求超时时间，默认 30 秒。

如果没有配置 API Key 或模型名，后端返回明确的配置错误，页面显示“后台未配置 AI 服务”，但产品其他功能继续可用。

## 候选人市场画像输出

后端接口 `/api/ai/market-insight` 返回结构化结果：

```json
{
  "market_position": "中高级 Java 后端，金融科技支付风控方向",
  "level": "高级工程师水平",
  "scarcity": "较稀缺",
  "monthly_salary_range": "35k-50k",
  "annual_package_range": "50w-80w",
  "confidence": "中等",
  "salary_drivers": [
    "7 年 Java 后端经验",
    "支付风控业务背景",
    "高并发交易链路经验"
  ],
  "risk_factors": [
    "简历未明确团队规模",
    "未明确 QPS、交易量、系统复杂度"
  ],
  "hr_suggestion": "建议先确认当前薪资、期望总包、奖金结构和到岗周期。",
  "boss_summary": "该候选人方向较贴合金融科技后端，具备一定市场溢价，建议进入初沟。",
  "disclaimer": "薪资参考由 AI 基于简历信息估算，仅供招聘沟通参考，需结合实时市场与公司薪酬策略确认。"
}
```

大模型提示词必须明确说明：当前 MVP 没有实时外部薪资数据源，也没有内部薪资基准库，所以模型只能做“基于简历信息和通用经验的估算”，不能声称使用了实时市场数据。

## 产品结合方式

### 候选人详情页

在右侧“候选人助手”里新增“市场画像”卡片。

初始状态：

```text
基于当前简历估算市场定位、薪资参考和沟通建议。
```

按钮：

```text
生成市场画像
```

点击后：

1. 前端从当前候选人记录中提取简历信息。
2. 去掉电话、邮箱、微信、本地文件路径等敏感信息。
3. 调用 `/api/ai/market-insight`。
4. 渲染市场定位、层级、稀缺度、月薪参考、年包参考、置信度、薪资驱动因素、风险点、HR 建议、老板摘要和免责声明。

### DeerSearch 首页聊天框

当前主页搜索框继续保留原来的静态搜索结果。

同时增加一个轻量 AI 回答区域，用于解释用户输入的招聘搜索意图，并给出下一步筛选建议。例如：

```text
用户输入：找支付风控 Java 后端，最好有高并发经验

AI 回答：这类需求重点关注 Java 后端能力、支付/风控业务经验和高并发交易链路经验。
建议继续补充：城市、年限、是否必须金融科技背景。
```

如果后端未配置模型，搜索结果仍然正常展示，AI 卡片显示“AI 助手暂不可用”。

## Harness 交付要求

继续严格保持现有 Harness 链路：

```text
source
  -> npm run check
  -> npm run build
  -> npm run verify:dist
  -> docker build
  -> docker compose up -d
  -> deployed smoke checks
```

需要同步更新：

- `npm run check`：检查前端 JS 和新增 server JS。
- `npm test`：跑原有页面结构测试和新增 AI 网关测试。
- `npm run build`：仍然只生成 `dist/index.html`、`dist/app.js`、`dist/styles.css`。
- `npm run verify:dist`：继续校验 dist 里只有预期静态文件。
- Docker image：从 Nginx 改为 Node runtime。
- Compose：把大模型环境变量传给 Node runtime。
- Harness verify：检查 `/health`、HTML 页面、缓存头和 `/api/ai/status`。

Harness 验证不能依赖真实 API Key。没有配置 API Key 时，`/api/ai/status` 也必须返回可验证的 JSON。

## 错误处理

- 缺少 API Key：返回 HTTP `503`，错误码 `llm_not_configured`。
- 缺少模型名：返回 HTTP `503`，错误码 `llm_not_configured`。
- 模型超时：返回 HTTP `504`，错误码 `llm_timeout`。
- 模型返回非法 JSON：返回 HTTP `502` 或明确错误。
- 页面通过 `file://` 打开：提示 AI 能力需要通过本地服务或 Docker 运行时打开。
- AI 请求失败：不影响原有搜索、候选人详情、短名单等功能。

## 隐私边界

第一版发给模型的数据只包含市场分析必要字段：

- 姓名
- 职位
- 城市
- 年限
- 技术栈
- 标签
- 简历摘要
- 工作经历摘要
- 项目经历摘要
- 匹配证据

不发送：

- 手机号
- 邮箱
- 微信
- 本地文件路径
- 原始简历文件内容

## 不做范围

第一版明确不做：

- JD 匹配
- 外部实时薪资数据接入
- 内部薪资基准对比
- 向量搜索
- 数据库存储
- 简历文件解析
- AI 结果入库
- 登录、权限、多用户
- Electron 本地 API 托管

Electron 仍然可以打开静态页面。AI 能力优先在 Node runtime、Docker Compose 和 Harness 部署环境里可用。

## 验收标准

- 候选人详情页有“生成市场画像”入口。
- 点击入口时，前端调用后端 AI 网关，而不是在前端暴露 API Key。
- 未配置 API Key 时，页面显示清晰的不可用状态，其他功能不受影响。
- 配置 API Key 后，页面能展示市场定位、薪资参考、稀缺度、薪资驱动因素、风险点、HR 建议、老板摘要和免责声明。
- DeerSearch 搜索框可以触发 AI 回答区域，但不改变当前静态搜索结果逻辑。
- 前端构建产物不包含 API Key。
- `npm run check` 通过。
- `npm run build` 通过。
- `npm run verify:dist` 通过。
- Docker Compose 可以启动 Node runtime。
- Harness pipeline 可以在没有真实模型 API Key 的情况下完成部署验证。
