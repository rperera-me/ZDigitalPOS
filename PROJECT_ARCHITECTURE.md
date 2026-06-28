# ZDigitalPOS — Project Architecture & Working Reference

> **This is a living document.** Update it after every bug fix, feature addition, or architectural decision.
> Treat it like CLAUDE.md — the first thing to read before touching any code, and the last thing to update after finishing.

---

## Last Updated
2026-06-29 — Kg/Unit pricing split in AdminProducts & ProductUpdateModal; int→decimal DTO fixes; scroll-wheel & outside-click UI conventions

---

## Change Log

| Date | Area | What Changed | Files |
|---|---|---|---|
| 2026-06-27 | Sale / Backend | `SaleItemDto` — added `RegularPrice` (MRP/product price, sourced from batch at save time); `SaleDto` — added `InvoiceNo` and `CashierName` | `api/POS/Application/DTOs/SaleItemDto.cs`, `SaleDto.cs` |
| 2026-06-27 | Sale / Backend | `CreateSaleCommandHandler` — now tracks product name and batch `ProductPrice` per item during stock deduction; generates `InvoiceNo = INV-{yyyy-MM}-{id:D6}` from confirmed DB id; fetches cashier name; returns fully enriched `SaleDto` | `api/POS/Application/Handlers/Command/CreateSaleCommandHandler.cs` |
| 2026-06-27 | Sale / Frontend | `CashierPage.onPay` — fixed payload to send `batchId` (was `sourceId`, caused batch deduction to silently never run); receipt now built entirely from `response.data` (not frontend payload) | `frontend/src/pages/CashierPage.js` |
| 2026-06-27 | GRN / Backend | `GetAllGRNsQueryHandler`, `GetGRNByIdQueryHandler`, `GetGRNsBySupplierQueryHandler` — added `PaymentStatus`, `PaidAmount`, `CreditAmount`, `PaymentType`, `PaymentDate`, `ChequeNumber`, `ChequeDate`, `PaymentNotes` to DTO mapping (were always returning defaults) | `api/POS/Application/Handlers/Query/Get*GRN*.cs` |
| 2026-06-27 | GRN / Backend | `UpdateGRNPaymentStatusCommandHandler` — fixed `RecordedByName` on each payment DTO (was using GRN receiver's user instead of each payment's own `RecordedBy` user). Also added missing payment fields to the returned GRNDto | `api/POS/Application/Handlers/Command/UpdateGRNPaymentStatusCommandHandler.cs` |
| 2026-06-27 | GRN / Frontend | `ViewGRNModal` — split single `useEffect([isOpen, grn])` into two: `fetchPayments` only on `isOpen`, payment amount pre-fill on `isOpen + grn.paidAmount` — prevents redundant double-fetch and unwanted form resets | `frontend/src/components/modals/ViewGRNModal.js` |
| 2026-06-27 | Sale / Backend (query) | `GetSaleByIdQueryHandler`, `GetSalesByDateRangeQueryHandler`, `GetSalesByCashierQueryHandler`, `SaleController.GetLastSale` — all now return `InvoiceNo`, `CashierName`, `RegularPrice` and look up product names; cashier batch-loaded in date-range handler to avoid N+1 | `api/POS/Application/Handlers/Query/GetSale*.cs`, `SaleController.cs` |
| 2026-06-27 | Bill Reprint / Last Bill / Today Sales | `CashierPage.handleViewLastSale` — fixed `cashier` field to read `cashierName`; normalized `saleItems` (`productName→name`, `regularPrice` fallback). `onReprintSale` — same fixes. `<TodaySalesPage>` — now receives `onPrintSale` callback that opens `ReceiptModal`. `TodaySalesPage.handlePrintReceipt` — now calls `onPrintSale` instead of re-opening `LastSaleModal`. `BillReprintModal` — shows `invoiceNo` instead of `#id`; search parses full `INV-YYYY-MM-NNNNNN` format | `frontend/src/pages/CashierPage.js`, `TodaySalesPage.js`, `frontend/src/components/modals/BillReprintModal.js` |
| 2026-06-27 | Receipt / Date | `ReceiptView.js` — fixed `saleData.date` → `saleData.saleDate \|\| saleData.date` (was always "Invalid Date" for any reprint/last-bill). `ReceiptTemplate.js` — wrapped savings section in `{{#if savings}}` guard so it hides when no savings | `frontend/src/components/receipt/ReceiptView.js`, `ReceiptTemplate.js` |
| 2026-06-27 | Sale listing / Date range | `TodaySalesPage` and `BillReprintModal` — replaced `.toISOString()` (UTC) with local ISO string helper. Fixes missing sales: backend stores `DateTime.Now` (local); UTC ISO queries caused sales after ~18:30 IST to be excluded | `frontend/src/pages/TodaySalesPage.js`, `frontend/src/components/modals/BillReprintModal.js` |
| 2026-06-27 | Savings / Reprint | `GetSaleByIdQueryHandler`, `GetSalesByDateRangeQueryHandler`, `GetSalesByCashierQueryHandler`, `SaleController.GetLastSale` — injected `IProductBatchRepository`; now loads `batch.ProductPrice` as `RegularPrice` for each sale item (batch IDs batch-loaded in a dict per call). Savings now correctly computes for all historical receipt views | `api/POS/Application/Handlers/Query/GetSale*.cs`, `api/POS/Controllers/SaleController.cs` |
| 2026-06-28 | GRN / Frontend | `ViewGRNModal` — fixed stale-closure bug where `useEffect([isOpen])` captured the previous GRN in its closure. Root cause: `setGrn(initialGRN)` from a separate `useEffect([initialGRN])` didn't take effect until the next render, so `fetchPayments()` always ran with the old GRN id. Fix: merged into one effect on `[isOpen, initialGRN?.id]`; `fetchPayments` now accepts an explicit `grnId` param so it never reads stale state. Also clears `payments` and resets all form state on every open/close | `frontend/src/components/modals/ViewGRNModal.js` |
| 2026-06-28 | Customer / Frontend | `CashierPage.handleCustomerTypeChange` — now always clears `currentCustomer` on any type switch (was only clearing for walk-in); also refreshes `customers` list from API on switch so credit balances and loyalty points are current. Customer dropdown `onChange` now fetches `/customer/{id}` for live data on each selection, with cached fallback | `frontend/src/pages/CashierPage.js` |
| 2026-06-28 | Cart / Frontend | `posSlice` — added `repriceCart` action: updates all `saleItems[].price` to `wholesalePrice` or `sellingPrice` depending on the dispatched `customerType`. `addSaleItem` payload now also stores `sellingPrice` and `wholesalePrice` alongside `price` so repricing has both values without extra API calls. `CashierPage.addToCart` — extended signature to accept and forward both prices. All `addToCart` call sites (barcode scan, price-select modal, `onAddProduct` all paths) updated. `handleCustomerTypeChange` — dispatches `repriceCart` when cart is non-empty. Cart table header shows "Wholesale" or "Selling" dynamically | `frontend/src/app/posSlice.js`, `frontend/src/pages/CashierPage.js` |
| 2026-06-28 | Store Settings / Frontend | **New `settingsSlice.js`** — Redux slice that initialises from `localStorage` (`zdigitalpos_store_settings`) with fallback to static `storeSettings.js` defaults. Fields: `storeName`, `storeAddress`, `storeContact`, `currency`, `receiptLanguage`, `defaultReceiptTemplate`, `storeLogo` (base64), `paperWidth` (58mm/80mm/auto). `saveSettings` action persists both to Redux and localStorage in one dispatch. **New `AdminSettingsPage.js`** — three-section form (Store Information, Bill Logo with canvas-compressed upload/preview/remove, Receipt Settings with paper size/language/template selectors). **`AdminPage.js`** — added "Settings" tab. **`CashierPage.js`, `TodaySalesPage.js`, `DashboardPage.js`** — removed static `storeSettings.js` import; now use `useSelector(state => state.settings)`. **`LastSaleModal.js`** — reads settings from Redux internally; `storeSetting` prop removed. All receipt data build sites in CashierPage now include `storeLogo`. **`ReceiptTemplate.js`** — logo changed from hardcoded `<img src="logo192.png">` to `{{#if storeLogo}}<img src="{{{storeLogo}}}">{{/if}}` (triple braces to avoid HTML-escaping the base64 data URL). **`ReceiptView.js`** — passes `storeLogo` from `saleData` to template; applies `paperWidth` as inline style override when set to non-default value | `frontend/src/app/settingsSlice.js` (new), `frontend/src/app/store.js`, `frontend/src/pages/AdminSettingsPage.js` (new), `frontend/src/pages/AdminPage.js`, `frontend/src/pages/CashierPage.js`, `frontend/src/pages/TodaySalesPage.js`, `frontend/src/pages/DashboardPage.js`, `frontend/src/components/modals/LastSaleModal.js`, `frontend/src/components/receipt/templates/ReceiptTemplate.js`, `frontend/src/components/receipt/ReceiptView.js` |
| 2026-06-28 | Settings / Routing | `/settings` route missing from `App.js` (NavigationBar linked to `/settings` but no route existed → 404). Added `/settings` route rendering `AdminSettingsPage` inside `ProtectedRoute` + `MainLayout` | `frontend/src/App.js` |
| 2026-06-28 | Receipt / Template cleanup | **Deleted `public/templates/ReceiptTemplate.js` and `public/templates/MinimalReceiptTemplate.js`** — these were an unused duplicate of `src/components/receipt/templates/`. Root problem: files used ES module `export` syntax but `electron.js` loaded them via CommonJS `require()`, which always threw a SyntaxError (caught silently), so templates were never registered and thermal printing always failed with "Template not found". `MinimalReceiptTemplate` also exported `minimalReceiptTemplate` while `electron.js` looked for `.receiptTemplate`. **Refactored thermal print path**: `htmlToEscposConverter.js` — `convert(htmlTemplate, data)` → `convert(renderedHtml)` (Handlebars compile step removed; accepts pre-rendered HTML directly). `thermalPrinterService.js` — removed template Map, `registerTemplate`, `getTemplate`, `formatReceiptData`; added `printRenderedHtml(renderedHtml)`. `electron.js` — removed `loadReceiptTemplates()`, `fs` import, `getAvailableTemplates` IPC; `printReceipt` IPC now receives `{ renderedHtml }` and calls `thermalPrinter.printRenderedHtml()`. `ReceiptPreviewModal.js` — removed `getAvailableTemplates` effect and template-selector UI; `handleThermalPrint` now reads `ref.current.innerHTML` for the pre-rendered HTML. `copy-electron-files.js` — removed `public/templates` → `build/templates` copy block | `frontend/public/templates/` (deleted), `frontend/public/htmlToEscposConverter.js`, `frontend/public/thermalPrinterService.js`, `frontend/public/electron.js`, `frontend/src/components/modals/ReceiptPreviewModal.js`, `frontend/copy-electron-files.js` |
| 2026-06-28 | Receipt / Print — dual path & translation | **Dual print path**: `ReceiptPreviewModal` now detects runtime environment via `!!window.electronAPI`. Electron (kiosk .exe) → sends `ref.current.innerHTML` via `window.electronAPI.printReceipt({ renderedHtml })` for ESC/POS thermal printing. Web browser → calls `window.print()`; `@media print` CSS hides everything except `.receipt-preview`. **Translation toggle fix**: `ReceiptView.useMemo` now includes `i18n.language` as a dependency — `t` is a stable reference in i18next so the memo never recomputed on language change; `i18n.language` is a string that changes, forcing the Handlebars template to recompile with the new language. **Dynamic `@page` size**: `ReceiptView` injects a `<style id="receipt-page-size">` into `<head>` via `useEffect([paperWidth])` with the correct `@page { size: ... }` rule; removes the hardcoded `80mm` from static CSS. **Print CSS fixes**: `.receipt-preview` changed from `position: absolute` to `position: fixed` (absolute was relative to the modal dialog, not the page origin); `.ReactModal__Overlay` and `.ReactModal__Content` given `background: transparent` so the dark modal backdrop doesn't print as a black page | `frontend/src/components/modals/ReceiptPreviewModal.js`, `frontend/src/components/receipt/ReceiptView.js`, `frontend/src/components/receipt/ReceiptView.css` |
| 2026-06-28 | Products / MeasureType & Scale | **`MeasureType` column** (NVARCHAR(20), default `'Unit'`) added to `Products` table. Values: `"Unit"` (whole items) and `"Kg"` (scale/weight, allows decimals). **Quantity columns changed from INT to DECIMAL(10,3)**: `Products.StockQuantity`, `ProductBatches.Quantity`, `ProductBatches.RemainingQuantity`, `SaleItems.Quantity`. **C# type changes**: `Product.StockQuantity`, `ProductBatch.Quantity/RemainingQuantity`, `SaleItem.Quantity`, `SaleItemDto.Quantity`, `ProductBatchDto.Quantity/RemainingQuantity`, `GRNItemDto.Quantity` all changed from `int` → `decimal`. **Commands updated**: `CreateProductCommand` and `UpdateProductCommand` — added `MeasureType`, changed `StockQuantity` to `decimal`. **All ProductDto mapping sites** (5 query handlers + 2 command handlers) — added `MeasureType`. **ProductRepository** — `MeasureType` added to all SELECT/INSERT/UPDATE SQL; `GRNRepository` quantity math works unchanged (decimal arithmetic). **Admin Products form**: `MeasureType` radio selector (📦 Unit / ⚖️ Kg) added to Add Product form; stock quantity input adapts `step` and placeholder based on type; product list table shows type badge. **Cashier weight flow**: Kg products always open `WeightInputModal` (even on barcode scan); unit products use existing flow unchanged. `addToCart` now accepts and stores `measureType` in each sale item. Cart displays kg items as `x.xxx kg` (read-only, no +/− buttons). Product cards show `⚖️kg` badge for scale products. **New `WeightInputModal`** — orange-themed modal with on-screen numpad + keyboard input; auto-focuses text field on open; Enter confirms, Escape cancels. **`PriceSelectionModal`** — now accepts `measureType` prop; when Kg: decimal weight input instead of integer stepper, labels say "Weight (kg)", stock check skipped. **SQL migration required** (run manually) | `api/POS/Domain/Entities/Product.cs`, `ProductBatch.cs`, `SaleItem.cs`, `api/POS/Application/DTOs/ProductDto.cs`, `ProductBatchDto.cs`, `SaleItemDto.cs`, `GRNDto.cs`, `api/POS/Application/Commands/Products/CreateProductCommand.cs`, `UpdateProductCommand.cs`, `api/POS/Application/Handlers/Command/CreateProductCommandHandler.cs`, `UpdateProductCommandHandler.cs`, `api/POS/Application/Handlers/Query/Get*ProductsQueryHandler.cs` (5 files), `api/POS/Infrastructure/Repositories/ProductRepository.cs`, `frontend/src/pages/AdminProductsPage.js`, `frontend/src/pages/CashierPage.js`, `frontend/src/components/modals/WeightInputModal.js` (new), `frontend/src/components/modals/PriceSelectionModal.js`, `frontend/src/components/modals/index.js` |
| 2026-06-28 | Products / Best Selling | **Backend**: Added `IsBestSelling BIT NOT NULL DEFAULT 0` column to `Products` table (manual SQL migration required). `Product.cs` entity + `ProductDto.cs` — added `IsBestSelling` property. `ProductRepository` — `IsBestSelling` included in all SELECT/INSERT/UPDATE queries; new `GetBestSellingAsync()` and `SetBestSellingAsync()` methods. `IProductRepository` — two new method signatures. `UpdateProductCommand` + handler — pass `IsBestSelling` through. **New `GetBestSellingProductsQuery` + handler** — returns only products with `IsBestSelling = 1`. **New `SetBestSellingCommand` + handler** — updates a single product's flag. **`ProductController`** — `GET /api/product/best-selling` and `PATCH /api/product/{id}/best-selling`. **Frontend (Cashier)**: Category dropdown gains `⭐ Best Selling` as the first option (value `"best-selling"`). Initial load dispatches `setCategoryId("best-selling")` instead of `null`. Product fetch `useEffect` handles three cases: `"best-selling"` → `/product/best-selling`, numeric id → `/product/category/{id}`, null → `/product` (all). **Frontend (Admin Products)**: New "Best Selling" column in the product table — a ★ star button per row; yellow when `isBestSelling`, grey when not. Clicking calls `PATCH /product/{id}/best-selling` then refreshes the product list | `api/POS/Domain/Entities/Product.cs`, `api/POS/Application/DTOs/ProductDto.cs`, `api/POS/Domain/Repositories/IProductRepository.cs`, `api/POS/Infrastructure/Repositories/ProductRepository.cs`, `api/POS/Application/Commands/Products/UpdateProductCommand.cs`, `api/POS/Application/Commands/Products/SetBestSellingCommand.cs` (new), `api/POS/Application/Handlers/Command/SetBestSellingCommandHandler.cs` (new), `api/POS/Application/Handlers/Command/UpdateProductCommandHandler.cs`, `api/POS/Application/Queries/Products/GetBestSellingProductsQuery.cs` (new), `api/POS/Application/Handlers/Query/GetBestSellingProductsQueryHandler.cs` (new), `api/POS/Controllers/ProductController.cs`, `frontend/src/pages/CashierPage.js`, `frontend/src/pages/AdminProductsPage.js` |
| 2026-06-29 | API / Decimal type fixes | `GRNItem.Quantity` changed from `int` to `decimal` in `GRN.cs` entity (missed in original int→decimal migration — caused build error in `CreateGRNCommandHandler`). DTO fixes: `LowStockItemDto.Available` int→decimal (assigned from `Product.StockQuantity`); `ProductPriceVariantDto.TotalStock` int→decimal (assigned from `g.Sum(b => b.RemainingQuantity)`); `PriceVariantSourceDto.Stock` int→decimal (assigned from `b.RemainingQuantity`); `BestSellerDto.Qty` int→decimal (Dapper maps `SUM(si.Quantity)` which returns decimal when column is DECIMAL); `CustomerPurchaseDto.ItemCount` int→decimal (assigned from `sale.SaleItems?.Sum(si => si.Quantity)`). **SQL migration also required**: `ALTER TABLE GRNItems ALTER COLUMN Quantity DECIMAL(10,3) NOT NULL` | `api/POS/Domain/Entities/GRN.cs`, `api/POS/Application/DTOs/LowStockItemDto.cs`, `api/POS/Application/DTOs/ProductDto.cs`, `api/POS/Application/DTOs/BestSellerDto.cs`, `api/POS/Application/DTOs/CustomerDto.cs` |
| 2026-06-29 | UI / Scroll-wheel & outside-click conventions | All `<input type="number">` fields across the app now have `onWheel={(e) => e.target.blur()}` to prevent the mouse wheel from accidentally changing values when the field is focused. All popup dialogs (overlay + inner card pattern) except `PaymentModal` now close when the user clicks the backdrop: outer overlay div gets `onClick={closeFunc}`, inner dialog div gets `onClick={(e) => e.stopPropagation()}`. `ReceiptPreviewModal` excluded (uses `react-modal` library). `PaymentModal` excluded by design | `frontend/src/pages/AdminProductsPage.js`, `AdminCustomersPage.js`, `TodaySalesPage.js`, `GRNPage.js`, `frontend/src/components/modals/WeightInputModal.js`, `ViewGRNModal.js`, `PaymentModal.js`, `PriceSelectionModal.js`, `ProductUpdateModal.js`, `AddCustomerModal.js`, `HeldSalesModal.js`, `BillReprintModal.js`, `LastSaleModal.js`, `SupplierGRNsModal.js`, `ViewCustomerPurchasesModal.js` |
| 2026-06-29 | GRN / Admin Products / ProductUpdateModal — Kg pricing | **GRN page**: "Selling Price (MRP)" field renamed "Unit Price (MRP)" and hidden entirely for Kg products (`isKgProduct` derived from selected product's `measureType`). Validation skips `productPrice` for Kg items; `newItem.productPrice` is set to `0` for Kg. **Admin Products Add form**: label dynamically shows "Kg Price (MRP)" or "Unit Price (MRP)" based on `measureType` radio. **View modal**: Kg products show a single orange summary card (Kg Price, Selling Price/kg, Wholesale Price/kg, Total Stock in kg) instead of the per-variant batch breakdown. Unit products keep the existing variant list with label updated to "Unit Price (MRP)". **ProductUpdateModal Edit flow**: Kg products show a single global pricing section — three editable fields (Kg Price/MRP, Selling Price/kg, Wholesale Price/kg); saving calls `PUT /product/batches/{id}` for every batch in `Promise.all` so all batches get the same prices simultaneously. Unit products keep the existing per-batch edit-in-place flow. Labels throughout updated to "Unit Price (MRP)" / "Unit Price / MRP (Read-Only)" for Unit products | `frontend/src/pages/GRNPage.js`, `frontend/src/pages/AdminProductsPage.js`, `frontend/src/components/modals/ProductUpdateModal.js` |

---

## Overview

ZDigitalPOS is a production-grade Point of Sale desktop application for retail and wholesale businesses. Monorepo structure with:
- **Backend**: ASP.NET Core 9.0 REST API (Clean Architecture + CQRS)
- **Frontend**: Electron 38 + React 19 desktop app
- **Database**: SQL Server (LocalDB in dev)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | ASP.NET Core 9.0 Web API |
| Backend Language | C# (.NET 9.0) |
| Data Access | Dapper (lightweight ORM, raw SQL — no EF migrations) |
| CQRS Mediator | MediatR 13.0.0 |
| Authentication | JWT Bearer Tokens |
| Real-time | SignalR (`/posHub`) |
| API Docs | Swagger / OpenAPI |
| Database | Microsoft SQL Server (LocalDB for dev: `pos_db`) |
| Frontend Framework | React 19.2.0 |
| Desktop Shell | Electron 38.4.0 |
| State Management | Redux Toolkit 2.9.1 |
| Routing | React Router 7.9.4 |
| Styling | Tailwind CSS 3.3.5 |
| HTTP Client | Axios 1.12.2 (with JWT interceptor) |
| Offline Database | better-sqlite3 12.4.1 (SQLite) |
| Thermal Printing | ESPOSjs 3.0.0-alpha.6 |
| Internationalization | i18next 23.10.0 (EN + Sinhala) |
| Build Tool | Create React App (Webpack) |
| Desktop Packaging | electron-builder 26.0.12 (NSIS for Windows) |
| CI/CD | GitHub Actions |

---

## Architecture

### Backend — Clean Architecture + CQRS

```
api/POS/
├── Domain/              # Entities + repository interfaces (no dependencies)
├── Application/         # Commands, Queries, Handlers, DTOs (depends on Domain only)
│   ├── Commands/        # Write operations (one file per command)
│   ├── Queries/         # Read operations (one file per query)
│   ├── Handlers/
│   │   ├── Command/     # IRequestHandler<TCommand, TResult>
│   │   └── Query/       # IRequestHandler<TQuery, TResult>
│   └── DTOs/            # Response shapes (never expose Domain entities directly)
├── Infrastructure/      # Dapper repositories, DapperContext (depends on Domain)
├── Controllers/         # Thin — only dispatch to MediatR, never business logic
├── Middleware/          # Global exception handler
├── Hubs/                # SignalR PosHub
└── Program.cs           # DI wiring, middleware pipeline, CORS, SignalR
```

**Data flow:** `HTTP → Controller → _mediator.Send() → Handler → Repository → SQL Server`

**Key rules:**
- Controllers must NEVER contain business logic — only `_mediator.Send(command/query)` and return the result
- Handlers fetch related data (supplier name, user name, product name) by calling other repositories — there are no SQL JOINs, all relations are resolved in the handler
- DTOs must always include ALL fields from the entity — omitting a field means the frontend gets a default value silently (this was the root cause of the GRN payment bug)
- Repositories use raw SQL via Dapper — `SELECT *` is common; field mapping is automatic by column name match

### Frontend — Electron + React SPA

```
frontend/
├── public/
│   ├── electron.js           # Electron main process (BrowserWindow, IPC handlers)
│   ├── preload.js            # Context bridge — exposes safe IPC API to renderer
│   ├── thermalPrinterService.js  # ESC/POS printer driver — receives pre-rendered HTML, no template logic
│   ├── htmlToEscposConverter.js  # Pre-rendered HTML → ESC/POS byte stream (no Handlebars)
│   ├── localdb.js            # SQLite offline sale storage + sync
│   └── locales/              # i18n JSON files (en/, si/)
└── src/
    ├── App.js                # Root router (protected routes by role)
    ├── app/                  # Redux store
    │   ├── store.js
    │   ├── authSlice.js      # JWT token + current user
    │   ├── posSlice.js       # Products, categories, suppliers, cart, held sales
    │   ├── dashboardSlice.js # Analytics data
    │   ├── userSlice.js      # User profile
    │   └── settingsSlice.js  # Store settings — persisted to localStorage, editable via Admin Settings tab
    ├── api/axios.js          # Axios instance — base URL from env, JWT in headers
    ├── components/           # Reusable UI + all modals
    ├── pages/                # One file per route
    ├── config/storeSettings.js  # Static fallback defaults only — real source of truth is settingsSlice/localStorage
    └── i18n/i18n.js
```

**Data flow:** `User Action → Page/Component → api/axios.js → Backend API → setState / dispatch → React re-render`

**Key rules:**
- Pages call the API directly (axios) for page-specific data; Redux is used for shared global state (cart, products, suppliers, auth)
- After any mutation (create/update/delete/payment), always re-fetch the affected list to keep UI in sync — don't try to patch local state manually
- `ViewGRNModal` manages its own internal `grn` state via `refreshGRN()` (GET by ID) — the prop `initialGRN` is only the initial value; subsequent refreshes update local state
- Payment list (`payments` state) is always fetched separately from `GET /grn/{id}/payments` — it is NOT embedded in the GRN response from query handlers

---

## Database Schema

**Dev connection:** `Server=(localdb)\MSSQLLocalDB;Initial Catalog=pos_db;Integrated Security=True;`

```
Categories
    └─< Products
              └─< ProductBatches  ──→ GRNs, Suppliers

Suppliers
    └─< GRNs
          ├─< GRNItems   ──→ Products
          └─< GRNPayments  (payment history, separate from GRN.PaidAmount summary)

Customers

Users  (Role: Cashier | Admin)

Sales  ──→ Customer, User
    ├─< SaleItems  ──→ Product, ProductBatch
    └─< Payments
```

### Entity Summary

| Entity | Key Fields |
|---|---|
| **Product** | Id, Barcode, Name, CategoryId, StockQuantity (DECIMAL), HasMultipleProductPrices, **IsBestSelling** (BIT, default 0), **MeasureType** (NVARCHAR: `"Unit"` \| `"Kg"`) |
| **ProductBatch** | Id, ProductId, BatchNumber, CostPrice, ProductPrice, SellingPrice, WholesalePrice, Quantity (DECIMAL), RemainingQuantity (DECIMAL), ExpiryDate, ManufactureDate, GRNId, SupplierId |
| **Category** | Id, Name |
| **Supplier** | Id, Name, ContactPerson, Phone, Email, Address, IsActive |
| **GRN** | Id, GRNNumber, SupplierId, ReceivedDate, ReceivedBy, TotalAmount, Notes, **PaymentStatus** (unpaid/partial/paid), **PaidAmount**, **CreditAmount**, PaymentType, PaymentDate, ChequeNumber, ChequeDate, PaymentNotes |
| **GRNItem** | Id, GRNId, ProductId, BatchNumber, Quantity (DECIMAL(10,3)), CostPrice, ProductPrice, ManufactureDate, ExpiryDate |
| **GRNPayment** | Id, GRNId, PaymentDate, PaymentType, Amount, ChequeNumber, ChequeDate, Notes, **RecordedBy** (UserId), CreatedAt |
| **Customer** | Id, Name, Phone, Address, NICNumber, Type (Loyalty/Wholesale), CreditBalance, LoyaltyPoints |
| **Sale** | Id, CashierId, CustomerId, SaleDate, TotalAmount, DiscountType, DiscountValue, DiscountAmount, FinalAmount, IsHeld, PaymentType, AmountPaid, Change, IsVoided — `InvoiceNo` computed as `INV-{SaleDate:yyyy-MM}-{Id:D6}` in handler (not stored) |
| **SaleItem** | Id, SaleId, ProductId, BatchId, BatchNumber, Quantity (DECIMAL — supports fractional kg), Price — `RegularPrice` (MRP) derived from batch at save time, returned in DTO only |
| **Payment** | Id, SaleId, Type (Cash/Card/Cheque), Amount, CardLastFour |
| **User** | Id, Username, PasswordHash, Role (Cashier/Admin) |

---

## Backend Modules

### Controllers (9)

| Controller | Key Routes | Notes |
|---|---|---|
| `AuthController` | POST `/api/auth/login` | Returns JWT |
| `ProductController` | CRUD `/api/product`, GET `barcode/{code}`, GET `{id}/batches`, GET `{id}/price-variants`, GET `best-selling`, PATCH `{id}/best-selling` | `best-selling` routes added for Best Selling feature |
| `SaleController` | CRUD `/api/sales`, GET `held`, POST `{id}/void` | |
| `GRNController` | CRUD `/api/grn`, POST `{id}/payment`, GET `{id}/payments`, PUT `{id}/payment-status` | See GRN flow below |
| `CustomerController` | CRUD `/api/customers`, GET `{id}/purchases` | |
| `SupplierController` | CRUD `/api/suppliers` | |
| `CategoryController` | CRUD `/api/categories` | |
| `UserController` | CRUD `/api/users` | |
| `DashboardController` | GET `stats`, `bestsellers`, `lowstock` | |

### GRN Payment Flow (important — was bugged, now fixed)

```
1. POST /api/grn/{id}/payment       → AddGRNPaymentCommand     → inserts into GRNPayments table
2. PUT  /api/grn/{id}/payment-status → UpdateGRNPaymentStatusCommand → recalculates PaidAmount/CreditAmount/PaymentStatus
                                                                        from SUM of all GRNPayments, updates GRNs table
3. GET  /api/grn/{id}               → GetGRNByIdQuery           → returns GRN with payment summary fields
4. GET  /api/grn/{id}/payments      → GetGRNPaymentsQuery        → returns payment history list
```

Frontend calls them in order: 1 → 2 → 3 (refreshGRN) → 4 (fetchPayments)

### CQRS Handlers

**Commands** (write side):
- `CreateGRNCommandHandler` — inserts GRN + items in a transaction; handles initial payment if not "unpaid"
- `AddGRNPaymentCommandHandler` — inserts a GRNPayment record
- `UpdateGRNPaymentStatusCommandHandler` — sums all payments, recalculates status, updates GRNs table, returns full GRNDto with per-payment RecordedByName (each payment's own RecordedBy user is looked up individually)
- `CreateSaleCommandHandler` — inserts sale + items, deducts stock from ProductBatches
- `VoidSaleCommandHandler` — marks IsVoided, restores stock
- `AuthenticateUserCommandHandler` — validates credentials, issues JWT

**Queries** (read side):
- All GRN query handlers now map all payment status fields from entity to DTO (fixed 2026-06-27)
- Handlers resolve related names (SupplierName, ReceivedByName, ProductName) by calling other repositories — no SQL JOINs

---

## Frontend Modules

### Pages

| Page | Role | Notes |
|---|---|---|
| `LoginPage` | Public | JWT auth |
| `CashierPage` | All | Main POS — product search/barcode, cart, checkout |
| `DashboardPage` | All | Real-time stats via SignalR |
| `GRNPage` | Admin | Create GRNs; view GRN history per supplier via `ViewGRNModal` |
| `AdminPage` | Admin | Hub with sub-routes |
| `AdminProductsPage` | Admin | Product + batch management |
| `AdminCustomersPage` | Admin | Customer CRM |
| `AdminCategoriesPage` | Admin | Categories |
| `AdminSuppliersPage` | Admin | Suppliers + their GRN history |
| `AdminSettingsPage` | Admin | Store settings — name, address, logo, receipt options |
| `TodaySalesPage` | Cashier/Admin | Daily transaction list |

### Modals

| Modal | Trigger | Notes |
|---|---|---|
| `ViewGRNModal` | Click GRN card in GRNPage | Has own internal `grn` state; fetches payments separately; `refreshGRN()` on payment add |
| `PaymentModal` | Checkout in CashierPage | Cash/Card/Cheque |
| `PriceSelectionModal` | Product has multiple prices | Shows variants from different batches; accepts `measureType` prop — Kg products get decimal weight input |
| `WeightInputModal` | Clicking/scanning a Kg-type product | Orange-themed numpad + keyboard input; asks for weight in kg; auto-focuses on open |
| `HeldSalesModal` | Resume held sale | |
| `ReceiptPreviewModal` | After sale complete | Preview before print |
| `AddCustomerModal` | POS screen quick-add | |
| `BillReprintModal` | Reprint by invoice # | |
| `SupplierGRNsModal` | Supplier card in AdminSuppliersPage | |
| `ViewCustomerPurchasesModal` | Customer card | |
| `ProductUpdateModal` | Batch price update | |
| `LastSaleModal` | Quick last-sale view | |

### Redux Store

| Slice | Holds |
|---|---|
| `authSlice` | `user` (id, username, role), JWT token |
| `posSlice` | `products`, `categories`, `suppliers`, `customers`, cart (`saleItems`), `heldSales`, `selectedCustomer` |
| `dashboardSlice` | `todaySales`, `lowStockItems`, `bestSellers` |
| `userSlice` | User profile/preferences |
| `settingsSlice` | `storeName`, `storeAddress`, `storeContact`, `currency`, `receiptLanguage`, `defaultReceiptTemplate`, `storeLogo` (base64), `paperWidth` — loaded from `localStorage` on boot, saved there on every Settings save |

---

## Implemented Functionalities

### 1. Point of Sale (CashierPage)
- Product search by name or barcode scan
- **Customer types**: Walk-in, Loyalty (retail), Wholesale — type selection changes pricing used
- **Pricing per customer type**:
  - Walk-in / Loyalty → `SellingPrice` (what they pay); `ProductPrice` = MRP (listed price)
  - Wholesale → `WholesalePrice`
  - Savings shown on receipt = `(ProductPrice − SellingPrice) × quantity` per item (retail only)
- Multi-price variants (ProductPrice differs per batch) — `PriceSelectionModal` appears when `HasMultipleProductPrices = true`
- Cart: add, remove, adjust quantity; `regularPrice` stored in Redux alongside `price`
- Discounts: percentage or fixed amount
- Hold / Resume sale
- Sale voiding with audit trail
- **Sale completion flow**: `POST /api/sale` → backend saves + computes InvoiceNo → frontend uses `response.data` exclusively for receipt (no frontend payload used for bill)
- **Best Selling default view**: category dropdown defaults to `⭐ Best Selling` on load; fetches `/api/product/best-selling`. Switching to another category or "All" fetches normally. Admin can star/unstar products in Admin → Products
- **Scale (Kg) product flow**: products with `MeasureType = "Kg"` always open `WeightInputModal` on click or barcode scan (even single-price). Kg products in the cart show `x.xxx kg` read-only — no +/− steppers. Barcode scans for Kg products also route through the weight modal

### 2. Payment Processing
- Cash (with change calculation), Card (last-four capture), Cheque (number + date)
- Partial payments per transaction

### 3. Receipt & Printing

**Templates (single source of truth):** `src/components/receipt/templates/`
- `ReceiptTemplate.js` — standard: logo, savings, loyalty info, i18n labels
- `MinimalReceiptTemplate.js` — compact: no logo, one line per item

**Print paths (environment-detected in `ReceiptPreviewModal`):**
- **Electron kiosk (.exe)**: `window.electronAPI` present → reads `ref.current.innerHTML` (pre-rendered receipt HTML from ReceiptView) → sends via IPC `printReceipt` → main process calls `thermalPrinterService.printRenderedHtml()` → `htmlToEscposConverter` parses HTML and emits ESC/POS commands to thermal printer
- **Web browser**: `window.electronAPI` absent → `window.print()` → `@media print` CSS hides everything except `.receipt-preview`

**Language toggle:** `LanguageToggle` in the receipt modal footer calls `i18n.changeLanguage()`. `ReceiptView.useMemo` depends on `i18n.language` (not just `t`) so the Handlebars template recompiles immediately with the new translation.

**Paper size:** `ReceiptView` injects `<style id="receipt-page-size">` into `<head>` via `useEffect([paperWidth])` — the only way to make `@page { size }` dynamic. Screen width is applied as an inline style override.

**Store info configurable:** name, address, contact, currency, logo (base64), paper size, language, and template — all from Admin → Settings tab, persisted in `localStorage` via `settingsSlice`.

### 4. Inventory Management
- Product + barcode creation
- **`MeasureType`**: each product is either `"Unit"` (whole items, integer qty) or `"Kg"` (scale/weight, decimal qty to 3dp). Set via radio selector in Admin → Products → Add/Edit form
- **Add product form**: price label adapts — "Unit Price (MRP)" for Unit products, "Kg Price (MRP)" for Kg products
- **Best Selling flag**: Admin → Products table has a ★ star button per row. Yellow = best selling; grey = not. Toggled via `PATCH /api/product/{id}/best-selling`
- **View button (price breakdown)**:
  - *Unit products*: shows one card per price variant (batch group), listing Unit Price (MRP), Selling Price, Wholesale Price, Total Stock in units
  - *Kg products*: shows a single orange summary card — Kg Price (MRP), Selling Price/kg, Wholesale Price/kg, Total Stock in kg (no batch breakdown)
- **Edit button (ProductUpdateModal)**:
  - *Unit products*: per-batch editing — Selling Price and Wholesale Price are editable per batch; Cost Price and Unit Price (MRP) are read-only (set at GRN time)
  - *Kg products*: single global pricing section — Kg Price (MRP), Selling Price/kg, Wholesale Price/kg all editable; saving patches all batches simultaneously via `Promise.all`
- Batch tracking (manufacture date, expiry date)
- Stock deducted on sale, restored on void — all quantity columns are `DECIMAL(10,3)` to support fractional kg
- Low stock dashboard alerts

### 5. Goods Received Notes (GRN)
- Auto-generated GRN number (`GRN{yyyyMMdd}{id:D4}`)
- Multi-item entry with cost price per item; **Unit Price (MRP) is captured only for Unit products** — the field is hidden for Kg products (price per kg is managed globally in ProductUpdateModal, not per-batch in GRN)
- Initial payment at GRN creation OR incremental payments later via `ViewGRNModal`
- Payment status: `unpaid` / `partial` / `paid` — derived from `SUM(GRNPayments.Amount)` vs `GRN.TotalAmount`
- Cheque payments tracked (cheque number, date)
- Full payment history per GRN (`GRNPayments` table)

### 6. Supplier Management
- CRUD with contact info, active/inactive flag
- Supplier-linked GRN history in `SupplierGRNsModal`

### 7. Customer Management
- Types: Loyalty (retail) and Wholesale
- Loyalty points, credit balance, purchase history

### 8. Dashboard
- Today's sales, last invoice, low stock, best sellers
- Real-time via SignalR

### 9. Sales Reporting
- By cashier, by date range, voided sales, payment method breakdown

### 10. Access Control
- Roles: Admin, Cashier — JWT claims
- Frontend: `ProtectedRoute` by role
- Backend: route-level `[Authorize(Roles="Admin")]`
- JWT expires after 60 min

### 11. Offline Mode
- Sales recorded to SQLite (`localdb.js`) when API unreachable
- Products cached locally
- Auto-sync on reconnect

### 12. Multi-language
- English + Sinhala via i18next
- Runtime toggle; translations in `public/locales/{lang}/`

### 13. Store Settings (Admin → Settings Tab)
- Edit store name, address, contact phone, and currency symbol
- Upload bill/receipt logo (compressed to ≤160px wide base64 PNG, stored in localStorage)
- Choose paper/bill size: 58mm narrow thermal, 80mm standard thermal, or A4/full width
- Choose receipt language: Sinhala or English
- Choose default receipt template: Standard (with logo, savings, loyalty) or Minimal (compact)
- Settings take effect immediately across CashierPage, receipt views, and dashboard — no restart needed
- Persistent across app sessions via `localStorage` key `zdigitalpos_store_settings`

### 14. Desktop (Electron)
- Fullscreen kiosk mode, no menu bar
- Context isolation on, Node integration off
- IPC via `preload.js` bridge (renderer → main process for printing)
- NSIS installer for Windows; App ID: `ZDigital`

---

## Configuration

### Backend (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Initial Catalog=pos_db;Integrated Security=True;"
  },
  "Jwt": {
    "Key": "<secret-key>",
    "Issuer": "https://posapi.yourdomain.com",
    "Audience": "pos-client",
    "ExpireMinutes": 60
  }
}
```

### Frontend Environment
| Variable | Default | Purpose |
|---|---|---|
| `REACT_APP_API_BASE_URL` | `http://localhost:5000/api` | Backend base URL |

### `Program.cs` DI registration order
1. Dapper context (singleton)
2. All repositories (scoped)
3. MediatR (auto-discovers all handlers in assembly)
4. CORS — allow any origin (**restrict before production**)
5. SignalR hub at `/posHub`
6. Swagger (dev only)
7. `ExceptionHandlingMiddleware`

---

## API Endpoints

| Method | Route | Handler | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | `AuthenticateUserCommand` | Returns JWT |
| GET | `/api/products` | `GetAllProductsQuery` | |
| GET | `/api/products/{id}` | `GetProductByIdQuery` | |
| GET | `/api/products/barcode/{code}` | `GetProductByBarcodeQuery` | |
| GET | `/api/products/{id}/batches` | `GetProductBatchesQuery` | |
| GET | `/api/products/{id}/prices` | `GetProductPriceVariantsQuery` | |
| POST | `/api/products` | `CreateProductCommand` | |
| PUT | `/api/products/{id}` | `UpdateProductCommand` | |
| DELETE | `/api/products/{id}` | `DeleteProductCommand` | |
| GET | `/api/product/best-selling` | `GetBestSellingProductsQuery` | Returns only products where `IsBestSelling = 1` |
| PATCH | `/api/product/{id}/best-selling` | `SetBestSellingCommand` | Body: `{ isBestSelling: bool }` — toggles flag |
| GET | `/api/grn` | `GetAllGRNsQuery` | Returns payment status fields |
| GET | `/api/grn/{id}` | `GetGRNByIdQuery` | Returns payment status fields |
| GET | `/api/grn/supplier/{supplierId}` | `GetGRNsBySupplierQuery` | Returns payment status fields |
| POST | `/api/grn` | `CreateGRNCommand` | |
| GET | `/api/grn/{id}/payments` | `GetGRNPaymentsQuery` | Payment history list |
| POST | `/api/grn/{id}/payment` | `AddGRNPaymentCommand` | Adds one payment record |
| PUT | `/api/grn/{id}/payment-status` | `UpdateGRNPaymentStatusCommand` | Recalculates + updates status |
| GET | `/api/sales` | `GetSalesQuery` | |
| GET | `/api/sales/held` | `GetHeldSalesQuery` | |
| POST | `/api/sales` | `CreateSaleCommand` | Deducts stock |
| PUT | `/api/sales/{id}` | `UpdateSaleCommand` | |
| POST | `/api/sales/{id}/void` | `VoidSaleCommand` | Restores stock |
| GET | `/api/customers` | `GetAllCustomersQuery` | |
| POST | `/api/customers` | `CreateCustomerCommand` | |
| PUT | `/api/customers/{id}` | `UpdateCustomerCommand` | |
| DELETE | `/api/customers/{id}` | `DeleteCustomerCommand` | |
| GET | `/api/customers/{id}/purchases` | `GetCustomerPurchaseHistoryQuery` | |
| GET | `/api/suppliers` | `GetAllSuppliersQuery` | |
| POST | `/api/suppliers` | `CreateSupplierCommand` | |
| PUT | `/api/suppliers/{id}` | `UpdateSupplierCommand` | |
| DELETE | `/api/suppliers/{id}` | `DeleteSupplierCommand` | |
| GET | `/api/categories` | `GetAllCategoriesQuery` | |
| POST | `/api/categories` | `CreateCategoryCommand` | |
| PUT | `/api/categories/{id}` | `UpdateCategoryCommand` | |
| DELETE | `/api/categories/{id}` | `DeleteCategoryCommand` | |
| GET | `/api/users` | `GetAllUsersQuery` | |
| POST | `/api/users` | `CreateUserCommand` | |
| PUT | `/api/users/{id}` | `UpdateUserCommand` | |
| GET | `/api/dashboard/stats` | `GetDashboardStatsQuery` | |
| GET | `/api/dashboard/bestsellers` | `GetBestSellersQuery` | |
| GET | `/api/dashboard/lowstock` | `GetLowStockQuery` | |

---

## Coding Conventions

### Backend
- Handler constructor receives only what it needs — inject repositories, not full services
- When building a response DTO from an entity, **always copy every field** — missing fields silently fall back to C# defaults (0, "", null) and cause frontend display bugs
- For payment-related handlers that return embedded sub-lists (e.g., `Payments` inside `GRNDto`), look up each item's user/name individually inside a `foreach` — do NOT reuse a single parent-level user variable
- Repository queries use `SELECT *` — Dapper maps by column name; as long as the entity property name matches the SQL column name, it works automatically

### Frontend
- After any POST/PUT/DELETE, re-fetch the affected data — never patch Redux or local state manually
- **Receipt data MUST come from `response.data`** after `POST /sale` — never build the receipt from the frontend cart payload; the backend is the source of truth for `invoiceNo`, `productName`, `regularPrice`, `cashierName`
- Cart items store `price` (what customer pays) and `regularPrice` (MRP from batch) separately; this separation drives the savings display on receipts
- Modal-local data (like `grn` inside `ViewGRNModal`) is managed with `useState` initialized from the prop; use a `refresh*()` function to re-fetch from the API after mutations
- `useEffect` dependencies: be precise — use `grn?.paidAmount` instead of `grn` to avoid firing on every object reference change
- `onPaymentAdded` callback pattern: modal calls it after successful payment → parent page re-fetches its list
- **Payload field name**: cart `sourceId` maps to `batchId` in the API payload — always send `batchId` to the backend so batch-level stock deduction works
- **Store settings**: consume via `useSelector(state => state.settings)` — never import `storeSettings.js` directly in components. The static file is only the fallback default; the live source of truth is Redux/localStorage. When building receipt data, always spread `storeName`, `storeAddress`, `storeContact`, `storeLogo` from `settings` into the `saleData` object so `ReceiptView` can pass them to the template
- **Receipt template authoring**: all receipt templates live in `src/components/receipt/templates/` only. Never duplicate them into `public/` — `electron.js` no longer loads templates from disk; the renderer sends pre-rendered HTML via IPC. Use `{{{varName}}}` (triple braces) for any URL or raw HTML value to prevent Handlebars from HTML-escaping it (e.g. `storeLogo` is a base64 data URL)
- **i18n in useMemo**: always include `i18n.language` (not just `t`) as a `useMemo` dependency when the memo body calls `t()`. The `t` function reference is stable in i18next — it does not change when language switches, so `t` alone as a dep will not trigger recomputation. `i18n.language` is a string that changes, which correctly invalidates the memo
- **Dual print path**: detect the runtime with `!!window.electronAPI`. Electron → IPC thermal print. Browser → `window.print()`. Never call `window.electronAPI` without this guard or the web build will throw on load
- **`measureType` in cart items**: `addToCart` always includes `measureType` in the saleItem payload so cart rendering and receipt logic know whether to show `x.xxx kg` or integer units. All `addToCart` call sites (direct add, barcode scan, `PriceSelectionModal`, `WeightInputModal` confirm) must pass `measureType`
- **Kg vs Unit modal routing**: for a product with `MeasureType = "Kg"` and a single price, intercept before adding to cart and open `WeightInputModal`. For Kg products with `HasMultipleProductPrices = true`, open `PriceSelectionModal` with `measureType="Kg"` (it adapts to show decimal weight input). Unit products follow the existing flow unchanged
- **`selectedCategoryId` sentinel values**: `null` = all products, numeric string/int = category filter, `"best-selling"` (string literal) = best-selling filter. The product-fetch `useEffect` branches on all three. The Redux slice and category dropdown must preserve this string sentinel — never coerce it to a number
- **Scroll-wheel on numeric inputs**: every `<input type="number">` must have `onWheel={(e) => e.target.blur()}` to prevent the mouse wheel from accidentally changing the value while the field is focused. Apply to all number inputs — price fields, quantity fields, payment fields, weight fields
- **Outside-click-to-close dialogs**: all popup dialogs (except `PaymentModal`) must close when the user clicks the dark backdrop. Pattern: outer overlay div gets `onClick={closeFunc}`; inner dialog card gets `onClick={(e) => e.stopPropagation()}` to prevent bubbling. `PaymentModal` is intentionally excluded (accidental dismissal would lose payment in progress). `ReceiptPreviewModal` uses `react-modal` which has its own `onRequestClose` mechanism and does not use this pattern

---

## Security Notes
- JWT expires 60 min; stored in Redux (memory) on frontend
- Passwords hashed server-side
- Electron: context isolation enabled, Node integration off, IPC via typed bridge
- CORS: currently `AllowAnyOrigin` — **must restrict to app origin before production deployment**

---

## Build & Run

### Backend
```bash
cd api/POS
dotnet run
# http://localhost:5000  |  Swagger: http://localhost:5000/swagger
```

### Frontend — dev
```bash
cd frontend
npm install
npm start             # CRA dev server on :3000
npm run electron      # Electron pointing to :3000
```

### Frontend — production
```bash
cd frontend
npm run build         # React build + copy-electron-files.js
npm run dist          # electron-builder → dist/ NSIS installer
```
