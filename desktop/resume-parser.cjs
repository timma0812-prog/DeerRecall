const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

const execFileAsync = promisify(execFile);

const supportedResumeExtensions = new Set([".pdf", ".doc", ".docx", ".txt", ".md", ".markdown"]);

const skillKeywords = [
  "Java",
  "Python",
  "Go",
  "Node",
  "React",
  "Vue",
  "Spring Boot",
  "MySQL",
  "PostgreSQL",
  "Redis",
  "Kafka",
  "Docker",
  "Kubernetes",
  "微服务",
  "分布式",
  "高并发",
  "风控",
  "支付",
  "算法",
  "数据分析",
  "产品经理",
  "运营",
];

function normalizeWhitespace(value = "") {
  return String(value)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getExtension(filePath) {
  return path.extname(filePath || "").toLowerCase();
}

async function parsePdf(filePath) {
  const data = await fs.readFile(filePath);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return normalizeWhitespace(result.text || result.pages?.map((page) => page.text).join("\n") || "");
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function parseDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeWhitespace(result.value || "");
}

async function parseDocBestEffort(filePath) {
  const { stdout } = await execFileAsync("textutil", ["-convert", "txt", "-stdout", filePath], {
    timeout: 20000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return normalizeWhitespace(stdout || "");
}

async function parseResumeFile(filePath) {
  const extension = getExtension(filePath);
  if (!supportedResumeExtensions.has(extension)) {
    return {
      ok: false,
      filePath,
      extension,
      text: "",
      reason: "unsupported_format",
      message: "格式不支持",
    };
  }

  try {
    let text = "";
    if (extension === ".txt" || extension === ".md" || extension === ".markdown") {
      text = normalizeWhitespace(await fs.readFile(filePath, "utf8"));
    } else if (extension === ".docx") {
      text = await parseDocx(filePath);
    } else if (extension === ".pdf") {
      text = await parsePdf(filePath);
    } else if (extension === ".doc") {
      text = await parseDocBestEffort(filePath);
    }

    if (!text) {
      return {
        ok: false,
        filePath,
        extension,
        text: "",
        reason: "empty_text",
        message: "未读取到可解析正文",
      };
    }

    return {
      ok: true,
      filePath,
      extension,
      text,
      textLength: text.length,
    };
  } catch (error) {
    return {
      ok: false,
      filePath,
      extension,
      text: "",
      reason: extension === ".doc" ? "doc_conversion_failed" : "parse_failed",
      message: error.message || "解析失败",
    };
  }
}

function getFileNameStem(filePath) {
  return path.basename(filePath || "未命名简历").replace(/\.[^.]+$/, "");
}

function extractName(text, filePath) {
  const lines = normalizeWhitespace(text).split(/\n/).map((line) => line.trim()).filter(Boolean);
  const nameLabel = text.match(/(?:姓名|Name)[:：]\s*([^\s,，|｜]{2,12})/i);
  if (nameLabel) return nameLabel[1].trim();

  const stem = getFileNameStem(filePath)
    .replace(/简历|resume|cv|候选人/gi, "")
    .split(/[_\-\s|｜]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const stemName = stem.find((part) => /^[\u4e00-\u9fa5]{2,4}$/.test(part));
  if (stemName) return stemName;

  const lineName = lines.find((line) => /^[\u4e00-\u9fa5]{2,4}$/.test(line));
  return lineName || stem[0] || getFileNameStem(filePath);
}

function extractPhone(text) {
  return text.match(/(?:\+?86[-\s]?)?1[3-9]\d{9}/)?.[0] || "";
}

function extractEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function extractYears(text) {
  const matched = text.match(/(\d{1,2})\s*年(?:以上)?(?:工作)?(?:经验|经历)?/);
  if (!matched) return "";
  const years = Number.parseInt(matched[1], 10);
  return Number.isFinite(years) ? years : "";
}

function extractRole(text, filePath) {
  const rolePattern = /(Java后端工程师|后端工程师|前端工程师|算法工程师|数据分析师|产品经理|运营经理|测试工程师|架构师|工程师|开发工程师)/i;
  const fromFile = getFileNameStem(filePath).match(rolePattern)?.[0];
  if (fromFile) return fromFile;
  return text.match(rolePattern)?.[0] || "候选人";
}

function extractCompany(text) {
  const matched = text.match(/(?:最近公司|当前公司|公司)[:：]\s*([^\n,，。；;]{2,30})/);
  return matched?.[1]?.trim() || "";
}

function extractTags(text) {
  const lower = text.toLowerCase();
  const tags = skillKeywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
  return [...new Set(tags)].slice(0, 10);
}

function buildSummary(text, tags) {
  const sentences = normalizeWhitespace(text)
    .split(/[。！？!?；;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8)
    .slice(0, 3);
  if (sentences.length) return sentences;
  if (tags.length) return [`简历中提到 ${tags.slice(0, 5).join("、")} 等关键词。`];
  return ["已从本地简历读取正文，建议后续补充结构化解析信息。"];
}

function inferCandidateFromText({ filePath, text, sourceName = "本地导入" }) {
  const normalizedText = normalizeWhitespace(text);
  const name = extractName(normalizedText, filePath);
  const role = extractRole(normalizedText, filePath);
  const years = extractYears(normalizedText);
  const tags = extractTags(normalizedText);
  const company = extractCompany(normalizedText);
  const summary = buildSummary(normalizedText, tags);
  const now = new Date().toISOString();

  return {
    id: `local_${Buffer.from(`${filePath}:${name}`).toString("base64url").slice(0, 18)}`,
    name,
    initial: name.slice(0, 1),
    title: role,
    role: years ? `${role} · ${years} 年经验` : role,
    shortRole: years ? `${role} · ${years} 年` : role,
    years,
    city: "",
    company,
    project: "",
    experience: summary[0] || "",
    stack: tags.join("、"),
    tags,
    summary,
    matchScore: 0,
    completeness: Math.min(95, 35 + tags.length * 5 + (extractPhone(normalizedText) ? 15 : 0) + (extractEmail(normalizedText) ? 15 : 0)),
    sourceName,
    importedAt: now,
    created: now,
    resumeFileName: path.basename(filePath),
    resumePath: filePath,
    resumeText: normalizedText.slice(0, 12000),
    matchNote: "来自本地简历解析，未使用云端 AI。",
    contacts: {
      phone: extractPhone(normalizedText),
      email: extractEmail(normalizedText),
      wechat: "",
    },
    recentExperience: {
      company: company || "待补充",
      title: role,
      summary: summary[0] || "",
    },
    keyProject: {
      name: "待补充",
      summary: summary[1] || summary[0] || "",
    },
    matchEvidence: tags.slice(0, 4).map((tag) => ({
      label: tag,
      level: "简历提及",
      score: "",
    })),
  };
}

module.exports = {
  inferCandidateFromText,
  normalizeWhitespace,
  parseResumeFile,
  supportedResumeExtensions,
};
