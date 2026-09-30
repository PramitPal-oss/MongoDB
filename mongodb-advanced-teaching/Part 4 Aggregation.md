# Part 2 — Nested Updates in MongoDB

This is an important section because MongoDB **reading nested arrays** and **updating nested arrays** are two different skills.

Your practice dataset is perfect for this. For example, `customers.addresses`, `products.variants`, `variants.optionValues`, `returns.items.inspection.checklist`, and `shipments.trackingEvents` give us progressively deeper arrays. :chatgpt-content-reference{index="0"} :chatgpt-content-reference{index="1"}

Your workbook also deliberately dedicates questions **81–100** to nested writes and concurrency. :chatgpt-content-reference{index="2"}

We'll build it from simple → horrible.

---

## 1. First understand the four ways of targeting arrays

When updating arrays, these are the symbols you need burned into memory:

| Syntax             | Meaning                                         |
| ------------------ | ----------------------------------------------- |
| `$`                | first array element that matched the query      |
| `$[]`              | **every** element                               |
| `$[x]`             | elements matching an `arrayFilter`              |
| `$[x].nested.$[y]` | filtered elements inside filtered nested arrays |

Think:

```text
$
↓
the matched one

$[]
↓
all of them

$[x]
↓
the ones satisfying my condition
```

Once you understand these three, even deeply nested updates become manageable.

---

# 2. Normal nested object update

Suppose a customer looks approximately like your seed data:

```javascript
{
  email: "customer0@example.test",

  loyalty: {
    tier: "GOLD",
    pointsBalance: 700
  },

  preferences: {
    language: "en",
    marketingOptIn: false
  }
}
```

Updating an embedded **object** is easy:

```javascript
db.customers.updateOne(
  { email: 'customer0@example.test' },
  {
    $set: {
      'preferences.marketingOptIn': true,
    },
  },
);
```

No positional operator is necessary.

Why?

Because `preferences` is an **object**, not an array.

Similarly:

```javascript
db.customers.updateOne(
  { email: 'customer0@example.test' },
  {
    $inc: {
      'loyalty.pointsBalance': 50,
    },
  },
);
```

Your dataset actually contains these nested fields. :chatgpt-content-reference{index="3"}

---

# 3. Updating an array element — `$`

Now things become interesting.

Your customer has:

```javascript
addresses: [
  {
    addressId: ObjectId(...),
    label: "Home",
    city: "Kolkata",
    isDefault: true
  }
]
```

Suppose later you add:

```javascript
addresses: [
  {
    addressId: ObjectId('AAA...'),
    label: 'Home',
    city: 'Kolkata',
    isDefault: true,
  },
  {
    addressId: ObjectId('BBB...'),
    label: 'Office',
    city: 'Mumbai',
    isDefault: false,
  },
];
```

You want:

> Change the Office address city to Pune.

You can write:

```javascript
db.customers.updateOne(
  {
    email: 'customer0@example.test',
    'addresses.label': 'Office',
  },
  {
    $set: {
      'addresses.$.city': 'Pune',
    },
  },
);
```

Here:

```javascript
"addresses.label": "Office"
```

finds the matching address.

Then:

```javascript
addresses.$.city;
```

means:

> Update the array element that matched the query.

### Mental model

```text
addresses
   |
   +-- Home
   |
   +-- Office    ← query matched this
         |
         city    ← $set this
```

Therefore:

```javascript
addresses.$.city;
```

means roughly:

```text
addresses.[MATCHED ELEMENT].city
```

---

# 4. `$` does NOT mean "all"

This is an extremely common interview mistake.

Suppose:

```javascript
scores: [
  { subject: 'math', score: 40 },
  { subject: 'math', score: 50 },
  { subject: 'english', score: 70 },
];
```

This:

```javascript
db.students.updateOne(
  { 'scores.subject': 'math' },
  {
    $set: {
      'scores.$.passed': true,
    },
  },
);
```

does **not** update every math entry.

`$` represents the matched positional element.

For updating multiple matching elements, that's where `$[identifier]` becomes useful.

---

# 5. `$[]` — update EVERY element

Now suppose we want:

> Set every saved address to `isDefault: false`.

```javascript
db.customers.updateOne(
  { email: 'customer0@example.test' },
  {
    $set: {
      'addresses.$[].isDefault': false,
    },
  },
);
```

Read:

```text
addresses
   ↓
$[]
   ↓
EVERY address
   ↓
isDefault = false
```

If:

```javascript
addresses: [
  { label: 'Home', isDefault: true },
  { label: 'Office', isDefault: true },
  { label: 'Parents', isDefault: true },
];
```

after the update:

```javascript
addresses: [
  { label: 'Home', isDefault: false },
  { label: 'Office', isDefault: false },
  { label: 'Parents', isDefault: false },
];
```

This corresponds directly to workbook question 85. :chatgpt-content-reference{index="4"}

---

# 6. `$[identifier]` — THIS is the powerful one

Suppose:

```javascript
addresses: [
  {
    label: 'Home',
    city: 'Kolkata',
    isDefault: true,
  },
  {
    label: 'Office',
    city: 'Kolkata',
    isDefault: false,
  },
  {
    label: 'Parents',
    city: 'Delhi',
    isDefault: false,
  },
];
```

Requirement:

> Update **all Kolkata addresses**.

We can use:

```javascript
db.customers.updateOne(
  { email: 'customer0@example.test' },

  {
    $set: {
      'addresses.$[address].city': 'New Kolkata',
    },
  },

  {
    arrayFilters: [
      {
        'address.city': 'Kolkata',
      },
    ],
  },
);
```

Notice the connection:

```javascript
$[address];
```

and:

```javascript
'address.city';
```

The name `address` is our identifier.

It could technically be:

```javascript
$[x];
```

with:

```javascript
arrayFilters: [{ 'x.city': 'Kolkata' }];
```

But meaningful names are much better.

---

# 7. The three parts of an array-filter update

Whenever you see this:

```javascript
db.collection.updateOne(
  DOCUMENT_FILTER,
  UPDATE,
  {
    arrayFilters: [...]
  }
)
```

separate it mentally into three questions.

### Question 1 — Which document?

```javascript
{
  email: 'customer0@example.test';
}
```

### Question 2 — Which array elements?

```javascript
arrayFilters: [{ 'address.city': 'Kolkata' }];
```

### Question 3 — What should happen to them?

```javascript
$set: {
  "addresses.$[address].isDefault": false
}
```

This mental model is extremely important:

```text
Document filter
      ↓
Which document?

arrayFilters
      ↓
Which elements?

Update operator
      ↓
What change?
```

---

# 8. `$` vs `$[]` vs `$[x]`

This is worth memorizing.

### `$`

```javascript
'addresses.$.city';
```

**Matched positional element**

---

### `$[]`

```javascript
'addresses.$[].city';
```

**Every element**

---

### `$[address]`

```javascript
'addresses.$[address].city';
```

**Elements satisfying `arrayFilters`**

---

# 9. Real example from your `products`

Your generated products contain:

```javascript
variants: [
  {
    variantId: ...,
    sku: "SKU-000000",

    optionValues: [
      { option: "color", value: "black" },
      { option: "storage", value: "512GB" }
    ],

    pricing: {
      currency: "INR",
      listPrice: ...,
      salePrice: ...
    }
  }
]
```

:chatgpt-content-reference{index="5"}

Suppose you want:

> Change sale price for SKU-000000.

You could do:

```javascript
db.products.updateOne(
  {
    'variants.sku': 'SKU-000000',
  },
  {
    $set: {
      'variants.$.pricing.salePrice': NumberDecimal('8500.00'),
    },
  },
);
```

That's positional `$`.

---

# 10. Same thing using `arrayFilters`

```javascript
db.products.updateOne(
  {
    'variants.sku': 'SKU-000000',
  },
  {
    $set: {
      'variants.$[variant].pricing.salePrice': NumberDecimal('8500.00'),
    },
  },
  {
    arrayFilters: [
      {
        'variant.sku': 'SKU-000000',
      },
    ],
  },
);
```

This looks longer.

But it becomes incredibly useful when things become nested.

---

# 11. Now the important part: nested arrays 🔥

Your product structure already gives us this:

```text
product
 └── variants[]
       └── optionValues[]
```

Suppose:

```javascript
variants: [
  {
    sku: 'LAPTOP-BLACK-512',

    optionValues: [
      { option: 'color', value: 'black' },
      { option: 'storage', value: '512GB' },
    ],
  },

  {
    sku: 'LAPTOP-BLUE-1TB',

    optionValues: [
      { option: 'color', value: 'blue' },
      { option: 'storage', value: '1TB' },
    ],
  },
];
```

Requirement:

> For SKU `LAPTOP-BLACK-512`, change only its `color` option from `black` to `midnight-black`.

We have to select:

```text
correct product
     ↓
correct variant
     ↓
correct option
     ↓
change value
```

And MongoDB can do that directly.

---

# 12. Two-level `arrayFilters`

```javascript
db.products.updateOne(
  {
    'variants.sku': 'LAPTOP-BLACK-512',
  },

  {
    $set: {
      'variants.$[variant].optionValues.$[option].value': 'midnight-black',
    },
  },

  {
    arrayFilters: [
      {
        'variant.sku': 'LAPTOP-BLACK-512',
      },
      {
        'option.option': 'color',
      },
    ],
  },
);
```

This is one of the most important nested-update patterns.

Break the path apart:

```javascript
variants.$[variant].optionValues.$[option].value;
```

Meaning:

```text
variants
   ↓
variant satisfying variant.sku = LAPTOP-BLACK-512
   ↓
optionValues
   ↓
option satisfying option.option = color
   ↓
value = midnight-black
```

Your workbook explicitly asks you to practice this exact pattern in question **91**. :chatgpt-content-reference{index="6"}

---

# 13. Don't be scared by three-level nested arrays

Imagine:

```javascript
departments: [
  {
    name: 'Engineering',

    teams: [
      {
        name: 'Backend',

        employees: [
          {
            id: 101,
            salary: 50000,
          },
          {
            id: 102,
            salary: 60000,
          },
        ],
      },
    ],
  },
];
```

Requirement:

> Increase employee 102's salary by 10,000 inside Backend inside Engineering.

```javascript
db.company.updateOne(
  { _id: companyId },

  {
    $inc: {
      'departments.$[dept].teams.$[team].employees.$[emp].salary': 10000,
    },
  },

  {
    arrayFilters: [{ 'dept.name': 'Engineering' }, { 'team.name': 'Backend' }, { 'emp.id': 102 }],
  },
);
```

Looks horrible.

But structurally it's just:

```text
departments.$[dept]
             ↓
teams.$[team]
       ↓
employees.$[emp]
           ↓
salary
```

And then:

```text
dept → Engineering
team → Backend
emp  → 102
```

That's the secret.

---

# 14. Your `returns` collection has an excellent real example

Your data contains:

```javascript
items: [
  {
    lineId: ...,

    inspection: {
      condition: "PENDING",

      checklist: [
        {
          question: "Original packaging?",
          answer: null
        },
        {
          question: "Serial matches?",
          answer: null
        }
      ]
    }
  }
]
```

:chatgpt-content-reference{index="7"}

Requirement:

> For a particular returned line, set `"Original packaging?"` to `true`.

Conceptually:

```javascript
db.returns.updateOne(
  {
    returnNumber: 'RET-2026-000000',
  },

  {
    $set: {
      'items.$[item].inspection.checklist.$[check].answer': true,
    },
  },

  {
    arrayFilters: [
      {
        'item.lineId': ObjectId('...'),
      },
      {
        'check.question': 'Original packaging?',
      },
    ],
  },
);
```

Again:

```text
items
 ↓
$[item]
 ↓
inspection
 ↓
checklist
 ↓
$[check]
 ↓
answer
```

This is exactly the sort of nested-array update your workbook expects at question 94. :chatgpt-content-reference{index="8"}

---

# 15. `$push`

Now let's cover modifying the array itself.

Suppose:

```javascript
tags: ['electronics', 'laptop'];
```

Add another:

```javascript
db.products.updateOne(
  { _id: productId },
  {
    $push: {
      tags: 'gaming',
    },
  },
);
```

Result:

```javascript
['electronics', 'laptop', 'gaming'];
```

---

# 16. `$push` an object

Your shipment contains `trackingEvents`. :chatgpt-content-reference{index="9"}

We could append:

```javascript
db.shipments.updateOne(
  { trackingNumber: 'EX00000000' },
  {
    $push: {
      trackingEvents: {
        code: 'CUSTOMER_NOTIFIED',
        location: {
          city: 'Kolkata',
        },
        occurredAt: new Date(),
      },
    },
  },
);
```

---

# 17. `$push` multiple elements with `$each`

Instead of doing three updates:

```javascript
$push: {
  tags: {
    $each: ['gaming', 'premium', 'featured'];
  }
}
```

---

# 18. `$addToSet`

Suppose:

```javascript
tags: ['gaming', 'laptop'];
```

You execute:

```javascript
$addToSet: {
  tags: 'gaming';
}
```

Nothing gets added because `"gaming"` already exists.

But:

```javascript
$push: {
  tags: 'gaming';
}
```

would create:

```javascript
['gaming', 'laptop', 'gaming'];
```

Therefore:

```text
$push
   ↓
always append

$addToSet
   ↓
append only if that value isn't already present
```

Your workbook questions 81–83 deliberately make you practice `$push`, `$addToSet`, and `$pull`. :chatgpt-content-reference{index="10"}

---

# 19. Important `$addToSet` trap with objects

Suppose:

```javascript
certifications: [
  {
    code: 'BIS',
    issuer: 'BIS',
  },
];
```

Then you do:

```javascript
$addToSet: {
  certifications: {
    code: "BIS",
    issuer: "NEW"
  }
}
```

You might expect MongoDB to say:

> BIS already exists.

But that's **not uniqueness by `code`**.

MongoDB is considering the value/document being added, not enforcing your business rule:

```text
certification.code must be unique
```

Your workbook intentionally calls this out in question 92. :chatgpt-content-reference{index="11"}

So `$addToSet` is **not equivalent to a unique constraint on one property inside embedded objects**.

---

# 20. `$pull`

Remove matching elements from an array.

Suppose:

```javascript
tags: ['gaming', 'laptop', 'old', 'featured'];
```

```javascript
db.products.updateOne(
  { _id: productId },
  {
    $pull: {
      tags: 'old',
    },
  },
);
```

Result:

```javascript
['gaming', 'laptop', 'featured'];
```

---

# 21. `$pull` objects conditionally

Suppose:

```javascript
items: [
  { sku: 'A', quantity: 2 },
  { sku: 'B', quantity: 0 },
  { sku: 'C', quantity: 0 },
];
```

You can:

```javascript
$pull: {
  items: {
    quantity: 0;
  }
}
```

Result:

```javascript
items: [{ sku: 'A', quantity: 2 }];
```

---

# 22. `$inc` inside filtered arrays

Suppose a cart contains:

```javascript
items: [
  {
    variantId: ObjectId('...'),
    quantity: 2,
  },
];
```

Your seed carts actually contain nested item objects with `variantId` and `quantity`. :chatgpt-content-reference{index="12"}

Increment only the required variant:

```javascript
db.carts.updateOne(
  {
    customerId: customerId,
  },

  {
    $inc: {
      'items.$[item].quantity': 1,
    },
  },

  {
    arrayFilters: [
      {
        'item.variantId': variantId,
      },
    ],
  },
);
```

Notice something important:

`arrayFilters` isn't tied to `$set`.

It works with updates such as:

```javascript
$set;
$inc;
$unset;
```

and other compatible update operations.

---

# 23. Sometimes `arrayFilters` aren't enough

Now we enter the **advanced level**.

Suppose you want:

> Rebuild an array based on complicated logic.

Then an **update aggregation pipeline** can be better.

Example:

```javascript
db.inventory.updateOne(
  { _id: inventoryId },

  [
    {
      $set: {
        available: {
          $subtract: [
            {
              $subtract: ['$quantity.onHand', '$quantity.reserved'],
            },
            '$quantity.damaged',
          ],
        },
      },
    },
  ],
);
```

Notice:

```javascript
updateOne(FILTER, [PIPELINE]);
```

instead of:

```javascript
updateOne(
  FILTER,
  {
     $set: ...
  }
)
```

The square brackets are important.

Your inventory documents contain exactly those three quantity values. :chatgpt-content-reference{index="13"}

And your workbook asks you to calculate `available` using an update pipeline in question 98. :chatgpt-content-reference{index="14"}

---

# 24. Update pipeline + `$map`

This is where your previous aggregation knowledge connects directly to updates.

Suppose:

```javascript
items: [
  { sku: 'A', price: 100 },
  { sku: 'B', price: 200 },
  { sku: 'C', price: 300 },
];
```

Requirement:

> Increase SKU B by 10%.

You can rebuild the array:

```javascript
db.orders.updateOne(
  { _id: orderId },

  [
    {
      $set: {
        items: {
          $map: {
            input: '$items',
            as: 'item',

            in: {
              $cond: [
                {
                  $eq: ['$$item.sku', 'B'],
                },

                {
                  $mergeObjects: [
                    '$$item',
                    {
                      price: {
                        $multiply: ['$$item.price', 1.1],
                      },
                    },
                  ],
                },

                '$$item',
              ],
            },
          },
        },
      },
    },
  ],
);
```

Don't worry about `$mergeObjects` yet—we'll study it properly.

The important concept is:

```text
old array
   ↓
$map
   ↓
inspect every element
   ↓
$cond
   ↓
matching?
 /       \
yes       no
 |         |
modify    unchanged
 \         /
   new array
```

This is extremely powerful.

---

# 25. `arrayFilters` vs update pipeline

You should know when to choose which.

### Use `$[x]` + `arrayFilters`

When the requirement is:

> Find specific array elements and change specific fields.

Example:

```text
Find variant SKU-101
→ change salePrice
```

Use:

```javascript
variants.$[variant].pricing.salePrice;
```

---

### Use update pipeline + `$map`

When the requirement is more like:

> Recalculate/reconstruct elements based on existing values and more complicated expression logic.

Think:

```text
arrayFilters
=
targeted surgical update


$map update pipeline
=
transform/rebuild array
```

That's an important distinction.

---

# 26. One more extremely important concept: atomicity

Consider:

```javascript
db.inventory.updateOne(
  {
    _id: inventoryId,
    'quantity.onHand': { $gte: 2 },
  },
  {
    $inc: {
      'quantity.reserved': 2,
    },
  },
);
```

Filtering and modifying a **single document** happens atomically.

But your actual availability rule is:

```text
onHand - reserved - damaged >= 2
```

So we need something stronger:

```javascript
db.inventory.updateOne(
  {
    _id: inventoryId,

    $expr: {
      $gte: [
        {
          $subtract: [
            {
              $subtract: ['$quantity.onHand', '$quantity.reserved'],
            },
            '$quantity.damaged',
          ],
        },
        2,
      ],
    },
  },

  {
    $inc: {
      'quantity.reserved': 2,
      version: 1,
    },
  },
);
```

This is beautiful because MongoDB checks:

```text
available >= 2
```

and reserves the stock as **one conditional single-document update**.

Your workbook intentionally has this as hard question 96. :chatgpt-content-reference{index="15"}

This is a real interview-level pattern.

---

# The mental cheat sheet

Remember this:

```text
OBJECT
──────

"profile.address.city"

Just use dot notation.


ARRAY — matched element
───────────────────────

items.$.quantity


ARRAY — every element
─────────────────────

items.$[].quantity


ARRAY — selected elements
─────────────────────────

items.$[item].quantity

arrayFilters:
[
  { "item.sku": "ABC" }
]


NESTED ARRAYS
─────────────

variants
.$[variant]
.optionValues
.$[option]
.value


COMPLEX TRANSFORMATION
──────────────────────

Update Pipeline
    +
$map
    +
$cond
    +
$mergeObjects
```

The single sentence I want you to remember **years from now** is:

> **The normal query chooses documents; `arrayFilters` choose elements inside those documents.**

That distinction eliminates a huge amount of confusion.

## Your practice before we move on

Use the lab database for these because they modify data; your workbook specifically recommends keeping writes away from the original import. :chatgpt-content-reference{index="16"}

Try these from the workbook **without looking up the answers**:

```text
84 → positional $
85 → $[]
86 → $[address] + arrayFilters

88 → filtered $inc

90 → variant update
91 → TWO nested arrayFilters

94 → return item + checklist
     TWO nested arrayFilters

96 → atomic conditional inventory update

98 → update aggregation pipeline
```

If you can solve **91 and 94 from memory**, nested updates are already becoming strong.

**Next lesson:** `$cond`, `$switch`, `$ifNull`, and handling `null` vs missing fields. That's where we start making aggregation pipelines behave like actual application/business logic.
