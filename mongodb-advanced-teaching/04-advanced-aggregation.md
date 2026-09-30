# 3. Advanced Aggregation

---

## `$facet` — several pipelines over the same input stream

Think of `$facet` as:
> “After common filtering, branch the same documents into multiple mini-pipelines.”

Example product API response:

```javascript
db.products.aggregate([
  { $match: { status: "ACTIVE" } },
  {
    $facet: {
      metadata: [
        { $count: "total" }
      ],
      data: [
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: 20 },
        { $project: { title: 1, sellerId: 1, variants: 1 } }
      ],
      priceHistogram: [
        { $unwind: "$variants" },
        {
          $bucket: {
            groupBy: "$variants.pricing.salePrice",
            boundaries: [
              NumberDecimal("0"),
              NumberDecimal("10000"),
              NumberDecimal("20000"),
              NumberDecimal("50000"),
              NumberDecimal("1000000")
            ],
            default: "OTHER",
            output: { count: { $sum: 1 } }
          }
        }
      ]
    }
  }
])
```

### Important
Do selective `$match` before `$facet` whenever possible. Otherwise each branch processes too many documents.

---

## `$bucket`

Fixed business-defined ranges.

```javascript
{
  $bucket: {
    groupBy: "$variants.pricing.salePrice",
    boundaries: [
      NumberDecimal("0"),
      NumberDecimal("10000"),
      NumberDecimal("25000"),
      NumberDecimal("50000"),
      NumberDecimal("100000")
    ],
    default: "100000+",
    output: {
      count: { $sum: 1 },
      avgPrice: { $avg: "$variants.pricing.salePrice" }
    }
  }
}
```

Use when product/business teams care about known bands.

---

## `$bucketAuto`

MongoDB chooses boundaries to distribute input approximately across N buckets.

```javascript
db.orders.aggregate([
  {
    $bucketAuto: {
      groupBy: "$totals.grandTotal",
      buckets: 5,
      output: {
        count: { $sum: 1 },
        avg: { $avg: "$totals.grandTotal" }
      }
    }
  }
])
```

Use for exploratory analytics, not stable UI labels.

---

## `$unionWith`

Union documents from another collection/pipeline.

Build an activity feed:

```javascript
db.orders.aggregate([
  {
    $project: {
      _id: 0,
      type: { $literal: "ORDER_PLACED" },
      entityId: "$_id",
      at: "$placedAt",
      description: "$orderNumber"
    }
  },
  {
    $unionWith: {
      coll: "payments",
      pipeline: [
        { $match: { status: "CAPTURED" } },
        {
          $project: {
            _id: 0,
            type: { $literal: "PAYMENT_CAPTURED" },
            entityId: "$_id",
            at: "$createdAt",
            description: "$providerPaymentId"
          }
        }
      ]
    }
  },
  {
    $unionWith: {
      coll: "shipments",
      pipeline: [
        { $match: { status: "DELIVERED" } },
        {
          $project: {
            _id: 0,
            type: { $literal: "SHIPMENT_DELIVERED" },
            entityId: "$_id",
            at: "$deliveredAt",
            description: "$trackingNumber"
          }
        }
      ]
    }
  },
  { $sort: { at: -1 } },
  { $limit: 100 }
])
```

Every branch should emit a compatible logical shape.

---

## `$merge` — materialize aggregation results

Example: monthly seller revenue summary.

```javascript
db.orders.aggregate([
  { $unwind: "$lines" },
  {
    $group: {
      _id: {
        sellerId: "$lines.sellerId",
        month: {
          $dateTrunc: {
            date: "$placedAt",
            unit: "month",
            timezone: "Asia/Kolkata"
          }
        }
      },
      revenue: { $sum: "$lines.lineTotal" },
      units: { $sum: "$lines.quantity" }
    }
  },
  {
    $project: {
      _id: 0,
      sellerId: "$_id.sellerId",
      month: "$_id.month",
      revenue: 1,
      units: 1,
      refreshedAt: "$$NOW"
    }
  },
  {
    $merge: {
      into: "seller_monthly_revenue",
      on: ["sellerId", "month"],
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
])
```

For this `on` key, create a unique index:

```javascript
db.seller_monthly_revenue.createIndex(
  { sellerId: 1, month: 1 },
  { unique: true }
)
```

### `$merge` vs `$out`

`$merge` supports merge semantics and incremental materialization patterns. `$out` replaces output more like a full refresh.

---

## Combining advanced stages

Dashboard strategy:
1. `$match` date/seller/status early.
2. `$unwind` only when required.
3. `$facet` for several metrics from same source.
4. `$unionWith` if metrics truly come from different root collections.
5. `$merge` when repeated expensive analytics should be persisted.

---

# Fan-out danger

Suppose one seller has:
- 10 products
- 100 reviews
- 20 return items

If you `$lookup` all three independently and then unwind everything, you can accidentally create `10 × 100 × 20` rows.

Fixes:
- aggregate inside lookup pipelines first
- maintain arrays instead of unwinding everything
- calculate each metric separately then combine
- use `$facet` or multiple subqueries

# Interview questions

1. Why put `$match` before `$facet`?
2. When is `$bucketAuto` a poor choice?
3. How do you prevent duplicates on `$merge` reruns?
4. What is the difference between combining collections with `$unionWith` and joining them with `$lookup`?
5. Why can `$lookup + $unwind` inflate totals?
