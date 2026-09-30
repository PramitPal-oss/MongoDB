# MongoDB Advanced Mastery — Course Map

This course is designed for the `ecommerce_practice` database and assumes you can already perform basic `find`, `insert`, `update`, `delete`, `$match`, `$project`, `$group`, `$unwind`, `$lookup`, `$map`, `$filter`, and `$reduce` operations.

## How to study

For every example:
1. Predict the document shape before running it.
2. Run it in `mongosh`.
3. Inspect `matchedCount`, `modifiedCount`, returned documents, or aggregation stage output.
4. Explain why the operator works.
5. Ask whether an index can help.
6. For writes, use a lab copy such as `ecommerce_practice_lab`.

## Chapters

1. Nested updates: `$`, `$[]`, `$[identifier]`, `arrayFilters`, multi-level nested arrays, `$push`, `$pull`, `$addToSet`, update pipelines.
2. Conditional and object operators: `$cond`, `$switch`, `$ifNull`, `$mergeObjects`, `$objectToArray`, `$arrayToObject`, `$getField`, `$setField`.
3. Advanced aggregation: `$facet`, `$bucket`, `$bucketAuto`, `$unionWith`, `$merge`.
4. Window functions: `$setWindowFields`, ranking, running totals, moving averages.
5. Hierarchies: `$graphLookup`.
6. Performance: indexes, multikey indexes, compound index rules, `explain("executionStats")`, aggregation optimization.
7. Schema/modeling: embedding vs referencing, validators, document growth, bounded arrays, snapshots.
8. Transactions/concurrency: atomic updates, optimistic locking, transactions, idempotency.
9. Production scenarios: checkout, stock reservation, payment retry, reporting, pagination, scaling, sharding, change streams.
10. Interview playbook: common traps, how to explain tradeoffs, machine-coding patterns.

## Lab safety

Use:
```javascript
use ecommerce_practice_lab
```

Prefer disposable documents or clone a real document before destructive experiments.
