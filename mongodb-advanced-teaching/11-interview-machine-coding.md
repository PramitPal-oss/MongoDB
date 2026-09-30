# 10. Interview and Machine-Coding Playbook

---

## How senior MongoDB interviews are usually evaluated

Interviewers are rarely satisfied with syntax alone. They look for whether you understand:
- document shape
- query correctness
- array semantics
- index fit
- concurrency
- modeling tradeoffs
- failure behavior
- production constraints

---

## Explain every query in four layers

1. **Filter** — which root documents match?
2. **Transformation** — how does each stage change the shape?
3. **Result invariant** — what exactly does one output document mean?
4. **Performance** — what index/cardinality issue matters?

---

## Common nested-array question

“Update storage option of one variant.”

Expected concepts:
```text
$[variant]
$[option]
arrayFilters
```

Strong answer also explains why replacing the whole variants array can lose concurrent updates.

---

## Common concurrency question

“Two buyers want the last item.”

Weak answer:
```text
read stock, if stock > 0 then update
```

Strong answer:
```text
one conditional atomic update with available-stock predicate
check matchedCount / returned document
```

---

## Common index question

“Why isn't this compound index used?”

Check:
- leftmost prefix
- sort direction
- range placement
- collation
- multikey
- partial filter conditions
- query type
- selectivity
- competing index plan

Then verify with `explain`.

---

## Common aggregation question

“Build seller dashboard.”

Mention fan-out danger before writing a giant join pipeline.

Better design:
- aggregate orders → seller metrics
- aggregate reviews → seller/product metric
- aggregate returns separately
- combine summarized results

---

## 45-minute Node + MongoDB endpoint

Task: filter/paginate orders and return customer summary.

### API concept
```http
GET /orders?customerId=...&status=DELIVERED&limit=20&cursor=...
```

### Validate
- ObjectId format
- enum status
- limit bounds
- cursor structure

### Query
```javascript
const filter = {
  customerId: new ObjectId(customerId),
  status: "DELIVERED"
};

if (cursor) {
  filter.$or = [
    { placedAt: { $lt: cursor.placedAt } },
    { placedAt: cursor.placedAt, _id: { $lt: cursor.id } }
  ];
}
```

### Aggregation option
```javascript
[
  { $match: filter },
  { $sort: { placedAt: -1, _id: -1 } },
  { $limit: limit + 1 },
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer"
    }
  },
  { $set: { customer: { $first: "$customer" } } },
  {
    $project: {
      orderNumber: 1,
      placedAt: 1,
      status: 1,
      "totals.grandTotal": 1,
      "customer.name": 1,
      "customer.email": 1
    }
  }
]
```

### Expected index
Depending on query shape:
```javascript
{ customerId: 1, status: 1, placedAt: -1, _id: -1 }
```

But don't create it blindly—compare against existing workload and indexes.

---

## Five-minute data-model defense template

Say:
1. Products reference sellers/categories; variants are embedded because bounded and read with product.
2. Orders embed line snapshots for historical truth but keep references for present entities.
3. Reviews/payments/shipments are separate because independently queried and potentially numerous.
4. Inventory is separate because it is a contention-heavy operational aggregate.
5. Unique indexes enforce identifiers/idempotency.
6. Compound indexes match hot APIs.
7. Bounded arrays avoid document growth.
8. Conditional single-document updates handle stock races.
9. Transactions are reserved for cross-document invariants.
10. Materialized summaries/change streams can support analytics.

---

## Rapid-fire traps

- `$in` tests membership against candidate values; `$all` requires all listed values.
- `$elemMatch` guarantees predicates apply to the same array element.
- two dot-notation conditions on an array may match different elements.
- `$lookup` is a join, `$unionWith` concatenates compatible streams.
- `$group` collapses; `$setWindowFields` preserves rows.
- `$addToSet` compares whole values.
- `$mergeObjects` later values overwrite earlier keys.
- `skip` becomes expensive deep into result sets.
- one-document update is atomic; multi-document workflow may need transaction/saga.
- unique indexes are correctness tools, not merely speed tools.

---

# Mock interview prompts

1. Explain positional `$` vs `$[]` vs `$[id]`.
2. Update a nested option inside a nested variant array.
3. Prevent overselling the final item.
4. Design idempotent payment handling.
5. Explain compound multikey restrictions.
6. Build a seller dashboard without fan-out bugs.
7. Choose embedding vs referencing for product reviews.
8. Diagnose a slow reporting pipeline.
9. Explain keyset pagination.
10. Propose a shard key and discuss tradeoffs.
11. Explain change streams and resume tokens.
12. Compare `$bucket` and `$bucketAuto`.
13. Build running revenue and rank sellers.
14. Traverse category ancestors and descendants.
15. Plan a no-downtime schema migration.
