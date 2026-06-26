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

test("supportedResumeExtensions covers first trial parsing targets", () => {
  assert.ok(supportedResumeExtensions.has(".pdf"));
  assert.ok(supportedResumeExtensions.has(".docx"));
  assert.ok(supportedResumeExtensions.has(".txt"));
  assert.ok(supportedResumeExtensions.has(".md"));
  assert.ok(supportedResumeExtensions.has(".doc"));
});
