# ZDigitalPOS — Project Architecture & Working Reference

> **This is a living document.** Update it after every bug fix, feature addition, or architectural decision.
> Treat it like CLAUDE.md — the first thing to read before touching any code, and the last thing to update after finishing.

---

## Last Updated
2026-06-28 — Customer panel: stale credit/points display fixed; customer now cleared and list refreshed on every type change

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
│   ├── thermalPrinterService.js  # ESC/POS printer driver
│   ├── htmlToEscposConverter.js  # Receipt HTML → ESC/POS byte stream
│   ├── localdb.js            # SQLite offline sale storage + sync
│   ├── templates/            # HTML receipt templates
│   └── locales/              # i18n JSON files (en/, si/)
└── src/
    ├── App.js                # Root router (protected routes by role)
    ├── app/                  # Redux store
    │   ├── store.js
    │   ├── authSlice.js      # JWT token + current user
    │   ├── posSlice.js       # Products, categories, suppliers, cart, held sales
    │   ├── dashboardSlice.js # Analytics data
    │   └── userSlice.js      # User profile
    ├── api/axios.js          # Axios instance — base URL from env, JWT in headers
    ├── components/           # Reusable UI + all modals
    ├── pages/                # One file per route
    ├── config/storeSettings.js  # Store name, address, currency, receipt template
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
| **Product** | Id, Barcode, Name, CategoryId, StockQuantity, HasMultipleProductPrices |
| **ProductBatch** | Id, ProductId, BatchNumber, CostPrice, ProductPrice, SellingPrice, WholesalePrice, ExpiryDate, ManufactureDate, GRNId, SupplierId |
| **Category** | Id, Name |
| **Supplier** | Id, Name, ContactPerson, Phone, Email, Address, IsActive |
| **GRN** | Id, GRNNumber, SupplierId, ReceivedDate, ReceivedBy, TotalAmount, Notes, **PaymentStatus** (unpaid/partial/paid), **PaidAmount**, **CreditAmount**, PaymentType, PaymentDate, ChequeNumber, ChequeDate, PaymentNotes |
| **GRNItem** | Id, GRNId, ProductId, BatchNumber, Quantity, CostPrice, ProductPrice, ManufactureDate, ExpiryDate |
| **GRNPayment** | Id, GRNId, PaymentDate, PaymentType, Amount, ChequeNumber, ChequeDate, Notes, **RecordedBy** (UserId), CreatedAt |
| **Customer** | Id, Name, Phone, Address, NICNumber, Type (Loyalty/Wholesale), CreditBalance, LoyaltyPoints |
| **Sale** | Id, CashierId, CustomerId, SaleDate, TotalAmount, DiscountType, DiscountValue, DiscountAmount, FinalAmount, IsHeld, PaymentType, AmountPaid, Change, IsVoided — `InvoiceNo` computed as `INV-{SaleDate:yyyy-MM}-{Id:D6}` in handler (not stored) |
| **SaleItem** | Id, SaleId, ProductId, BatchId, BatchNumber, Quantity, Price — `RegularPrice` (MRP) derived from batch at save time, returned in DTO only |
| **Payment** | Id, SaleId, Type (Cash/Card/Cheque), Amount, CardLastFour |
| **User** | Id, Username, PasswordHash, Role (Cashier/Admin) |

---

## Backend Modules

### Controllers (9)

| Controller | Key Routes | Notes |
|---|---|---|
| `AuthController` | POST `/api/auth/login` | Returns JWT |
| `ProductController` | CRUD `/api/products`, GET `barcode/{code}`, GET `{id}/batches`, GET `{id}/prices` | |
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
| `TodaySalesPage` | Cashier/Admin | Daily transaction list |

### Modals

| Modal | Trigger | Notes |
|---|---|---|
| `ViewGRNModal` | Click GRN card in GRNPage | Has own internal `grn` state; fetches payments separately; `refreshGRN()` on payment add |
| `PaymentModal` | Checkout in CashierPage | Cash/Card/Cheque |
| `PriceSelectionModal` | Product has multiple prices | Shows variants from different batches |
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

### 2. Payment Processing
- Cash (with change calculation), Card (last-four capture), Cheque (number + date)
- Partial payments per transaction

### 3. Receipt & Printing
- Standard and minimal thermal templates
- HTML → ESC/POS byte conversion (`htmlToEscposConverter.js`)
- Preview before print, bill reprint by invoice number
- Store name / address / currency configurable in `storeSettings.js`

### 4. Inventory Management
- Product + barcode creation
- Batch tracking (manufacture date, expiry date)
- Stock deducted on sale, restored on void
- Low stock dashboard alerts

### 5. Goods Received Notes (GRN)
- Auto-generated GRN number (`GRN{yyyyMMdd}{id:D4}`)
- Multi-item entry with cost/selling price per item
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

### 13. Desktop (Electron)
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
