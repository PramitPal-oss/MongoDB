# 11. End-to-End Labs

These labs combine several chapters. Do not look for a single “magic operator.”

---

## Lab 1 — Product variant maintenance

Requirements:
1. find product by SKU
2. update only matching variant's sale price
3. update only its `storage` option
4. append audit event
5. ensure variant lookup is indexed
6. explain what happens if two admins change price concurrently

Expected concepts:
- multikey SKU index
- two `arrayFilters`
- optimistic version or audit strategy
- transaction only if audit event in separate collection must commit atomically with product change

---

## Lab 2 — Inventory reservation

Requirements:
1. reserve N units only when available
2. increment version
3. create reservation record
4. safely handle retry
5. expire reservation once

Expected concepts:
- conditional atomic update
- transaction if reservation record and inventory must commit together
- idempotency key
- expiration worker
- idempotent compensation

---

## Lab 3 — Seller dashboard

Metrics:
- active product count
- units sold
- revenue
- average review rating
- return request count

Rules:
- don't inflate metrics via fan-out
- support seller/date filter
- explain candidate indexes
- produce live pipeline and materialized alternative

---

## Lab 4 — Activity feed

Combine:
- order placed
- payment captured
- shipment delivered

Requirements:
- single chronological output
- normalized event shape
- newest 100
- cursor pagination

Expected concept: `$unionWith`.

---

## Lab 5 — Category tree report

Starting category:
1. return ancestors
2. return descendants up to 2 levels
3. count products under subtree
4. calculate sales under subtree
5. compare `$graphLookup` with `ancestorIds`

---

## Lab 6 — Customer analytics

Build:
- monthly spend
- cumulative spend
- previous month spend
- growth rate
- rank within loyalty tier
- flag >2× prior average

Expected concepts:
- `$group`
- `$setWindowFields`
- `$shift`
- running total
- conditional logic

---

## Lab 7 — Search API

Filters:
- seller
- category
- min/max price
- active only

Response:
- first 20 products
- total count
- price histogram

Expected concepts:
- `$match`
- `$facet`
- `$bucket`
- index discussion
- careful variant unwind

---

## Lab 8 — Payment webhook

Simulate same webhook 3 times.

Requirements:
- only one event accepted
- only one payment transition
- safe server restart/retry
- audit duplicate deliveries without applying side effect twice

Expected concepts:
- unique provider event ID
- idempotency
- conditional state transition

---

## Lab 9 — Slow query clinic

Choose a deliberately unindexed deep nested filter.
1. run explain
2. record docs examined / returned
3. create candidate index
4. rerun explain
5. discuss write/storage impact
6. decide if index is worth keeping

---

## Lab 10 — Materialized monthly report

Build seller/month metrics and `$merge` into a report collection.

Requirements:
- unique merge key
- safe rerun behavior
- refreshed timestamp
- strategy for late-arriving corrections
- compare full rebuild vs incremental update
