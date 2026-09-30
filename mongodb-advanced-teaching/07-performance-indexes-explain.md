# 6. Performance, Indexes, and `explain("executionStats")`

Performance tuning is not “add indexes everywhere.” Start from actual query shapes.

---

## Index mental model

A B-tree-like index helps MongoDB avoid scanning every document.

```javascript
db.customers.createIndex({ email: 1 }, { unique: true })
```

A lookup by exact email should usually examine very few keys/documents.

---

## Read `explain("executionStats")`

```javascript
db.customers
  .find({ email: "customer0@example.test" })
  .explain("executionStats")
```

Focus on:
- `winningPlan`
- `IXSCAN` vs `COLLSCAN`
- `totalKeysExamined`
- `totalDocsExamined`
- `nReturned`
- execution time

Healthy selective lookup often looks roughly like:
```text
keys examined ≈ rows returned
docs examined ≈ rows returned
```

A scan may look like:
```text
docs examined = 5000
rows returned = 1
```

---

## Compound indexes

Your setup includes:

```javascript
{ customerId: 1, placedAt: -1 }
```

Perfect query shape:

```javascript
db.orders
  .find({ customerId })
  .sort({ placedAt: -1 })
  .limit(20)
```

One index supports filter + sort.

---

## Leftmost prefix

Index:
```javascript
{ customerId: 1, placedAt: -1 }
```

Useful for:
```javascript
{ customerId: X }
```

Useful for:
```javascript
{ customerId: X, placedAt: { $gte: ... } }
```

Generally not ideal as a direct index for:
```javascript
{ placedAt: { $gte: ... } }
```

because the leading field is missing.

---

## Equality, Sort, Range heuristic

A common design heuristic:
1. equality predicates first
2. sort fields next
3. range predicates after

Example:
```javascript
{ sellerId: 1, status: 1, createdAt: -1 }
```

for:
```javascript
find({ sellerId, status: "ACTIVE" }).sort({ createdAt: -1 })
```

Always verify with `explain`.

---

## Multikey indexes

If an indexed field is an array, MongoDB creates index entries for array elements.

Your product index:

```javascript
{ "variants.sku": 1 }
```

is multikey because `variants` is an array.

This makes lookups like:
```javascript
db.products.find({ "variants.sku": "SKU-000000" })
```
fast.

---

## Compound multikey restriction

MongoDB cannot freely support a compound index where more than one indexed path comes from independent arrays in the same document.

Problem concept:
```javascript
{ "variants.sku": 1, "categoryIds": 1 }
```

Both can be arrays. Cartesian index explosion would be problematic.

Alternative designs:
- separate indexes
- remodel one array
- denormalize a scalar search field
- use a separate collection for variants
- use dedicated search capabilities depending on use case

---

## Covered queries

A query may be covered when MongoDB can answer it from index entries without fetching full documents.

Example concept:
```javascript
index: { email: 1, status: 1 }
query: { email: ... }
projection: { _id: 0, email: 1, status: 1 }
```

Check explain rather than assuming.

---

## Partial indexes

```javascript
db.products.createIndex(
  { sellerId: 1, createdAt: -1 },
  { partialFilterExpression: { status: "ACTIVE" } }
)
```

Smaller index if inactive data is large.

But MongoDB can only safely use it when query semantics imply the partial filter.

---

## Sparse vs partial

Sparse focuses primarily on indexed-field existence. Partial indexes allow an expressive filter and are usually more useful for deliberate production designs.

---

## Unique indexes

Your dataset uses unique constraints for:
- customer email
- seller code
- product variant SKU
- order number
- payment idempotency key
- provider/providerPaymentId
- tracking number combinations

These are not only performance tools—they enforce invariants.

---

## Regex and indexes

Anchored prefix:
```javascript
{ email: /^customer1/ }
```

may use an index much better than:
```javascript
{ email: /omer1/ }
```

Unanchored substring search generally cannot leverage a standard B-tree index efficiently.

---

## Sorting and indexes

If query has to sort huge results in memory, ask:
- can a compound index provide the requested order?
- does earlier transformation destroy index ordering?

Example:
```javascript
find({ customerId }).sort({ placedAt: -1 })
```
can align with `{customerId:1, placedAt:-1}`.

---

## Aggregation optimization

### Put selective `$match` early
```javascript
[{$match:{status:"DELIVERED"}}, ...]
```

### Projecting early is not always magic
MongoDB's optimizer can prune fields in many cases. The bigger wins usually come from reducing document count and avoiding fan-out.

### Unwind late when possible
`$unwind` multiplies documents.

### Group before lookup when semantically valid
Turn millions of detail rows into thousands of summaries before joining.

### Pipeline `$lookup`
Filter foreign documents inside the lookup rather than joining everything.

```javascript
{
  $lookup: {
    from: "reviews",
    let: { productId: "$_id" },
    pipeline: [
      { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
      { $match: { status: "PUBLISHED" } },
      { $sort: { createdAt: -1 } },
      { $limit: 3 },
      { $project: { rating: 1, title: 1 } }
    ],
    as: "reviews"
  }
}
```

---

## Diagnose slow aggregation step-by-step

1. Capture exact query/pipeline and representative parameters.
2. Check cardinality before/after each stage.
3. Push selective filters early.
4. Run explain.
5. Check whether initial match/sort uses indexes.
6. Look for huge `$unwind` fan-out.
7. Look for `$lookup` returning enormous arrays.
8. Check grouping/sort memory pressure.
9. Reduce shape/cardinality before expensive stages.
10. Consider materialized summaries if workload is repeatedly analytical.

---

## Pagination performance

### Offset
```javascript
.skip(100000).limit(20)
```
MongoDB still has to walk past many entries.

### Keyset
Sort:
```javascript
{ placedAt: -1, _id: -1 }
```

Next page filter:
```javascript
{
  $or: [
    { placedAt: { $lt: lastPlacedAt } },
    { placedAt: lastPlacedAt, _id: { $lt: lastId } }
  ]
}
```

Index:
```javascript
{ placedAt: -1, _id: -1 }
```

Much better for deep pagination.

---

# Interview checklist

When asked “how would you optimize this?” do not immediately say “create index.” Say:
1. inspect query shape
2. inspect selectivity
3. inspect current indexes
4. use explain
5. analyze sort and cardinality
6. verify multikey implications
7. test candidate index
8. measure write/storage cost

# Practice

Complete workbook questions 161–180 after this chapter.
