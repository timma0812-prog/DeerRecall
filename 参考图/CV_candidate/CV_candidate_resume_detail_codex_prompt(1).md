# Codex Prompt: CV_candidate_resume_detail

请在当前 DeerRecall 项目中新增一个共用的候选人完整简历详情页，页面名为 `CV_candidate_resume_detail`。当前项目中已经存在多个「查看简历」入口，但没有完整承接页面：DeerSearch 搜索结果候选人卡片里有 `.resume-btn / 查看简历`；人才库候选人行里有「查看简历」；人才库右侧 `简历概览` 面板里有「打开完整简历」。请把这些入口统一跳转到同一个完整详情页。

## 目标

新增一个 SPA 内部 view：

```js
currentView = 'candidateResumeDetail'
selectedCandidateId = candidateId
candidateResumeEntry = 'search' | 'talent' | 'task'
```

新增统一打开方法：

```js
function openCandidateResume(candidateId, options = {}) {
  const entry = options.entry || 'talent'
  state.currentView = 'candidateResumeDetail'
  state.selectedCandidateId = candidateId
  state.candidateResumeEntry = entry
  state.resumeReturnContext = options
  render()
}
```

## 入口绑定

1. DeerSearch 搜索结果候选人卡片的 `.resume-btn`：

```js
openCandidateResume(candidateId, { entry: 'search', queryId: currentQueryId })
```

2. 人才库候选人行的「查看简历」：

```js
openCandidateResume(candidateId, { entry: 'talent', talentFilter: currentTalentFilter })
```

3. 人才库右侧 `简历概览` 的「打开完整简历」：

```js
openCandidateResume(selectedCandidateId, { entry: 'talent', talentFilter: currentTalentFilter })
```

4. 解析任务详情成功文件行的「查看候选人」：

```js
openCandidateResume(candidateId, { entry: 'task', taskId: selectedTaskId })
```

## 返回逻辑

在详情页顶部显示返回按钮，文案根据 entry 变化：

```js
const backLabel = {
  search: '返回搜索结果',
  talent: '返回人才库',
  task: '返回任务详情'
}[candidateResumeEntry]
```

点击返回：

```js
if (candidateResumeEntry === 'search') {
  state.currentView = 'searchResults'
}
if (candidateResumeEntry === 'talent') {
  state.currentView = 'talents'
  state.currentTalentFilter = state.resumeReturnContext.talentFilter || state.currentTalentFilter
}
if (candidateResumeEntry === 'task') {
  state.currentView = 'tasks'
  state.currentTaskView = 'detail'
  state.selectedTaskId = state.resumeReturnContext.taskId
}
render()
```

左侧导航高亮规则：

```js
const activeNav = {
  search: 'search',
  talent: 'talents',
  task: 'tasks'
}[candidateResumeEntry]
```

## 页面布局

沿用当前三栏结构：

- 左侧：复用现有 sidebar，不改结构，只根据 entry 高亮。
- 中间：完整候选人档案。
- 右侧：候选人助手。

中间内容：

1. 顶部返回区
2. 候选人头部卡片
   - 姓名
   - 职位 / 城市 / 年限
   - 标签
   - 来源
   - 入库时间
   - 资料状态
   - 匹配度或完整度徽标
3. Tabs
   - AI 摘要
   - 原始简历
   - 工作经历
   - 项目经历
   - 联系方式
   - 标签来源
4. 默认内容展示 `AI 摘要`
   - 候选人亮点
   - 匹配证据
   - 原始简历预览
   - 最近工作经历
   - 核心项目
   - 联系方式

右侧助手：

1. 匹配分析 / 资料概览
2. 快捷操作
   - 加入短名单
   - 复制候选人摘要
   - 查找相似候选人
   - 编辑标签
3. 来源与资料
   - 来源批次
   - 完整度
   - 联系方式
   - 项目经历数量

## 视觉要求

请严格参考 `CV_candidate_resume_detail.png`：

- 深紫色背景、玻璃卡片、半透明描边。
- 左侧栏、按钮、标签、右侧助手风格保持和当前 index 页面一致。
- 页面要简练，不要做成 ATS 表格。
- 文案不要挤，卡片之间保持足够间距。
- 右侧助手不要溢出窗口。

## 第一版交互范围

第一版只需要实现默认 `AI 摘要` tab 的内容展示。Tabs 可以先作为静态切换按钮，后续再接真实 tab 内容。

按钮第一版可实现：

- 返回
- 加入短名单
- 复制候选人摘要，成功后显示 toast
- 查找相似候选人，跳回 DeerSearch 并填入相似搜索条件
- 编辑标签，可先弹出轻量 toast 或后续接标签编辑抽屉
- 打开原文件 / Finder 中显示 / 复制文本，可以先预留事件函数

## 建议 mock 数据

请先用陈屿作为默认 mock 数据：

```js
{
  id: 'candidate_chenyu_001',
  name: '陈屿',
  title: 'Java 后端开发工程师',
  city: '上海',
  years: 7,
  tags: ['Java', 'Spring Boot', '支付风控', '高并发', '金融科技'],
  sourceName: 'FinTech_Backend_2026',
  importedAt: '今天 10:32',
  resumeFileName: '陈屿_Java后端工程师_7年.pdf',
  matchScore: 92,
  completeness: 92,
  summary: [
    '7 年 Java 后端经验，长期负责支付与风控相关系统，业务方向与当前搜索高度贴合。',
    '熟悉规则引擎、交易链路、Redis / Kafka / MySQL 等技术栈，有高并发处理经验。',
    '最近经历集中在金融科技场景，适合支付风控、交易平台、后端服务治理方向。'
  ],
  matchEvidence: [
    { label: 'Java / Spring', level: 'strong', score: 98 },
    { label: '支付风控经验', level: 'strong', score: 94 },
    { label: '高并发项目', level: 'strong', score: 88 },
    { label: '金融科技背景', level: 'bonus', score: 76 }
  ],
  contacts: {
    phone: '138****5678',
    email: 'chenyu@example.com',
    wechat: 'chenyu_tech'
  }
}
```
