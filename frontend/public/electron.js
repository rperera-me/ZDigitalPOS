const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const localdb = require(path.join(__dirname, "localdb.js"));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    kiosk: true,            // Enables kiosk mode - full screen, no exit bar
    frame: false,           // Removes OS window frame (title bar and controls)
    resizable: false,       // Prevent window resize
    fullscreen: true,       // Fullscreen mode
    movable: false,         // Prevent moving window
    skipTaskbar: true,      // Don't show in taskbar
    alwaysOnTop: false,      // Window always on top
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  //win.loadURL("http://localhost:3000");
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error("❌ LOAD FAILED");
    console.error("Error Code:", errorCode);
    console.error("Description:", errorDescription);
    console.error("URL:", validatedURL);
    console.error("__dirname:", __dirname);
    console.error("index.html exists?", require("fs").existsSync(path.join(__dirname, "index.html")));
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Add logging to verify paths
console.log("App Path:", app.getAppPath());
console.log("__dirname:", __dirname);
console.log("index.html Path:", path.join(__dirname, "index.html"));

// --- IPC HANDLERS FOR OFFLINE SALES SYNC ---
ipcMain.on("saveSale", (event, salePayload) => {
  localdb.saveOfflineSale(salePayload);
});

ipcMain.on("syncSales", async (event) => {
  const unsyncedSales = localdb.getUnsyncedSales();
  for (const sale of unsyncedSales) {
    try {
      const response = await fetch("http://localhost:5000/api/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: sale.payload,
      });
      if (response.ok) {
        localdb.markSaleAsSynced(sale.id);
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  }
  event.sender.send("syncComplete");
});

ipcMain.on("cacheProducts", (event, products) => {
  localdb.cacheProducts(products);
});

ipcMain.handle("getCachedProducts", async () => {
  return localdb.getCachedProducts();
});

console.log("App Path:", app.getAppPath());
console.log("Index Path:", path.join(__dirname, "index.html"));