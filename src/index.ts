import path from "path";
import fs from "fs";
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { Settings } from "./types";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const settingsFile = path.join(app.getPath("userData"), "settings.json");
console.debug("Settings file:", settingsFile);
let settings: Settings = { servers: [] };

if (fs.existsSync(settingsFile)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
    console.debug("Loaded Settings:", settings);
  } catch (e) {
    console.error("Error reading settings file", e);
  }
}

console.debug("temp", app.getPath("temp"));

const createWindow = (): void => {
  const showDevTools = !!process.env["GMN_SHOW_DEV_TOOLS"] ?? false;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: showDevTools ? 1369 : 800,
    autoHideMenuBar: true,
    icon: "./images/icon.png",
    title: "GM's Notebook Local Server",
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: [
        "--settings=" + JSON.stringify(settings),
        "--tempdir=" + app.getPath("temp"),
      ],
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  if (showDevTools) mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

async function chooseFolder(): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled) {
    return;
  }
  return result.filePaths[0];
}

ipcMain.on("choose-folder", async (event) => {
  const path = await chooseFolder();
  if (path) {
    event.sender.send("folder-chosen", path);
  } else {
    event.sender.send("folder-choose-cancelled");
  }
});

ipcMain.on("save-settings", (event, arg) => {
  settings = arg;
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  console.debug("Saved Settings:", settings);
});
