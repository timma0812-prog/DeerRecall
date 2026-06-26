const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deerRecallDesktop", {
  selectImportFolder: () => ipcRenderer.invoke("import:select-folder"),
});
