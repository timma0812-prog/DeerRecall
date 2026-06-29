const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("deerRecallDesktop", {
  getTalentLibrary: () => ipcRenderer.invoke("library:get"),
  selectImportFolder: () => ipcRenderer.invoke("import:select-folder"),
  selectImportFiles: () => ipcRenderer.invoke("import:select-files"),
  importPaths: (paths) => ipcRenderer.invoke("import:paths", paths),
  getDroppedFilePaths: (files) => Array.from(files || []).map((file) => webUtils.getPathForFile(file)).filter(Boolean),
  openResumeFile: (filePath) => ipcRenderer.invoke("resume:open-file", filePath),
  showResumeInFolder: (filePath) => ipcRenderer.invoke("resume:show-in-folder", filePath),
});
