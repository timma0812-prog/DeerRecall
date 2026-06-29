const { contextBridge, ipcRenderer, webUtils } = require("electron");
const { fileURLToPath } = require("node:url");

let lastDroppedFilePaths = [];

function dedupePaths(paths) {
  return Array.from(new Set((paths || []).filter(Boolean)));
}

function getFilePath(file) {
  if (!file) return "";
  try {
    return webUtils.getPathForFile(file);
  } catch {
    return "";
  }
}

function getPathsFromFiles(files) {
  return Array.from(files || []).map(getFilePath).filter(Boolean);
}

function getPathsFromItems(items) {
  return Array.from(items || [])
    .map((item) => (typeof item?.getAsFile === "function" ? getFilePath(item.getAsFile()) : ""))
    .filter(Boolean);
}

function normalizeDroppedPath(value) {
  const text = String(value || "").trim();
  if (!text || text.startsWith("#")) return "";
  if (text.startsWith("file://")) {
    try {
      return fileURLToPath(text);
    } catch {
      return "";
    }
  }
  if (text.startsWith("/") || /^[A-Za-z]:[\\/]/.test(text)) return text;
  return "";
}

function getPathsFromTransferText(dataTransfer) {
  if (!dataTransfer || typeof dataTransfer.getData !== "function") return [];
  const types = ["text/uri-list", "text/plain", ...Array.from(dataTransfer.types || [])];
  return types.flatMap((type) => {
    try {
      return String(dataTransfer.getData(type) || "")
        .split(/\r?\n/)
        .map(normalizeDroppedPath)
        .filter(Boolean);
    } catch {
      return [];
    }
  });
}

function getPathsFromDataTransfer(dataTransfer) {
  if (!dataTransfer) return [];
  return dedupePaths([
    ...getPathsFromFiles(dataTransfer.files),
    ...getPathsFromItems(dataTransfer.items),
    ...getPathsFromTransferText(dataTransfer),
  ]);
}

function rememberDroppedFilePaths(event) {
  const paths = getPathsFromDataTransfer(event?.dataTransfer);
  if (paths.length) lastDroppedFilePaths = paths;
}

window.addEventListener("drop", rememberDroppedFilePaths, true);

contextBridge.exposeInMainWorld("deerRecallDesktop", {
  getTalentLibrary: () => ipcRenderer.invoke("library:get"),
  selectImportFolder: () => ipcRenderer.invoke("import:select-folder"),
  selectImportFiles: () => ipcRenderer.invoke("import:select-files"),
  importPaths: (paths) => ipcRenderer.invoke("import:paths", paths),
  getDroppedFilePaths: (files) => dedupePaths([...getPathsFromFiles(files), ...lastDroppedFilePaths]),
  consumeDroppedFilePaths: () => {
    const paths = lastDroppedFilePaths.slice();
    lastDroppedFilePaths = [];
    return paths;
  },
  openResumeFile: (filePath) => ipcRenderer.invoke("resume:open-file", filePath),
  showResumeInFolder: (filePath) => ipcRenderer.invoke("resume:show-in-folder", filePath),
});
