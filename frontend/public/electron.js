const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

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

function loadReceiptTemplates() {
  // Load all receipt templates from templates directory
  const templatesDir = path.join(__dirname, "templates");
  
  try {
    const files = fs.readdirSync(templatesDir);
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const templatePath = path.join(templatesDir, file);
        const template = require(templatePath);
        
        // Register template with its name
        const templateName = file.replace('.js', '');
        thermalPrinter.registerTemplate(templateName, template.receiptTemplate);
      }
    });
  } catch (error) {
    console.error("Error loading templates:", error);
  }
}

app.whenReady().then(() => {
  createWindow();
  thermalPrinter.initialize();
  loadReceiptTemplates(); // Load all templates on startup
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- THERMAL PRINTER HANDLERS ---

ipcMain.handle("printReceipt", async (event, { saleData, translations, templateName }) => {
  try {
    // Create translation function
    const t = (key) => {
      const keys = key.split('.');
      let value = translations;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    };

    // Print using specified template (defaults to 'standard')
    return await thermalPrinter.printReceipt(
      saleData, 
      t, 
      templateName || 'ReceiptTemplate'
    );
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

// Get list of available templates
ipcMain.handle("getAvailableTemplates", async () => {
  try {
    const templatesDir = path.join(__dirname, "templates");
    const files = fs.readdirSync(templatesDir);
    
    const templates = files
      .filter(f => f.endsWith('.js'))
      .map(f => f.replace('.js', ''));
    
    return { success: true, templates };
  } catch (error) {
    return { success: false, error: error.message, templates: [] };
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