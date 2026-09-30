# 1. Nested Updates — Complete Guide

MongoDB nested updates become easy once you separate three questions:

1. **Which parent document should match?** — query filter.
2. **Which array element(s) should change?** — `$`, `$[]`, `$[identifier]`.
3. **What modification should happen?** — `$set`, `$inc`, `$push`, `$pull`, pipeline expressions, etc.

---

## 1. Dot notation refresher

```javascript
db.customers.updateOne(
  { email: "customer0@example.test" },
  { $set: { "preferences.marketingOptIn": true } }
)
```

Dot notation walks embedded objects. It does **not** by itself select a particular array element.

---

## 2. The positional `$` operator — first matched element

Use `$` when the query already identifies an array element and you want to update the first matching element.

```javascript
const customer = db.customers.findOne({ email: "customer0@example.test" })
const addressId = customer.addresses[0].addressId

db.customers.updateOne(
  { _id: customer._id, "addresses.addressId": addressId },
  { $set: { "addresses.$.label": "Primary Home" } }
)
```

Mental model: `addresses.$` means “the `addresses` element that satisfied the query.”

### Common mistake

```javascript
// Bad mental model: $ is NOT "loop every address"
{ $set: { "addresses.$.isDefault": false } }
```

It updates one matched element, not every element.

---

## 3. `$[]` — all elements in one array

```javascript
db.customers.updateOne(
  { _id: customer._id },
  { $set: { "addresses.$[].isDefault": false } }
)
```

This touches every address inside the matched customer.

Typical use cases:
- clear every `isDefault`
- reset flags
- apply one uniform state
- increment every numeric item field

### Then select one default address atomically?

You cannot express “set all to false, then this one to true” with two conflicting classic `$set` paths safely in every shape. An update pipeline is often clearer:

```javascript
db.customers.updateOne(
  { _id: customer._id },
  [
    {
      $set: {
        addresses: {
          $map: {
            input: "$addresses",
            as: "a",
            in: {
              $mergeObjects: [
                "$$a",
                { isDefault: { $eq: ["$$a.addressId", addressId] } }
              ]
            }
          }
        }
      }
    }
  ]
)
```

---

## 4. `$[identifier]` + `arrayFilters`

This is the most important nested-update pattern.

```javascript
db.customers.updateOne(
  { _id: customer._id },
  {
    $set: {
      "addresses.$[addr].postalCode": "700001"
    }
  },
  {
    arrayFilters: [
      { "addr.addressId": addressId }
    ]
  }
)
```

Read it as:
> In `addresses`, for every element named `addr` that satisfies the filter, set its postal code.

The identifier can be any valid lowercase name: `addr`, `variant`, `option`, `item`, `check`, etc.

---

## 5. Multiple nested arrays with multiple identifiers

Your products contain:

```text
products
└─ variants[]
   └─ optionValues[]
```

Change only `storage` for one SKU:

```javascript
db.products.updateOne(
  { "variants.sku": "SKU-000000" },
  {
    $set: {
      "variants.$[v].optionValues.$[opt].value": "1TB"
    }
  },
  {
    arrayFilters: [
      { "v.sku": "SKU-000000" },
      { "opt.option": "storage" }
    ]
  }
)
```

This pattern scales to 3+ levels:

```text
orders.groups.$[g].packages.$[p].contents.$[c].quantity
```

with:

```javascript
arrayFilters: [
  { "g.groupId": groupId },
  { "p.packageId": packageId },
  { "c.lineId": lineId }
]
```

---

## 6. Updating deeply nested return inspection data

Your returns contain:

```text
items[]
└─ inspection
   └─ checklist[]
```

```javascript
db.returns.updateOne(
  { _id: returnId },
  {
    $set: {
      "items.$[item].inspection.checklist.$[check].answer": true
    }
  },
  {
    arrayFilters: [
      { "item.lineId": lineId },
      { "check.question": "Original packaging?" }
    ]
  }
)
```

This is a canonical senior-interview question.

---

## 7. `$push`

Append an item:

```javascript
db.customers.updateOne(
  { _id: customer._id },
  {
    $push: {
      addresses: {
        addressId: new ObjectId(),
        label: "Office",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700091",
        country: "IN",
        isDefault: false
      }
    }
  }
)
```

### `$push` modifiers

```javascript
$push: {
  history: {
    $each: [event1, event2],
    $position: 0,
    $slice: 50,
    $sort: { at: -1 }
  }
}
```

Useful for bounded arrays.

---

## 8. `$addToSet`

```javascript
db.customers.updateOne(
  { _id: customer._id },
  { $addToSet: { "preferences.favoriteCategories": categoryId } }
)
```

Running it twice does not duplicate the same scalar/ObjectId value.

### Important object trap

```javascript
{ $addToSet: { certifications: { code: "BIS", issuer: "BIS" } } }
```

MongoDB compares the whole embedded value. If another object is `{code:"BIS", issuer:"Other"}`, that is a different object.

If uniqueness is “by `code` only,” use a conditional query or an update pipeline.

---

## 9. `$pull`

Remove matching elements:

```javascript
db.carts.updateOne(
  { _id: cartId },
  {
    $pull: {
      items: { productId: { $in: productIdsToRemove } }
    }
  }
)
```

`$pull` is often much simpler than rebuilding an array.

---

## 10. `$pop`

```javascript
{ $pop: { history: -1 } } // remove first
{ $pop: { history: 1 } }  // remove last
```

Rarely appropriate for business workflows because it is position-based, not identity-based.

---

## 11. Update pipeline — when classic update operators are not enough

Pipeline update syntax:

```javascript
db.inventory.updateOne(
  { _id: inventoryId },
  [
    {
      $set: {
        available: {
          $subtract: [
            { $subtract: ["$quantity.onHand", "$quantity.reserved"] },
            "$quantity.damaged"
          ]
        }
      }
    }
  ]
)
```

The big advantage: right-hand expressions can read other fields from the same document.

Classic update:
```javascript
{ $set: { available: ??? } }
```

cannot directly say “calculate from three current fields” the same way.

---

## 12. Rebuilding arrays with `$map`

```javascript
db.products.updateOne(
  { _id: productId },
  [
    {
      $set: {
        variants: {
          $map: {
            input: "$variants",
            as: "v",
            in: {
              $cond: [
                { $eq: ["$$v.sku", targetSku] },
                {
                  $mergeObjects: [
                    "$$v",
                    {
                      pricing: {
                        $mergeObjects: [
                          "$$v.pricing",
                          { salePrice: NumberDecimal("14999.00") }
                        ]
                      }
                    }
                  ]
                },
                "$$v"
              ]
            }
          }
        }
      }
    }
  ]
)
```

This is verbose but extremely powerful because every element can be transformed using arbitrary aggregation expressions.

---

## 13. `$filter` in an update pipeline

Equivalent idea to `$pull`:

```javascript
db.carts.updateOne(
  { _id: cartId },
  [
    {
      $set: {
        items: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $not: [{ $in: ["$$item.productId", productIdsToRemove] }] }
          }
        }
      }
    }
  ]
)
```

Why choose this over `$pull`?
- condition requires expression logic
- derived calculations are involved
- multiple transformations happen in one pipeline

---

## 14. Atomic conditional inventory reservation

Never do this:

```javascript
const inv = db.inventory.findOne({_id: id})
if (inv.quantity.onHand - inv.quantity.reserved >= 2) {
  db.inventory.updateOne({_id:id}, {$inc:{"quantity.reserved":2}})
}
```

That is a race condition.

Instead:

```javascript
const result = db.inventory.updateOne(
  {
    _id: inventoryId,
    $expr: {
      $gte: [
        {
          $subtract: [
            { $subtract: ["$quantity.onHand", "$quantity.reserved"] },
            "$quantity.damaged"
          ]
        },
        2
      ]
    }
  },
  {
    $inc: {
      "quantity.reserved": 2,
      version: 1
    },
    $currentDate: { updatedAt: true }
  }
)

if (result.matchedCount === 0) {
  // insufficient stock or stale state
}
```

The predicate and increment are evaluated atomically on the same document.

---

## 15. Optimistic locking with `version`

Suppose two requests read version 17.

Writer A:
```javascript
db.inventory.updateOne(
  { _id: inventoryId, version: 17 },
  {
    $inc: { "quantity.reserved": 1, version: 1 }
  }
)
```

Writer B runs the same query. After A succeeds, version becomes 18. B gets `matchedCount: 0`.

That is optimistic concurrency control.

---

## 16. Idempotent append

Bad:
```javascript
$push: { statusHistory: event }
```

A retry duplicates the event.

Safer pattern:
```javascript
db.orders.updateOne(
  {
    _id: orderId,
    "statusHistory.eventId": { $ne: eventId }
  },
  {
    $push: {
      statusHistory: {
        eventId,
        status: "PAID",
        at: new Date()
      }
    }
  }
)
```

For stronger guarantees across a large system, put idempotency keys behind a unique index in a dedicated event/request collection.

---

# Operator selection cheat sheet

| Need | Best starting tool |
|---|---|
| update one matched array element | `$` |
| update every element | `$[]` |
| update selected elements | `$[id]` + `arrayFilters` |
| append | `$push` |
| append unique whole value | `$addToSet` |
| remove matching items | `$pull` |
| derive field from current document | update pipeline |
| transform every array item | `$map` |
| keep/remove items with expression logic | `$filter` |
| concurrency-safe numeric state | conditional query + atomic update |

# Interview traps

1. `$` is not “all elements.”
2. `arrayFilters` names must correspond to identifiers in the path.
3. `$addToSet` does not provide uniqueness by one subfield of an object.
4. read-then-write stock checks race.
5. array-index updates like `items.0` are brittle.
6. replacing an entire array can overwrite concurrent changes.
7. update pipelines are excellent when values depend on other fields.

# Practice

Implement workbook questions 81–100 after this chapter.
