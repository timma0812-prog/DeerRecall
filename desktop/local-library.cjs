const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const {
  inferCandidateFromText,
  parseResumeFile,
  supportedResumeExtensions,
} = require("./resume-parser.cjs");

function createEmptyLibrary() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    candidates: [],
    importTasks: [],
    sources: [],
  };
}

function shouldUpgradeCandidate(candidate) {
  if (!candidate?.resumeText) return false;
  const missingStructuredSections = !Array.isArray(candidate.workExperiences) || !Array.isArray(candidate.projects) || !Array.isArray(candidate.tagSources);
  const missingContact = !candidate.contacts?.phone && /1[3-9](?:[-\s]?\d){9}/.test(candidate.resumeText);
  return missingStructuredSections || missingContact;
}

function upgradeCandidate(candidate) {
  if (!shouldUpgradeCandidate(candidate)) return candidate;
  const inferred = inferCandidateFromText({
    filePath: candidate.resumePath || candidate.resumeFileName || candidate.file || candidate.name || "本地简历",
    text: candidate.resumeText,
    sourceName: candidate.sourceName || candidate.source || "本地导入",
  });
  return {
    ...candidate,
    ...inferred,
    id: candidate.id || inferred.id,
    importedAt: candidate.importedAt || inferred.importedAt,
    created: candidate.created || inferred.created,
    updatedAt: candidate.updatedAt,
  };
}

function normalizeLibrary(library) {
  if (!library || typeof library !== "object") return createEmptyLibrary();
  return {
    ...createEmptyLibrary(),
    ...library,
    candidates: Array.isArray(library.candidates) ? library.candidates.map(upgradeCandidate) : [],
    importTasks: Array.isArray(library.importTasks) ? library.importTasks : [],
    sources: Array.isArray(library.sources) ? library.sources : [],
  };
}

function loadLibrary(databasePath) {
  if (!databasePath || !fs.existsSync(databasePath)) return createEmptyLibrary();
  try {
    return normalizeLibrary(JSON.parse(fs.readFileSync(databasePath, "utf8")));
  } catch {
    return createEmptyLibrary();
  }
}

function saveLibrary(databasePath, library) {
  const normalized = normalizeLibrary({
    ...library,
    updatedAt: new Date().toISOString(),
  });
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const tempPath = `${databasePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(normalized, null, 2)}\n`);
  fs.renameSync(tempPath, databasePath);
  return normalized;
}

async function walkResumeFiles(folderPath, options = {}) {
  const maxFiles = options.maxFiles || 1000;
  const files = [];

  async function walk(currentPath) {
    if (files.length >= maxFiles) return;
    let entries = [];
    try {
      entries = await fsp.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (!entry.isFile()) continue;
      files.push(entryPath);
    }
  }

  await walk(folderPath);
  return files;
}

function getFileInfo(filePath, folderPath) {
  const stat = fs.statSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  return {
    id: `file_${Buffer.from(filePath).toString("base64url").slice(0, 18)}`,
    name: path.basename(filePath),
    path: filePath,
    relativePath: path.relative(folderPath, filePath),
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
    extension,
  };
}

function createTaskFile(fileInfo, parsed, candidate) {
  const supported = supportedResumeExtensions.has(fileInfo.extension);
  const status = parsed.ok ? "success" : supported ? "failed" : "unsupported";
  return {
    id: fileInfo.id,
    name: fileInfo.name,
    path: fileInfo.path,
    relativePath: fileInfo.relativePath,
    info: `${Math.max(1, Math.round(fileInfo.size / 1024))} KB · ${fileInfo.extension.replace(".", "").toUpperCase() || "FILE"}`,
    ext: fileInfo.extension.replace(".", "").toUpperCase(),
    status,
    result: candidate ? `已入库：${candidate.name}` : undefined,
    reason: parsed.ok ? undefined : parsed.message || (supported ? "解析失败" : "格式不支持"),
    suggestion: parsed.ok
      ? undefined
      : fileInfo.extension === ".doc"
        ? "建议转为 DOCX 或 PDF 后重新导入"
        : supported
          ? "请确认文件内容可读取后重试"
          : "转为 PDF、DOCX、TXT 或 MD 后重新导入",
    retryable: supported && !parsed.ok,
    selected: !parsed.ok,
    candidateId: candidate?.id,
  };
}

function upsertCandidate(candidates, candidate) {
  const existingIndex = candidates.findIndex((item) => item.resumePath === candidate.resumePath || item.id === candidate.id);
  if (existingIndex >= 0) {
    candidates[existingIndex] = {
      ...candidates[existingIndex],
      ...candidate,
      id: candidates[existingIndex].id,
      importedAt: candidates[existingIndex].importedAt,
      updatedAt: new Date().toISOString(),
    };
    return { type: "updated", candidate: candidates[existingIndex] };
  }
  candidates.push(candidate);
  return { type: "new", candidate };
}

async function importFolderToLibrary({ folderPath, databasePath }) {
  if (!folderPath) throw new Error("folderPath is required");
  if (!databasePath) throw new Error("databasePath is required");

  const library = loadLibrary(databasePath);
  const sourceName = path.basename(folderPath);
  const filePaths = await walkResumeFiles(folderPath);
  const taskFiles = [];
  let parseable = 0;
  let failed = 0;
  let unsupported = 0;
  let newProfiles = 0;
  let updatedProfiles = 0;

  for (const filePath of filePaths) {
    const fileInfo = getFileInfo(filePath, folderPath);
    const supported = supportedResumeExtensions.has(fileInfo.extension);
    const parsed = supported
      ? await parseResumeFile(filePath)
      : { ok: false, filePath, extension: fileInfo.extension, text: "", message: "格式不支持" };

    let candidate = null;
    if (parsed.ok) {
      candidate = inferCandidateFromText({ filePath, text: parsed.text, sourceName });
      const result = upsertCandidate(library.candidates, candidate);
      if (result.type === "new") newProfiles += 1;
      else updatedProfiles += 1;
      parseable += 1;
    } else if (supported) {
      failed += 1;
    } else {
      unsupported += 1;
    }
    taskFiles.push(createTaskFile(fileInfo, parsed, candidate));
  }

  const now = new Date().toISOString();
  const task = {
    id: `import_${Date.now()}`,
    source: sourceName,
    importType: "文件夹导入",
    folderPath,
    time: now,
    status: failed || unsupported ? "partial_failed" : "completed",
    total: filePaths.length,
    success: parseable,
    failed,
    unsupported,
    skipped: 0,
    retryable: failed,
    newProfiles,
    updatedProfiles,
    files: taskFiles,
    stats: {
      total: filePaths.length,
      parseable,
      duplicate: 0,
      unsupported,
      newProfiles,
      updatedProfiles,
      skippedDuplicates: 0,
      failed,
    },
  };

  const source = {
    id: `source_${Buffer.from(folderPath).toString("base64url").slice(0, 18)}`,
    name: sourceName,
    path: folderPath,
    type: "文件夹",
    importedAt: now,
    total: task.total,
    parseable,
    failed,
    unsupported,
  };

  library.importTasks.unshift(task);
  library.sources = [source, ...library.sources.filter((item) => item.path !== folderPath)].slice(0, 20);
  const saved = saveLibrary(databasePath, library);

  return {
    name: source.name,
    path: source.path,
    type: source.type,
    files: taskFiles,
    stats: task.stats,
    task,
    library: saved,
  };
}

module.exports = {
  createEmptyLibrary,
  importFolderToLibrary,
  loadLibrary,
  saveLibrary,
  walkResumeFiles,
};
