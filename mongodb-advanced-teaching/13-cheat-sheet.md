# 12. MongoDB Advanced Cheat Sheet

## Nested updates

```javascript
"arr.$.field"          // first element matched by query
"arr.$[].field"        // all elements
"arr.$[x].field"       // filtered elements
arrayFilters: [{"x.id": id}]
```

Nested arrays:
```javascript
"variants.$[v].optionValues.$[o].value"
```

## Array mutations

```javascript
$push
$push + $each/$slice/$sort/$position
$addToSet
$pull
$pop
```

## Update pipeline

```javascript
updateOne(filter, [
  {$set:{...aggregation expressions...}}
])
```

## Conditional/object

```javascript
$cond
$switch
$ifNull
$mergeObjects
$objectToArray
$arrayToObject
$getField
$setField
```

## Advanced aggregation

```javascript
$facet       // branches same input
$bucket      // fixed ranges
$bucketAuto  // automatic ranges
$unionWith   // concatenate streams
$merge       // materialize/upsert results
```

## Window functions

```javascript
$setWindowFields
$rank
$denseRank
$documentNumber
$sum
$avg
$shift
```

Frames:
```javascript
{documents:["unbounded","current"]}
{documents:[-6,"current"]}
{range:[-6,0], unit:"day"}
```

## Hierarchy

```javascript
$graphLookup
startWith
connectFromField
connectToField
depthField
maxDepth
restrictSearchWithMatch
```

## Index analysis

```javascript
.find(...).explain("executionStats")
.aggregate(..., {explain: ...}) // driver/method form varies
```

Look for:
```text
IXSCAN / COLLSCAN
totalKeysExamined
totalDocsExamined
nReturned
```

## Index rules

- design for query shape
- equality → sort → range is a useful heuristic
- understand leftmost prefix
- arrays create multikey indexes
- avoid compound indexes over independent arrays
- unique indexes enforce invariants
- partial indexes reduce indexed subset

## Modeling

Embed if bounded + owned + read together.
Reference if unbounded + independently queried/shared.
Use snapshots for historical truth.
Avoid unbounded arrays.

## Concurrency

Best pattern:
```javascript
updateOne(
  { _id, /* expected state or available-stock predicate */ },
  { $inc: {...} }
)
```

Check `matchedCount`.

Optimistic lock:
```javascript
{_id, version:expected}
$inc:{version:1}
```

## Idempotency

Use stable request/provider key + unique index.
Retry returns/reuses original effect.

## Pagination

Avoid deep:
```javascript
skip(100000)
```

Prefer stable keyset:
```javascript
sort({placedAt:-1,_id:-1})
```

## Production mantra

Correctness first → query shape → index → measure → concurrency → failure/retry → observability.
