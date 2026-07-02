const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const crypto = require("node:crypto");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const supportedResumeExtensions = new Set([".pdf", ".doc", ".docx", ".txt", ".md", ".markdown"]);

const cjkCompatibilityMap = {
  "⻩": "黄",
  "⻔": "门",
  "⻜": "飞",
  "⻓": "长",
  "⻛": "风",
  "⻋": "车",
  "⻅": "见",
  "⻉": "贝",
};

const skillKeywords = [
  { label: "Java" },
  { label: "Python" },
  { label: "Go" },
  { label: "Node" },
  { label: "React" },
  { label: "Vue" },
  { label: "Spring Boot" },
  { label: "MySQL" },
  { label: "PostgreSQL" },
  { label: "Redis" },
  { label: "Kafka" },
  { label: "Docker" },
  { label: "Kubernetes" },
  { label: "微服务" },
  { label: "分布式" },
  { label: "高并发" },
  { label: "风控" },
  { label: "支付" },
  { label: "算法" },
  { label: "数据分析", aliases: ["数据分析", "数据洞察", "可视化分析"] },
  { label: "产品经理" },
  { label: "B端", aliases: ["B端", "B 端", "b端", "b 端"] },
  { label: "中后台", aliases: ["中后台", "后台管理", "后台管理系统"] },
  { label: "SaaS" },
  { label: "PRD" },
  { label: "原型" },
  { label: "业务调研" },
  { label: "流程梳理" },
  { label: "订单管理" },
  { label: "财务对账" },
  { label: "AI" },
  { label: "SQL" },
  { label: "IoT", aliases: ["IoT", "IOT", "iot", "智能硬件", "智能门锁", "硬件"] },
  { label: "CRM" },
  { label: "运营" },
  { label: "合规" },
];

function normalizeWhitespace(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[⻩⻔⻜⻓⻛⻋⻅⻉]/g, (char) => cjkCompatibilityMap[char] || char)
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !/^[a-z0-9_-]{24,}~*$/i.test(line))
    .filter((line) => !/^~+$/.test(line))
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getExtension(filePath) {
  return path.extname(filePath || "").toLowerCase();
}

async function parsePdf(filePath) {
  const { PDFParse } = require("pdf-parse");
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
  const mammoth = require("mammoth");
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
  const matched = text.match(/(?:\+?86[-\s]?)?1[3-9](?:[-\s]?\d){9}/);
  if (!matched) return "";
  const digits = matched[0].replace(/\D/g, "");
  return digits.length === 13 && digits.startsWith("86") ? digits.slice(2) : digits;
}

function extractEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function extractYears(text) {
  const matched = text.match(/(\d{1,2})\s*年(?:以上)?(?:工作)?(?:经验|经历)?/);
  if (!matched) return estimateYearsFromPeriods(text);
  const years = Number.parseInt(matched[1], 10);
  return Number.isFinite(years) ? years : "";
}

function extractRole(text, filePath) {
  const rolePattern = /((?:中后台|B端|IOT|IoT|AI|SaaS|后台|平台|商业化|数据|增长)[/｜|、\s-]*){0,4}(?:产品经理|Java\s*后端工程师|后端工程师|前端工程师|算法工程师|数据分析师|运营经理|测试工程师|架构师|工程师|开发工程师)/i;
  const intentMatch = text.match(/(?:求职意向|应聘岗位|目标职位)[:：\s]*([^\n]{2,60})/i);
  const fromIntent = intentMatch?.[1]?.match(rolePattern)?.[0];
  if (fromIntent) return cleanRole(fromIntent);
  const fromHeader = getContentLines(text).slice(0, 4).join(" ").match(rolePattern)?.[0];
  if (fromHeader) return cleanRole(fromHeader);
  const fromFile = getFileNameStem(filePath).match(rolePattern)?.[0];
  if (fromFile) return cleanRole(fromFile);
  return cleanRole(text.match(rolePattern)?.[0] || "候选人");
}

function extractCompany(text) {
  const matched = text.match(/(?:最近公司|当前公司|公司)[:：]\s*([^\n,，。；;]{2,30})/);
  return matched?.[1]?.trim() || "";
}

function extractTags(text) {
  const lower = text.toLowerCase();
  const tags = skillKeywords
    .filter((keyword) => {
      const aliases = [keyword.label, ...(keyword.aliases || [])];
      return aliases.some((alias) => lower.includes(alias.toLowerCase()));
    })
    .map((keyword) => keyword.label);
  return [...new Set(tags)].slice(0, 14);
}

function buildSummary(text, tags, structured = {}) {
  const summary = [];
  const firstWork = structured.workExperiences?.[0];
  const firstProject = structured.projects?.[0];
  if (firstWork?.summary) {
    summary.push(`${firstWork.company} · ${firstWork.title}：${firstWork.summary}`);
  }
  if (firstProject?.summary) {
    summary.push(`${firstProject.name}：${firstProject.summary}`);
  }
  if (tags.length) {
    summary.push(`简历中提到 ${tags.slice(0, 6).join("、")} 等关键词。`);
  }
  if (summary.length) return summary.slice(0, 3);

  const sentences = normalizeWhitespace(text)
    .split(/[。！？!?；;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8)
    .filter((item) => !/(手机|邮箱|电话|@)/i.test(item))
    .slice(0, 3);
  if (sentences.length) return sentences;
  if (tags.length) return [`简历中提到 ${tags.slice(0, 5).join("、")} 等关键词。`];
  return ["已从本地简历读取正文，建议后续补充结构化解析信息。"];
}

function getContentLines(text) {
  return normalizeWhitespace(text)
    .split(/\n/)
    .map((line) => line.replace(/^[-•·]\s*/, "").trim())
    .filter((line) => line && line !== "•");
}

function compactHeading(line) {
  return String(line || "").replace(/\s/g, "");
}

function findHeadingIndex(lines, patterns, start = 0) {
  return lines.findIndex((line, index) => index >= start && patterns.some((pattern) => pattern.test(compactHeading(line))));
}

function sliceSection(lines, startPatterns, stopPatterns) {
  const start = findHeadingIndex(lines, startPatterns);
  if (start < 0) return [];
  const afterStart = start + 1;
  const relativeStop = lines.slice(afterStart).findIndex((line) => stopPatterns.some((pattern) => pattern.test(compactHeading(line))));
  const stop = relativeStop >= 0 ? afterStart + relativeStop : lines.length;
  return lines.slice(afterStart, stop);
}

function cleanRole(value = "") {
  return String(value)
    .replace(/[｜|]/g, "/")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, "")
    .replace(/^[-—–―]+|[-—–―]+$/g, "")
    .trim();
}

function normalizePeriod(value = "") {
  return String(value)
    .replace(/至今/g, "__PRESENT__")
    .replace(/[—–―~到至]/g, "-")
    .replace(/(\d{4})[./年](\d{1,2})/g, (_matched, year, month) => `${year}.${String(month).padStart(2, "0")}`)
    .replace(/__PRESENT__/g, "至今")
    .replace(/\s*-\s*/g, " - ")
    .replace(/(?:-\s*){2,}/g, "- ")
    .replace(/- 今|-\s*至今/g, "- 至今")
    .trim();
}

function isPeriodLine(line = "") {
  return /(\d{4}[./年]\d{1,2}|\d{4})\s*[—–―\-~至到]\s*(\d{4}[./年]\d{1,2}|\d{4}|至今|今|present)/i.test(line);
}

function splitRoleLine(line = "") {
  const normalized = line.replace(/[—–―]/g, "-");
  const parts = normalized.split(/\s+-\s+|\s*-\s*/).map((item) => item.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const title = parts.slice(1).join(" - ");
  if (!/(产品经理|工程师|运营|架构师|设计师|分析师|负责人|经理)/.test(title)) return null;
  return {
    company: parts[0],
    title,
  };
}

function extractSectionTags(text) {
  return extractTags(text).slice(0, 6);
}

function clampSummary(lines, maxLength = 260) {
  const summary = lines
    .map((line) => line.replace(/^职责[:：]\s*/, "").trim())
    .filter(Boolean)
    .join(" ");
  return summary.length > maxLength ? `${summary.slice(0, maxLength)}...` : summary;
}

function extractWorkExperiences(text) {
  const lines = getContentLines(text);
  const section = sliceSection(lines, [/^工作经历$/, /^工作经验$/], [/^项目经历$/, /^项目经验$/, /^专业技能$/, /^教育经历$/, /^自我评价$/]);
  const experiences = [];

  for (let index = 0; index < section.length; index += 1) {
    const roleLine = splitRoleLine(section[index]);
    if (!roleLine) continue;
    const periodIndex = isPeriodLine(section[index + 1]) ? index + 1 : isPeriodLine(section[index + 2]) ? index + 2 : -1;
    if (periodIndex < 0) continue;

    const description = [];
    let cursor = periodIndex + 1;
    while (cursor < section.length) {
      if (splitRoleLine(section[cursor]) && (isPeriodLine(section[cursor + 1]) || isPeriodLine(section[cursor + 2]))) break;
      description.push(section[cursor]);
      cursor += 1;
    }
    const summaryLines = description.filter((line) => !isPeriodLine(line)).slice(0, 4);
    const segment = [roleLine.company, roleLine.title, ...description].join("\n");
    experiences.push({
      company: roleLine.company,
      title: roleLine.title,
      period: normalizePeriod(section[periodIndex]),
      summary: clampSummary(summaryLines),
      tags: extractSectionTags(segment),
    });
    index = cursor - 1;
  }

  return experiences.slice(0, 8);
}

function isProjectNameLine(line = "", nextLine = "") {
  if (!line || line.length > 70) return false;
  if (/[:：。；;]/.test(line)) return false;
  if (isPeriodLine(line)) return false;
  if (/^(职责|成果|专业技能|工作经历|教育经历)/.test(line)) return false;
  return /^职责[:：]/.test(nextLine) || /(系统|平台|APP|小程序|项目|管理|助手|CRM|中后台|后台)/i.test(line);
}

function extractProjects(text) {
  const lines = getContentLines(text);
  const section = sliceSection(lines, [/^项目经历$/, /^项目经验$/], [/^专业技能$/, /^教育经历$/, /^自我评价$/, /^工作经历$/]);
  const projects = [];

  for (let index = 0; index < section.length; index += 1) {
    if (!isProjectNameLine(section[index], section[index + 1] || "")) continue;
    const name = section[index];
    let role = "";
    const description = [];
    let cursor = index + 1;
    if (/^职责[:：]/.test(section[cursor] || "")) {
      role = section[cursor].replace(/^职责[:：]\s*/, "").trim();
      cursor += 1;
    }
    while (cursor < section.length) {
      if (isProjectNameLine(section[cursor], section[cursor + 1] || "")) break;
      description.push(section[cursor]);
      cursor += 1;
    }
    const segment = [name, role, ...description].join("\n");
    projects.push({
      name,
      role: role || "简历提及",
      summary: clampSummary(description.slice(0, 4)),
      tags: extractSectionTags(segment),
      confidence: description.length ? "高" : "中",
    });
    index = cursor - 1;
  }

  return projects.slice(0, 8);
}

function extractCity(text, filePath) {
  const header = getContentLines(text).slice(0, 4).join(" ");
  const cityPattern = /(北京|上海|广州|深圳|杭州|成都|南京|武汉|西安|苏州|天津|重庆|厦门|长沙|郑州|青岛|合肥|宁波|无锡)/;
  return header.match(cityPattern)?.[1] || getFileNameStem(filePath).match(cityPattern)?.[1] || "";
}

function estimateYearsFromPeriods(text) {
  const matches = [...text.matchAll(/(\d{4})[./年](\d{1,2})/g)];
  if (!matches.length) return "";
  const earliest = matches
    .map((match) => ({ year: Number(match[1]), month: Number(match[2]) || 1 }))
    .filter((item) => Number.isFinite(item.year) && Number.isFinite(item.month))
    .sort((a, b) => a.year - b.year || a.month - b.month)[0];
  if (!earliest) return "";
  const now = new Date();
  const months = (now.getFullYear() - earliest.year) * 12 + (now.getMonth() + 1 - earliest.month);
  const years = Math.max(1, Math.floor(months / 12));
  return Number.isFinite(years) ? years : "";
}

function findEvidenceLine(sectionText, tag) {
  const lines = getContentLines(sectionText);
  const keyword = tag.toLowerCase();
  return lines.find((line) => line.toLowerCase().includes(keyword)) || lines[0] || "";
}

function extractTagSources(text, tags) {
  const lines = getContentLines(text);
  const workSection = sliceSection(lines, [/^工作经历$/, /^工作经验$/], [/^项目经历$/, /^项目经验$/, /^专业技能$/, /^教育经历$/, /^自我评价$/]).join("\n");
  const projectSection = sliceSection(lines, [/^项目经历$/, /^项目经验$/], [/^专业技能$/, /^教育经历$/, /^自我评价$/, /^工作经历$/]).join("\n");
  const skillSection = sliceSection(lines, [/^专业技能$/, /^技能$/, /^技能清单$/], [/^教育经历$/, /^自我评价$/, /^工作经历$/, /^项目经历$/]).join("\n");
  const intentSection = lines.slice(0, Math.max(4, findHeadingIndex(lines, [/^工作经历$/, /^工作经验$/]) || 4)).join("\n");
  const sections = [
    { source: "求职意向", text: intentSection },
    { source: "工作经历", text: workSection },
    { source: "项目经历", text: projectSection },
    { source: "专业技能", text: skillSection },
  ];

  return tags.map((tag) => {
    const matched = sections.find((section) => section.text.toLowerCase().includes(tag.toLowerCase())) || sections.find((section) => section.text);
    return {
      tag,
      source: matched?.source || "简历正文",
      evidence: findEvidenceLine(matched?.text || text, tag),
      confidence: matched ? "高" : "中",
    };
  });
}

function inferCandidateFromText({ filePath, text, sourceName = "本地导入" }) {
  const normalizedText = normalizeWhitespace(text);
  const name = extractName(normalizedText, filePath);
  const role = extractRole(normalizedText, filePath);
  const years = extractYears(normalizedText);
  const city = extractCity(normalizedText, filePath);
  const tags = extractTags(normalizedText);
  const workExperiences = extractWorkExperiences(normalizedText);
  const projects = extractProjects(normalizedText);
  const tagSources = extractTagSources(normalizedText, tags);
  const company = workExperiences[0]?.company || extractCompany(normalizedText);
  const summary = buildSummary(normalizedText, tags, { workExperiences, projects });
  const now = new Date().toISOString();
  const phone = extractPhone(normalizedText);
  const email = extractEmail(normalizedText);

  return {
    id: `local_${crypto.createHash("sha256").update(`${filePath}:${name}`).digest("base64url").slice(0, 22)}`,
    name,
    initial: name.slice(0, 1),
    title: role,
    role: [role, city, years ? `${years} 年经验` : ""].filter(Boolean).join(" · "),
    shortRole: [role, city, years ? `${years} 年` : ""].filter(Boolean).join(" · "),
    years,
    city,
    company,
    project: projects[0]?.name || "",
    experience: workExperiences[0]?.summary || summary[0] || "",
    stack: tags.join("、"),
    tags,
    summary,
    matchScore: 0,
    completeness: Math.min(95, 35 + tags.length * 4 + (phone ? 15 : 0) + (email ? 15 : 0) + (workExperiences.length ? 10 : 0) + (projects.length ? 10 : 0)),
    sourceName,
    importedAt: now,
    created: now,
    resumeFileName: path.basename(filePath),
    resumePath: filePath,
    resumeText: normalizedText.slice(0, 12000),
    matchNote: "来自本地简历解析，未使用云端 AI。",
    contacts: {
      phone,
      email,
      wechat: "",
    },
    recentExperience: {
      company: company || "待补充",
      title: role,
      period: workExperiences[0]?.period || "最近经历",
      summary: workExperiences[0]?.summary || summary[0] || "",
    },
    keyProject: {
      name: projects[0]?.name || "待补充",
      role: projects[0]?.role || "",
      summary: projects[0]?.summary || summary[1] || summary[0] || "",
    },
    workExperiences,
    projects,
    tagSources,
    matchEvidence: tagSources.slice(0, 4).map((item) => ({
      label: item.tag,
      level: item.source,
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
