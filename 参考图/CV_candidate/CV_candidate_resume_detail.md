# CV_candidate_resume_detail

## 页面定位

候选人完整简历详情页，用于承接以下入口：

- DeerSearch 搜索结果卡片中的「查看简历」
- 人才库候选人行中的「查看简历」
- 人才库右侧「简历概览」中的「打开完整简历」
- 解析任务详情页中成功文件的「查看候选人」

该页面是共用页面，不区分搜索页和人才库页的两套实现。通过入口参数控制左侧高亮、返回按钮和右侧助手展示重点。

## 页面文件

- 参考图：`CV_candidate_resume_detail.png`
- 页面说明：`CV_candidate_resume_detail.md`
- Codex 提示词：`CV_candidate_resume_detail_codex_prompt.md`
- HTML 静态参考：`CV_candidate_resume_detail.html`

## 视觉要求

保持当前 DeerRecall 产品风格：

- 左侧栏完全沿用当前产品，只根据入口高亮 `DeerSearch`、`人才库` 或 `解析任务`。
- 主区域使用深紫 / 靛蓝背景、玻璃卡片、半透明描边。
- 页面内容要克制，不做复杂 ATS 式表格。
- 右侧继续使用助手面板，不新增第四列。
- 字体、按钮、卡片圆角、渐变主按钮、标签样式需与当前 index 页面一致。

## 页面结构

### 1. 左侧导航

复用现有 sidebar。

高亮规则：

| entry | 左侧高亮 | 返回按钮 |
|---|---|---|
| `search` | DeerSearch | 返回搜索结果 |
| `talent` | 人才库 | 返回人才库 |
| `task` | 解析任务 | 返回任务详情 |

### 2. 中间主区域

#### 顶部返回区

显示：

- 返回按钮
- 页面上下文：`候选人完整档案 · CV_candidate_resume_detail`

#### 候选人头部卡片

展示：

- 姓名
- 当前职位
- 城市
- 工作年限
- 核心标签
- 简历来源
- 入库时间
- 资料状态
- 匹配度徽标（仅 search entry 强展示；talent entry 可弱化为资料完整度）

#### Tabs

默认展示 `AI 摘要`。

Tabs：

- AI 摘要
- 原始简历
- 工作经历
- 项目经历
- 联系方式
- 标签来源

第一版可以不做真实 tab 切页，只要 UI 保留 tabs，默认显示 AI 摘要即可。后续再补交互。

#### AI 摘要卡片

展示：

- 3 条候选人亮点
- 4 条匹配证据
  - Java / Spring
  - 支付风控经验
  - 高并发项目
  - 金融科技背景

#### 原始简历预览卡片

展示：

- 原始文件名
- PDF 预览占位
- 打开原文件
- 在 Finder 中显示
- 复制文本

#### 底部信息卡片

展示三张简洁卡片：

- 最近工作经历
- 核心项目
- 联系方式

## 右侧助手

标题：`候选人助手`

### 匹配分析

用于 search entry：

- 匹配度环形数字，例如 92
- 高度匹配说明
- 条件匹配列表
  - Java / Spring：强匹配
  - 支付或风控：强匹配
  - 高并发项目：强匹配
  - 金融科技：加分

用于 talent entry：

- 可以保留同一块，但标题文案可改为 `资料概览`
- 不需要强调「搜索条件」

### 快捷操作

按钮：

- 加入短名单
- 复制候选人摘要
- 查找相似候选人
- 编辑标签

### 来源与资料

展示：

- 来源批次
- 资料完整度
- 联系方式状态
- 项目经历数量

## 主要交互

### 打开页面

建议新增统一方法：

```js
openCandidateResume(candidateId, options)
```

参数：

```js
{
  entry: 'search' | 'talent' | 'task',
  queryId?: string,
  taskId?: string,
  sourceId?: string
}
```

### 返回逻辑

```js
if (entry === 'search') returnToSearchResults(queryId)
if (entry === 'talent') returnToTalentCurrentView()
if (entry === 'task') returnToTaskDetail(taskId)
```

### 左侧高亮逻辑

```js
const activeNav = {
  search: 'search',
  talent: 'talents',
  task: 'tasks'
}[entry]
```

### 数据状态

建议新增：

```js
currentView = 'candidateResumeDetail'
selectedCandidateId = candidateId
candidateResumeEntry = entry
```

## 数据字段建议

```ts
type CandidateResumeDetail = {
  id: string
  name: string
  title: string
  city: string
  years: number
  tags: string[]
  sourceName: string
  importedAt: string
  resumeFileName: string
  matchScore?: number
  completeness?: number
  summary: string[]
  matchEvidence: Array<{
    label: string
    level: 'strong' | 'medium' | 'bonus'
    score: number
  }>
  recentExperience: {
    company: string
    title: string
    period: string
    summary: string
  }
  keyProject: {
    name: string
    summary: string
  }
  contacts: {
    phone?: string
    email?: string
    wechat?: string
  }
}
```

## Codex 开发注意

- 不要新建完全独立的窗口；应作为当前 SPA 内部 view 切换。
- 保持 `app-window / sidebar / main / assistant-panel` 三栏结构。
- 页面高度不要超过当前窗口太多，内容必要时主区域内部滚动。
- 右侧助手不要复用人才库的 `简历概览` 小面板，需要变成完整页的 `候选人助手`。
- 入口不同只影响高亮、返回按钮、右侧文案，不要复制三份页面。
