# Section 8 — MongoDB Update Operations

**Purpose:** Understand and use these notes years later without reopening the videos.

**Course:** MongoDB — The Complete Developer's Guide, Academind / Maximilian Schwarzmüller. Aligned with the Section 8 curriculum previously inspected on Udemy: lectures 106–121 and the update practice assignment. These are original explanations and examples, not a lecture transcript or the instructor's assignment solution.

**Written:** 28 September 2026. Commands use `mongosh` syntax. Expected changes are reasoned from the sample data; they were not executed against a MongoDB server. Check the linked documentation for your installed server and driver version when revisiting these notes.

## 1. The idea to remember first — lecture 106

A **read** asks what is stored. An **update** changes what is stored.

Every update has three parts:

```javascript
db.collection.updateOne(filter, update, options)
```

**English:** “Choose a document using this filter, apply these changes, and use these optional settings.”

- **Filter:** which documents qualify? It uses the query rules from Section 7.
- **Update document:** what should change? Operators such as `$set` or `$inc` express the change.
- **Options:** additional behavior, such as `upsert` or `arrayFilters`.

For array updates, ask two separate questions: **Which documents qualify? Which elements inside their arrays should change?**

## 2. One dataset for all examples

Imagine a user collection. Each user has a numeric age, a nested address, an array of hobby documents, and an array of tags. Hobby `frequency` means sessions per month.

Connect `mongosh` to a MongoDB server and select this dedicated practice database:

```javascript
use section8_update_practice
```

The examples in each section are **independent**: assume this starting dataset before each example unless a sequence is explicitly stated. Otherwise, earlier changes would alter later expected results.

To create or restore the starting data, run this setup. It replaces documents with IDs 1–3 in this practice collection and preserves any other IDs. Use it only in the named practice database. For the upsert examples, choose an `_id` that does not already exist.

```javascript
const sampleUsers = [
  {
    _id: 1, name: "Asha", age: 28, active: true,
    address: { city: "Kolkata", postcode: "700001" },
    hobbies: [
      { title: "Sports", frequency: 3 },
      { title: "Reading", frequency: 5 },
      { title: "Cooking", frequency: 1 }
    ],
    tags: ["member", "newsletter"], loginCount: 4,
    bestScore: 80, price: 100, temporaryNote: "Review later"
  },
  {
    _id: 2, name: "Ben", age: 35, active: false,
    address: { city: "Mumbai", postcode: "400001" },
    hobbies: [
      { title: "Sports", frequency: 1 },
      { title: "Reading", frequency: 4 }
    ],
    tags: ["member"], loginCount: 7,
    bestScore: 95, price: 200
  },
  {
    _id: 3, name: "Cara", age: 22, active: true,
    address: { city: "Delhi", postcode: "110001" },
    hobbies: [{ title: "Music", frequency: 2 }],
    tags: [], loginCount: 0, bestScore: 70, price: 50
  }
]

sampleUsers.forEach(user => {
  db.users.replaceOne({ _id: user._id }, user, { upsert: true })
})
```

`replaceOne()` is used here to restore whole practice records. It replaces the existing record's contents; it is different from a targeted `$set` update. You can rerun the `sampleUsers.forEach(...)` block to restore IDs 1–3.

Inspect a result after an update:

```javascript
db.users.findOne({ _id: 1 })
```

## 3. updateOne, updateMany, and results — lecture 107

### `updateOne()`: change at most one matching document

```javascript
db.users.updateOne({ _id: 1 }, { $set: { active: false } })
```

**Before → after:** Asha's `active: true` becomes `active: false`. Ben and Cara do not change.

If several documents match, `updateOne()` still updates only one. Use a unique filter such as `_id` when you mean a particular record. An empty filter `{}` does not identify a particular user. [MongoDB: updateOne](https://www.mongodb.com/docs/manual/reference/method/db.collection.updateone/)

### `updateMany()`: change all matching documents

```javascript
db.users.updateMany({ active: true }, { $set: { needsReview: true } })
```

**Expected:** Asha and Cara gain `needsReview: true`; Ben does not. `updateMany({}, ...)` applies to every document in the collection.

Each individual document update is atomic: its changes happen together. The complete `updateMany()` operation is not automatically one atomic change across all documents. If multiple-document all-or-nothing behavior is required, investigate transactions. [MongoDB: updateMany](https://www.mongodb.com/docs/manual/reference/method/db.collection.updatemany/)

### Understand the returned counts

For an acknowledged update, inspect these fields:

| Result field | Meaning |
|---|---|
| `acknowledged` | Whether the write was acknowledged under the requested write concern |
| `matchedCount` | Number of existing documents matching the filter |
| `modifiedCount` | Number of documents actually changed |
| `upsertedCount` | Number of documents inserted by an upsert |
| `upsertedId` | ID of the upserted document, if an insertion occurred |

An update that finds Asha but sets her age to its current value, 28, can have `matchedCount: 1` and `modifiedCount: 0`. No match without upsert gives both counts zero. Counts describe **documents**, not changed array elements. These methods return write information, not the updated user document. [MongoDB: updateOne results](https://www.mongodb.com/docs/manual/reference/method/db.collection.updateone/)

## 4. `$set`: assign fields — lectures 107–108

`$set` means “make this field equal to this value.” It can add a field or replace its current value.

```javascript
db.users.updateOne(
  { _id: 1 },
  { $set: { age: 29, active: false, role: "editor" } }
)
```

**Expected:** `age` becomes 29, `active` becomes false, and `role` is added. Unmentioned top-level fields remain.

### Updating a nested field versus replacing its parent

```javascript
// Change city and preserve postcode:
db.users.updateOne({ _id: 1 }, { $set: { "address.city": "Pune" } })
// address becomes { city: "Pune", postcode: "700001" }

// Independent example: replace the entire address value:
db.users.updateOne({ _id: 1 }, { $set: { address: { city: "Pune" } } })
// address becomes { city: "Pune" }; postcode is removed.
```

**Memory:** A dotted path changes the child; assigning the parent replaces that parent's value. `$set` can create a missing path when its structure is compatible. A path through an incompatible value, such as a scalar where an object is required, can fail. [MongoDB: $set](https://www.mongodb.com/docs/manual/reference/operator/update/set/)

Do not repeat operator keys:

```javascript
// WRONG: JavaScript overwrites the first $set before sending the object.
// { $set: { age: 29 }, $set: { active: false } }

// RIGHT:
{ $set: { age: 29, active: false } }
```

## 5. `$inc`: increment or decrement — lecture 109

```javascript
db.users.updateOne({ _id: 1 }, { $inc: { loginCount: 1 } })
// loginCount: 4 → 5

db.users.updateOne({ _id: 1 }, { $inc: { age: -2 } })
// age: 28 → 26
```

There is no separate `$dec` operator: use a negative increment. If the field is missing, `$inc` creates it with the increment value. A null or nonnumeric field cannot be incremented this way.

Prefer a server-side `$inc` for a counter instead of reading 4 and later writing 5 with `$set`: concurrent writers can otherwise overwrite each other's increments. Running `$inc: 1` twice deliberately adds two. [MongoDB: $inc](https://www.mongodb.com/docs/manual/reference/operator/update/inc/)

You can combine operators on **different paths**:

```javascript
db.users.updateOne(
  { _id: 1 },
  { $inc: { loginCount: 1 }, $set: { active: true } }
)
```

Avoid conflicting operations on the same path or a parent and its child in one classic update document. Do not depend on the order in which operator keys are written.

## 6. `$min`, `$max`, and `$mul` — lecture 110

### `$min`: accept a lower candidate

```javascript
db.users.updateOne({ _id: 1 }, { $min: { price: 90 } })
// price: 100 → 90

db.users.updateOne({ _id: 1 }, { $min: { price: 110 } })
// Independent example: price remains 100.
```

Think “record the lower price,” not “ensure price is at least this minimum.” For comparable numeric values, the result is the smaller of current and candidate. A missing field is created with the candidate. [MongoDB: $min](https://www.mongodb.com/docs/manual/reference/operator/update/min/)

### `$max`: accept a higher candidate

```javascript
db.users.updateOne({ _id: 1 }, { $max: { bestScore: 90 } })
// bestScore: 80 → 90

db.users.updateOne({ _id: 1 }, { $max: { bestScore: 75 } })
// Independent example: bestScore remains 80.
```

Think “record the higher score.” A missing field is created. These operators compare BSON values, so use consistent types for predictable numeric meaning. [MongoDB: $max](https://www.mongodb.com/docs/manual/reference/operator/update/max/)

### `$mul`: multiply the current value

```javascript
db.users.updateOne({ _id: 1 }, { $mul: { price: 1.1 } })
// Mathematical result: price 100 → 110 (10% increase).

db.users.updateOne({ _id: 1 }, { $mul: { price: 0.9 } })
// Independent example: 100 → 90 (10% decrease).
```

If the field is missing, `$mul` creates zero of the multiplier's numeric type; it does not initialize the field to the multiplier. Binary floating-point values can introduce rounding differences; choose numeric types appropriate to your application's precision requirements. [MongoDB: $mul](https://www.mongodb.com/docs/manual/reference/operator/update/mul/)

## 7. Remove and rename fields — lectures 111–112

### `$unset`: remove the key itself

```javascript
db.users.updateOne({ _id: 1 }, { $unset: { temporaryNote: "" } })
// temporaryNote is absent afterward.
```

The value `""` is a placeholder; the operator determines removal. A missing field makes this a no-op. `$set: { temporaryNote: null }` instead keeps the key and stores null.

For a positional array element, `$unset` leaves a null slot rather than shifting the array. Use `$pull` to remove matching array elements. [MongoDB: $unset](https://www.mongodb.com/docs/manual/reference/operator/update/unset/)

### `$rename`: move a value to a new field name

```javascript
db.users.updateOne({ _id: 1 }, { $rename: { loginCount: "signInCount" } })
// loginCount disappears; signInCount becomes 4.
```

The key is the old name; the value is the new name. If the old field is absent, nothing changes. If the destination already exists, it is replaced. `$rename` does not rename fields inside array elements. [MongoDB: $rename](https://www.mongodb.com/docs/manual/reference/operator/update/rename/)

## 8. Upsert: update or insert — lecture 113

**Upsert = update if a match exists; insert if none exists.** It is an option, not a separate `upsert()` method in these examples.

```javascript
// Assume ID 10 does not exist.
db.users.updateOne(
  { _id: 10 },
  { $set: { name: "Dev", active: true } },
  { upsert: true }
)
```

First run inserts `{ _id: 10, name: "Dev", active: true }`. It does not clone Asha's fields or automatically provide age/address/hobbies. Repeating the command matches ID 10 and updates it; unchanged values may produce `modifiedCount: 0`.

With an operator-style upsert, equality fields in the filter can contribute to the inserted document; range conditions are not default field values. `updateMany(..., { upsert: true })` inserts one document when no documents match, not one for every imagined match. Use a unique key/index for identity when concurrent upserts are possible. [MongoDB: upsert behavior](https://www.mongodb.com/docs/manual/reference/method/db.collection.updatemany/)

### Extra useful companion: `$setOnInsert`

```javascript
// Assume ID 11 does not exist.
db.users.updateOne(
  { _id: 11 },
  {
    $set: { name: "Esha", active: true },
    $setOnInsert: { loginCount: 0, createdAt: new Date() }
  },
  { upsert: true }
)
```

`$set` applies on update and insert. `$setOnInsert` applies only when the upsert inserts: later calls do not reset the existing counter or creation date. [MongoDB: $setOnInsert](https://www.mongodb.com/docs/manual/reference/operator/update/setoninsert/)

## 9. Updating array elements — lectures 114–116

Start from Asha's original hobby frequencies:

```javascript
[
  { title: "Sports", frequency: 3 },
  { title: "Reading", frequency: 5 },
  { title: "Cooking", frequency: 1 }
]
```

### Known index: a numeric dotted path

```javascript
db.users.updateOne({ _id: 1 }, { $set: { "hobbies.0.frequency": 4 } })
// First hobby, Sports: 3 → 4.
```

Array indexes start at zero. This targets a position, so it is suitable only when that position is meaningful and known.

### `$`: first element matched by the query — lecture 114

```javascript
db.users.updateOne(
  { _id: 1, "hobbies.title": "Sports" },
  { $set: { "hobbies.$.frequency": 4 } }
)
// Sports: 3 → 4; Reading and Cooking stay unchanged.
```

The query must identify a matching element in the array. `$` is replaced by the position of the first matching element. It does not update every match.

When multiple conditions must refer to one hobby, use query `$elemMatch`:

```javascript
db.users.updateOne(
  { _id: 1, hobbies: { $elemMatch: { title: "Sports", frequency: { $gte: 3 } } } },
  { $set: { "hobbies.$.frequent": true } }
)
// Sports gains frequent: true.
```

Separate dotted predicates can match different elements. Positional `$` also has limitations with multiple arrays, nested-array traversal, and negated predicates; do not use it for an inserting upsert. [MongoDB: positional $ update](https://www.mongodb.com/docs/manual/reference/operator/update/positional/)

### `$[]`: every element in each matched document — lecture 115

```javascript
db.users.updateOne({ _id: 1 }, { $inc: { "hobbies.$[].frequency": 1 } })
// Frequencies [3, 5, 1] → [4, 6, 2].
```

The filter chooses Asha. `$[]` chooses all her hobbies. A filter containing an array condition still does not restrict `$[]` to matching elements: it only chooses documents. [MongoDB: all positional $[]](https://www.mongodb.com/docs/manual/reference/operator/update/positional-all/)

### `$[identifier]` plus `arrayFilters`: every qualifying element — lecture 116

```javascript
db.users.updateMany(
  { active: true },
  { $set: { "hobbies.$[hobby].frequent": true } },
  { arrayFilters: [{ "hobby.frequency": { $gte: 3 } }] }
)
```

**Read it in two stages:** Select active users Asha and Cara; within each, add `frequent: true` only to hobbies with frequency at least 3.

**Expected:** Asha's Sports and Reading change. Cooking does not. Cara's Music does not. Ben is excluded by the document filter. Thus, on the starting dataset, `matchedCount` is 2 and `modifiedCount` is 1, even though two hobby elements change.

The identifier connects the update path to its element filter. It must start with a lowercase letter and contain only alphanumeric characters. `arrayFilters` belongs in the third argument, not the main filter or update document. Matched documents must have an array structure compatible with the update path. [MongoDB: filtered positional updates](https://www.mongodb.com/docs/manual/reference/operator/update/positional-filtered/)

| Path | Which elements? |
|---|---|
| `hobbies.0` | Element at index 0 |
| `hobbies.$` | First element matched by the document query |
| `hobbies.$[]` | Every element in each selected document |
| `hobbies.$[hobby]` | Every element satisfying the corresponding array filter |

## 10. Adding array elements — lecture 117

### `$push`: append one element

```javascript
db.users.updateOne({ _id: 1 }, { $push: { tags: "premium" } })
// ["member", "newsletter"] → ["member", "newsletter", "premium"]
```

Duplicates are allowed. A missing field is created as an array; an existing non-array field produces an error.

### `$each`: append multiple separate elements

```javascript
db.users.updateOne(
  { _id: 1 },
  { $push: { tags: { $each: ["premium", "beta"] } } }
)
// ["member", "newsletter", "premium", "beta"]
```

Without `$each`, `$push: { tags: ["premium", "beta"] }` appends **one nested array**, producing `["member", "newsletter", ["premium", "beta"]]`. [MongoDB: $push](https://www.mongodb.com/docs/manual/reference/operator/update/push/)

### `$position`, `$sort`, and `$slice` modify `$push`

```javascript
db.users.updateOne(
  { _id: 1 },
  { $push: { tags: { $each: ["priority"], $position: 0 } } }
)
// ["priority", "member", "newsletter"]
```

An independent example: add a hobby, rank the stored array, and keep only the three most frequent:

```javascript
db.users.updateOne(
  { _id: 1 },
  { $push: {
      hobbies: {
        $each: [{ title: "Cycling", frequency: 4 }],
        $sort: { frequency: -1 },
        $slice: 3
      }
  } }
)
// hobbies becomes Reading 5, Cycling 4, Sports 3.
// Cooking 1 is removed from the STORED array.
```

With these modifiers, MongoDB adds elements, sorts if requested, then slices, regardless of the modifiers' written order. Positive `$slice` keeps the first N; negative keeps the last N. These operations change the stored array. Section 7's projection `$slice` only trims what is returned. [MongoDB: $push modifiers](https://www.mongodb.com/docs/manual/reference/operator/update/push/)

## 11. Removing array elements — lecture 118

### `$pull`: remove every element matching a condition

```javascript
db.users.updateOne({ _id: 1 }, { $pull: { tags: "newsletter" } })
// tags becomes ["member"].

db.users.updateOne(
  { _id: 1 },
  { $pull: { hobbies: { frequency: { $lt: 3 } } } }
)
// Independent example: Cooking is removed; Sports and Reading remain.
```

For an array of documents, write the condition directly as if each element were a document. Multiple fields in that condition apply to the same candidate element. `$pull` removes all matching elements, not just the first. [MongoDB: $pull](https://www.mongodb.com/docs/manual/reference/operator/update/pull/)

### `$pop`: remove by end position

```javascript
db.users.updateOne({ _id: 1 }, { $pop: { hobbies: -1 } })
// Remove first: Sports. Remaining: Reading, Cooking.

db.users.updateOne({ _id: 1 }, { $pop: { hobbies: 1 } })
// Independent example: remove last, Cooking. Remaining: Sports, Reading.
```

**Memory:** `-1` removes first, `1` removes last. `$pop` does not take a matching condition. [MongoDB: $pop](https://www.mongodb.com/docs/manual/reference/operator/update/pop/)

Removing an array element leaves the containing user document intact. Removing the entire `hobbies` field is a different operation: `$unset`.

## 12. `$addToSet`: add only if absent — lecture 119

```javascript
db.users.updateOne({ _id: 1 }, { $addToSet: { tags: "member" } })
// No change: member already exists.

db.users.updateOne({ _id: 1 }, { $addToSet: { tags: "premium" } })
// Adds premium because it is absent.

db.users.updateOne(
  { _id: 1 },
  { $addToSet: { tags: { $each: ["member", "premium", "beta"] } } }
)
// Independent example: member stays once; premium and beta are added.
```

`$addToSet` prevents adding an equal element; it does not clean up duplicates already present or promise an ordering. With embedded documents, equality depends on the complete document, including field order. `{ title: "Sports", frequency: 4 }` is not equal to the existing Sports hobby with frequency 3. It will not enforce uniqueness by title alone. Without `$each`, an array value is added as one nested-array element. [MongoDB: $addToSet](https://www.mongodb.com/docs/manual/reference/operator/update/addtoset/)

**Choice:** Use `$push` for another event/item even if duplicates are valid. Use `$addToSet` for an element that should be added only when the same value is absent.

## 13. A complete update you should be able to explain

**Requirement:** For active users with at least one hobby practiced three or more times monthly, increment their login counter, record a review date, and flag every qualifying hobby.

```javascript
db.users.updateMany(
  { active: true, hobbies: { $elemMatch: { frequency: { $gte: 3 } } } },
  {
    $inc: { loginCount: 1 },
    $set: {
      reviewedAt: new Date(),
      "hobbies.$[hobby].frequent": true
    }
  },
  { arrayFilters: [{ "hobby.frequency": { $gte: 3 } }] }
)
```

Starting dataset: only Asha qualifies. Her `loginCount` becomes 5; `reviewedAt` is added; Sports and Reading gain `frequent: true`. Cooking, Ben, and Cara do not change.

The outer `$elemMatch` determines whether a user qualifies. `arrayFilters` determines which of that user's hobbies change. The operators target different paths, and the changes within Asha's document are atomic. Repeating this command adds another login count; it is not a command to replay casually.

## 14. Common mistakes and how to recognize them

| Mistake | What happens / what to do |
|---|---|
| Empty filter with updateMany | Every document qualifies; use `{}` only when that is intended |
| Assuming updateOne changes all matches | It changes at most one; use updateMany for all |
| Setting a parent object to change one child | Replaces the parent value; use a dotted path |
| Treating matchedCount as modifiedCount | A matching document can already contain the requested values |
| Counting array edits with modifiedCount | It counts documents, not elements |
| Repeating `$set` keys | JavaScript overwrites an earlier key; merge fields into one `$set` |
| `$set` and `$inc` targeting the same path | Conflicting classic updates; choose the intended operation |
| Expecting `$` to update all matching elements | Use `$[identifier]` with arrayFilters |
| Expecting a query condition to restrict `$[]` | `$[]` updates all elements inside the selected documents |
| Pushing an array without `$each` | Adds a nested array rather than separate values |
| Expecting addToSet to deduplicate by one object property | It compares whole values, not a chosen property |
| Expecting `$min` to enforce a lower bound | It accepts a lower value; `$max` accepts a higher value |
| Treating null as a removed field | Null is still a stored value; `$unset` removes the field |
| Forgetting updates persist | Later examples see earlier writes unless you restore the starting data |

Extra context: classic operator `$set` assigns the supplied value. `{ $set: { copiedName: "$name" } }` stores the literal string `$name`; it does not copy `name`. Field-to-field calculations use update pipelines, a separate syntax beyond these section examples. [MongoDB: update operators and pipelines](https://www.mongodb.com/docs/manual/reference/mql/update/)

## 15. Practice — attempt before checking the answers

Assume the original dataset for each question. These are original exercises for the section's practice theme.

1. Change Asha's city to Chennai while preserving her postcode.
2. Increase loginCount by 2 for every active user. Predict the resulting counters.
3. Remove Asha's temporaryNote field.
4. Flag all hobbies with frequency at least 4 for every user. Predict which elements change.
5. Add premium and beta to Ben's tags only if absent.
6. Remove Asha's hobbies with frequency below 3.
7. Upsert ID 20 with name Farah and initialize loginCount only on insertion.
8. An update sets Ben's active field to false. Why can matchedCount be 1 while modifiedCount is 0?

### Answers

```javascript
// 1: address { city: "Chennai", postcode: "700001" }
db.users.updateOne({ _id: 1 }, { $set: { "address.city": "Chennai" } })

// 2: Asha 6, Ben unchanged at 7, Cara 2
db.users.updateMany({ active: true }, { $inc: { loginCount: 2 } })

// 3: key absent afterward
db.users.updateOne({ _id: 1 }, { $unset: { temporaryNote: "" } })

// 4: Asha's Reading 5 and Ben's Reading 4 gain frequent: true.
// Cara's Music 2 remains unchanged.
db.users.updateMany(
  { hobbies: { $elemMatch: { frequency: { $gte: 4 } } } },
  { $set: { "hobbies.$[hobby].frequent": true } },
  { arrayFilters: [{ "hobby.frequency": { $gte: 4 } }] }
)

// 5: Ben retains member and gains premium and beta.
db.users.updateOne(
  { _id: 2 },
  { $addToSet: { tags: { $each: ["premium", "beta"] } } }
)

// 6: Cooking removed; Sports and Reading remain.
db.users.updateOne({ _id: 1 }, { $pull: { hobbies: { frequency: { $lt: 3 } } } })

// 7: Assume ID 20 absent. First call inserts; subsequent calls preserve loginCount.
db.users.updateOne(
  { _id: 20 },
  { $set: { name: "Farah" }, $setOnInsert: { loginCount: 0 } },
  { upsert: true }
)

// 8: Ben already has active: false. A match is not necessarily a change.
db.users.updateOne({ _id: 2 }, { $set: { active: false } })
```

## 16. Fast revision for your future self — lecture 120

| Requirement | Method/operator |
|---|---|
| Change one matching document | `updateOne()` |
| Change every matching document | `updateMany()` |
| Assign a value | `$set` |
| Increase/decrease a number | `$inc` with positive/negative amount |
| Accept a lower/higher candidate | `$min` / `$max` |
| Multiply a number | `$mul` |
| Remove a field | `$unset` |
| Rename a field | `$rename` |
| Insert if no match exists | Option `{ upsert: true }` |
| Assign insertion-only defaults | `$setOnInsert` |
| Change element at known position | Numeric dotted path, e.g. `.0` |
| Change first element matched by query | Positional `$` |
| Change every array element | `$[]` |
| Change every qualifying array element | `$[identifier]` + `arrayFilters` |
| Append an element | `$push` |
| Append multiple separate elements | `$each` inside `$push` |
| Control inserted position / order / retained size | `$position` / `$sort` / `$slice` inside `$push` |
| Append only if equal element is absent | `$addToSet` |
| Remove elements by condition | `$pull` |
| Remove first/last element | `$pop: -1` / `$pop: 1` |

Before writing an update, answer:

1. Which exact documents should qualify? Preview with `find(filter)` when useful.
2. Am I changing one document or all matches?
3. Am I assigning a value or changing it relative to its current value?
4. Am I replacing an entire nested object or only one child?
5. Which array elements must change: first, all, or filtered?
6. What should happen if no document matches?
7. What happens if I deliberately run this operation twice?
8. What do the write counts and a follow-up read show?

Repeating `$inc` or `$push` usually adds again. Repeating the same `$set` or `$addToSet` usually produces no further change once the desired value exists. This property is called **idempotency**. Distinguish intentional repeated calls from a driver's supported retryable-write mechanism.

**The core memory:** The filter chooses documents. Update operators describe changes. Array placeholders choose elements. Upsert decides what happens when nothing matches.

## 17. Course map and reference use — lecture 121

| Course lecture | Corresponding notes |
|---|---|
| 106: Module Introduction | 1 |
| 107: updateOne, updateMany, set | 3–4 |
| 108: Updating Multiple Fields with set | 4 |
| 109: Incrementing & Decrementing Values | 5 |
| 110: min, max, mul | 6 |
| 111: Getting Rid of Fields | 7 |
| 112: Renaming Fields | 7 |
| 113: Understanding upsert | 8 |
| Assignment 5: Update Operations | Original exercises in 15 |
| 114: Updating Matched Array Elements | 9: `$` |
| 115: Updating All Array Elements | 9: `$[]` |
| 116: Finding & Updating Specific Fields | 9: `$[identifier]` and arrayFilters |
| 117: Adding Elements to Arrays | 10 |
| 118: Removing Elements from Arrays | 11 |
| 119: Understanding addToSet | 12 |
| 120: Wrap Up | 16 |
| 121: Useful Resources & Links | Official references beside each concept |

For a refresher, read sections 1 and 16, then revisit the dataset and the relevant example. When adapting commands to an application, check your driver's syntax and asynchronous behavior. These notes use modern `mongosh` examples; older videos may show different shell output formatting.
