# 7. Schema Design, Modeling, and Validation

MongoDB gives flexibility, not an excuse to avoid design.

---

## Embed vs reference

### Embed when
- data belongs to one aggregate/root
- child count is bounded
- child is usually read with parent
- child lifecycle closely follows parent
- atomic updates across parent+child are valuable

Good examples in your dataset:
- customer addresses
- order lines
- shipment tracking events (when bounded reasonably)
- return inspection checklist

### Reference when
- child cardinality can grow very large
- child is independently queried
- child has separate lifecycle
- many parents share it
- document would grow without bound

Good examples:
- reviews as separate documents
- inventory records
- payments
- products vs orders

---

## Snapshot vs live reference

Order lines store both:
- `productId`
- `productSnapshot`

That is deliberate.

Use snapshot for:
- invoice
- historical receipt
- “what customer purchased then”

Use current reference for:
- current catalog page
- present product state
- inventory lookup

Historical documents should not silently change because catalog title changed.

---

## Bounded vs unbounded arrays

Dangerous:
```javascript
product.reviews = [millions of reviews]
```

Problems:
- document growth
- 16 MiB BSON document limit
- expensive rewrites
- huge reads
- hot document contention

Safer:
- separate `reviews` collection
- optionally keep a bounded recent-review preview or rating summary on product

---

## Document growth

MongoDB updates are conceptually document-level storage operations. Frequently growing giant documents can cause write amplification and operational pain.

Ask:
- How large can this array become in 1 year? 5 years?
- Do I always need all elements?
- Can I archive old elements?
- Should this be a child collection?

---

## JSON Schema validation

Your setup uses `$jsonSchema`.

Example:

```javascript
db.runCommand({
  collMod: "orders",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orderNumber", "customerId", "lines", "totals", "placedAt", "currency"],
      properties: {
        currency: {
          enum: ["INR", "USD"]
        }
      }
    }
  },
  validationAction: "error"
})
```

### Validation is not relational integrity
A validator can enforce:
```text
orders.lines.productId is ObjectId
```

It cannot ensure that ObjectId exists in `products`.

Application code, transactions, workflows, repair jobs, or event-driven consistency checks may be needed.

---

## Validation levels/actions

Know these concepts:
- validation action: error vs warn
- validation level: strict vs moderate

During migrations, stricter validation can break updates to legacy documents if they do not conform.

---

## Schema versioning

Production documents evolve.

Pattern:
```javascript
schemaVersion: 2
```

Application reads can support v1 and v2 temporarily.

Migration options:
- eager batch migration
- lazy migration on read/write
- dual-read/dual-write transition

---

## Modeling product variants

Embedded variants are good when:
- variants per product remain bounded
- product page usually needs all variants
- variant lifecycle tied to product

Separate `product_variants` collection when:
- huge variant counts
- independent inventory/search workload
- variant-specific updates dominate
- compound multikey limitations become painful

Migration strategy without downtime:
1. create new collection/indexes
2. backfill variants
3. dual-write old + new
4. read from new with fallback
5. verify parity
6. switch reads fully
7. stop old writes
8. later remove old embedded field

---

## Denormalization

Denormalize when repeated reads justify duplicating stable data.

Examples:
- seller display-name snapshot in order line
- rating summary on product
- monthly revenue materialized collection

Tradeoff: duplicated data must have a defined freshness/consistency policy.

---

## Anti-patterns

1. giant unbounded arrays
2. one monster document for an entire business domain
3. referencing everything like a relational schema
4. embedding everything regardless of growth
5. relying on schema validation for cross-collection integrity
6. no historical snapshots where history matters
7. storing dynamic polymorphic fields without clear query strategy

# Interview framework

When asked “embed or reference?” answer with:
- cardinality
- access pattern
- update pattern
- lifecycle
- atomicity needs
- growth bound
- duplication tolerance

# Practice

1. Explain why reviews are separate.
2. Defend embedded order lines.
3. Redesign order with 50,000 lines.
4. Add a stricter currency validator.
5. Plan embedded-variant → collection migration.
