const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Import the localdb functions (adjust path as necessary)
const localdb = require(path.join(__dirname, "..", "build", "localdb.js"));

function createWindow() {
  const win = new BrowserWindow({
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

  //win.loadFile(path.join(__dirname, "..", "build", "index.html"));
  win.loadURL("http://localhost:3000");
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC HANDLERS FOR OFFLINE SALES SYNC ---
// Save sale offline
ipcMain.on("saveSale", (event, salePayload) => {
  localdb.saveOfflineSale(salePayload);
  // Optionally, send back a response: event.reply('saveSaleComplete');
});

// Sync offline sales when online
ipcMain.on("syncSales", async (event) => {
  const unsyncedSales = localdb.getUnsyncedSales();
  for (const sale of unsyncedSales) {
    try {
      // Send to backend API (replace URL below!)
      const response = await fetch("http://localhost:5000/api/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: sale.payload,
      });
      if (response.ok) {
        localdb.markSaleAsSynced(sale.id);
      }
    } catch (err) {
      // Handle sync error, optional logging
    }
  }
  event.sender.send("syncComplete");
});

// Cache products from server
ipcMain.on("cacheProducts", (event, products) => {
  localdb.cacheProducts(products);
  // Optional: event.reply('cacheProductsComplete');
});

// Get cached products for offline use
ipcMain.handle("getCachedProducts", async () => {
  return localdb.getCachedProducts();
});