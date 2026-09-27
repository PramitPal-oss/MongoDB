//? 24. Calculate total sales by month

db.users.aggregate([
  { $unwind: '$orders' },
  {
    $group: {
      _id: { $month: '$orders.orderedAt' },
      totalSales: { $sum: '$orders.total' }
    }
  }
])

//? 21. Find users who spent more than 20000 in total

db.users.aggregate([
  {
    $project: {
      name: 1,
      totalSpend: { $sum: '$orders.total' },
    }
  },
  {
    $match: {
      totalSpend: { $gt: 20000 }
    }
  }
])


//? 50. Calculate percentage of users who leave reviews

db.users.aggregate([
  {
    $project: {
      name: 1,
      hasReviews: { $gt: [{ $size: "$reviews" }, 0] }
    }
  },
  {
    $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      totalReviews: {
        $sum: {
          $cond: [{ $eq: ['$hasReviews', true] }, 1, 0]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      totalUsers: 1,
      totalReviews: 1,
      avgReviewPercentage: {
        $multiply: [
          { $divide: ['$totalReviews', '$totalUsers'] }, 100
        ]
      }
    }
  }
])