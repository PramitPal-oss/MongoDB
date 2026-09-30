# 8. Transactions, Concurrency, Atomicity, and Idempotency

This chapter separates four concepts people frequently mix up.

---

## 1. Single-document atomicity

MongoDB updates to one document are atomic.

If inventory quantity and version are in one document:

```javascript
db.inventory.updateOne(
  { _id: id, version: expectedVersion },
  {
    $inc: {
      "quantity.reserved": 2,
      version: 1
    }
  }
)
```

No reader observes half of that update.

---

## 2. Conditional atomic updates

Best tool for contention-heavy inventory:

```javascript
db.inventory.updateOne(
  {
    _id: id,
    $expr: {
      $gte: [
        {
          $subtract: [
            { $subtract: ["$quantity.onHand", "$quantity.reserved"] },
            "$quantity.damaged"
          ]
        },
        requestedQty
      ]
    }
  },
  {
    $inc: {
      "quantity.reserved": requestedQty,
      version: 1
    }
  }
)
```

If `matchedCount === 0`, reservation lost the race or stock was insufficient.

---

## 3. Optimistic locking

Read version → write only if version is unchanged.

```javascript
updateOne(
  { _id, version: 17 },
  { $set: {...}, $inc: { version: 1 } }
)
```

This converts silent lost updates into detectable conflicts.

---

## 4. Transactions

Use a transaction when multiple documents/collections must change atomically.

Node-style pseudocode:

```javascript
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    const inv = await inventory.findOneAndUpdate(
      { _id: inventoryId, /* enough-stock predicate */ },
      { $inc: { "quantity.reserved": qty } },
      { session, returnDocument: "after" }
    );

    if (!inv) throw new Error("INSUFFICIENT_STOCK");

    await orders.insertOne(order, { session });
  });
} finally {
  await session.endSession();
}
```

Transactions require an appropriate MongoDB topology (for example a replica set or sharded cluster).

---

## Do not put external payment API calls inside the DB transaction

Bad idea:
```text
BEGIN DB transaction
reserve stock
create order
call external payment gateway
wait network
COMMIT
```

Problems:
- long transaction duration
- external service cannot roll back with MongoDB
- locks/resources held longer
- payment may succeed while transaction aborts

Better architecture uses state machines, idempotency, and compensating actions.

---

## Idempotency

Definition:
> Retrying the same logical request produces no additional side effect.

Your payment collection already has `idempotencyKey` and `providerPaymentId` concepts.

Create unique index:

```javascript
db.payments.createIndex({ idempotencyKey: 1 }, { unique: true })
```

Flow:
1. client sends idempotency key
2. server checks/inserts operation record
3. duplicate key means request was already processed/in-flight
4. return prior result instead of performing duplicate side effects

---

## Duplicate payment webhook

Provider sends success three times.

Do not:
```javascript
$push: { events: successEvent }
```
three times.

Use provider event/payment ID behind a unique constraint.

Example event collection:
```javascript
{
  provider: "sandbox-provider",
  providerEventId: "evt_123",
  receivedAt: ...,
  processedAt: ...
}
```

Unique index:
```javascript
{ provider: 1, providerEventId: 1 }
```

Only first insert succeeds.

---

## Network timeout after successful write

Without idempotency:
```text
client → create order
server writes order
response lost
client retries
server creates second order
```

With idempotency key:
```text
retry → same key → return original order result
```

---

## Read/write concerns — conceptually

Write concern controls acknowledgment durability level.
Read concern controls consistency/isolation characteristics of reads.

For business-critical confirmation flows, choose settings according to durability/latency requirements rather than copying defaults blindly.

---

## Transaction vs atomic update

Do not use a transaction when one conditional document update already solves the invariant.

For “reserve inventory if 2 available”:
- one conditional update is simpler
- lower overhead
- naturally handles race

Transactions are for invariants spanning multiple documents.

---

## Checkout state machine

Possible states:
```text
CART_ACTIVE
CHECKOUT_STARTED
STOCK_RESERVED
ORDER_CREATED
PAYMENT_PENDING
PAID
FULFILLMENT_PENDING
SHIPPED
DELIVERED
```

Failure states:
```text
PAYMENT_FAILED
RESERVATION_EXPIRED
CANCELLED
```

Every transition should define:
- allowed previous states
- atomic write condition
- idempotency key/event ID
- retry behavior
- compensating action
- audit event

---

## Saga-style compensation

Example:
1. reserve stock
2. create order
3. payment fails
4. release reservation
5. mark order payment failed

The release operation itself should be idempotent.

---

# Interview answers to remember

**Question:** Two users buy the last item. How do you avoid overselling?

Answer: use a conditional atomic update whose filter verifies enough available stock; exactly one writer succeeds. Check `matchedCount`/returned document.

**Question:** Why not always use transactions?

Answer: single-document atomic operations are cheaper and often better for local invariants; transactions are valuable for cross-document atomicity.

**Question:** How do you handle payment retries?

Answer: persistent idempotency key + unique index + state machine + provider event uniqueness.
