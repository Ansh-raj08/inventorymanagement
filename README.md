# Inventory and Data Management System

A backend REST API for a store or warehouse inventory, built with Node.js, Express, MongoDB, Mongoose and dotenv.

## 1. Requirements

- Node.js (18 or newer recommended)
- MongoDB running locally, or a MongoDB Atlas connection string
- Postman or another API client

## 2. Setup

Open this folder in VS Code, then run:

```bash
npm install
```

Copy `.env.example` to `.env` and update the MongoDB URL if needed.

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Default local configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventoryDB
```

Start MongoDB before starting the application.

## 3. Run

Development mode:

```bash
npm run dev
```

Normal mode:

```bash
npm start
```

Open `http://localhost:5000` to see the API welcome response.

## 4. API endpoints

Base URL: `http://localhost:5000/api/products`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Create a product |
| GET | `/` | List, filter, sort and paginate products |
| GET | `/:id` | Get one product |
| PUT | `/:id` | Update product details |
| DELETE | `/:id` | Delete a product |
| PATCH | `/:id/restock` | Increase stock |
| PATCH | `/:id/sale` | Record a sale / decrease stock |
| GET | `/reports/low-stock` | List products at or below their low-stock threshold |
| GET | `/reports/category-summary` | Category-wise inventory aggregation |

### Create product example

POST `http://localhost:5000/api/products`

Body → raw → JSON:

```json
{
  "name": "Laptop",
  "category": "Electronics",
  "price": 45000,
  "quantity": 10,
  "sku": "LAP101",
  "description": "Dell laptop",
  "lowStockThreshold": 5
}
```

### List, filter, sort and paginate

Examples:

```text
GET /api/products
GET /api/products?category=Electronics
GET /api/products?search=laptop
GET /api/products?minPrice=1000&maxPrice=50000
GET /api/products?sort=price&order=asc
GET /api/products?page=1&limit=5
GET /api/products?category=Electronics&sort=price&order=asc&page=1&limit=5
```

Allowed sort fields: `name`, `price`, `quantity`, `category`, `createdAt`.
Pagination defaults: page 1, limit 10; maximum limit 100.

### Update product

PUT `/api/products/PRODUCT_ID`

```json
{
  "price": 42000,
  "description": "Updated laptop price"
}
```

### Restock

PATCH `/api/products/PRODUCT_ID/restock`

```json
{
  "quantity": 5
}
```

### Record a sale

PATCH `/api/products/PRODUCT_ID/sale`

```json
{
  "quantity": 2
}
```

Sale uses a conditional atomic database update, so it cannot reduce stock below zero.

## 5. Data model

Product fields:

- `name`: required string
- `category`: required string
- `price`: required number, minimum 0
- `quantity`: integer, minimum 0, default 0
- `sku`: required unique string
- `description`: optional string
- `lowStockThreshold`: integer, minimum 0, default 5
- `createdAt` and `updatedAt`: generated timestamps

## 6. Notes

- Do not upload your real `.env` file to GitHub. It is ignored by `.gitignore`.
- A duplicate SKU returns HTTP 409.
- Invalid schema data returns HTTP 400.
- A product that does not exist returns HTTP 404.
- This is a backend-only assignment project; use Postman to test the APIs.
