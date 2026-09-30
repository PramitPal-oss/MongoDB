# 9. Production Scenarios

---

## Scenario A — Checkout

A robust checkout is not one giant request with blind writes.

### Step 1: validate cart
- cart exists and active
- product/variant still sellable
- requested quantities valid
- price snapshot rules defined

### Step 2: reserve stock atomically
Use a conditional inventory update.

### Step 3: create order
Store historical snapshots needed for invoices and support.

### Step 4: payment initiation
Use idempotency key.

### Step 5: payment webhook
Use provider event/payment uniqueness.

### Step 6: finalize or compensate
- success → mark paid
- failure/expiry → release stock reservation

### Important
Do not treat a transaction as a distributed transaction with the payment provider.

---

## Scenario B — Stock reservation expiration

Inventory document can store aggregate reserved count, while reservation detail lives separately:

```javascript
stock_reservations {
  _id,
  orderId,
  inventoryId,
  qty,
  status,
  expiresAt,
  idempotencyKey
}
```

A worker expires old reservations and decrements reserved stock exactly once.

Use unique keys/state checks to make retries safe.

---

## Scenario C — Payment retries

Persist:
- internal payment attempt ID
- order ID
- provider
- idempotency key
- providerPaymentId
- status
- raw provider reference (careful with sensitive data)
- timestamps

Never infer success only from client redirect. Provider webhook/server verification should drive authoritative state.

---

## Scenario D — Reporting

Options:

### Real-time aggregation
Good when dataset is moderate and queries selective.

### Materialized summary
Good when expensive report repeats frequently.

### Change-stream maintained projection
Good for near-real-time summaries when topology supports change streams.

### Batch refresh
Good for hourly/daily analytics where minor staleness is acceptable.

Define freshness SLA explicitly.

---

## Scenario E — Pagination

### Offset pagination
Simple:
```javascript
skip(page * size).limit(size)
```

Weaknesses:
- expensive at deep pages
- writes can shift rows between pages

### Keyset pagination
Use stable sort:
```javascript
{ placedAt: -1, _id: -1 }
```

Cursor carries last values.

Benefits:
- efficient deep paging
- more stable under inserts

---

## Scenario F — Scaling reads

Before sharding:
1. fix bad query shapes
2. add correct indexes
3. remove unnecessary fan-out
4. cache where justified
5. materialize repeated analytics
6. separate transactional vs analytical workloads when needed

Sharding does not repair inefficient queries automatically.

---

## Scenario G — Sharding

Shard-key goals:
- good distribution
- avoid hot shard
- support common routing patterns
- appropriate cardinality

For large orders collection, candidate choices depend on access pattern.

### `{ customerId: 1 }`
Pros:
- customer-history queries targeted

Cons:
- a huge customer can create skew
- write distribution depends on customer distribution

### hashed customer key
Pros:
- better distribution

Cons:
- range/order-by-time behavior differs
- some queries scatter

### compound strategies
Can balance locality and distribution but require careful workload analysis.

Never propose a shard key without knowing dominant queries and growth pattern.

---

## Scenario H — Change streams

Change streams let an application subscribe to inserts/updates/deletes.

Conceptual Node example:

```javascript
const stream = db.collection("orders").watch([
  {
    $match: {
      operationType: { $in: ["insert", "update", "replace"] }
    }
  }
]);

for await (const change of stream) {
  // update cache / summary / downstream workflow
}
```

Use cases:
- near-real-time dashboard
- cache invalidation
- event-driven integrations
- derived projections

Important production concerns:
- resume tokens
- duplicate/retry-safe consumers
- backpressure
- topology requirements
- ordering semantics

---

## Scenario I — Reporting with change streams

A robust pattern:
1. transactional order write
2. change stream emits change
3. consumer updates materialized summary using idempotent logic
4. consumer stores resume/checkpoint information
5. dashboard reads summary collection

This creates eventual consistency, so define expected delay.

---

## Scenario J — Account deletion

MongoDB architecture must separate:
- personal profile data
- legally/audit-required records
- financial/order snapshots
- analytics identifiers

Possible actions include delete, anonymize, pseudonymize, or retain depending on policy/law. The data model should make these operations traceable.

---

## Scenario K — Backup/restore

Know the conceptual difference:
- JSON export/import is data interchange and may require Extended JSON handling to preserve BSON types correctly.
- BSON-oriented backup tools preserve MongoDB-native structure/types more directly.

A backup is not trustworthy until restore is tested and integrity verified.

---

## Scenario L — Product search

Basic indexes support:
- exact/range filters
- sort
- prefix-like patterns in some cases

Advanced full-text relevance, typo tolerance, autocomplete, faceting, etc. may warrant dedicated MongoDB search capabilities or an external search engine depending on deployment.

---

# Production design questions to ask

For every feature:
1. What is the consistency boundary?
2. What can retry?
3. What must be idempotent?
4. What can grow without bound?
5. What are hottest queries?
6. Which invariants need unique indexes?
7. What is the failure recovery path?
8. What is auditable?
9. What can be eventually consistent?
10. How will we observe/repair drift?
