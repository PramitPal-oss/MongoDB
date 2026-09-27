//?5. Find users who registered after January 1, 2023.

db.users.find({ "registeredAt": { $gte: new Date("01-01-2023") } }).count()


//?6. Find users who have the country as "India" in any of their addresses.
db.users.find({ "addresses.country": "India" })

//?13. Find users with at least 2 addresses.
db.users.find({ "addresses": { $size: 2 } }).count()

//?14. Find users who have a “Work” address. 
db.users.find({ "addresses.type": "Work" }).count()

//?16. Add a new address to a user
db.users.updateOne({ "email": "Lea_Hudson34@gmail.com" }, {
  $push: {
    addresses: {
      "type": "Home",
      "street": "40/b Bachespati Para",
      "city": "Kolkata",
      "state": "West Bengal",
      "zip": "700076",
      "country": "India"
    }
  }
})

//? 17. Pull a address
db.users.updateOne({ _id: ObjectId("683d94a52d0317e856e9de20") }, {
  $pull: { addresses: { country: "Bangladesh" } }
})


//?18. Find users whose name contains "Smith".
db.users.find({ name: { $regex: /Smith/i } }).count()

//?19 Find users registered in the past 1 year.

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

db.users.find({ registeredAt: { $lt: oneYearAgo } }).count()



//?. 20 Add a review
const obj = {
  "productId": "1d3f19b3-2a6c-42ea-9514-c54104d1b716",
  "productName": "Luxurious Concrete Soap",
  "rating": 4,
  "comment": "Ambitus aer uredo clarus amoveo suasoria.",
  "createdAt": {
    "$date": "2025-05-07T09:19:49.283Z"
  }
}
db.users.updateOne({ _id: ObjectId("683d94a52d0317e856e9de20") }, { $push: { "reviews": obj } })


//? 28. Change the status of all orders for a user to “Delivered”
db.users.updateOne({ _id: ObjectId("683d94a52d0317e856e9de20") }, { $set: { "orders.$[].status": "Delivered" } })

// ? 29. Find users who have placed an order using “PayPal”
db.users.find({ orders: { $all: [{ $elemMatch: { "payment.method": "PayPal" } }] } }, { name: 1 })


db.users.updateOne({ _id: ObjectId('683d94a52d0317e856e9de21') },
  { $set: { "orders.$[order].products.$[product].quantity": 5 } },
  {
    arrayFilters:
      [
        { "order.orderId": "b0eb8d60-db26-41e7-9e48-c8486c52650d" },
        { "product.name": "Modern Silk Cheese" }
      ]
  }
);



//? 31. Find users who have ordered more than 3 products in any order :

db.users.countDocuments({ "orders.products.3": { $exists: true } })

db.users.find({ "orders.products.3": { $exists: true } }, { name: 1 })

db.users.find({ "orders.products.3": { $exists: true } }, { name: 1 }).count()

//? 32. Find users who gave a 5-star rating in any review

db.users.find({ "reviews.rating": 5 }, { name: 1 })

//? 33. Remove an order with a specific `orderId` from a user.

db.users.updateOne({ _id: ObjectId('683d94a52d0317e856e9de23') }, { $pull: { orders: { orderId: "e02fd017-3c0b-437a-a190-f95f1188181f" } } })

//? 34. Update the quantity of a product in a user’s order.

db.users.updateOne(
  { _id: ObjectId("683d94a52d0317e856e9de23") },
  {
    $inc: {
      "orders.$[order].products.$[product].quantity": 3
    }
  },
  {
    arrayFilters: [
      { "order.orderId": "7dd0abfc-ee81-4411-a550-cb926d2967c7" },
      { "product.name": "Elegant Bronze Shirt" }
    ]
  }
)


//? 36.  Find users who have both “Home” and “Work” addresses

db.users.find({
  addresses: {
    $all: [
      { $elemMatch: { type: "Home" } },
      { $elemMatch: { type: "Work" } }
    ]
  }
})


// ? 37. Update the tracking number for a specific order

db.users.updateOne({ _id: ObjectId('683d94a52d0317e856e9de21') },
  { $set: { "orders.$[order].shipping.trackingNumber": "af80a50a-7351-4394-aa5a-737597752854-cha" } },
  {
    arrayFilters:
      [
        { "order.orderId": "ae985d60-2336-4afe-a65c-5b44d42bc2e8" }
      ]
  })


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

// ? Remove the element from order Array :

db.users.updateOne({
  _id: ObjectId('683d94a52d0317e856e9de20')
},
  {
    $pull:
    {
      "orders.0.products": {
        name: 'Redmi note 4g'
      }
    }
  }
)

// ? 39. Update the shipping provider in the latest order.

db.users.updateOne(
  {
    _id: ObjectId('683d94a52d0317e856e9de20')
  },
  {
    $set:
    {
      "orders.$[order].shipping.provider": "Make-know-craft"
    },
  },
  {
    arrayFilters:
      [
        { "order.orderId": "aa76598f-ea6d-491f-a48c-6bd9344fa185" }
      ]
  }
)

// ? 40. Find users whose orders include a product named "T-Shirt".

db.users.findOne({ "orders.products.name": "Refined Steel Pants" })

// ? Average and total orders as per user

db.users.aggregate([
  {
    $project: {
      orderCount: { $size: "$orders" }
    }
  },
  {
    $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      totalOrders: { $sum: "$orderCount" },
      averageOrders: { $avg: "$orderCount" }
    }
  },
  {
    $project: {
      _id: 0,
      totalUsers: 1,
      totalOrders: 1,
      averageOrders: { $round: ["$averageOrders", 2] }
    }
  }
])

// ? Find total revenue from all orders

db.users.aggregate([
  {
    $project: {
      name: 1,
      totalRevenue: { $round: [{ $sum: "$orders.total" }, 2] }
    },
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$totalRevenue" }
    }
  },
  {
    $project: {
      _id: 0,
      totalRevenue: 1
    }
  }
])

// ? Total amount of order per user

db.users.aggregate([
  {
    $project: {
      name: 1,
      totalAmount: {
        $sum: {
          $map: {
            input: '$orders',
            as: 'order',
            in: {
              $sum: {
                $map: {
                  input: '$$order.products',
                  as: 'product',
                  in: {
                    $multiply: ['$$product.price', '$$product.quantity']
                  }
                }
              }
            }
          }
        }
      }
    }
  }
])

//? Group orders by status and count them

db.users.aggregate([
  { $unwind: "$orders" },
  {
    $group: {
      _id: "$orders.status",  // Group by status field
      count: { $sum: 1 }      // Count each order
    }
  },
  { $sort: { count: -1 } },
  {
    $project: {
      _id: 0,
      status: "$_id",
      count: 1
    }
  }
]);



//? Find the user who spent the most money

db.users.aggregate([
  {
    $project: {
      name: 1,
      email: 1,
      _id: 0,
      totalSpend: { $round: [{ $sum: "$orders.total" }, 2] }
    }
  },
  { $sort: { totalSpend: -1 } },
  { $limit: 1 }
]);

