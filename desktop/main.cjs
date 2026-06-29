const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const {
  importFolderToLibrary,
  importPathsToLibrary,
  loadLibrary,
} = require("./local-library.cjs");

function getDatabasePath() {
  return path.join(app.getPath("userData"), "talent-library.json");
}

function getReadableFilePath(filePath) {
  if (!filePath || typeof filePath !== "string") return null;
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() ? filePath : null;
  } catch {
    return null;
  }
}

function getExistingImportPath(filePath) {
  if (!filePath || typeof filePath !== "string") return null;
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() || stat.isDirectory() ? filePath : null;
  } catch {
    return null;
  }
}

function getCommonSourcePath(paths) {
  if (!paths.length) return app.getPath("home");
  if (paths.length === 1) {
    const stat = fs.statSync(paths[0]);
    return stat.isDirectory() ? paths[0] : path.dirname(paths[0]);
  }
  return path.dirname(paths[0]);
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    title: "DeerRecall",
    backgroundColor: "#070712",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

ipcMain.handle("import:select-folder", async (event) => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    title: "选择简历文件夹",
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) return null;

  const folderPath = result.filePaths[0];
  return importFolderToLibrary({
    folderPath,
    databasePath: getDatabasePath(),
  });
});

ipcMain.handle("import:select-files", async (event) => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    title: "选择简历文件",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "简历文件", extensions: ["pdf", "doc", "docx", "txt", "md", "markdown"] },
      { name: "所有文件", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths.length) return null;

  const paths = result.filePaths.map(getExistingImportPath).filter(Boolean);
  if (!paths.length) return null;
  return importPathsToLibrary({
    paths,
    databasePath: getDatabasePath(),
    sourceName: paths.length === 1 ? path.basename(paths[0]) : "本地选择文件",
    sourcePath: getCommonSourcePath(paths),
    importType: "文件导入",
    type: "文件",
  });
});

ipcMain.handle("import:paths", async (_event, droppedPaths) => {
  const paths = Array.isArray(droppedPaths) ? droppedPaths.map(getExistingImportPath).filter(Boolean) : [];
  if (!paths.length) return null;
  return importPathsToLibrary({
    paths,
    databasePath: getDatabasePath(),
    sourceName: paths.length === 1 ? path.basename(paths[0]) : "拖拽导入",
    sourcePath: getCommonSourcePath(paths),
    importType: "拖拽导入",
  });
});

ipcMain.handle("library:get", async () => {
  return loadLibrary(getDatabasePath());
});

ipcMain.handle("resume:open-file", async (_event, filePath) => {
  const readablePath = getReadableFilePath(filePath);
  if (!readablePath) return { ok: false, message: "原文件不存在或不可读取" };
  filePath = readablePath;
  const errorMessage = await shell.openPath(filePath);
  return errorMessage ? { ok: false, message: errorMessage } : { ok: true };
});

ipcMain.handle("resume:show-in-folder", async (_event, filePath) => {
  const readablePath = getReadableFilePath(filePath);
  if (!readablePath) return { ok: false, message: "原文件不存在或不可读取" };
  filePath = readablePath;
  shell.showItemInFolder(filePath);
  return { ok: true };
});

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
