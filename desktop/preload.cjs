const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deerRecallDesktop", {
  getTalentLibrary: () => ipcRenderer.invoke("library:get"),
  selectImportFolder: () => ipcRenderer.invoke("import:select-folder"),
});
