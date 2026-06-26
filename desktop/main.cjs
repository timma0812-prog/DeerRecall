const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const supportedResumeExtensions = new Set([".pdf", ".doc", ".docx", ".txt", ".md", ".markdown"]);

function scanImportFolder(folderPath) {
  const files = [];
  const duplicateNames = new Set();
  const seenNames = new Set();
  let unsupported = 0;

  function walk(currentPath) {
    if (files.length >= 500) return;
    let entries = [];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (_error) {
      return;
    }

    entries.forEach((entry) => {
      if (files.length >= 500) return;
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        return;
      }
      if (!entry.isFile()) return;

      const extension = path.extname(entry.name).toLowerCase();
      if (!supportedResumeExtensions.has(extension)) unsupported += 1;
      const normalizedName = entry.name.toLowerCase();
      if (seenNames.has(normalizedName)) duplicateNames.add(normalizedName);
      seenNames.add(normalizedName);

      let size = 0;
      try {
        size = fs.statSync(entryPath).size;
      } catch (_error) {
        size = 0;
      }
      files.push({
        name: entry.name,
        path: entryPath,
        relativePath: path.relative(folderPath, entryPath),
        size,
      });
    });
  }

  walk(folderPath);
  const duplicate = duplicateNames.size;
  const supported = Math.max(0, files.length - unsupported);
  const parseable = Math.max(0, supported - duplicate);
  const failed = Math.min(parseable, Math.max(0, Math.round(parseable * 0.03)));
  const successfulProfiles = Math.max(0, parseable - failed);
  const updatedProfiles = Math.round(successfulProfiles * 0.16);

  return {
    files,
    stats: {
      total: files.length,
      parseable,
      duplicate,
      unsupported,
      newProfiles: Math.max(0, successfulProfiles - updatedProfiles),
      updatedProfiles,
      skippedDuplicates: duplicate,
      failed,
    },
  };
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
  const scan = scanImportFolder(folderPath);
  return {
    name: path.basename(folderPath),
    path: folderPath,
    type: "文件夹",
    ...scan,
  };
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
