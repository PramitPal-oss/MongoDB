# 2. Conditional and Object Operators

These operators let you write business logic inside aggregation and update pipelines.

---

## `$cond`

Ternary form:

```javascript
{
  $project: {
    orderNumber: 1,
    valueBand: {
      $cond: [
        { $gte: ["$totals.grandTotal", NumberDecimal("25000.00")] },
        "HIGH",
        "NORMAL"
      ]
    }
  }
}
```

Object form:

```javascript
{
  $cond: {
    if: { $gt: ["$rating", 3] },
    then: "POSITIVE",
    else: "LOW_OR_NEUTRAL"
  }
}
```

Use `$cond` for one binary branch.

---

## `$switch`

Better for multiple branches:

```javascript
{
  $project: {
    rating: 1,
    sentiment: {
      $switch: {
        branches: [
          { case: { $gte: ["$rating", 5] }, then: "EXCELLENT" },
          { case: { $gte: ["$rating", 4] }, then: "GOOD" },
          { case: { $gte: ["$rating", 3] }, then: "AVERAGE" }
        ],
        default: "POOR"
      }
    }
  }
}
```

First true branch wins.

---

## `$ifNull`

```javascript
{
  $project: {
    answer: {
      $ifNull: ["$items.inspection.answer", "NOT_ANSWERED"]
    }
  }
}
```

It is invaluable when old documents do not yet contain a newer field.

Modern MongoDB supports multiple fallback expressions:

```javascript
{ $ifNull: ["$preferredName", "$name.first", "Unknown"] }
```

---

## Null vs missing

MongoDB often treats explicit `null` and missing fields similarly in several query contexts, but they are not identical concepts. Use `$type`, `$exists`, and explicit predicates when the distinction matters.

---

## `$mergeObjects`

Your most useful object-update expression.

```javascript
{
  $set: {
    customerSnapshot: {
      $mergeObjects: [
        "$customerSnapshot",
        { source: "MIGRATED" }
      ]
    }
  }
}
```

Later objects overwrite earlier duplicate keys.

Nested merge:

```javascript
{
  $set: {
    pricing: {
      $mergeObjects: [
        "$pricing",
        { salePrice: NumberDecimal("19999.00") }
      ]
    }
  }
}
```

If you replace `pricing` without merging, omitted fields can disappear.

---

## `$objectToArray`

Suppose a document stores dynamic metrics:

```javascript
metrics: {
  jan: 100,
  feb: 120,
  mar: 90
}
```

Convert object → array:

```javascript
{
  $project: {
    metricsArray: { $objectToArray: "$metrics" }
  }
}
```

Result:

```javascript
[
  { k: "jan", v: 100 },
  { k: "feb", v: 120 },
  { k: "mar", v: 90 }
]
```

Once converted, you can `$filter`, `$map`, `$unwind`, `$group`, etc.

---

## `$arrayToObject`

Reverse operation:

```javascript
{
  $set: {
    metrics: {
      $arrayToObject: [
        { k: "apr", v: 150 },
        { k: "may", v: 170 }
      ]
    }
  }
}
```

Great for dynamic pivots.

---

## Dynamic-key transformation

```javascript
{
  $set: {
    normalized: {
      $arrayToObject: {
        $map: {
          input: { $objectToArray: "$metrics" },
          as: "pair",
          in: {
            k: { $toUpper: "$$pair.k" },
            v: "$$pair.v"
          }
        }
      }
    }
  }
}
```

This pattern is extremely powerful for documents whose field names are data.

---

## `$getField`

Useful when a field name is dynamic or contains special characters.

```javascript
{
  $project: {
    selected: {
      $getField: {
        field: "$requestedMetric",
        input: "$metrics"
      }
    }
  }
}
```

Conceptually: `metrics[requestedMetric]`.

---

## `$setField`

Set a dynamic field:

```javascript
{
  $set: {
    metrics: {
      $setField: {
        field: "apr",
        input: "$metrics",
        value: 155
      }
    }
  }
}
```

This is safer than trying to construct dotted paths dynamically in application code.

---

## Real example: classify inventory health

```javascript
db.inventory.aggregate([
  {
    $set: {
      available: {
        $subtract: [
          { $subtract: ["$quantity.onHand", "$quantity.reserved"] },
          "$quantity.damaged"
        ]
      }
    }
  },
  {
    $set: {
      stockState: {
        $switch: {
          branches: [
            { case: { $lte: ["$available", 0] }, then: "OUT_OF_STOCK" },
            { case: { $lte: ["$available", "$reorderPoint"] }, then: "LOW" }
          ],
          default: "HEALTHY"
        }
      }
    }
  }
])
```

---

# Interview distinctions

- `$cond`: one if/else.
- `$switch`: many branches.
- `$ifNull`: fallback/default.
- `$mergeObjects`: combine object values.
- `$objectToArray`: dynamic object fields become iterable.
- `$arrayToObject`: build dynamic object fields.
- `$getField`: access key dynamically.
- `$setField`: assign key dynamically.

# Practice prompts

1. Categorize order totals into LOW/MEDIUM/HIGH/VIP.
2. Fill missing return inspection answers with `"PENDING"` in projection only.
3. Add a computed `available` field to inventory documents without removing existing `quantity` subfields.
4. Convert a dynamic object into rows, filter keys, then rebuild it.
5. Transform one nested variant with `$map + $cond + $mergeObjects`.
