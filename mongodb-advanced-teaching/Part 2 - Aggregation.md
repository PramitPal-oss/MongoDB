Good. Now we go deep into **arrays and nested arrays**, because this is where MongoDB aggregation becomes genuinely powerful.

I’ll teach this in a way that helps you read even ugly pipelines without panicking.

# Part 2 — MongoDB Arrays: Beginner → Advanced

We’ll focus on these first:

```javascript
$elemMatch
$size
$arrayElemAt
$first
$last
$slice
$in
$indexOfArray
$concatArrays
$setUnion
$setIntersection

$filter
$map
$reduce

nested $filter
nested $map
nested $reduce
```

---

# 1. Sample Document

Keep this document in mind:

```javascript
{
  _id: 1,

  customer: {
    name: "Pramit",
    city: "Kolkata"
  },

  tags: [
    "electronics",
    "premium",
    "online"
  ],

  items: [
    {
      productId: 101,
      name: "Laptop",
      category: "Electronics",
      price: 70000,
      quantity: 1,
      discount: 10,

      reviews: [
        {
          user: "Amit",
          rating: 5
        },
        {
          user: "Rahul",
          rating: 4
        }
      ]
    },

    {
      productId: 102,
      name: "Mouse",
      category: "Electronics",
      price: 1200,
      quantity: 2,
      discount: 5,

      reviews: [
        {
          user: "Sourav",
          rating: 3
        }
      ]
    },

    {
      productId: 103,
      name: "Chair",
      category: "Furniture",
      price: 8000,
      quantity: 1,
      discount: 0,

      reviews: []
    }
  ]
}
```

Structure:

```text
document
│
├── customer {}
│
├── tags []
│
└── items []
      │
      ├── item {}
      │     └── reviews []
      │
      ├── item {}
      │     └── reviews []
      │
      └── item {}
            └── reviews []
```

---

# 2. Query Array of Primitive Values

We have:

```javascript
tags: ['electronics', 'premium', 'online'];
```

Find documents containing `"premium"`:

```javascript
db.orders.find({
  tags: 'premium',
});
```

You don't need:

```javascript
{
  tags: {
    $in: ['premium'];
  }
}
```

although `$in` can also be useful.

---

# 3. `$in`

Suppose you want documents whose status is either:

```text
PAID
SHIPPED
DELIVERED
```

```javascript
db.orders.find({
  status: {
    $in: ['PAID', 'SHIPPED', 'DELIVERED'],
  },
});
```

Conceptually:

```javascript
['PAID', 'SHIPPED', 'DELIVERED'].includes(status);
```

---

# 4. Array Contains Any Matching Value

Suppose:

```javascript
tags: ['electronics', 'premium'];
```

Query:

```javascript
db.orders.find({
  tags: {
    $in: ['premium', 'featured'],
  },
});
```

Meaning:

> Does the `tags` array contain at least one of these values?

---

# 5. `$all`

Different from `$in`.

Suppose:

```javascript
tags: ['electronics', 'premium', 'online'];
```

Requirement:

> Document must contain both `"electronics"` and `"premium"`.

```javascript
db.orders.find({
  tags: {
    $all: ['electronics', 'premium'],
  },
});
```

Think:

```text
$in
ANY match

$all
ALL required values
```

---

# 6. `$size` in Queries

Find orders containing exactly 3 items:

```javascript
db.orders.find({
  items: {
    $size: 3,
  },
});
```

Simple.

But there is an important distinction.

In a normal query:

```javascript
$size;
```

is a query operator.

Inside aggregation:

```javascript
$size;
```

is an expression.

Example:

```javascript
db.orders.aggregate([
  {
    $project: {
      customer: 1,

      itemCount: {
        $size: '$items',
      },
    },
  },
]);
```

Result:

```javascript
{
  customer: {...},
  itemCount: 3
}
```

---

# 7. Safe `$size`

Danger:

Suppose `items` can be missing or `null`.

This:

```javascript
{
  $size: '$items';
}
```

can fail because `$size` expects an array.

Safer:

```javascript
{
  $size: {
    $ifNull: ['$items', []];
  }
}
```

I use this pattern a lot.

```javascript
{
  $ifNull: ['$items', []];
}
```

means:

```javascript
items ?? [];
```

in JavaScript.

---

# 8. `$arrayElemAt`

Get specific array element.

```javascript
{
  $project: {
    firstItem: {
      $arrayElemAt: ['$items', 0];
    }
  }
}
```

Get second item:

```javascript
{
  $arrayElemAt: ['$items', 1];
}
```

Get last item:

```javascript
{
  $arrayElemAt: ['$items', -1];
}
```

Negative indexes count backward.

---

# 9. `$first`

You can also do:

```javascript
{
  $project: {
    firstItem: {
      $first: '$items';
    }
  }
}
```

Equivalent idea:

```javascript
items[0];
```

---

# 10. `$last`

```javascript
{
  $project: {
    lastItem: {
      $last: '$items';
    }
  }
}
```

Equivalent:

```javascript
items[items.length - 1];
```

---

# 11. `$slice`

Very useful.

Get first 2 items:

```javascript
{
  $project: {
    items: {
      $slice: ['$items', 2];
    }
  }
}
```

Result:

```javascript
[Laptop, Mouse];
```

---

## Skip + Limit inside array

```javascript
{
  $slice: ['$items', 1, 2];
}
```

Meaning:

```text
skip 1
take 2
```

JavaScript equivalent:

```javascript
items.slice(1, 3);
```

---

# 12. `$indexOfArray`

Suppose:

```javascript
tags: ['electronics', 'premium', 'online'];
```

Find position of `"premium"`:

```javascript
{
  $project: {
    premiumPosition: {
      $indexOfArray: ['$tags', 'premium'];
    }
  }
}
```

Result:

```javascript
1;
```

Because arrays are zero-indexed.

If not found:

```javascript
-1;
```

---

# 13. `$concatArrays`

Suppose:

```javascript
tags: ['electronics', 'premium'];

additionalTags: ['sale', 'featured'];
```

Combine:

```javascript
{
  $project: {
    allTags: {
      $concatArrays: ['$tags', '$additionalTags'];
    }
  }
}
```

Result:

```javascript
['electronics', 'premium', 'sale', 'featured'];
```

JavaScript:

```javascript
[...tags, ...additionalTags];
```

---

# 14. `$setUnion`

Suppose:

```javascript
tags1: ['node', 'mongodb', 'react'];

tags2: ['mongodb', 'postgres', 'node'];
```

Combine and remove duplicates:

```javascript
{
  $project: {
    technologies: {
      $setUnion: ['$tags1', '$tags2'];
    }
  }
}
```

Result conceptually:

```javascript
['node', 'mongodb', 'react', 'postgres'];
```

Order should not be relied upon with set operations.

---

# 15. `$setIntersection`

Find common elements:

```javascript
{
  $project: {
    common: {
      $setIntersection: ['$tags1', '$tags2'];
    }
  }
}
```

Result:

```javascript
['node', 'mongodb'];
```

Think mathematical sets.

---

# 16. `$setDifference`

Also useful:

```javascript
{
  $setDifference: ['$tags1', '$tags2'];
}
```

Returns values in array 1 that aren't in array 2.

Conceptually:

```javascript
tags1 - tags2;
```

---

# 17. `$elemMatch` Deep Dive

This one causes many bugs.

Suppose:

```javascript
items: [
  {
    name: 'Laptop',
    price: 70000,
  },
  {
    name: 'Mouse',
    price: 1000,
  },
];
```

You write:

```javascript
db.orders.find({
  'items.name': 'Laptop',
  'items.price': {
    $lt: 5000,
  },
});
```

Does it match?

**Yes.**

Why?

MongoDB sees:

```text
Does items.name contain Laptop?
YES

Does items.price contain a number < 5000?
YES
```

But those conditions came from different elements.

---

# Correct version

```javascript
db.orders.find({
  items: {
    $elemMatch: {
      name: 'Laptop',
      price: {
        $lt: 5000,
      },
    },
  },
});
```

Now MongoDB asks:

> Is there one item satisfying both conditions?

Answer:

```text
NO
```

---

# Golden Rule

When multiple conditions must apply to:

> **the same array object**

think:

```javascript
$elemMatch;
```

---

# 18. `$filter`

Now aggregation-side array filtering.

Suppose:

```javascript
items: [
  {
    name: 'Laptop',
    price: 70000,
  },
  {
    name: 'Mouse',
    price: 1200,
  },
  {
    name: 'Chair',
    price: 8000,
  },
];
```

Return only items costing at least ₹5000:

```javascript
db.orders.aggregate([
  {
    $project: {
      expensiveItems: {
        $filter: {
          input: '$items',
          as: 'item',

          cond: {
            $gte: ['$$item.price', 5000],
          },
        },
      },
    },
  },
]);
```

Result:

```javascript
[
  {
    name: 'Laptop',
    price: 70000,
  },
  {
    name: 'Chair',
    price: 8000,
  },
];
```

Original documents weren't changed.

---

# How to Read `$filter`

Always read this:

```javascript
{
  $filter: {
    input: "$items",
    as: "item",
    cond: ...
  }
}
```

as:

```javascript
items.filter(item => ...)
```

So:

```javascript
{
  $gte: ['$$item.price', 5000];
}
```

becomes:

```javascript
item.price >= 5000;
```

Full JavaScript equivalent:

```javascript
items.filter((item) => item.price >= 5000);
```

---

# 19. Multiple Conditions Inside `$filter`

Requirement:

```text
price >= 5000
AND
category = Electronics
```

Use `$and`:

```javascript
{
  $filter: {
    input: "$items",
    as: "item",

    cond: {
      $and: [
        {
          $gte: [
            "$$item.price",
            5000
          ]
        },
        {
          $eq: [
            "$$item.category",
            "Electronics"
          ]
        }
      ]
    }
  }
}
```

Equivalent:

```javascript
items.filter((item) => item.price >= 5000 && item.category === 'Electronics');
```

---

# 20. `$map`

Transform every item.

Suppose:

```javascript
items: [
  {
    name: 'Laptop',
    price: 70000,
    quantity: 1,
  },
  {
    name: 'Mouse',
    price: 1200,
    quantity: 2,
  },
];
```

Create:

```javascript
[
  {
    name: 'Laptop',
    subtotal: 70000,
  },
  {
    name: 'Mouse',
    subtotal: 2400,
  },
];
```

Pipeline:

```javascript
{
  $project: {
    items: {
      $map: {
        input: "$items",
        as: "item",

        in: {
          name: "$$item.name",

          subtotal: {
            $multiply: [
              "$$item.price",
              "$$item.quantity"
            ]
          }
        }
      }
    }
  }
}
```

Equivalent JavaScript:

```javascript
items.map((item) => ({
  name: item.name,
  subtotal: item.price * item.quantity,
}));
```

---

# 21. Preserve Existing Object Fields with `$mergeObjects`

Suppose we want to add `subtotal` but keep every existing property.

Instead of manually writing:

```javascript
{
  name: "$$item.name",
  category: "$$item.category",
  price: "$$item.price",
  quantity: "$$item.quantity",
  discount: "$$item.discount",
  subtotal: ...
}
```

use:

```javascript
{
  $map: {
    input: "$items",
    as: "item",

    in: {
      $mergeObjects: [
        "$$item",

        {
          subtotal: {
            $multiply: [
              "$$item.price",
              "$$item.quantity"
            ]
          }
        }
      ]
    }
  }
}
```

Think:

```javascript
{
  ...item,
  subtotal: item.price * item.quantity
}
```

This is one of the best MongoDB patterns to remember.

---

# 22. `$filter` + `$map`

Requirement:

> Take only Electronics items costing more than 5000 and return name + final price.

First filter:

```text
items
  ↓
filter
  ↓
matching items
```

then map:

```text
matching items
  ↓
map
  ↓
new structure
```

Pipeline:

```javascript
{
  $project: {
    expensiveElectronics: {
      $map: {
        input: {
          $filter: {
            input: "$items",
            as: "item",

            cond: {
              $and: [
                {
                  $eq: [
                    "$$item.category",
                    "Electronics"
                  ]
                },
                {
                  $gte: [
                    "$$item.price",
                    5000
                  ]
                }
              ]
            }
          }
        },

        as: "item",

        in: {
          name: "$$item.name",
          price: "$$item.price"
        }
      }
    }
  }
}
```

---

# Read Inside-Out

When aggregation becomes nested, always start with the deepest operator.

Here:

```javascript
$filter;
```

happens first.

Then its result becomes:

```javascript
input;
```

for:

```javascript
$map;
```

This reading habit is essential.

---

# 23. `$reduce`

Now the fun begins.

Requirement:

> Calculate total price of all items.

Data:

```javascript
items: [
  {
    price: 70000,
    quantity: 1,
  },
  {
    price: 1200,
    quantity: 2,
  },
  {
    price: 8000,
    quantity: 1,
  },
];
```

We want:

```text
70000
+
2400
+
8000

= 80400
```

Use:

```javascript
{
  $project: {
    orderTotal: {
      $reduce: {
        input: "$items",
        initialValue: 0,

        in: {
          $add: [
            "$$value",

            {
              $multiply: [
                "$$this.price",
                "$$this.quantity"
              ]
            }
          ]
        }
      }
    }
  }
}
```

---

# Understand `$reduce` Properly

Mongo:

```javascript
{
  $reduce: {
    input: "$items",
    initialValue: 0,
    in: ...
  }
}
```

JavaScript:

```javascript
items.reduce(
  (accumulator, current) => {
    ...
  },
  0
)
```

MongoDB provides:

```javascript
$$value;
```

which means:

```javascript
accumulator;
```

and:

```javascript
$$this;
```

means:

```javascript
current item
```

So:

```javascript
{
  $add: [
    '$$value',
    {
      $multiply: ['$$this.price', '$$this.quantity'],
    },
  ];
}
```

is:

```javascript
accumulator + current.price * current.quantity;
```

---

# 24. Running `$reduce` Manually

Start:

```text
$$value = 0
```

First item:

```text
Laptop

0 + (70000 × 1)

$$value = 70000
```

Second:

```text
Mouse

70000 + (1200 × 2)

$$value = 72400
```

Third:

```text
Chair

72400 + (8000 × 1)

$$value = 80400
```

Final:

```text
80400
```

---

# 25. `$reduce` Can Return Objects

Many people think `$reduce` only calculates numbers.

Wrong.

Your accumulator can be an object.

Example:

```javascript
{
  $reduce: {
    input: "$items",

    initialValue: {
      totalAmount: 0,
      totalQuantity: 0
    },

    in: {
      totalAmount: {
        $add: [
          "$$value.totalAmount",

          {
            $multiply: [
              "$$this.price",
              "$$this.quantity"
            ]
          }
        ]
      },

      totalQuantity: {
        $add: [
          "$$value.totalQuantity",
          "$$this.quantity"
        ]
      }
    }
  }
}
```

Result:

```javascript
{
  totalAmount: 80400,
  totalQuantity: 4
}
```

That's a powerful interview-level pattern.

---

# 26. `$reduce` Can Build Arrays

Initial:

```javascript
initialValue: [];
```

Then:

```javascript
{
  $concatArrays: ['$$value', ['$$this.name']];
}
```

Example:

```javascript
{
  $reduce: {
    input: "$items",
    initialValue: [],

    in: {
      $concatArrays: [
        "$$value",
        [
          "$$this.name"
        ]
      ]
    }
  }
}
```

Result:

```javascript
['Laptop', 'Mouse', 'Chair'];
```

Now you can see:

> `$reduce` is not really a "sum" operator.

It is a generic accumulator.

---

# 27. Nested Arrays

Now consider:

```javascript
items: [
  {
    name: 'Laptop',

    reviews: [
      {
        user: 'Amit',
        rating: 5,
      },
      {
        user: 'Rahul',
        rating: 4,
      },
    ],
  },

  {
    name: 'Mouse',

    reviews: [
      {
        user: 'Sourav',
        rating: 3,
      },
    ],
  },
];
```

Requirement:

> For every item, keep only reviews where rating >= 4.

We need:

```text
items
  ↓ $map

each item
  ↓

reviews
  ↓ $filter
```

Pipeline:

```javascript
{
  $project: {
    items: {
      $map: {
        input: "$items",
        as: "item",

        in: {
          $mergeObjects: [
            "$$item",

            {
              reviews: {
                $filter: {
                  input: "$$item.reviews",
                  as: "review",

                  cond: {
                    $gte: [
                      "$$review.rating",
                      4
                    ]
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

This is a **nested `$map` + `$filter` pattern**.

Very important.

---

# Translate to JavaScript

Mongo:

```javascript
$map items
   ↓
$filter item.reviews
```

JavaScript:

```javascript
items.map((item) => ({
  ...item,

  reviews: item.reviews.filter((review) => review.rating >= 4),
}));
```

When Mongo syntax becomes confusing, translate it to JavaScript.

---

# 28. Nested `$map`

Suppose requirement:

> Add `"Excellent"` / `"Average"` labels to every review.

Input:

```javascript
items[]
   reviews[]
```

Need:

```text
map items
   ↓
map reviews
```

Pipeline:

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
              reviews: {
                $map: {
                  input: "$$item.reviews",
                  as: "review",

                  in: {
                    $mergeObjects: [
                      "$$review",

                      {
                        label: {
                          $cond: [
                            {
                              $gte: [
                                "$$review.rating",
                                4
                              ]
                            },

                            "Excellent",
                            "Average"
                          ]
                        }
                      }
                    ]
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

That may initially look horrible.

Translate:

```javascript
items.map((item) => ({
  ...item,

  reviews: item.reviews.map((review) => ({
    ...review,

    label: review.rating >= 4 ? 'Excellent' : 'Average',
  })),
}));
```

Suddenly much easier.

---

# 29. Three-Level Nested `$map`

Imagine:

```text
departments[]
  teams[]
    employees[]
```

You want:

> Add `fullName` to every employee.

Pattern:

```javascript
$map departments
    $map teams
        $map employees
```

Example:

```javascript
{
  $set: {
    departments: {
      $map: {
        input: "$departments",
        as: "dept",

        in: {
          $mergeObjects: [
            "$$dept",

            {
              teams: {
                $map: {
                  input: "$$dept.teams",
                  as: "team",

                  in: {
                    $mergeObjects: [
                      "$$team",

                      {
                        employees: {
                          $map: {
                            input: "$$team.employees",
                            as: "emp",

                            in: {
                              $mergeObjects: [
                                "$$emp",

                                {
                                  fullName: {
                                    $concat: [
                                      "$$emp.firstName",
                                      " ",
                                      "$$emp.lastName"
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        }
                      }
                    ]
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

Ugly?

Yes.

But logically:

```javascript
departments.map((dept) => ({
  ...dept,

  teams: dept.teams.map((team) => ({
    ...team,

    employees: team.employees.map((emp) => ({
      ...emp,

      fullName: `${emp.firstName} ${emp.lastName}`,
    })),
  })),
}));
```

That's all it is.

---

# 30. `$unwind` vs `$map`

Very important difference.

Suppose:

```javascript
items: [Laptop, Mouse, Chair];
```

`$unwind`:

```javascript
{
  $unwind: '$items';
}
```

turns:

```text
1 document
```

into:

```text
3 documents
```

While `$map`:

```javascript
{
  $set: {
    items: {
      $map: ...
    }
  }
}
```

keeps:

```text
1 document
```

but transforms:

```text
3 array elements
```

---

# Mental Rule

Use `$unwind` when:

> I need array elements to behave like separate documents.

Use `$map` when:

> I want to transform elements but keep the array.

Use `$filter` when:

> I want to keep/remove elements but preserve the array.

Use `$reduce` when:

> I want to combine an array into one result.

---

# 31. Example Comparison

Input:

```javascript
{
  _id: 1,
  items: [
    {
      name: "Laptop",
      price: 70000
    },
    {
      name: "Mouse",
      price: 1200
    }
  ]
}
```

### `$unwind`

```javascript
{
  $unwind: '$items';
}
```

Output:

```javascript
{
  _id: 1,
  items: {
    name: "Laptop",
    price: 70000
  }
}
```

```javascript
{
  _id: 1,
  items: {
    name: "Mouse",
    price: 1200
  }
}
```

---

### `$filter`

```javascript
{
  $set: {
    items: {
      $filter: {
        input: "$items",
        as: "item",
        cond: {
          $gt: [
            "$$item.price",
            5000
          ]
        }
      }
    }
  }
}
```

Output:

```javascript
{
  _id: 1,

  items: [
    {
      name: "Laptop",
      price: 70000
    }
  ]
}
```

---

### `$map`

```javascript
{
  $set: {
    items: {
      $map: {
        input: "$items",
        as: "item",

        in: {
          name: "$$item.name",

          gstPrice: {
            $multiply: [
              "$$item.price",
              1.18
            ]
          }
        }
      }
    }
  }
}
```

Still one document.

---

### `$reduce`

```javascript
{
  $set: {
    total: {
      $reduce: {
        input: "$items",
        initialValue: 0,

        in: {
          $add: [
            "$$value",
            "$$this.price"
          ]
        }
      }
    }
  }
}
```

Array becomes one total.

---

# 32. Critical Cheat Sheet

Memorize this:

| Need                                       | Operator            |
| ------------------------------------------ | ------------------- |
| Find documents containing array value      | normal dot notation |
| Same array element must satisfy conditions | `$elemMatch`        |
| Number of items                            | `$size`             |
| Specific position                          | `$arrayElemAt`      |
| First element                              | `$first`            |
| Last element                               | `$last`             |
| Subset by position                         | `$slice`            |
| Element position                           | `$indexOfArray`     |
| Combine arrays                             | `$concatArrays`     |
| Unique combination                         | `$setUnion`         |
| Common values                              | `$setIntersection`  |
| Array → documents                          | `$unwind`           |
| Remove unwanted elements                   | `$filter`           |
| Transform elements                         | `$map`              |
| Array → accumulated value                  | `$reduce`           |

---

# 33. Real Interview Question

Given:

```javascript
{
  name: "Pramit",

  purchases: [
    {
      category: "Electronics",
      amount: 70000,
      status: "COMPLETED"
    },
    {
      category: "Electronics",
      amount: 2000,
      status: "CANCELLED"
    },
    {
      category: "Furniture",
      amount: 12000,
      status: "COMPLETED"
    }
  ]
}
```

Requirement:

> Calculate total completed purchase amount.

Try mentally first.

We need:

```text
filter completed
↓
calculate total
```

Option 1:

```javascript
{
  $set: {
    completedPurchases: {
      $filter: {
        input: "$purchases",
        as: "purchase",

        cond: {
          $eq: [
            "$$purchase.status",
            "COMPLETED"
          ]
        }
      }
    }
  }
}
```

Then:

```javascript
{
  $set: {
    totalCompletedAmount: {
      $reduce: {
        input: "$completedPurchases",
        initialValue: 0,

        in: {
          $add: [
            "$$value",
            "$$this.amount"
          ]
        }
      }
    }
  }
}
```

Result:

```text
70000 + 12000
= 82000
```

---

# 34. Better Version Without Temporary Field

You can combine both:

```javascript
{
  $set: {
    totalCompletedAmount: {
      $reduce: {
        input: {
          $filter: {
            input: "$purchases",
            as: "purchase",

            cond: {
              $eq: [
                "$$purchase.status",
                "COMPLETED"
              ]
            }
          }
        },

        initialValue: 0,

        in: {
          $add: [
            "$$value",
            "$$this.amount"
          ]
        }
      }
    }
  }
}
```

Read:

```text
$filter
↓
returns completed purchases
↓
$reduce
↓
sums their amounts
```

---

# 35. Sometimes `$sum + $map` Is Cleaner

Instead of `$reduce`, you can also do:

```javascript
{
  $set: {
    totalCompletedAmount: {
      $sum: {
        $map: {
          input: {
            $filter: {
              input: "$purchases",
              as: "purchase",

              cond: {
                $eq: [
                  "$$purchase.status",
                  "COMPLETED"
                ]
              }
            }
          },

          as: "purchase",
          in: "$$purchase.amount"
        }
      }
    }
  }
}
```

Flow:

```text
filter completed
↓
map to amount
↓
sum numbers
```

Both approaches are valid.

---

# 36. Choosing Between `$reduce` and `$sum`

For simply summing numbers, this:

```javascript
$sum;
```

is usually clearer.

For more complicated accumulation, use:

```javascript
$reduce;
```

For example if you need:

```javascript
{
  totalAmount: ...,
  totalQuantity: ...,
  itemNames: [...]
}
```

one `$reduce` can calculate all three.

---

# Your First Practice Set

Don't look for solutions yet. Try these against your ecommerce data.

Assume:

```javascript
orders.items[]
```

contains:

```javascript
{
  productId,
  productName,
  category,
  price,
  quantity,
  discount,
  reviews: [
    {
      rating,
      comment
    }
  ]
}
```

Try these:

1. Return orders having exactly 3 items.
2. Return only the first item from every order.
3. Return the last item.
4. Return the first 2 items.
5. Find orders containing an item where `price > 50000` and `quantity >= 2` on the **same item**.
6. Add an `itemCount` field.
7. Keep only items costing more than 10000.
8. Transform items into `{ productName, total }`.
9. Add `lineTotal = price * quantity` while preserving all original item fields.
10. Calculate total order value.
11. Calculate total quantity purchased.
12. Return only reviews with rating >= 4.
13. Add `reviewCount` to every item.
14. Add `averageRating` to every item.
15. Remove all items with quantity 0.
16. Return a unique list of all categories in the order.
17. Find the index of `"Electronics"` inside a category array.
18. Combine `tags` and `marketingTags` without duplicates.
19. Calculate total price only for `Electronics`.
20. Calculate `{ totalAmount, totalQuantity }` using a single `$reduce`.

These 20 alone will make `$filter`, `$map`, and `$reduce` much more natural.

## Next: `$lookup` — MongoDB joins

Next we should move into what is probably the **second hardest major aggregation area**:

```text
customers
orders
products
categories
sellers
payments
reviews
```

We'll cover simple `$lookup`, nested `$lookup`, pipeline `$lookup`, `let` + `$expr`, multiple joins, joins involving arrays, `$lookup + $unwind`, and SQL JOIN comparisons.

After that, we'll attack **nested updates** properly: positional `$`, `$[]`, `$[identifier]`, multi-level `arrayFilters`, `$push`, `$pull`, `$addToSet`, and aggregation-pipeline updates on deeply nested arrays.
