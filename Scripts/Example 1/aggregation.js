//? 2. Calculate average number of orders per user

db.users.aggregate([
  {
    $project: {
      orderCount: { $size: "$orders" },
      name: 1
    }
  },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: "$orderCount" },
      totalUsers: { $sum: 1 },
      averageOrders: { $avg: { $sum: "$orderCount" } },
    }
  },
  {
    $project: {
      _id: 0,
      totalOrders: 1,
      totalUsers: 1,
      averageOrders: { $round: ["$averageOrders", 2] },
    }
  }
])

//? 3.  Find total revenue from all orders

db.users.aggregate([
  {
    $project: {
      name: 1,
      perPersonRevenue: { $round: [{ $sum: "$orders.total" }, 2] },
      name: 1
    },
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$perPersonRevenue" },
      orderAvg: { $avg: { $sum: "$perPersonRevenue" } },
      totalUsers: { $sum: 1 },
    }
  },
  {
    $project: {
      _id: 0,
      totalRevenue: 1,
      averageRevenue: { $round: ["$orderAvg", 1] },
      totalUsers: 1
    }
  }
])

//? 4. Group orders by status and count them

db.users.aggregate([
  {
    $unwind: { path: '$orders', }
  },
  {
    $group: {
      _id: '$orders.status',
      statusCount: { $count: {} }
    }
  },
  {
    $project: {
      _id: 0,
      OrderStatus: '$_id',
      totalCount: "$statusCount"
    }
  }
])

//? 7. Find the user who spent the most money

db.users.aggregate([
  {
    $project: {
      name: 1,
      totalAmountSpend: { $sum: '$orders.total' }
    }
  },
  {
    $sort: {
      totalAmountSpend: -1
    }
  },
  { $limit: 1 }
])

//Solution : 2

db.users.aggregate([
  // First compute total spend for each user
  {
    $project: {
      name: 1,
      totalAmountSpend: { $sum: "$orders.total" }
    }
  },
  // Group to find the maximum
  {
    $group: {
      _id: null,
      maxSpend: { $max: "$totalAmountSpend" },
      users: { $push: { name: "$name", totalAmountSpend: "$totalAmountSpend" } }
    }
  },
  {
    $project: {
      _id: 0,
      topSpenders: {
        $filter: {
          input: "$users",
          as: "u",
          cond: { $eq: ["$$u.totalAmountSpend", "$maxSpend"] }
        }
      }
    }
  }
  // Filte
])
// solution : 3


db.users.aggregate([
  {
    $project: {
      name: 1,
      totalAmountSpend: { $sum: "$orders.total" }
    }
  },
  {
    $setWindowFields: {
      sortBy: { totalAmountSpend: -1 },
      output: { rank: { $rank: {} } }
    }
  },
  { $match: { rank: 1 } },        // keep only the top rank
  { $project: { _id: 0, name: 1, totalAmountSpend: 1 } }
]);


//? 8.  Calculate total quantity of all products ordered

db.users.aggregate([
  { $unwind: '$orders' },
  { $unwind: '$orders.products' },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: '$orders.products.quantity' }
    }
  },
  { $project: { _id: 0, totalOrders: 1 } }
])

//? 9. Find the most popular payment method

db.users.aggregate([
  { $unwind: '$orders' },
  {
    $group: {
      _id: '$orders.payment.method',
      PaymentMethod: { $count: {} }
    }
  },
  { $sort: { PaymentMethod: -1 } },
  { $limit: 1 }
])

//? 10. Count reviews by rating (1-5 stars)

db.users.aggregate([
  {
    $unwind: '$reviews'
  },
  {
    $group: {
      _id: '$reviews.rating',
      count: { $count: {} }
    }
  },
  {
    $project: {
      rating: '$_id',
      count: 1,
      _id: 0,
    }
  }
])

//? 11. Find the most common city in user addresses


db.users.aggregate([
  { $unwind: "$addresses" },
  {
    $group: {
      _id: "$addresses.country",
      totalAddresses: { $sum: 1 }
    }
  }
]);

db.users.aggregate([
  { $unwind: "$addresses" },
  {
    $group: {
      _id: "$addresses.city",
      totalAddresses: { $sum: 1 }
    }
  }
]);

//? 16. Calculate percentage of paid vs unpaid orders

db.users.aggregate([
  { $unwind: '$orders' },
  {
    $group: {
      _id: '$orders.payment.paid',
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      PaymentStatus: { $cond: { if: '$_id', then: 'paid', else: 'unpaid' } },
      count: 1
    }
  }
])

//? 15. Find the shipping provider with most orders

db.users.aggregate([
  { $unwind: '$orders' },
  {
    $group: {
      _id: '$orders.shipping.provider',
      total: { $sum: 1 },
    }
  },
  {
    $group: {
      _id: null,
      maxCount: { $max: '$total' },
      providres: { $push: { provider: '$_id', count: '$total' } }
    }
  },
  {
    $project: {
      _id: 0,
      MaxProvidres: {
        $filter: {
          input: '$providres',
          as: 'u',
          cond: { $gte: ["$$u.count", '$maxCount'] },
        }
      }
    }
  }

])


//? 16. Calculate percentage of paid vs unpaid orders

db.users.aggregate([
  { $unwind: '$orders' },
  {
    $group: {
      _id: '$orders.payment.paid',
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      PaymentStatus: { $cond: { if: '$_id', then: 'paid', else: 'unpaid' } },
      count: 1,
    }
  },
  {
    $group: {
      _id: null,
      total: { $sum: '$count' },
      breakDown: { $push: '$$ROOT' }
    }
  },

  { $unwind: '$breakDown' },

  {
    $project: {
      _id: 0,
      paymentStatus: '$breakDown.PaymentStatus',
      percentage: {
        $round: [
          {
            $multiply: [
              { $divide: ['$breakDown.count', '$total'] },
              100
            ]
          },
          2]
      }
    }
  }
])


//? 17. Find the state with most users

db.users.aggregate([
  { $unwind: '$addresses' },
  {
    $group: {
      _id: '$addresses.state',
      totalHeadCount: { $sum: 1 },
    }
  },
  {
    $group: {
      _id: null,
      maxCount: { $max: '$totalHeadCount' },
      personPerState: { $push: { state: '$_id', counts: '$totalHeadCount' } }
    }
  },
  {
    $project: {
      _id: 0,
      highestUserState: {
        $filter: {
          input: '$personPerState',
          as: 'u',
          cond: { $gte: ['$$u.counts', '$maxCount'] }
        }
      }
    }
  }

])


//? 14. Count users by registration month

db.users.aggregate([
  {
    $group: {
      _id: { $month: '$registeredAt' },
      registeredUserPerMonth: { $sum: 1 }
    }
  }
])

//? 19. Find the day of week with most orders

db.users.aggregate([
  { $unwind: '$orders' },
  {
    $group: {
      _id: { $dayOfWeek: '$orders.orderedAt' },
      ordersCount: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: null,
      maxCount: { $max: '$ordersCount' },
      weeksArray: { $push: { week: '$_id', orderCount: '$ordersCount' } }
    }
  },
  {
    $project: {
      _id: 0,
      mostOrderedInWeek: {
        $filter: {
          input: '$weeksArray',
          as: 'item',
          cond: { $gte: ['$$item.orderCount', '$maxCount'] }
        }
      }
    }
  }
])

//? 20. Calculate average time between user registration and first order

db.users.aggregate([
  {
    $project: {
      name: 1,
      registeredAt: 1,
      firstOrderAt: { $min: "$orders.orderedAt" },
      dateDifference: {
        $dateDiff: {
          startDate: "$registeredAt",
          endDate: { $min: "$orders.orderedAt" },
          unit: "second"
        }
      }
    }
  },

  {
    $group: {
      _id: null,
      averageTimeInSecond: {
        $avg: '$dateDifference'
      },
    }
  },
  {
    $project: {
      _id: 0,
      aveRageTimeInDays: {
        $floor: { $divide: ['$averageTimeInSecond', 86400] }
      },
      averageTimeInSecond: { $round: ['$averageTimeInSecond', 2] },
      aveRageTimeInHours: {
        $floor: { $divide: ['$averageTimeInSecond', 3600] }
      }
    }
  }

])

//? 13. Find the most ordered product 

db.users.aggregate([
  { $unwind: '$orders' },
  { $unwind: '$orders.products' },
  {
    $group: {
      _id: '$orders.products.name',
      totalCount: { $sum: 1 }
    }
  },
  {
    $setWindowFields: {
      sortBy: { totalCount: -1 },
      output: {
        maxCount: { $max: "$totalCount", window: { documents: ["unbounded", "unbounded"] } }
      }
    }
  },
  { $match: { $expr: { $eq: ["$totalCount", "$maxCount"] } } }
])

//? 12. Calculate average rating across all reviews

db.users.aggregate([
  {
    $project: {
      name: 1,
      totalRatings: { $round: [{ $avg: '$reviews.rating' }, 2] }
    }
  },
  {
    $group: {
      _id: null,
      averageRatings: { $avg: '$totalRatings' }
    }
  },
  {
    $project: {
      _id: 0,
      avgRating: { $ceil: '$averageRatings' }
    }
  }
])