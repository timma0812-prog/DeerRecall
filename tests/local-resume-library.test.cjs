const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createEmptyLibrary,
  importFolderToLibrary,
  loadLibrary,
} = require("../desktop/local-library.cjs");
const {
  inferCandidateFromText,
  parseResumeFile,
  supportedResumeExtensions,
} = require("../desktop/resume-parser.cjs");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "deerrecall-local-library-"));
}

test("createEmptyLibrary starts without seeded demo candidates", () => {
  const library = createEmptyLibrary();

  assert.deepEqual(library.candidates, []);
  assert.deepEqual(library.importTasks, []);
  assert.deepEqual(library.sources, []);
  assert.equal(library.schemaVersion, 1);
});

test("parseResumeFile extracts local text resume body", async () => {
  const tempDir = makeTempDir();
  const resumePath = path.join(tempDir, "王小明_Java后端工程师.txt");
  fs.writeFileSync(
    resumePath,
    [
      "王小明",
      "手机：13800138000",
      "邮箱：wang@example.com",
      "7 年 Java 后端工程师，熟悉 Spring Boot、Redis、MySQL。",
      "最近公司：星河科技",
      "项目：支付风控平台，高并发交易链路。",
    ].join("\n")
  );

  const parsed = await parseResumeFile(resumePath);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.extension, ".txt");
  assert.match(parsed.text, /王小明/);
  assert.match(parsed.text, /支付风控平台/);
});

test("inferCandidateFromText creates useful candidate fields from resume text", () => {
  const candidate = inferCandidateFromText({
    filePath: "/tmp/王小明_Java后端工程师.txt",
    text: "王小明\n手机：13800138000\n邮箱：wang@example.com\n7 年 Java 后端工程师，熟悉 Spring Boot、Redis、MySQL。最近公司：星河科技。",
  });

  assert.equal(candidate.name, "王小明");
  assert.equal(candidate.contacts.phone, "13800138000");
  assert.equal(candidate.contacts.email, "wang@example.com");
  assert.match(candidate.role, /Java后端工程师/);
  assert.equal(candidate.years, 7);
  assert.ok(candidate.tags.includes("Java"));
  assert.ok(candidate.summary.some((item) => item.includes("Spring Boot")));
});

test("inferCandidateFromText structures a local product manager resume without demo tags", () => {
  const candidate = inferCandidateFromText({
    filePath: "/tmp/IOT产品经理-黄凯-北京.pdf",
    sourceName: "IOT产品经理",
    text: [
      "黄凯 | 中后台/B端产品经理",
      "北京 | 159-1066-0153 | [1095933642@qq.com]",
      "求职意向：中后台产品经理 | B端产品经理",
      "工作经历",
      "魅KTV - B端产品经理",
      "2023.05 - 至今",
      "全权负责公司 B端全量产品线，包括总部中后台管理系统与魅管家门店助手 APP 的整体规划与架构设计。",
      "统筹订单管理、结算提成、财务对账、多平台渠道对接，引入 AI 工具辅助分析异常订单及运营数据。",
      "北京实惠多多科技有限公司 - 产品经理",
      "2023.01 - 2023.05",
      "负责公寓租赁、异业合作及商场水电业务线产品规划与需求拆解。",
      "项目经历",
      "魅KTV中后台管理系统 + 魅管家门店助手APP",
      "职责：B端全系产品整体规划、架构拆解、业务规则定义与模块设计",
      "订单与结算体系：规划消费单、充值单、AI订单全品类订单架构。",
      "融寓后台管理系统 + 融寓APP",
      "职责：产品整体规划、流程重构与功能架构设计",
      "对接智能门锁、水电、监控等 IoT 硬件，实现设备数据采集、异常告警及风险预警规则。",
      "专业技能",
      "产品与业务能力：中后台 SaaS 产品规划、业务调研、流程梳理、规则设计；独立输出 PRD、原型及流程文档。",
    ].join("\n"),
  });

  assert.equal(candidate.name, "黄凯");
  assert.equal(candidate.contacts.phone, "15910660153");
  assert.equal(candidate.contacts.email, "1095933642@qq.com");
  assert.match(candidate.title, /产品经理/);
  assert.ok(candidate.tags.includes("B端"));
  assert.ok(candidate.tags.includes("中后台"));
  assert.ok(candidate.tags.includes("IoT"));
  assert.ok(candidate.tags.includes("PRD"));
  assert.ok(!candidate.tags.includes("Java"));
  assert.ok(!candidate.tags.includes("Spring Boot"));
  assert.equal(candidate.workExperiences[0].company, "魅KTV");
  assert.equal(candidate.workExperiences[0].title, "B端产品经理");
  assert.equal(candidate.workExperiences[0].period, "2023.05 - 至今");
  assert.match(candidate.workExperiences[0].summary, /中后台管理系统/);
  assert.equal(candidate.projects[0].name, "魅KTV中后台管理系统 + 魅管家门店助手APP");
  assert.match(candidate.projects[0].summary, /订单与结算体系/);
  assert.ok(candidate.tagSources.some((item) => item.tag === "B端" && /求职意向|工作经历|项目经历/.test(item.source)));
  assert.ok(candidate.tagSources.some((item) => item.tag === "IoT" && /项目经历|专业技能/.test(item.source)));
  assert.doesNotMatch(JSON.stringify(candidate), /支付风控|Spring Boot|Java 后端开发工程师/);
});

test("importFolderToLibrary persists parsed local candidates without demo records", async () => {
  const tempDir = makeTempDir();
  const dbPath = path.join(tempDir, "talent-library.json");
  const resumeDir = path.join(tempDir, "resumes");
  fs.mkdirSync(resumeDir);
  fs.writeFileSync(
    path.join(resumeDir, "王小明_Java后端工程师.txt"),
    "王小明\n手机：13800138000\n邮箱：wang@example.com\n7 年 Java 后端工程师，熟悉 Spring Boot、Redis、MySQL。"
  );
  fs.writeFileSync(
    path.join(resumeDir, "unsupported.pages"),
    "unsupported"
  );

  const result = await importFolderToLibrary({
    folderPath: resumeDir,
    databasePath: dbPath,
  });
  const stored = loadLibrary(dbPath);

  assert.equal(result.library.candidates.length, 1);
  assert.equal(stored.candidates.length, 1);
  assert.equal(stored.candidates[0].name, "王小明");
  assert.equal(stored.importTasks.length, 1);
  assert.equal(stored.importTasks[0].stats.total, 2);
  assert.equal(stored.importTasks[0].stats.parseable, 1);
  assert.equal(stored.importTasks[0].stats.unsupported, 1);
  assert.doesNotMatch(JSON.stringify(stored), /陈屿|FinTech_Backend_2026|客户A_后端简历包/);
});

test("loadLibrary upgrades older local candidates from stored resume text", () => {
  const tempDir = makeTempDir();
  const dbPath = path.join(tempDir, "talent-library.json");
  fs.writeFileSync(dbPath, JSON.stringify({
    schemaVersion: 1,
    candidates: [{
      id: "local_old_huangkai",
      name: "黄凯",
      title: "产品经理",
      contacts: { phone: "", email: "1095933642@qq.com", wechat: "" },
      tags: ["数据分析", "产品经理", "运营"],
      resumePath: "/tmp/IOT产品经理-黄凯-北京.pdf",
      resumeFileName: "IOT产品经理-黄凯-北京.pdf",
      resumeText: [
        "黄凯 | 中后台/B端产品经理",
        "北京 | 159-1066-0153 | [1095933642@qq.com]",
        "工作经历",
        "魅KTV - B端产品经理",
        "2023.05 - 至今",
        "全权负责公司 B端全量产品线，包括总部中后台管理系统与魅管家门店助手 APP 的整体规划与架构设计。",
        "项目经历",
        "魅KTV中后台管理系统 + 魅管家门店助手APP",
        "职责：B端全系产品整体规划、架构拆解、业务规则定义与模块设计",
        "订单与结算体系：规划消费单、充值单、AI订单全品类订单架构。",
      ].join("\n"),
    }],
    importTasks: [],
    sources: [],
  }));

  const library = loadLibrary(dbPath);
  const candidate = library.candidates[0];

  assert.equal(candidate.id, "local_old_huangkai");
  assert.equal(candidate.contacts.phone, "15910660153");
  assert.equal(candidate.workExperiences[0].company, "魅KTV");
  assert.equal(candidate.projects[0].name, "魅KTV中后台管理系统 + 魅管家门店助手APP");
  assert.ok(candidate.tagSources.some((item) => item.tag === "B端"));
  assert.doesNotMatch(JSON.stringify(candidate), /Java 后端|Spring Boot|支付风控/);
});

test("supportedResumeExtensions covers first trial parsing targets", () => {
  assert.ok(supportedResumeExtensions.has(".pdf"));
  assert.ok(supportedResumeExtensions.has(".docx"));
  assert.ok(supportedResumeExtensions.has(".txt"));
  assert.ok(supportedResumeExtensions.has(".md"));
  assert.ok(supportedResumeExtensions.has(".doc"));
});
