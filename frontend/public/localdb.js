const Database = require("better-sqlite3");
const path = require("path");
const os = require("os");

const dbPath = path.join(os.homedir(), "my-pos-offline.db");
const db = new Database(dbPath, { fileMustExist: false });

// Initialize tables
db.exec(`
CREATE TABLE IF NOT EXISTS offline_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payload TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cached_products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  price REAL,
  categoryId INTEGER
);
`);

function saveOfflineSale(saleData) {
  const stmt = db.prepare("INSERT INTO offline_sales (payload) VALUES (?)");
  stmt.run(JSON.stringify(saleData));
}

function getUnsyncedSales() {
  const stmt = db.prepare("SELECT * FROM offline_sales WHERE synced = 0");
  return stmt.all();
}

function markSaleAsSynced(id) {
  const stmt = db.prepare("UPDATE offline_sales SET synced = 1 WHERE id = ?");
  stmt.run(id);
}

// Caching products for offline usage
function cacheProducts(products) {
  const insert = db.prepare("INSERT OR REPLACE INTO cached_products (id, name, price, categoryId) VALUES (@id, @name, @price, @categoryId)");
  const insertMany = db.transaction((products) => {
    for (const product of products) insert.run(product);
  });
  insertMany(products);
}

function getCachedProducts() {
  const stmt = db.prepare("SELECT * FROM cached_products");
  return stmt.all();
}

module.exports = {
  saveOfflineSale,
  getUnsyncedSales,
  markSaleAsSynced,
  cacheProducts,
  getCachedProducts
};
