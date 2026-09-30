Yes. We can do this properly—from **“I forgot MongoDB”** to **interview-level aggregation**, including deeply nested objects/arrays, `$lookup`, `$unwind`, `$map`, `$filter`, `$reduce`, update pipelines, `arrayFilters`, dynamic fields, recursive-style transformations, and performance.

The most important idea is this:

> **MongoDB aggregation is not just querying. It is a data-processing pipeline.**
>
> A document enters stage 1 → transformed document enters stage 2 → transformed document enters stage 3 → final result comes out.

Since you already have the `ecommerce_practice` database, we can use an e-commerce-style model throughout so the concepts stay connected.

# MongoDB Aggregation — Complete Roadmap

We should learn it in this order:

1. Aggregation fundamentals
2. `$match`
3. `$project`
4. `$set` / `$addFields`
5. `$unset`
6. `$sort`
7. `$limit`
8. `$skip`
9. `$count`
10. `$group`
11. Aggregation accumulators
12. Working with normal objects
13. Working with arrays
14. `$unwind`
15. `$filter`
16. `$map`
17. `$reduce`
18. `$arrayElemAt`
19. `$first`, `$last`
20. `$slice`
21. `$size`
22. `$in`
23. `$indexOfArray`
24. `$concatArrays`
25. `$setUnion`
26. `$setIntersection`
27. Nested arrays
28. Super-deep nested arrays
29. `$lookup`
30. Pipeline `$lookup`
31. Correlated `$lookup`
32. Multiple `$lookup`s
33. `$facet`
34. `$bucket`
35. `$bucketAuto`
36. `$sortByCount`
37. `$replaceRoot`
38. `$replaceWith`
39. `$mergeObjects`
40. `$objectToArray`
41. `$arrayToObject`
42. Dynamic object fields
43. Conditional expressions
44. `$cond`
45. `$switch`
46. Null handling
47. `$ifNull`
48. String expressions
49. Date expressions
50. Numeric expressions
51. Type conversion
52. `$expr`
53. `$let`
54. Variables like `$$ROOT`, `$$CURRENT`, `$$this`, `$$value`
55. Window functions
56. `$setWindowFields`
57. Ranking
58. Running totals
59. Moving averages
60. Updating normal fields
61. Updating nested objects
62. Updating nested arrays
63. Positional `$`
64. `$[]`
65. `$[identifier]`
66. `arrayFilters`
67. Multiple nested `arrayFilters`
68. Aggregation pipeline updates
69. Updating arrays with `$map`
70. Removing array elements
71. Adding array elements
72. Updating super-nested arrays
73. Querying super-nested arrays
74. Indexing nested fields
75. Multikey indexes
76. Aggregation optimization
77. `$explain`
78. Stage ordering
79. Interview patterns
80. Real-world aggregation problems

We'll cover all of these.

---

# Part 1 — Mental Model

Suppose you have:

```javascript
{
  _id: 1,
  customer: {
    name: "Pramit",
    address: {
      city: "Kolkata",
      state: "West Bengal"
    }
  },
  status: "PAID",
  items: [
    {
      product: "Laptop",
      price: 70000,
      quantity: 1
    },
    {
      product: "Mouse",
      price: 1000,
      quantity: 2
    }
  ]
}
```

Normal `find()`:

```javascript
db.orders.find({
  status: 'PAID',
});
```

Aggregation:

```javascript
db.orders.aggregate([
  {
    $match: {
      status: 'PAID',
    },
  },
]);
```

Same result.

But aggregation lets us continue:

```javascript
db.orders.aggregate([
  {
    $match: {
      status: 'PAID',
    },
  },
  {
    $project: {
      customerName: '$customer.name',
      items: 1,
    },
  },
]);
```

Pipeline:

```text
orders
  ↓
$match
  ↓
$project
  ↓
result
```

Think of it almost like:

```javascript
data
  .filter(...)
  .map(...)
  .reduce(...)
```

in JavaScript.

This analogy will help you enormously.

---

# Part 2 — `$match`

`$match` means:

> Filter documents.

Equivalent JavaScript concept:

```javascript
array.filter(...)
```

Example:

```javascript
db.orders.aggregate([
  {
    $match: {
      status: 'PAID',
    },
  },
]);
```

Multiple conditions:

```javascript
db.orders.aggregate([
  {
    $match: {
      status: 'PAID',
      totalAmount: {
        $gte: 5000,
      },
    },
  },
]);
```

This means:

```text
status = PAID
AND
totalAmount >= 5000
```

---

## Comparison Operators

```javascript
$eq;
$ne;
$gt;
$gte;
$lt;
$lte;
$in;
$nin;
```

Example:

```javascript
db.orders.aggregate([
  {
    $match: {
      totalAmount: {
        $gte: 10000,
        $lte: 50000,
      },
    },
  },
]);
```

Meaning:

```text
10000 <= totalAmount <= 50000
```

---

# Part 3 — Query Nested Objects

MongoDB uses **dot notation**.

Suppose:

```javascript
{
  customer: {
    name: "Pramit",
    address: {
      city: "Kolkata",
      state: "West Bengal"
    }
  }
}
```

Query:

```javascript
db.orders.aggregate([
  {
    $match: {
      'customer.address.city': 'Kolkata',
    },
  },
]);
```

You can go arbitrarily deep:

```javascript
"a.b.c.d.e.f": "value"
```

Example:

```javascript
{
  company: {
    department: {
      manager: {
        address: {
          city: 'Kolkata';
        }
      }
    }
  }
}
```

Query:

```javascript
{
  $match: {
    "company.department.manager.address.city": "Kolkata"
  }
}
```

This is fundamental.

---

# Part 4 — Arrays

Consider:

```javascript
{
  _id: 1,
  items: [
    {
      product: "Laptop",
      price: 70000,
      quantity: 1
    },
    {
      product: "Mouse",
      price: 1000,
      quantity: 2
    }
  ]
}
```

Find orders containing Laptop:

```javascript
db.orders.aggregate([
  {
    $match: {
      'items.product': 'Laptop',
    },
  },
]);
```

MongoDB automatically checks elements inside the array.

You do **not** need:

```javascript
items[0].product;
```

---

# Important Array Trap

Suppose you want:

```text
product = Laptop
AND
price < 50000
```

You might write:

```javascript
{
  $match: {
    "items.product": "Laptop",
    "items.price": {
      $lt: 50000
    }
  }
}
```

This does **not necessarily mean the same array element**.

For example:

```javascript
items: [
  {
    product: 'Laptop',
    price: 70000,
  },
  {
    product: 'Mouse',
    price: 1000,
  },
];
```

The document matches because:

```text
Laptop exists
price < 50000 exists
```

They can be different array elements.

To require the **same element**, use:

```javascript
$elemMatch;
```

```javascript
db.orders.aggregate([
  {
    $match: {
      items: {
        $elemMatch: {
          product: 'Laptop',
          price: {
            $lt: 50000,
          },
        },
      },
    },
  },
]);
```

Remember this one. It is a common interview question.

---

# Part 5 — `$project`

Think:

> Which fields should the result contain?

Input:

```javascript
{
  _id: 1,
  customer: {
    name: "Pramit",
    email: "p@test.com"
  },
  totalAmount: 72000,
  status: "PAID"
}
```

Pipeline:

```javascript
db.orders.aggregate([
  {
    $project: {
      customer: 1,
      totalAmount: 1,
    },
  },
]);
```

Result:

```javascript
{
  _id: 1,
  customer: {...},
  totalAmount: 72000
}
```

Remove `_id`:

```javascript
{
  $project: {
    _id: 0,
    customer: 1,
    totalAmount: 1
  }
}
```

---

# Rename / Extract Nested Fields

```javascript
{
  $project: {
    _id: 0,
    customerName: "$customer.name",
    city: "$customer.address.city"
  }
}
```

Result:

```javascript
{
  customerName: "Pramit",
  city: "Kolkata"
}
```

Notice the `$`.

```javascript
customerName: '$customer.name';
```

means:

> Read the value stored at `customer.name`.

Without `$`:

```javascript
customerName: 'customer.name';
```

MongoDB would treat it as a literal string.

---

# Part 6 — `$set` / `$addFields`

These two are effectively aliases.

Suppose:

```javascript
{
  firstName: "Pramit",
  lastName: "Pal"
}
```

Add:

```javascript
{
  $set: {
    fullName: {
      $concat: ['$firstName', ' ', '$lastName'];
    }
  }
}
```

Result:

```javascript
{
  firstName: "Pramit",
  lastName: "Pal",
  fullName: "Pramit Pal"
}
```

Original fields remain.

Difference from `$project`:

```text
$project
→ controls/rebuilds output fields

$set
→ adds or modifies fields while keeping the rest
```

---

# Part 7 — Calculate Values

Suppose:

```javascript
{
  price: 100,
  quantity: 5
}
```

Use:

```javascript
{
  $set: {
    total: {
      $multiply: ['$price', '$quantity'];
    }
  }
}
```

Result:

```javascript
{
  price: 100,
  quantity: 5,
  total: 500
}
```

Operators:

```javascript
$add;
$subtract;
$multiply;
$divide;
$mod;
```

---

# Part 8 — `$unset`

Remove fields:

```javascript
{
  $unset: ['password', 'internalNotes'];
}
```

Pipeline:

```javascript
db.users.aggregate([
  {
    $unset: ['password', 'refreshToken'],
  },
]);
```

---

# Part 9 — `$sort`

Ascending:

```javascript
{
  $sort: {
    price: 1;
  }
}
```

Descending:

```javascript
{
  $sort: {
    price: -1;
  }
}
```

Multiple:

```javascript
{
  $sort: {
    status: 1,
    createdAt: -1
  }
}
```

---

# Part 10 — `$skip` + `$limit`

Pagination:

```javascript
db.products.aggregate([
  {
    $skip: 20,
  },
  {
    $limit: 10,
  },
]);
```

For:

```text
page = 3
limit = 10
```

Formula:

```javascript
skip = (page - 1) * limit;
```

So:

```javascript
(3 - 1) * 10
= 20
```

Pipeline:

```javascript
[{ $skip: 20 }, { $limit: 10 }];
```

Usually:

```javascript
[{ $sort: { createdAt: -1 } }, { $skip: 20 }, { $limit: 10 }];
```

---

# Part 11 — `$group`

Now aggregation becomes powerful.

Data:

```javascript
[
  {
    category: 'Laptop',
    amount: 70000,
  },
  {
    category: 'Laptop',
    amount: 50000,
  },
  {
    category: 'Phone',
    amount: 30000,
  },
];
```

Group by category:

```javascript
db.sales.aggregate([
  {
    $group: {
      _id: '$category',
      totalSales: {
        $sum: '$amount',
      },
    },
  },
]);
```

Result:

```javascript
[
  {
    _id: 'Laptop',
    totalSales: 120000,
  },
  {
    _id: 'Phone',
    totalSales: 30000,
  },
];
```

Think SQL:

```sql
SELECT
    category,
    SUM(amount)
FROM sales
GROUP BY category;
```

MongoDB:

```javascript
{
  $group: {
    _id: "$category",
    totalSales: {
      $sum: "$amount"
    }
  }
}
```

---

# Important `$group` Rule

Inside `$group`:

```javascript
_id;
```

defines the grouping key.

Example:

```javascript
{
  $group: {
    _id: '$status';
  }
}
```

Means:

```text
GROUP BY status
```

Multiple fields:

```javascript
{
  $group: {
    _id: {
      category: "$category",
      year: "$year"
    }
  }
}
```

Equivalent concept:

```sql
GROUP BY category, year
```

---

# Common Group Accumulators

You should memorize:

```javascript
$sum;
$avg;
$min;
$max;
$first;
$last;
$push;
$addToSet;
$count;
```

Count documents:

```javascript
{
  $group: {
    _id: "$status",
    total: {
      $sum: 1
    }
  }
}
```

Average:

```javascript
{
  $group: {
    _id: "$category",
    avgPrice: {
      $avg: "$price"
    }
  }
}
```

Collect values:

```javascript
{
  $group: {
    _id: "$category",

    products: {
      $push: "$name"
    }
  }
}
```

Result:

```javascript
{
  _id: "Laptop",
  products: [
    "MacBook",
    "ThinkPad",
    "Dell XPS"
  ]
}
```

Remove duplicates:

```javascript
{
  $addToSet: '$brand';
}
```

---

# Part 12 — `$unwind`

This is one of the most important aggregation stages.

Input:

```javascript
{
  orderId: 101,
  items: [
    {
      product: "Laptop",
      qty: 1
    },
    {
      product: "Mouse",
      qty: 2
    }
  ]
}
```

Run:

```javascript
{
  $unwind: '$items';
}
```

Output becomes **two documents**:

```javascript
{
  orderId: 101,
  items: {
    product: "Laptop",
    qty: 1
  }
}
```

and

```javascript
{
  orderId: 101,
  items: {
    product: "Mouse",
    qty: 2
  }
}
```

Mental model:

```text
1 document with 2 array items

         ↓ $unwind

2 documents
```

---

# Very Important

Before `$unwind`:

```javascript
items.product;
```

represents many possible values.

After:

```javascript
{
  $unwind: '$items';
}
```

`items` is now effectively one element:

```javascript
'$items.product';
```

That's why `$unwind` is so useful for grouping.

---

# Example: Revenue Per Product

Suppose orders:

```javascript
{
  items: [
    {
      product: 'Laptop',
      price: 70000,
      quantity: 2,
    },
    {
      product: 'Mouse',
      price: 1000,
      quantity: 3,
    },
  ];
}
```

Pipeline:

```javascript
db.orders.aggregate([
  {
    $unwind: '$items',
  },

  {
    $group: {
      _id: '$items.product',

      revenue: {
        $sum: {
          $multiply: ['$items.price', '$items.quantity'],
        },
      },
    },
  },
]);
```

Now you're doing real aggregation.

---

# Part 13 — `$filter`

This is extremely important for nested arrays.

Suppose:

```javascript
{
  name: "Order 1",

  items: [
    {
      product: "Laptop",
      price: 70000
    },
    {
      product: "Mouse",
      price: 1000
    },
    {
      product: "Monitor",
      price: 25000
    }
  ]
}
```

Return only items where:

```text
price > 20000
```

Use:

```javascript
{
  $project: {
    items: {
      $filter: {
        input: "$items",
        as: "item",

        cond: {
          $gt: [
            "$$item.price",
            20000
          ]
        }
      }
    }
  }
}
```

This:

```javascript
input: '$items';
```

means the array.

```javascript
as: 'item';
```

means:

> Call each element `item`.

Then:

```javascript
$$item.price;
```

means:

> Read the current item's price.

Notice:

```text
$field
```

versus:

```text
$$variable
```

Very important.

---

# Part 14 — `$map`

JavaScript:

```javascript
items.map(...)
```

MongoDB:

```javascript
$map;
```

Suppose:

```javascript
items: [
  {
    product: 'Laptop',
    price: 70000,
    quantity: 2,
  },
  {
    product: 'Mouse',
    price: 1000,
    quantity: 3,
  },
];
```

Calculate each line total:

```javascript
{
  $project: {
    items: {
      $map: {
        input: "$items",
        as: "item",

        in: {
          product: "$$item.product",
          price: "$$item.price",
          quantity: "$$item.quantity",

          total: {
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

Result:

```javascript
items: [
  {
    product: 'Laptop',
    price: 70000,
    quantity: 2,
    total: 140000,
  },
  {
    product: 'Mouse',
    price: 1000,
    quantity: 3,
    total: 3000,
  },
];
```

---

# `$filter` vs `$map`

Think JavaScript:

```javascript
filter();
map();
```

MongoDB:

```javascript
$filter;
$map;
```

`$filter`:

```text
Which array elements survive?
```

`$map`:

```text
What should each element become?
```

This distinction is incredibly important.

---

# Part 15 — Filter Then Map

You can nest them.

```javascript
{
  $project: {
    expensiveItems: {
      $map: {
        input: {
          $filter: {
            input: "$items",
            as: "item",

            cond: {
              $gte: [
                "$$item.price",
                10000
              ]
            }
          }
        },

        as: "item",

        in: {
          product: "$$item.product",

          lineTotal: {
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

Read inside-out:

```text
$filter
   ↓
expensive items
   ↓
$map
   ↓
transform expensive items
```

---

# Part 16 — Super Nested Arrays

Now we come to what you specifically asked about.

Suppose:

```javascript
{
  company: "ABC",

  departments: [
    {
      name: "Engineering",

      teams: [
        {
          name: "Backend",

          employees: [
            {
              name: "Amit",
              skills: [
                {
                  name: "Node",
                  level: 8
                },
                {
                  name: "MongoDB",
                  level: 9
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Structure:

```text
company
 └─ departments[]
      └─ teams[]
           └─ employees[]
                └─ skills[]
```

This is four array levels deep.

MongoDB can handle it.

---

# Query Super-Nested Values

Find companies with someone having MongoDB skill:

```javascript
db.companies.find({
  'departments.teams.employees.skills.name': 'MongoDB',
});
```

MongoDB traverses arrays automatically for basic matching.

---

# Need Conditions on Same Skill Object?

Use:

```javascript
db.companies.find({
  'departments.teams.employees.skills': {
    $elemMatch: {
      name: 'MongoDB',
      level: {
        $gte: 8,
      },
    },
  },
});
```

However, when conditions span multiple different nested array levels, things become more interesting.

That's when nested `$elemMatch`, `$filter`, or `$unwind` becomes useful.

---

# Part 17 — Multiple `$unwind`

Given:

```text
departments[]
 → teams[]
 → employees[]
 → skills[]
```

You can flatten everything:

```javascript
db.companies.aggregate([
  {
    $unwind: '$departments',
  },
  {
    $unwind: '$departments.teams',
  },
  {
    $unwind: '$departments.teams.employees',
  },
  {
    $unwind: '$departments.teams.employees.skills',
  },
]);
```

You now effectively have:

```javascript
{
  company: "ABC",

  departments: {
    name: "Engineering",

    teams: {
      name: "Backend",

      employees: {
        name: "Amit",

        skills: {
          name: "MongoDB",
          level: 9
        }
      }
    }
  }
}
```

Then:

```javascript
{
  $match: {
    "departments.teams.employees.skills.name": "MongoDB"
  }
}
```

This pattern appears constantly.

---

# But Beware of `$unwind` Explosion

Suppose:

```text
10 departments
×
10 teams
×
20 employees
×
10 skills
```

Potential intermediate documents:

```text
10 × 10 × 20 × 10
= 20,000
```

from a single document.

So:

> Don't automatically `$unwind` everything.

Sometimes `$map` + `$filter` is significantly better.

This distinction separates beginner aggregation from advanced aggregation.

---

# Part 18 — `$reduce`

This is one of the hardest and most useful operators.

JavaScript:

```javascript
array.reduce(...)
```

MongoDB:

```javascript
$reduce;
```

Suppose:

```javascript
numbers: [10, 20, 30];
```

Sum:

```javascript
{
  $project: {
    total: {
      $reduce: {
        input: "$numbers",
        initialValue: 0,

        in: {
          $add: [
            "$$value",
            "$$this"
          ]
        }
      }
    }
  }
}
```

Meaning:

```text
initialValue = 0

0 + 10
10 + 20
30 + 30

= 60
```

Special variables:

```javascript
$$value;
```

= accumulator

```javascript
$$this;
```

= current item

Exactly like:

```javascript
numbers.reduce((value, current) => {
  return value + current;
}, 0);
```

---

# Calculate Order Total Without `$unwind`

Suppose:

```javascript
items: [
  {
    price: 100,
    quantity: 2,
  },
  {
    price: 50,
    quantity: 3,
  },
];
```

Do:

```javascript
{
  $set: {
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

Result:

```text
100 × 2 = 200

50 × 3 = 150

total = 350
```

This is an important advanced pattern.

---

# Part 19 — Querying vs Updating

You need to separate two ideas:

```text
READING / TRANSFORMING
```

versus

```text
ACTUALLY UPDATING DATABASE
```

Aggregation normally:

```javascript
db.collection.aggregate(...)
```

does **not modify the collection**.

It returns transformed results.

Updating:

```javascript
db.collection.updateOne();
db.collection.updateMany();
```

changes documents.

MongoDB also supports:

```javascript
updateOne(filter, aggregationPipeline);
```

which combines both concepts.

This is extremely powerful.

---

# Part 20 — Update Normal Nested Object

Document:

```javascript
{
  customer: {
    name: "Pramit",
    address: {
      city: "Kolkata",
      pin: "700001"
    }
  }
}
```

Update city:

```javascript
db.customers.updateOne(
  {
    _id: 1,
  },
  {
    $set: {
      'customer.address.city': 'Howrah',
    },
  },
);
```

Simple dot notation.

---

# Part 21 — Update Array Element with `$`

Document:

```javascript
{
  _id: 1,

  items: [
    {
      productId: 101,
      quantity: 2
    },
    {
      productId: 102,
      quantity: 5
    }
  ]
}
```

Change product `102` quantity:

```javascript
db.orders.updateOne(
  {
    _id: 1,
    'items.productId': 102,
  },

  {
    $set: {
      'items.$.quantity': 10,
    },
  },
);
```

The positional `$` means:

> The array element that matched the query.

---

# Part 22 — `$[]`

Update **every array element**.

```javascript
db.orders.updateOne(
  {
    _id: 1,
  },
  {
    $set: {
      'items.$[].discount': 10,
    },
  },
);
```

Every item becomes:

```javascript
{
  discount: 10;
}
```

Remember:

```text
$
matched element

$[]
all elements
```

---

# Part 23 — `$[identifier]` + `arrayFilters`

This is one of the most important MongoDB update features.

Suppose:

```javascript
items: [
  {
    product: 'Laptop',
    price: 70000,
  },
  {
    product: 'Mouse',
    price: 1000,
  },
  {
    product: 'Monitor',
    price: 25000,
  },
];
```

Apply discount only where:

```text
price >= 20000
```

```javascript
db.orders.updateOne(
  {
    _id: 1,
  },

  {
    $set: {
      'items.$[item].discount': 15,
    },
  },

  {
    arrayFilters: [
      {
        'item.price': {
          $gte: 20000,
        },
      },
    ],
  },
);
```

This means:

```text
for every item where
item.price >= 20000

set
item.discount = 15
```

---

# Part 24 — Super Nested Array Update

Now the serious stuff.

Data:

```javascript
{
  company: "ABC",

  departments: [
    {
      name: "Engineering",

      teams: [
        {
          name: "Backend",

          employees: [
            {
              employeeId: 101,

              skills: [
                {
                  name: "MongoDB",
                  level: 7
                },
                {
                  name: "Node",
                  level: 8
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Goal:

> In Engineering → Backend → employee 101 → MongoDB skill → change level to 10.

You can use multiple `arrayFilters`:

```javascript
db.companies.updateOne(
  {
    company: 'ABC',
  },

  {
    $set: {
      'departments.$[dept].teams.$[team].employees.$[emp].skills.$[skill].level': 10,
    },
  },

  {
    arrayFilters: [
      {
        'dept.name': 'Engineering',
      },
      {
        'team.name': 'Backend',
      },
      {
        'emp.employeeId': 101,
      },
      {
        'skill.name': 'MongoDB',
      },
    ],
  },
);
```

This is one of the most important patterns you can learn.

Read it like this:

```text
departments
  ↓ where dept.name = Engineering

teams
  ↓ where team.name = Backend

employees
  ↓ where employeeId = 101

skills
  ↓ where skill.name = MongoDB

level = 10
```

---

# Visualize It

```text
departments
   ↓
$[dept]

teams
   ↓
$[team]

employees
   ↓
$[emp]

skills
   ↓
$[skill]

level
```

with:

```javascript
arrayFilters: [
  { 'dept.name': 'Engineering' },
  { 'team.name': 'Backend' },
  { 'emp.employeeId': 101 },
  { 'skill.name': 'MongoDB' },
];
```

Once this clicks, deeply nested updates stop being scary.

---

# Part 25 — Push into Nested Array

Add a new skill:

```javascript
db.companies.updateOne(
  {
    company: 'ABC',
  },

  {
    $push: {
      'departments.$[dept].teams.$[team].employees.$[emp].skills': {
        name: 'PostgreSQL',
        level: 8,
      },
    },
  },

  {
    arrayFilters: [
      {
        'dept.name': 'Engineering',
      },
      {
        'team.name': 'Backend',
      },
      {
        'emp.employeeId': 101,
      },
    ],
  },
);
```

---

# Remove Nested Array Element

Remove MongoDB skill:

```javascript
db.companies.updateOne(
  {
    company: 'ABC',
  },

  {
    $pull: {
      'departments.$[dept].teams.$[team].employees.$[emp].skills': {
        name: 'MongoDB',
      },
    },
  },

  {
    arrayFilters: [
      {
        'dept.name': 'Engineering',
      },
      {
        'team.name': 'Backend',
      },
      {
        'emp.employeeId': 101,
      },
    ],
  },
);
```

---

# Array Update Operators You Must Know

```javascript
$push;
$pull;
$pop;
$addToSet;
$each;
$position;
$slice;
$sort;
```

Example:

```javascript
$addToSet;
```

prevents duplicates.

```javascript
{
  $addToSet: {
    tags: 'mongodb';
  }
}
```

---

# Part 26 — Aggregation Pipeline Update

This is advanced and extremely powerful.

Instead of:

```javascript
db.products.updateMany(
  {},
  {
    $set: {...}
  }
)
```

MongoDB lets you do:

```javascript
db.products.updateMany(
  {},
  [
    {
      $set: {...}
    }
  ]
)
```

Notice:

```javascript
[];
```

The update itself is an aggregation pipeline.

Example:

```javascript
db.products.updateMany({}, [
  {
    $set: {
      finalPrice: {
        $subtract: [
          '$price',

          {
            $multiply: ['$price', 0.1],
          },
        ],
      },
    },
  },
]);
```

This actually stores `finalPrice`.

---

# Update Array Using `$map`

Suppose:

```javascript
items: [
  {
    product: 'Laptop',
    price: 70000,
  },
  {
    product: 'Mouse',
    price: 1000,
  },
];
```

Increase prices by 10%.

```javascript
db.orders.updateOne(
  {
    _id: 1,
  },

  [
    {
      $set: {
        items: {
          $map: {
            input: '$items',
            as: 'item',

            in: {
              $mergeObjects: [
                '$$item',

                {
                  price: {
                    $multiply: ['$$item.price', 1.1],
                  },
                },
              ],
            },
          },
        },
      },
    },
  ],
);
```

This is an extremely useful advanced technique.

---

# Why `$mergeObjects`?

Without it you might reconstruct everything:

```javascript
{
  product: "$$item.product",
  quantity: "$$item.quantity",
  price: ...
}
```

But `$mergeObjects` says:

> Keep the original object, but overwrite these selected fields.

Conceptually:

```javascript
{
   ...item,
   price: newPrice
}
```

JavaScript spread syntax analogy:

```javascript
{
  ...item,
  price: item.price * 1.1
}
```

MongoDB:

```javascript
{
  $mergeObjects: [
    '$$item',
    {
      price: {
        $multiply: ['$$item.price', 1.1],
      },
    },
  ];
}
```

Excellent pattern to memorize.

---

# The Big Mental Cheat Sheet

Map MongoDB to JavaScript:

| MongoDB         | JavaScript idea                      |
| --------------- | ------------------------------------ |
| `$match`        | `filter()`                           |
| `$map`          | `map()`                              |
| `$filter`       | `filter()` inside an array           |
| `$reduce`       | `reduce()`                           |
| `$sort`         | `sort()`                             |
| `$slice`        | `slice()`                            |
| `$concatArrays` | spread / concat                      |
| `$size`         | `.length`                            |
| `$unwind`       | flatten array                        |
| `$group`        | `reduce()` into groups               |
| `$project`      | reshape object                       |
| `$set`          | add/change property                  |
| `$mergeObjects` | `{...a, ...b}`                       |
| `$lookup`       | SQL JOIN                             |
| `$facet`        | run several pipelines simultaneously |

This table alone will make aggregation much easier to remember.

---

# The Four Array Operators You Must Master First

If you become excellent at only these four:

```javascript
$unwind;
$filter;
$map;
$reduce;
```

you will already be able to solve a huge percentage of complicated aggregation questions.

Think:

```text
$unwind
Array → documents

$filter
Array → smaller array

$map
Array → transformed array

$reduce
Array → one accumulated result
```

This distinction should become automatic.

---

# A Difficult Example

Suppose:

```javascript
{
  customer: "Pramit",

  orders: [
    {
      status: "PAID",

      products: [
        {
          name: "Laptop",
          price: 70000,
          quantity: 1
        },
        {
          name: "Mouse",
          price: 1000,
          quantity: 2
        }
      ]
    },

    {
      status: "CANCELLED",

      products: [
        {
          name: "Monitor",
          price: 20000,
          quantity: 1
        }
      ]
    }
  ]
}
```

Requirement:

> Calculate total value of only PAID orders.

We can do:

```javascript
db.customers.aggregate([
  {
    $set: {
      paidOrders: {
        $filter: {
          input: '$orders',
          as: 'order',

          cond: {
            $eq: ['$$order.status', 'PAID'],
          },
        },
      },
    },
  },

  {
    $set: {
      paidAmount: {
        $reduce: {
          input: '$paidOrders',
          initialValue: 0,

          in: {
            $add: [
              '$$value',

              {
                $reduce: {
                  input: '$$this.products',
                  initialValue: 0,

                  in: {
                    $add: [
                      '$$value',

                      {
                        $multiply: ['$$this.price', '$$this.quantity'],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
]);
```

Yes—there is a `$reduce` inside another `$reduce`.

That's the kind of aggregation that initially looks horrible.

But translate it:

```text
filter PAID orders

then

for each PAID order:
    calculate product total

then

sum every order total
```

Once you learn to read pipelines **inside-out**, these become manageable.

---

# How I Want You to Learn This

Don't memorize 100 operators separately.

Learn these five mental categories:

```text
1. Filter documents
   $match

2. Change document shape
   $project
   $set
   $unset

3. Manipulate arrays
   $unwind
   $filter
   $map
   $reduce

4. Aggregate documents
   $group

5. Combine collections
   $lookup
```

Almost every complicated aggregation problem is a combination of those ideas.

---

## Next lesson

The next part should go much deeper into **arrays**, because that's where MongoDB interviews and real backend work become difficult.

We'll cover things like:

```javascript
array of strings
array of objects
object → array → object
array → object → array
nested arrays
array inside array inside array

$elemMatch
$arrayElemAt
$first
$last
$slice
$size
$in
$indexOfArray
$concatArrays
$setUnion
$setIntersection
$sortArray

$map + $filter
$map + $reduce
$filter + $reduce
nested $map
nested $filter
nested $reduce
```

Then we'll move into **`$lookup`/joins**, followed by **advanced nested updates and `arrayFilters`**, and finally interview-level pipelines and optimization.
