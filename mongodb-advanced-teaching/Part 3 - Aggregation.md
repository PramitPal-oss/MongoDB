Next: **`$lookup` — MongoDB joins**, from simple to interview-level.

# 1. What `$lookup` does

Think SQL:

```sql
SELECT *
FROM orders
LEFT JOIN customers
  ON orders.customer_id = customers.id;
```

MongoDB:

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customer',
    },
  },
]);
```

Important:

> `$lookup` behaves like a **left outer join**.

So every order remains, even if no matching customer exists.

---

# 2. Example Collections

## `orders`

```javascript
{
  _id: 1,
  customerId: 101,
  totalAmount: 5000
}
```

## `customers`

```javascript
{
  _id: 101,
  name: "Pramit",
  city: "Kolkata"
}
```

Pipeline:

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customer',
    },
  },
]);
```

Result:

```javascript
{
  _id: 1,
  customerId: 101,
  totalAmount: 5000,

  customer: [
    {
      _id: 101,
      name: "Pramit",
      city: "Kolkata"
    }
  ]
}
```

Notice:

```javascript
customer: [...]
```

`$lookup` returns an **array**.

Even if only one customer matches.

---

# 3. Why `$unwind` is often used after `$lookup`

If there is logically only one customer per order, you often want:

```javascript
customer: {
  name: 'Pramit';
}
```

instead of:

```javascript
customer: [
  {
    name: 'Pramit',
  },
];
```

So:

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customer',
    },
  },

  {
    $unwind: '$customer',
  },
]);
```

Now:

```javascript
{
  _id: 1,
  totalAmount: 5000,

  customer: {
    _id: 101,
    name: "Pramit",
    city: "Kolkata"
  }
}
```

---

# 4. Important `$unwind` problem after `$lookup`

Suppose no customer matches.

Before unwind:

```javascript
customer: [];
```

Then:

```javascript
{
  $unwind: '$customer';
}
```

will remove that order completely.

If you want to retain it:

```javascript
{
  $unwind: {
    path: "$customer",
    preserveNullAndEmptyArrays: true
  }
}
```

Very important in real projects.

---

# 5. Simple One-to-Many Join

Suppose:

## customers

```javascript
{
  _id: 101,
  name: "Pramit"
}
```

## orders

```javascript
{
  _id: 1,
  customerId: 101,
  total: 5000
}
```

```javascript
{
  _id: 2,
  customerId: 101,
  total: 8000
}
```

Start from customers:

```javascript
db.customers.aggregate([
  {
    $lookup: {
      from: 'orders',
      localField: '_id',
      foreignField: 'customerId',
      as: 'orders',
    },
  },
]);
```

Result:

```javascript
{
  _id: 101,
  name: "Pramit",

  orders: [
    {
      _id: 1,
      total: 5000
    },
    {
      _id: 2,
      total: 8000
    }
  ]
}
```

Perfect one-to-many pattern.

---

# 6. Join Then Calculate Total Spend

Now:

```javascript
db.customers.aggregate([
  {
    $lookup: {
      from: 'orders',
      localField: '_id',
      foreignField: 'customerId',
      as: 'orders',
    },
  },

  {
    $set: {
      totalSpent: {
        $sum: '$orders.total',
      },
    },
  },
]);
```

This is a very common pattern:

```text
lookup
↓
joined array
↓
aggregate joined array
```

---

# 7. Join Array Field to Another Collection

Suppose product:

```javascript
{
  _id: 1,
  categoryIds: [10, 20]
}
```

Categories:

```javascript
{
  _id: 10,
  name: "Electronics"
}
```

```javascript
{
  _id: 20,
  name: "Premium"
}
```

You can directly do:

```javascript
{
  $lookup: {
    from: "categories",
    localField: "categoryIds",
    foreignField: "_id",
    as: "categories"
  }
}
```

MongoDB can match an array of local values against the foreign field.

Result:

```javascript
categories: [
  {
    _id: 10,
    name: 'Electronics',
  },
  {
    _id: 20,
    name: 'Premium',
  },
];
```

---

# 8. `$lookup` using nested field

Suppose:

```javascript
{
  customer: {
    id: 101;
  }
}
```

You can do:

```javascript
{
  $lookup: {
    from: "customers",
    localField: "customer.id",
    foreignField: "_id",
    as: "customerDetails"
  }
}
```

Dot notation works normally.

---

# 9. Multiple `$lookup`s

Suppose an order references:

```javascript
customerId;
sellerId;
paymentId;
```

You can do:

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customer',
    },
  },

  {
    $lookup: {
      from: 'sellers',
      localField: 'sellerId',
      foreignField: '_id',
      as: 'seller',
    },
  },

  {
    $lookup: {
      from: 'payments',
      localField: 'paymentId',
      foreignField: '_id',
      as: 'payment',
    },
  },
]);
```

Nothing wrong with multiple lookups.

But performance matters, which we'll discuss later.

---

# 10. The real power: pipeline `$lookup`

Simple `$lookup` can only express:

```text
localField = foreignField
```

But real requirements are usually:

> Join orders belonging to this customer where status is PAID and amount > 5000.

Now you need a lookup pipeline.

Syntax:

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      customerId: "$_id"
    },

    pipeline: [
      ...
    ],

    as: "orders"
  }
}
```

This is one of the most important advanced aggregation patterns.

---

# 11. `let` inside `$lookup`

Suppose current customer:

```javascript
{
  _id: 101,
  name: "Pramit"
}
```

We want its orders.

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      currentCustomerId: "$_id"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$customerId",
              "$$currentCustomerId"
            ]
          }
        }
      }
    ],

    as: "orders"
  }
}
```

Important distinction:

Inside foreign pipeline:

```javascript
'$customerId';
```

means:

> field in the `orders` document

while:

```javascript
'$$currentCustomerId';
```

means:

> variable passed from the outer customer document

---

# 12. Why `$expr` is needed

Normal `$match`:

```javascript
{
  $match: {
    status: 'PAID';
  }
}
```

compares:

```text
field vs literal
```

But this:

```javascript
{
  $eq: ['$customerId', '$$currentCustomerId'];
}
```

compares:

```text
field vs variable
```

So we need:

```javascript
$expr;
```

Think of `$expr` as:

> Allow aggregation expressions inside a query condition.

---

# 13. Pipeline `$lookup` with extra conditions

Requirement:

> Get PAID orders over ₹5000 for each customer.

```javascript
db.customers.aggregate([
  {
    $lookup: {
      from: 'orders',

      let: {
        currentCustomerId: '$_id',
      },

      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$customerId', '$$currentCustomerId'],
            },

            status: 'PAID',

            totalAmount: {
              $gt: 5000,
            },
          },
        },
      ],

      as: 'paidOrders',
    },
  },
]);
```

This is already interview-level MongoDB.

---

# 14. Better pattern for indexed constants

Often write:

```javascript
{
  $match: {
    status: "PAID",

    $expr: {
      $eq: [
        "$customerId",
        "$$currentCustomerId"
      ]
    }
  }
}
```

This is easier to read because constant conditions stay normal.

---

# 15. Project only required fields inside `$lookup`

Don't fetch huge foreign documents unnecessarily.

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      currentCustomerId: "$_id"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$customerId",
              "$$currentCustomerId"
            ]
          }
        }
      },

      {
        $project: {
          _id: 1,
          totalAmount: 1,
          status: 1,
          createdAt: 1
        }
      }
    ],

    as: "orders"
  }
}
```

Very good practice.

---

# 16. Sort inside lookup

Get latest orders:

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      customerId: "$_id"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$customerId",
              "$$customerId"
            ]
          }
        }
      },

      {
        $sort: {
          createdAt: -1
        }
      }
    ],

    as: "orders"
  }
}
```

---

# 17. Get only latest order

Just add:

```javascript
{
  $limit: 1;
}
```

Full:

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      customerId: "$_id"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$customerId",
              "$$customerId"
            ]
          }
        }
      },

      {
        $sort: {
          createdAt: -1
        }
      },

      {
        $limit: 1
      }
    ],

    as: "latestOrder"
  }
}
```

Then:

```javascript
{
  $set: {
    latestOrder: {
      $first: '$latestOrder';
    }
  }
}
```

This is a very common real-world API pattern.

---

# 18. SQL comparison

SQL:

```sql
SELECT *
FROM customers c
LEFT JOIN orders o
ON c.id = o.customer_id
AND o.status = 'PAID'
AND o.total_amount > 5000;
```

MongoDB:

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      cid: "$_id"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$customerId",
              "$$cid"
            ]
          },

          status: "PAID",

          totalAmount: {
            $gt: 5000
          }
        }
      }
    ],

    as: "orders"
  }
}
```

---

# 19. `$lookup` inside `$lookup`

Now suppose:

```text
customers
   ↓
orders
   ↓
items
   ↓
products
```

You can join products from inside the order lookup.

Example:

```javascript
db.customers.aggregate([
  {
    $lookup: {
      from: 'orders',

      let: {
        customerId: '$_id',
      },

      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$customerId', '$$customerId'],
            },
          },
        },

        {
          $unwind: '$items',
        },

        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'items.product',
          },
        },
      ],

      as: 'orders',
    },
  },
]);
```

Possible? Yes.

Should you always do this? No.

You need to think carefully about intermediate document explosion.

---

# 20. Better order → product join

Suppose an order contains:

```javascript
items: [
  {
    productId: 1001,
    quantity: 2,
  },
  {
    productId: 1002,
    quantity: 1,
  },
];
```

You can join all referenced products without unwinding first:

```javascript
{
  $lookup: {
    from: "products",
    localField: "items.productId",
    foreignField: "_id",
    as: "productDetails"
  }
}
```

Now:

```javascript
productDetails: [
  {...product 1001},
  {...product 1002}
]
```

This can be more efficient than:

```text
unwind items
lookup one product
regroup
```

depending on what result you need.

---

# 21. Attach product details back to each item

Now we have:

```javascript
items: [
  {
    productId: 1001,
    quantity: 2,
  },
];
```

and:

```javascript
productDetails: [
  {
    _id: 1001,
    name: 'Laptop',
    price: 70000,
  },
];
```

Requirement:

```javascript
items: [
  {
    productId: 1001,
    quantity: 2,
    product: {
      name: 'Laptop',
      price: 70000,
    },
  },
];
```

We can use `$map` + `$filter`.

```javascript
{
  $set: {
    items: {
      $map: {
        input: "$items",
        as: "item",

        in: {
          $mergeObjects: [
            "$$item",

            {
              product: {
                $first: {
                  $filter: {
                    input: "$productDetails",
                    as: "product",

                    cond: {
                      $eq: [
                        "$$product._id",
                        "$$item.productId"
                      ]
                    }
                  }
                }
              }
            }
          ]
        }
      }
    }
  }
}
```

Now we're combining several concepts you've learned:

```text
$lookup
+
$map
+
$filter
+
$first
+
$mergeObjects
```

This is exactly how advanced aggregation works.

---

# 22. Read that pipeline as JavaScript

Equivalent concept:

```javascript
items.map((item) => ({
  ...item,

  product: productDetails.find((product) => product._id === item.productId),
}));
```

MongoDB doesn't have normal JS `.find()`, so we emulate it with:

```javascript
$filter + $first;
```

Very useful mental pattern:

```text
JavaScript .find()

≈

$first + $filter
```

---

# 23. Join and group

Requirement:

> Show each customer with order count and total spending.

```javascript
db.customers.aggregate([
  {
    $lookup: {
      from: 'orders',
      localField: '_id',
      foreignField: 'customerId',
      as: 'orders',
    },
  },

  {
    $set: {
      orderCount: {
        $size: '$orders',
      },

      totalSpent: {
        $sum: '$orders.totalAmount',
      },
    },
  },
]);
```

Simple and clean.

---

# 24. Alternative with `$unwind` + `$group`

You could also:

```javascript
db.customers.aggregate([
  {
    $lookup: {
      from: 'orders',
      localField: '_id',
      foreignField: 'customerId',
      as: 'orders',
    },
  },

  {
    $unwind: {
      path: '$orders',
      preserveNullAndEmptyArrays: true,
    },
  },

  {
    $group: {
      _id: '$_id',

      name: {
        $first: '$name',
      },

      orderCount: {
        $sum: {
          $cond: [
            {
              $ne: ['$orders', null],
            },
            1,
            0,
          ],
        },
      },

      totalSpent: {
        $sum: {
          $ifNull: ['$orders.totalAmount', 0],
        },
      },
    },
  },
]);
```

But for this simple requirement, the first solution is cleaner.

Rule:

> Don't `$unwind` merely because you can.

---

# 25. `$lookup` where both sides have arrays

Suppose user:

```javascript
{
  interests: ['node', 'mongodb', 'aws'];
}
```

Courses:

```javascript
{
  tags: ['mongodb', 'database'];
}
```

Requirement:

> Find courses having any overlapping interest.

This is more advanced.

Use pipeline lookup:

```javascript
{
  $lookup: {
    from: "courses",

    let: {
      interests: "$interests"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $gt: [
              {
                $size: {
                  $setIntersection: [
                    "$tags",
                    "$$interests"
                  ]
                }
              },
              0
            ]
          }
        }
      }
    ],

    as: "recommendedCourses"
  }
}
```

This means:

```text
course.tags ∩ user.interests
```

If intersection size > 0, match.

Excellent advanced pattern.

---

# 26. `$lookup` using multiple join conditions

Suppose:

```javascript
inventory:
{
  productId: 101,
  warehouseId: 5,
  quantity: 50
}
```

Order item:

```javascript
{
  productId: 101,
  warehouseId: 5
}
```

Need both to match.

```javascript
{
  $lookup: {
    from: "inventory",

    let: {
      productId: "$productId",
      warehouseId: "$warehouseId"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: [
                  "$productId",
                  "$$productId"
                ]
              },

              {
                $eq: [
                  "$warehouseId",
                  "$$warehouseId"
                ]
              }
            ]
          }
        }
      }
    ],

    as: "inventory"
  }
}
```

Simple `$lookup` can't express this cleanly.

Pipeline `$lookup` can.

---

# 27. `$lookup` + computed condition

Requirement:

> Join products whose price is less than the customer's budget.

Customer:

```javascript
{
  name: "Pramit",
  maxBudget: 50000
}
```

Products:

```javascript
{
  name: "Monitor",
  price: 20000
}
```

Pipeline:

```javascript
{
  $lookup: {
    from: "products",

    let: {
      budget: "$maxBudget"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $lte: [
              "$price",
              "$$budget"
            ]
          }
        }
      }
    ],

    as: "affordableProducts"
  }
}
```

Notice:

> No foreign key needed.

`$lookup` can perform arbitrary correlated matching.

---

# 28. `$lookup` + `$count`

Suppose you don't need the actual orders.

You only want:

```text
number of PAID orders
```

Don't fetch every order and count afterward.

You can count inside lookup.

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      customerId: "$_id"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$customerId",
              "$$customerId"
            ]
          },

          status: "PAID"
        }
      },

      {
        $count: "count"
      }
    ],

    as: "paidOrderStats"
  }
}
```

Result:

```javascript
paidOrderStats: [
  {
    count: 5,
  },
];
```

Then:

```javascript
{
  $set: {
    paidOrderCount: {
      $ifNull: [
        {
          $first: '$paidOrderStats.count',
        },
        0,
      ];
    }
  }
}
```

Then unset temporary field:

```javascript
{
  $unset: 'paidOrderStats';
}
```

This pattern is extremely useful for APIs.

---

# 29. `$lookup` + `$group` inside lookup

Requirement:

> For each customer, calculate total paid amount without returning all orders.

```javascript
{
  $lookup: {
    from: "orders",

    let: {
      customerId: "$_id"
    },

    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              "$customerId",
              "$$customerId"
            ]
          },

          status: "PAID"
        }
      },

      {
        $group: {
          _id: null,

          totalSpent: {
            $sum: "$totalAmount"
          },

          orderCount: {
            $sum: 1
          }
        }
      }
    ],

    as: "stats"
  }
}
```

Then:

```javascript
{
  $set: {
    stats: {
      $ifNull: [
        {
          $first: '$stats',
        },

        {
          totalSpent: 0,
          orderCount: 0,
        },
      ];
    }
  }
}
```

This is often better than returning hundreds of orders.

---

# 30. `$lookup` + nested array condition

Suppose orders contain:

```javascript
items: [
  {
    productId: 101,
    quantity: 2,
  },
];
```

You want customers who bought product `101`.

Inside lookup:

```javascript
{
  $match: {
    "items.productId": 101
  }
}
```

Easy.

If same item must satisfy:

```text
productId = 101
AND
quantity >= 5
```

use:

```javascript
{
  $match: {
    items: {
      $elemMatch: {
        productId: 101,

        quantity: {
          $gte: 5
        }
      }
    }
  }
}
```

All your array knowledge applies inside `$lookup`.

---

# 31. Joining after `$unwind`

Sometimes this is the best option.

Order:

```javascript
{
  items: [
    {
      productId: 101,
      quantity: 2,
    },
    {
      productId: 102,
      quantity: 3,
    },
  ];
}
```

Pipeline:

```javascript
[
  {
    $unwind: '$items',
  },

  {
    $lookup: {
      from: 'products',
      localField: 'items.productId',
      foreignField: '_id',
      as: 'product',
    },
  },

  {
    $unwind: '$product',
  },
];
```

Now every document represents:

```text
one order
+
one item
+
one product
```

This becomes ideal for:

```text
group revenue by product
group revenue by category
group quantity by seller
```

---

# 32. Revenue by Category Example

Suppose:

```text
orders.items.productId
→ products._id
→ products.categoryId
→ categories._id
```

Pipeline:

```javascript
db.orders.aggregate([
  {
    $unwind: '$items',
  },

  {
    $lookup: {
      from: 'products',
      localField: 'items.productId',
      foreignField: '_id',
      as: 'product',
    },
  },

  {
    $unwind: '$product',
  },

  {
    $lookup: {
      from: 'categories',
      localField: 'product.categoryId',
      foreignField: '_id',
      as: 'category',
    },
  },

  {
    $unwind: '$category',
  },

  {
    $group: {
      _id: '$category.name',

      totalRevenue: {
        $sum: {
          $multiply: ['$items.quantity', '$items.price'],
        },
      },
    },
  },

  {
    $sort: {
      totalRevenue: -1,
    },
  },
]);
```

That's a classic interview aggregation.

---

# 33. Mental pipeline

Read it:

```text
orders

↓ split each item

order-item

↓ find product

order-item-product

↓ find category

order-item-product-category

↓ group category

revenue per category
```

When pipelines get long, draw this transformation mentally.

---

# 34. Common `$lookup` Mistake #1

Wrong:

```javascript
{
  $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"
  }
}
```

when:

```javascript
customerId = '101';
```

is a **string**

but:

```javascript
_id = ObjectId('...');
```

Different BSON types do not match.

This is very common.

Always verify types.

---

# 35. Common mistake #2: unnecessary `$unwind`

If you're joining:

```javascript
customer -> orders[]
```

and you simply need:

```text
orderCount
totalSpent
```

don't automatically unwind.

Use:

```javascript
$size;
$sum;
$map;
$filter;
```

on the joined array.

---

# 36. Common mistake #3: joining too much data

Bad pattern:

```javascript
lookup every order
↓
each order has 100 fields
↓
later project 2 fields
```

Better:

```javascript
lookup
  pipeline:
    match
    project only needed fields
```

Especially important for large collections.

---

# 37. Common mistake #4: filtering too late

Suppose:

```text
1 million orders
```

Don't do:

```text
lookup all orders
↓
filter PAID afterward
```

Prefer:

```text
lookup
  pipeline:
    match customer
    match PAID
```

Reduce data as early as possible.

---

# 38. Common mistake #5: `$lookup` explosion

Suppose:

```text
100 customers

each customer → 100 orders

each order → 20 items

each item → product
```

If you keep unwinding:

```text
100
× 100
× 20
=
200,000 intermediate rows
```

This can become expensive.

Always ask:

> Do I truly need to unwind?

---

# 39. Indexes for `$lookup`

For simple:

```javascript
localField: "customerId",
foreignField: "_id"
```

`_id` is indexed automatically.

For:

```javascript
foreignField: 'customerId';
```

you should generally have:

```javascript
db.orders.createIndex({
  customerId: 1,
});
```

If you frequently lookup:

```javascript
customerId + status;
```

consider:

```javascript
db.orders.createIndex({
  customerId: 1,
  status: 1,
});
```

Index design depends on actual pipeline and selectivity, but this is the right direction.

---

# 40. Important Variables Recap

Inside aggregation:

```javascript
'$field';
```

means:

> field of current document

```javascript
'$$variable';
```

means:

> aggregation variable

Examples:

```javascript
$$item;
$$order;
$$customerId;
$$value;
$$this;
$$ROOT;
$$CURRENT;
```

---

# 41. `$lookup` mental cheat sheet

| Need                           | Pattern                      |
| ------------------------------ | ---------------------------- |
| Basic equality join            | `localField + foreignField`  |
| Need joined single object      | `$lookup + $unwind`          |
| Preserve unmatched docs        | `preserveNullAndEmptyArrays` |
| Need conditions inside join    | pipeline `$lookup`           |
| Outer field inside join        | `let`                        |
| Compare fields/variables       | `$expr`                      |
| Several join conditions        | `$and` inside `$expr`        |
| Latest related record          | `$sort + $limit: 1`          |
| Only count matches             | `$count` inside lookup       |
| Aggregate related rows         | `$group` inside lookup       |
| Join array of IDs              | array `localField`           |
| One item matching joined array | `$first + $filter`           |

---

# Practice Problems

Try these in your ecommerce database:

1. Join each order with its customer.
2. Convert joined customer array into an object.
3. Join each product with its category.
4. Return each customer with all their orders.
5. Return customer with `orderCount`.
6. Return customer with `totalSpent`.
7. Return only PAID orders inside lookup.
8. Return PAID orders over ₹10,000.
9. Return customer's latest order.
10. Return customer's latest 3 orders.
11. Return only order `_id`, total, status inside lookup.
12. Return customer with count of PAID orders without returning all orders.
13. Return customer with `{paidCount, totalPaidAmount}`.
14. Join an order's `items.productId` with products.
15. Add product information back into every order item.
16. Find revenue per product.
17. Find revenue per category.
18. Find top-selling categories by quantity.
19. Find customers who purchased a specific product.
20. Join inventory using both `productId` and `warehouseId`.
21. Join products cheaper than each customer's own budget.
22. Join courses having overlapping tags with user interests.
23. Return seller with only ACTIVE products.
24. Return sellers whose active product count > 10.
25. Return every customer with their highest-value order.

If you can solve those comfortably, your `$lookup` knowledge will be strong.

## Next — deeply nested updates

Next we'll cover the part you explicitly wanted from the beginning:

```text
update nested object
update one matching array element
update every array element
update multiple matching elements
nested $[]
nested $[identifier]
multiple arrayFilters
$push
$pull
$addToSet
$inc
nested arrays 3–4 levels deep
conditional nested updates
aggregation-pipeline updates
$map-based updates
remove/replace nested objects
update super-nested structures
```

That part is especially important because **querying a nested document and actually modifying it are two different skills in MongoDB**.
