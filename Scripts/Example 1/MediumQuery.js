// ? 31. Find users who have ordered more than 3 products in any order.
db.users.find({ "orders.products": { $size: 4 } }, { name: 1 })

// ? 32. Find users who gave a 5-star rating in any review.
db.users.find({ "reviews.rating": 5 }, { name: 1 })

//? 33.  Remove an order with a specific `orderId` from a user.
db.users.updateOne({ _id: ObjectId("683d94a52d0317e856e9de21") }, { $pull: { orders: { orderId: "ae985d60-2336-4afe-a65c-5b44d42bc2e8" } } })

//? 34 Update the quantity of a product in a user’s order
db.users.updateOne({ _id: ObjectId("683d94a52d0317e856e9de21") },
  { $inc: { "orders.$[order].products.$[element].quantity": 3 } },
  {
    arrayFilters: [
      { "order.orderId": "b0eb8d60-db26-41e7-9e48-c8486c52650d" },
      { "element.name": { $regex: /Handmade Aluminum Hat/i } }]
  })

// ?35. Delete users who have never placed an order.
db.users.find({ orders: { $size: 0 } })

//? 37. Update the tracking number for a specific order.

//!Optimised Approach
db.users.updateOne(
  { _id: ObjectId('683d94a52d0317e856e9de21'), "orders.orderId": "b0eb8d60-db26-41e7-9e48-c8486c52650d" },
  { $set: { "orders.$.shipping.trackingNumber": "h8998efa-c159-4970-9a7e-27227360d051" } }
)

//! Less Optimised Approach
db.users.updateOne({ _id: ObjectId('683d94a52d0317e856e9de21') },
  { $set: { "orders.$[element].shipping.trackingNumber": "g8998efa-c159-4970-9a7e-27227360d051" } },
  { arrayFilters: [{ "element.orderId": "b0eb8d60-db26-41e7-9e48-c8486c52650d" }] }
)

// ? 38. Add a product to the first order of a user.

db.users.updateOne(
  { _id: ObjectId("683d94a52d0317e856e9de20") },
  {
    $push: {
      "orders.0.products": {
        $each: [
          { name: "Redmi note 4g", price: 5000, quantity: 3 }
        ],
        $position: 0
      }
    },

    $inc:
    {
      "orders.0.total": 5000 * 3  // price × quantity
    }
  }
)
