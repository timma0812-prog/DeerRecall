const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deerRecallDesktop", {
  getTalentLibrary: () => ipcRenderer.invoke("library:get"),
  selectImportFolder: () => ipcRenderer.invoke("import:select-folder"),
  openResumeFile: (filePath) => ipcRenderer.invoke("resume:open-file", filePath),
  showResumeInFolder: (filePath) => ipcRenderer.invoke("resume:show-in-folder", filePath),
});
