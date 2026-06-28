const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const localdb = require(path.join(__dirname, "localdb.js"));
const thermalPrinter = require(path.join(__dirname, "thermalPrinterService.js"));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    kiosk: true,
    frame: false,
    resizable: false,
    fullscreen: true,
    movable: false,
    skipTaskbar: false,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  thermalPrinter.initialize();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- THERMAL PRINTER HANDLERS ---

// Receive pre-rendered HTML from the React receipt view and convert to ESC/POS
ipcMain.handle("printReceipt", async (event, { renderedHtml }) => {
  try {
    return await thermalPrinter.printRenderedHtml(renderedHtml);
  } catch (error) {
    console.error("Print error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("testPrinter", async () => {
  try {
    const isConnected = await thermalPrinter.isConnected();
    return { success: isConnected };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- OFFLINE SALES SYNC HANDLERS ---
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