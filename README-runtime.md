# DeerRecall 本地运行与发布说明

## 本地验证

常用命令：

```bash
npm test
npm run build
npm run verify:dist
npm run desktop:build
npm run desktop:build:trial
```

Electron 本地 app 输出位置：

- `release/electron/mac-arm64/DeerRecall.app`
- `release/electron/DeerRecall-0.1.0-arm64.dmg`

Electron 打包会先执行 `scripts/prepare-electron-app.mjs`，生成 `release/electron-app` 最小运行目录，只包含桌面壳、静态 `dist`、AI 网关和 PDF / DOCX 解析所需依赖，避免扫描完整开发依赖树。

当前桌面包是未签名的本地 macOS app，用户不需要安装 Electron。第一版试用包启动时人才库为空，数据保存在 `Library/Application Support/deerrecall/talent-library.json`。

支持导入格式：PDF / DOCX / TXT / Markdown。配置模型 Key 后，Electron 桌面端可以直接启用 DeerSearch AI 回答和候选人市场画像。桌面端环境变量文件位置：`Library/Application Support/deerrecall/.env`。

## 静态运行时

前端仍是静态系统，构建产物包含：

- `index.html`
- `styles.css`
- `deersearch-engine-runtime.js`
- `app-runtime.js`
- `motion.js`
- `vendor/gsap.min.js`
- `vendor/Flip.min.js`

`motion.js`、`vendor/gsap.min.js` 和 `vendor/Flip.min.js` 都是本地资源，不依赖 CDN。

## Docker 与 Harness

本地容器命令：

```bash
docker build -t deerrecall:local .
docker compose up -d
docker compose logs --tail=100 deerrecall
```

Harness Open Source pipeline 挂载 `/var/run/docker.sock`，使用 `DEERRECALL_PORT` 调整端口。生产发布护栏要求先测试、再构建静态产物、再构建镜像、再部署并 smoke check。

构建产物不包含设计参考资料。JS、CSS 和搜索引擎脚本使用 `no-cache, must-revalidate`，HTML 使用 `no-store`。正式发布前创建 release tag。

## AI 市场画像 MVP

AI 市场画像 MVP 通过 `DEERRECALL_LLM_API_KEY` 和 `DEERRECALL_LLM_MODEL` 配置模型。薪资参考仅用于招聘沟通参考，需结合实时市场和公司薪酬策略确认。
