# 4. Window Functions with `$setWindowFields`

Window functions analyze neighboring rows **without collapsing them** like `$group` does.

Think SQL:
```sql
SUM(revenue) OVER (PARTITION BY seller ORDER BY month)
```

MongoDB equivalent uses `$setWindowFields`.

---

## Core syntax

```javascript
{
  $setWindowFields: {
    partitionBy: "$sellerId",
    sortBy: { month: 1 },
    output: {
      runningRevenue: {
        $sum: "$revenue",
        window: { documents: ["unbounded", "current"] }
      }
    }
  }
}
```

- `partitionBy`: independent groups.
- `sortBy`: order inside each group.
- `output`: one or more window calculations.
- `window`: frame around current row.

---

## Prepare monthly seller revenue

```javascript
const pipeline = [
  { $unwind: "$lines" },
  {
    $group: {
      _id: {
        sellerId: "$lines.sellerId",
        month: {
          $dateTrunc: { date: "$placedAt", unit: "month" }
        }
      },
      revenue: { $sum: "$lines.lineTotal" }
    }
  },
  {
    $project: {
      _id: 0,
      sellerId: "$_id.sellerId",
      month: "$_id.month",
      revenue: 1
    }
  }
]
```

Now append window stages.

---

## Ranking

```javascript
{
  $setWindowFields: {
    partitionBy: "$month",
    sortBy: { revenue: -1, sellerId: 1 },
    output: {
      rank: { $rank: {} },
      denseRank: { $denseRank: {} },
      documentNumber: { $documentNumber: {} }
    }
  }
}
```

### Differences

If revenues are `100, 100, 90`:
- `$rank`: `1,1,3`
- `$denseRank`: `1,1,2`
- `$documentNumber`: `1,2,3`

Use deterministic secondary sort when business logic needs stable ordering.

---

## Running total

```javascript
{
  $setWindowFields: {
    partitionBy: "$sellerId",
    sortBy: { month: 1 },
    output: {
      cumulativeRevenue: {
        $sum: "$revenue",
        window: { documents: ["unbounded", "current"] }
      }
    }
  }
}
```

---

## Moving average by documents

For already-daily rows:

```javascript
{
  $setWindowFields: {
    sortBy: { day: 1 },
    output: {
      moving7Rows: {
        $avg: "$revenue",
        window: { documents: [-6, "current"] }
      }
    }
  }
}
```

This means 7 rows, not necessarily 7 calendar days.

---

## Seven-day moving average by date range

First create one row per day. Then:

```javascript
{
  $setWindowFields: {
    sortBy: { day: 1 },
    output: {
      moving7DayRevenue: {
        $avg: "$revenue",
        window: {
          range: [-6, 0],
          unit: "day"
        }
      }
    }
  }
}
```

This is conceptually different from seven documents.

---

## Prior value with `$shift`

```javascript
{
  $setWindowFields: {
    partitionBy: "$sellerId",
    sortBy: { month: 1 },
    output: {
      previousRevenue: {
        $shift: {
          output: "$revenue",
          by: -1,
          default: null
        }
      }
    }
  }
}
```

Then growth:

```javascript
{
  $set: {
    growth: {
      $cond: [
        { $gt: ["$previousRevenue", 0] },
        {
          $divide: [
            { $subtract: ["$revenue", "$previousRevenue"] },
            "$previousRevenue"
          ]
        },
        null
      ]
    }
  }
}
```

---

## Detect spend anomalies vs prior average

Create one row per customer/month first. Then:

```javascript
{
  $setWindowFields: {
    partitionBy: "$customerId",
    sortBy: { month: 1 },
    output: {
      priorAvg: {
        $avg: "$monthlySpend",
        window: { documents: ["unbounded", -1] }
      }
    }
  }
},
{
  $match: {
    $expr: {
      $gt: ["$monthlySpend", { $multiply: [2, "$priorAvg"] }]
    }
  }
}
```

Notice current row is excluded from the prior average.

---

## Top N per group using rank

```javascript
{
  $setWindowFields: {
    partitionBy: "$sellerId",
    sortBy: { units: -1, productId: 1 },
    output: { r: { $documentNumber: {} } }
  }
},
{ $match: { r: { $lte: 3 } } }
```

---

## `$group` vs window function

`$group`:
- one output row per group
- detail rows disappear

`$setWindowFields`:
- rows stay
- each row gains context such as rank, running sum, previous value, moving average

# Performance considerations

Window stages usually need sorted data. A supporting index can help earlier matching/sorting, but aggregation may still materialize/sort intermediate results after prior transformations.

Reduce cardinality first when possible. Example: compute daily totals with `$group`, then run a window over hundreds of day rows instead of millions of order rows.

# Practice

1. Monthly seller revenue rank.
2. Seller cumulative revenue.
3. 7-day moving average daily GMV.
4. Month-over-month growth.
5. Top 3 products per seller.
6. Customer spend spike > 2× prior average.
