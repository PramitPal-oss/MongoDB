# MongoDB ecommerce aggregation dataset

Creates **16 collections** and **5,000 documents in each** (80,000 total). The JSON files use newline-delimited canonical MongoDB Extended JSON (one document per line). Import each collection separately with `mongoimport`; a single file cannot specify 16 target collections.

## Requirements

- Node.js 20.19+ and npm
- MongoDB server, `mongosh`, and MongoDB Database Tools (`mongoimport`)
- `MONGO_URI` if your database is not at `mongodb://127.0.0.1:27017`

## Run

```bash
cd mongo-ecommerce-practice
npm install
npm run seed
MONGO_DB=ecommerce_practice mongosh "${MONGO_URI:-mongodb://127.0.0.1:27017}" setup.mongodb.js
MONGO_DB=ecommerce_practice MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017}" bash import.sh
MONGO_DB=ecommerce_practice mongosh "${MONGO_URI:-mongodb://127.0.0.1:27017}" verify.mongodb.js
```

The generator writes `data/customers.json`, `data/orders.json`, etc. and `data/manifest.json`. Each collection file contains exactly 5,000 records by default. Use `COUNT=100 npm run seed` for a quick trial; regenerate with the default count for the full dataset. `SEED=20260928` controls Faker's randomness, and `OUT_DIR=/path/to/data` changes the output directory (set it for both generation and import).

`setup.mongodb.js` is safe to rerun: it creates missing collections and updates validators on existing ones. `import.sh` upserts by `_id`, so rerunning imports the same deterministic IDs. It does not delete older rows: import into a fresh database if changing `COUNT` and you need exact counts. **Do not run it against a production database.**

If MongoDB is in Docker, run `mongosh`/`mongoimport` from your host with a published port, or run the tools inside a container that can reach the MongoDB service. When using a remote URI, assign it to `MONGO_URI` in your shell environment.

## Design notes

- IDs are stable across generated files, so product, customer, order, shipment, payment, review, and return references match.
- Monetary values are `Decimal128`; dates and IDs retain BSON types after import.
- Orders include snapshots, nested discount allocations, tax components, packages, and status history. Products, promotions, returns, and shipments contain additional nested structures.
- Five thousand warehouses, categories, promotions, and returns are intentionally dense for aggregation practice. In a normal shop their counts and ratios would differ. All returns are pending requests and have not refunded payment or restocked inventory.
- The schema validators enforce basic types and required fields. A real checkout also needs application-level authorization, price/tax calculations, inventory reservation, payment webhook idempotency, and careful transaction boundaries.

## Starter aggregation

```javascript
db.orders.aggregate([
  { $unwind: "$lines" },
  { $group: {
      _id: { sellerId: "$lines.sellerId", month: { $dateTrunc: { date: "$placedAt", unit: "month" } } },
      revenue: { $sum: "$lines.lineTotal" },
      units: { $sum: "$lines.quantity" }
  } },
  { $sort: { revenue: -1 } },
  { $limit: 20 }
]);
```
