# DeerRecall

DeerRecall 是一个 AI 招聘工作台 MVP。Web/Harness 版本仍保留静态演示页面和 Node AI 网关，用来支撑候选人市场画像 MVP；Electron 第一版试用包已经切到本地优先模式：启动时人才库为空，用户选择本地简历文件夹后，在 Mac 本机解析简历正文并写入本地人才库。

## 本地命令

运行结构测试：

```bash
npm test
```

运行 Harness 本地发布门禁：

```bash
npm run check
```

构建静态产物：

```bash
npm run build
```

验证 `dist/` 只包含运行时文件：

```bash
npm run verify:dist
```

本地启动 Node runtime：

```bash
npm run serve
```

## AI 市场画像 MVP

DeerRecall 现在包含后台 AI 网关，用于候选人市场画像、薪资参考和 DeerSearch AI 回答。API Key 只在后台运行时配置，不会写入前端资源，也不会打包到浏览器代码里。

真实调用模型时需要配置：

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

## 本地 macOS 桌面端

第一版试用包启动时人才库为空，不会自动展示演示候选人。用户在 Electron 客户端中选择本地简历文件夹后，应用会扫描该文件夹和子文件夹，把支持格式的简历解析为本地候选人记录。

第一版桌面试用包默认本地优先，不要求用户安装 Electron、Node、Docker、Rust 或数据库。支持本地解析 PDF / DOCX / TXT / Markdown，并对 DOC 做 macOS `textutil` best-effort 转换；扫描版 PDF 或图片型简历需要原文件自带可提取文字，否则会进入失败任务列表。

配置模型 Key 后，Electron 桌面端可以直接启用 DeerSearch AI 回答和候选人市场画像。开发环境优先读取项目根目录 `.env`；打包后的客户端可读取：

```text
~/Library/Application Support/deerrecall/.env
```

文件内容沿用同一组变量：

```dotenv
DEERRECALL_LLM_API_KEY=your-api-key
DEERRECALL_LLM_BASE_URL=https://api.openai.com/v1
DEERRECALL_LLM_MODEL=your-model-name
DEERRECALL_LLM_TIMEOUT_MS=30000
```

这些配置文件已经被 `.gitignore` 和 `.dockerignore` 排除，不会进入 Git 仓库或 Docker 镜像。

本地人才库保存位置：

```text
~/Library/Application Support/deerrecall/talent-library.json
```

原始简历文件不会被移动、修改、上传或复制。

构建未签名的本地 macOS app：

```bash
npm run desktop:build
```

打开生成的应用：

```bash
open release/electron/mac-arm64/DeerRecall.app
```

生成产物位于 `release/electron/mac-arm64/DeerRecall.app`。这个包只用于本地验收，因为没有 Apple Developer ID 签名和 notarize，macOS 可能会提示安全警告。

构建给客户试用的未签名 DMG 安装包：

```bash
npm run desktop:build:trial
```

生成产物位于 `release/electron/DeerRecall-0.1.0-arm64.dmg`。用户不需要安装 Electron；Electron runtime、Chromium 和 DeerRecall 前端代码都会被打进 `.dmg` 内的 macOS app。用户双击 `.dmg` 后打开 DeerRecall，或拖到 Applications 目录即可。

当前 Electron 目录版加载的是静态 `dist/` 页面，并通过 Electron IPC 调用 `desktop/` 下的本地解析、JSON 持久化和桌面 AI 网关模块。Web / Docker 运行时仍通过 Node runtime 的 `/api/ai/*` 访问 AI；Electron 打包客户端通过主进程 IPC 调用同一套模型消息构造与结果归一化逻辑，API Key 不会暴露给前端页面。

Tauri 已保留为后续更小运行时的打包选项，但本地需要先安装 Rust/Cargo：

```bash
npm run desktop:build:tauri
```

## Docker Compose 部署

先构建静态产物和镜像：

```bash
npm run build
docker build -t deerrecall:local .
```

如果 Docker Desktop 已安装，但 shell 找不到 `docker` 命令，先执行：

```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
```

Dockerfile 默认使用 public ECR 的 Docker Library 镜像 `node:20-alpine`，减少 Harness 和本地构建对 Docker Hub 可用性的依赖。如果需要改成其他镜像源：

```bash
docker build \
  --build-arg NODE_IMAGE=node:20-alpine \
  -t deerrecall:local .
```

用 Docker Compose 启动：

```bash
DEERRECALL_IMAGE=deerrecall:local \
DEERRECALL_PORT=8080 \
DEERRECALL_LLM_API_KEY=... \
DEERRECALL_LLM_MODEL=... \
docker compose up -d
```

打开 `http://localhost:8080`。

查看日志：

```bash
docker compose logs --tail=100 deerrecall
```

停止服务：

```bash
docker compose down
```

## 部署变量

可以把 `.env.example` 复制为 `.env` 做本地覆盖。

```dotenv
DEERRECALL_IMAGE=deerrecall:local
DEERRECALL_CONTAINER=deerrecall
DEERRECALL_PORT=8080
DEERRECALL_LLM_API_KEY=
DEERRECALL_LLM_BASE_URL=https://api.openai.com/v1
DEERRECALL_LLM_MODEL=
DEERRECALL_LLM_TIMEOUT_MS=30000
```

## Harness Open Source

仓库内置 Harness Open Source pipeline：`.harness/deerrecall-ci-cd.yaml`。

流水线顺序：

```text
source -> npm run check -> npm run build -> npm run verify:dist -> docker build -> docker compose up -d -> release smoke checks
```

Harness 需要访问 Docker socket，才能构建镜像并执行 Docker Compose 部署。本地运行 Harness Open Source 时，需要把 `/var/run/docker.sock` 挂载到 Harness 容器。

当前 pipeline 使用 Harness Open Source YAML，并通过 host volume 挂载 `/var/run/docker.sock`。正式依赖触发器前，先在 Harness 实例里保存 pipeline，让 Harness 按当前版本校验 YAML。

## 生产发布护栏

部署到演示环境之外前，需要遵守：

- 构建产物不包含设计参考资料：`npm run build` 只会把 `index.html`、`deersearch-engine.js`、`app.js`、`styles.css` 复制到 `dist/`。
- `npm run verify:dist` 会拦截缺文件、多余文件或空文件的发布产物。
- JS、CSS 和搜索引擎脚本使用 `no-cache, must-revalidate`，因为当前文件名还没有内容 hash。
- SPA 入口 HTML 使用 `no-store`，确保发布检查总是拿到最新入口。
- Harness verify 会等待 Node runtime 就绪，检查部署后的核心 SPA 和 AI 入口，检查 `/api/ai/status`，并验证 `app.js`、`deersearch-engine.js`、`styles.css`、`/` 的缓存头。
- 生产发布前应创建 release tag，并部署不可变镜像 tag，方便回滚到上一版。

Harness Open Source 本地启动示例：

```bash
docker run -d \
  -p 3000:3000 \
  -p 3022:3022 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp/harness:/data \
  --name harness \
  --restart always \
  harness/harness
```

## 回滚

这个单机部署的回滚方式是重新部署上一版 Docker 镜像 tag：

```bash
DEERRECALL_IMAGE=deerrecall:previous docker compose up -d
```

如果部署失败，先查看服务状态和日志：

```bash
docker compose ps
docker compose logs --tail=100 deerrecall
```
