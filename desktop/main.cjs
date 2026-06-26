const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("node:path");
const {
  importFolderToLibrary,
  loadLibrary,
} = require("./local-library.cjs");

function getDatabasePath() {
  return path.join(app.getPath("userData"), "talent-library.json");
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

ipcMain.handle("library:get", async () => {
  return loadLibrary(getDatabasePath());
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
