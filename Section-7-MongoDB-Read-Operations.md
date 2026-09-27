# Section 7 — MongoDB Read Operations: A Closer Look

**Purpose:** Understand these notes without reopening the videos, even years later.

**Course:** MongoDB — The Complete Developer's Guide, Academind / Maximilian Schwarzmüller. Aligned with the Section 7 curriculum visible on Udemy: lectures 79–105 and the two practice assignments. These are original explanations and examples, not a lecture transcript or the instructor's assignment solutions.

**Written:** 28 September 2026. Examples use `mongosh` syntax. Server and driver details can change; use the linked MongoDB documentation for your installed version. Expected results below are reasoned from the sample data; they were not executed against a MongoDB server.

## 1. The idea to remember first

A **read operation** asks MongoDB for stored data without changing it.

- **Database:** a named container for collections.
- **Collection:** a group of documents, roughly comparable to a SQL table.
- **Document:** one stored record with named fields; MongoDB stores documents as BSON, a format with types such as numbers, strings, dates, arrays, and embedded documents.
- **Filter:** the conditions deciding which documents qualify.
- **Projection:** the fields or array elements shown in each returned document.
- **Cursor:** an object through which you retrieve a query's results over time.

Read a query in this order:

```javascript
db.collection.find(filter, projection).sort(order).skip(offset).limit(count)
```

**English:** “From this collection, find documents satisfying these conditions, show these fields, put the results in this order, skip this many, and return at most this many.”

This is a conceptual explanation, not a description of the server's physical execution plan. An index can change how the server finds and orders results.

**Keep three questions separate:** Which documents? Which fields? In what order and quantity?

## 2. One dataset for all the examples

Imagine a small TV catalogue. `rating.average` is a nested number. `genres` is an array of strings. `reviews` is an array of documents. `budget` and `revenue` are comparable amounts in the same currency/unit.

To try the examples, connect `mongosh` to a MongoDB server, select the dedicated practice database, and insert this dataset **once**. This setup writes practice data; the later queries only read it. Running the insertion twice causes duplicate `_id` errors.

```javascript
use section7_read_practice

db.shows.insertMany([
  {
    _id: 1, name: "Orbit", runtime: 45, status: "Running",
    rating: { average: 8.5 }, genres: ["Drama", "Sci-Fi"],
    reviews: [
      { user: "Asha", score: 9 },
      { user: "Ben", score: 6 }
    ],
    budget: 100, revenue: 140, website: "https://orbit.example"
  },
  {
    _id: 2, name: "Harbor", runtime: 60, status: "Ended",
    rating: { average: 7.2 }, genres: ["Drama", "Crime"],
    reviews: [
      { user: "Asha", score: 6 },
      { user: "Ben", score: 9 }
    ],
    budget: 100, revenue: 80, website: null
  },
  {
    _id: 3, name: "Laugh Lab", runtime: 25, status: "Running",
    rating: { average: 8.0 }, genres: ["Comedy"],
    reviews: [{ user: "Cara", score: 8 }],
    budget: 50, revenue: 70
  },
  {
    _id: 4, name: "Night Files", runtime: 50, status: "Ended",
    rating: { average: 8.5 }, genres: ["Crime", "Drama"],
    reviews: [
      { user: "Asha", score: 8 },
      { user: "Cara", score: 9 }
    ],
    budget: 120, revenue: 110, website: "https://night.example"
  }
])
```

The examples identify results by `_id`. Unless a query has `.sort()`, the order of those results is not promised.

| ID | Name | Runtime | Rating | Status | Website |
|---|---|---:|---:|---|---|
| 1 | Orbit | 45 | 8.5 | Running | String |
| 2 | Harbor | 60 | 7.2 | Ended | Explicit `null` |
| 3 | Laugh Lab | 25 | 8.0 | Running | Field absent |
| 4 | Night Files | 50 | 8.5 | Ended | String |

## 3. Methods, filters, and operators — lectures 79–83

A **method** is the action, such as `find()`. The **filter document** is its argument. An **operator**, usually beginning with `$`, expresses a condition or transformation.

```javascript
db.shows.find({ runtime: { $gt: 45 } })
```

Here `find` is the method, the whole `{ runtime: ... }` is the filter, and `$gt` means “greater than.” Expected IDs: **2, 4**.

### `findOne()` versus `find()`

```javascript
db.shows.findOne({ _id: 1 }) // One document: Orbit
db.shows.findOne({ _id: 99 }) // null: no match
db.shows.find({ status: "Running" }) // Cursor for IDs 1 and 3
db.shows.find({}) // Cursor for all four documents
```

`findOne()` returns one matching document or `null`. `find()` returns a cursor, even if zero or one document matches. A cursor with zero results is not `null`. An empty filter `{}` imposes no restrictions. “One result” does not mean “the best result”: if several documents qualify, specify an ordering when the choice matters. [MongoDB: findOne](https://www.mongodb.com/docs/manual/reference/method/db.collection.findone/)

**Query selectors** appear in the filter and choose documents. **Projection operators** appear in the projection and shape returned data. Some names, such as `$elemMatch`, exist in both contexts with different jobs.

## 4. Comparison operators — lecture 84

| Operator | Meaning | Example filter | Expected IDs |
|---|---|---|---|
| `$eq` | Equal | `{ runtime: { $eq: 45 } }` | 1 |
| `$ne` | Not equal | `{ runtime: { $ne: 45 } }` | 2, 3, 4 |
| `$gt` | Greater than | `{ runtime: { $gt: 45 } }` | 2, 4 |
| `$gte` | Greater than or equal | `{ runtime: { $gte: 45 } }` | 1, 2, 4 |
| `$lt` | Less than | `{ runtime: { $lt: 45 } }` | 3 |
| `$lte` | Less than or equal | `{ runtime: { $lte: 45 } }` | 1, 3 |

These examples compare numeric fields to numeric values. [MongoDB: query operators](https://www.mongodb.com/docs/manual/reference/mql/query-predicates/)

Equality has a shorter form. A range can combine operators on one field:

```javascript
db.shows.find({ runtime: 45 }) // Same equality condition as $eq
db.shows.find({ runtime: { $gte: 45, $lt: 60 } }) // IDs 1, 4
```

**Boundary memory:** `$gt` excludes the boundary; `$gte` includes it. Likewise for `$lt` and `$lte`.

**Missing-field trap:** `$ne: 45` also accepts a document with no `runtime` field. If you require a recorded runtime, add `$exists: true`. `$ne: null` has special null/missing semantics, discussed below. [MongoDB: $ne](https://www.mongodb.com/docs/manual/reference/operator/query/ne/)

## 5. Nested fields and basic arrays — lectures 85–86

### Dot notation reaches inside documents

```javascript
db.shows.find({ "rating.average": { $gte: 8 } }) // IDs 1, 3, 4
```

The quotes are necessary around a dotted field path. This checks `average` inside `rating`. Matching an entire embedded document instead can depend on its exact contents and field order, so use a dotted path when you mean one nested field. [MongoDB: embedded-document queries](https://www.mongodb.com/docs/manual/tutorial/query-embedded-documents/)

### A scalar condition on an array tests membership

```javascript
db.shows.find({ genres: "Drama" }) // IDs 1, 2, 4
```

English: “The genres array contains Drama.” The returned document still contains its full genres array.

### `$in` means any allowed value; `$nin` excludes all listed values

```javascript
db.shows.find({ runtime: { $in: [25, 45] } }) // IDs 1, 3
db.shows.find({ genres: { $in: ["Comedy", "Sci-Fi"] } }) // IDs 1, 3
db.shows.find({ genres: { $nin: ["Crime", "Comedy"] } }) // ID 1
```

For an array field, `$in` accepts a document if an element matches a listed value. `$nin` requires none of its elements to match; it also accepts a missing field. Add `$exists: true` if absence should be excluded. [MongoDB: $in](https://www.mongodb.com/docs/manual/reference/operator/query/in/), [MongoDB: $nin](https://www.mongodb.com/docs/manual/reference/operator/query/nin/)

## 6. Logical operators — lectures 87–89

Top-level logical operators combine **complete filter clauses** in an array.

```javascript
// Running OR rated at least 8.5: IDs 1, 3, 4
db.shows.find({
  $or: [{ status: "Running" }, { "rating.average": { $gte: 8.5 } }]
})

// Neither Running NOR rated at least 8.5: ID 2
db.shows.find({
  $nor: [{ status: "Running" }, { "rating.average": { $gte: 8.5 } }]
})

// Running AND runtime at least 40: ID 1
db.shows.find({
  $and: [{ status: "Running" }, { runtime: { $gte: 40 } }]
})
```

Different fields in the same filter already mean AND:

```javascript
db.shows.find({ status: "Running", runtime: { $gte: 40 } }) // ID 1
```

Use explicit `$and` when clauses cannot safely share one object, for example two separate `$or` groups. Never repeat a key in a JavaScript object: a later key overwrites the earlier one.

```javascript
// WRONG: the first runtime condition is overwritten before MongoDB sees it.
// { runtime: { $gte: 45 }, runtime: { $lt: 60 } }

// RIGHT:
{ runtime: { $gte: 45, $lt: 60 } }
```

`$or` = at least one clause matches. `$and` = every clause matches. `$nor` = no clause matches. [MongoDB: logical operators](https://www.mongodb.com/docs/manual/reference/mql/query-predicates/logical/)

### `$not` sits inside a field condition

```javascript
db.shows.find({ runtime: { $not: { $gt: 45 } } }) // IDs 1, 3
```

English: “The runtime condition ‘greater than 45’ does not match.” A document missing `runtime` also qualifies. Therefore this is not generally equivalent to `$lte: 45`. Negation over arrays can be surprising; express the intended array condition explicitly. [MongoDB: $not](https://www.mongodb.com/docs/manual/reference/operator/query/not/)

## 7. Existence, null, and types — lectures 90–91

**Missing** means the key is absent. **Null** means the key exists and explicitly stores `null`. An empty string is a third, different value.

| Filter | Meaning on this scalar website field | Expected IDs |
|---|---|---|
| `{ website: { $exists: true } }` | Key exists, including null | 1, 2, 4 |
| `{ website: { $exists: false } }` | Key absent | 3 |
| `{ website: null }` | Null OR absent | 2, 3 |
| `{ website: { $type: "null" } }` | Explicit null | 2 |
| `{ website: { $ne: null } }` | Exists and is non-null | 1, 4 |
| `{ website: { $type: "string" } }` | Stored string | 1, 4 |

`$exists` tests presence, not whether a value is useful. `{ website: { $exists: true, $ne: null } }` is an explicit way to ask for a present non-null value. [MongoDB: $exists](https://www.mongodb.com/docs/manual/reference/operator/query/exists/), [MongoDB: null queries](https://www.mongodb.com/docs/manual/tutorial/query-for-null-fields/)

`$type` tests BSON types. Prefer readable aliases such as `"string"`, `"date"`, `"array"`, or `"number"`; `"number"` covers numeric BSON types. `"45"` is a string and `45` is a number. Query `$type` can inspect array elements for many requested types; `$type: "array"` checks the field itself for an array. [MongoDB: $type](https://www.mongodb.com/docs/manual/reference/operator/query/type/)

## 8. Evaluation operators — lectures 92–93

### `$regex`: match a text pattern

```javascript
db.shows.find({ name: { $regex: "^o", $options: "i" } }) // ID 1
db.shows.find({ name: /Lab$/ }) // ID 3
```

`^` anchors the start, `$` anchors the end, and option `i` ignores letter case. The first query means “name starts with o, in either case”; the second means “name ends with Lab.” An unanchored pattern can match in the middle. Regex metacharacters have special meaning, so escape them when the intention is literal user text. Index usefulness depends on the pattern and options. [MongoDB: $regex](https://www.mongodb.com/docs/manual/reference/operator/query/regex/)

### `$expr`: compare fields or calculate a condition

```javascript
db.shows.find({ $expr: { $gt: ["$revenue", "$budget"] } }) // IDs 1, 3
```

English: “For each document, revenue is greater than budget.” Inside an expression, `"$revenue"` refers to that document's field. `"revenue"` without the `$` is a literal string.

Contrast the two grammars:

```javascript
{ revenue: { $gt: 100 } } // Ordinary filter: field versus fixed value
{ $expr: { $gt: ["$revenue", "$budget"] } } // Expression: two operands
```

A conditional calculation can also be used:

```javascript
// If budget is at least 100, compare revenue with 90% of budget;
// otherwise compare revenue with the full budget. IDs 1, 3, 4.
db.shows.find({
  $expr: {
    $gt: [
      "$revenue",
      { $cond: {
          if: { $gte: ["$budget", 100] },
          then: { $multiply: ["$budget", 0.9] },
          else: "$budget"
      } }
    ]
  }
})
```

`$cond` means if/then/else. The calculation only decides whether a document matches; it does not rewrite `budget` or add a calculated result field. [MongoDB: $expr](https://www.mongodb.com/docs/manual/reference/operator/query/expr/)

## 9. Deeper array queries — lectures 94–97

### Contains versus exact array equality

```javascript
db.shows.find({ genres: "Drama" }) // Contains Drama: IDs 1, 2, 4
db.shows.find({ genres: ["Drama", "Crime"] }) // Exact array: ID 2
db.shows.find({ "genres.0": "Drama" }) // First element: IDs 1, 2
```

An array literal asks for exact array equality, including order and length. ID 4 has the same two genres in the opposite order, so it fails that equality test. Array indexes are zero-based: `.0` means the first element. [MongoDB: querying arrays](https://www.mongodb.com/docs/manual/tutorial/query-arrays/)

### `$size`: exact number of elements

```javascript
db.shows.find({ genres: { $size: 2 } }) // IDs 1, 2, 4
```

`$size: 2` means exactly two array elements. Query `$size` takes a number, not a range such as `{ $gt: 2 }`. For frequent length-range searches, consider storing an array count; expression-based length checks require handling non-arrays. [MongoDB: $size](https://www.mongodb.com/docs/manual/reference/operator/query/size/)

### `$all`: contains every requested value

```javascript
db.shows.find({ genres: { $all: ["Drama", "Crime"] } }) // IDs 2, 4
```

Order does not matter and additional elements are allowed. `$in` is “any listed value”; `$all` is “every listed value.” [MongoDB: $all](https://www.mongodb.com/docs/manual/reference/operator/query/all/)

### `$elemMatch`: one element must satisfy all conditions

This is the central array distinction:

```javascript
// Asha appears somewhere, and a score >= 8 appears somewhere.
db.shows.find({ "reviews.user": "Asha", "reviews.score": { $gte: 8 } })
// IDs 1, 2, 4

// The SAME review must be by Asha AND have score >= 8.
db.shows.find({
  reviews: { $elemMatch: { user: "Asha", score: { $gte: 8 } } }
})
// IDs 1, 4
```

Harbor (ID 2) demonstrates the trap: Asha gave 6, while Ben gave 9. Separate dotted conditions can use different reviews; `$elemMatch` binds the conditions to one review.

For a numeric array `[2, 12]`, `{ values: { $gt: 5, $lt: 10 } }` can match using different elements. `{ values: { $elemMatch: { $gt: 5, $lt: 10 } } }` does not match: no single number is between 5 and 10.

**Memory:** “Same element” → `$elemMatch`. Its query form chooses documents and leaves the returned array intact. [MongoDB: query $elemMatch](https://www.mongodb.com/docs/manual/reference/operator/query/elemmatch/)

## 10. Cursors — lectures 98–99

A cursor is like a bookmark through the result stream, not an array containing every result. MongoDB can send results in batches; the shell displaying some documents does not mean those are all the matches.

```javascript
const cursor = db.shows.find({ status: "Running" }).sort({ _id: 1 })
cursor.hasNext() // Is another document available?
cursor.next()    // Retrieves and advances past the next document
```

Ways to consume a fresh cursor:

```javascript
db.shows.find({}).sort({ _id: 1 }).forEach(doc => print(doc.name))
// Orbit, Harbor, Laugh Lab, Night Files

const results = db.shows.find({}).sort({ _id: 1 }).toArray()
// A JavaScript array containing the four documents
```

Iteration advances the cursor. If you already retrieved one document, `toArray()` collects the remaining results, not automatically the original full set. Make a fresh `find()` when you want to restart. `toArray()` is convenient for small data, but loads the remaining results into client memory. Configure sorting and pagination before consuming a cursor. Driver syntax, including `await`, differs from shell syntax. [MongoDB: read with mongosh](https://www.mongodb.com/docs/mongodb-shell/crud/read/)

## 11. Sort, skip, and limit — lectures 100–101

### Sort: choose the order

```javascript
db.shows.find({}).sort({ runtime: 1 }) // IDs 3, 1, 4, 2
db.shows.find({}).sort({ "rating.average": -1, _id: 1 }) // IDs 1, 4, 3, 2
```

`1` means ascending; `-1` means descending. In a compound sort, the first field is primary and later fields break ties. Orbit and Night Files both score 8.5; `_id: 1` puts Orbit first. A unique tie-breaker makes ordering repeatable for unchanged data. Without sorting, do not assume insertion order. [MongoDB: cursor.sort](https://www.mongodb.com/docs/manual/reference/method/cursor.sort/)

### Pagination: skip an offset, then take a limited number

```javascript
db.shows.find({})
  .sort({ "rating.average": -1, _id: 1 })
  .skip(2)
  .limit(2)
// IDs 3, 2: second page, two items per page
```

For page numbers starting at 1: **offset = (page − 1) × pageSize**. `limit(2)` means at most two documents, not exactly two. `limit(0)` means no limit. The server applies skip before limit regardless of their chaining order, but writing sort → skip → limit makes the intention clearer. [MongoDB: cursor.skip](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/), [MongoDB: cursor.limit](https://www.mongodb.com/docs/manual/reference/method/cursor.limit/)

Large offsets become costly because the server must pass over earlier results. For large sequential listings, a range query can use the last seen sort key:

```javascript
// Additional practical pattern: continue after ID 2 in ascending ID order.
db.shows.find({ _id: { $gt: 2 } }).sort({ _id: 1 }).limit(2)
// IDs 3, 4
```

This simple example uses a unique numeric key. A compound ordering needs a corresponding compound continuation condition. Inserts or updates between page requests can change page contents; stable sorting alone does not freeze the dataset. [MongoDB: pagination with skip and ranges](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/)

## 12. Projection — lecture 102

Projection changes the returned view, not the stored document.

```javascript
db.shows.find({ _id: 1 }, { _id: 0, name: 1, "rating.average": 1 })
// { name: "Orbit", rating: { average: 8.5 } }

db.shows.find({ _id: 1 }, { reviews: 0, website: 0 })
// All stored fields except reviews and website; _id remains.
```

For ordinary field inclusion/exclusion, choose one mode: `1` includes specified fields; `0` excludes specified fields. `_id` is included by default and can be excluded from an inclusion projection. `{ name: 1, reviews: 0 }` is invalid mixing; `{ name: 1, _id: 0 }` is valid. [MongoDB: project fields](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)

**Context matters:** `1` in `.sort()` means ascending; `1` in projection means include. These are unrelated meanings.

## 13. Array projection — lectures 103–104

Filtering by an array element does not automatically remove other elements from the returned array. Use projection when you want a smaller returned array.

### Positional `$`: first array element matching the query

```javascript
db.shows.find(
  { _id: 1, genres: "Sci-Fi" },
  { _id: 0, name: 1, "genres.$": 1 }
)
// { name: "Orbit", genres: ["Sci-Fi"] }
```

This connects the projected array element to the query condition. It returns one matching element, not all matches. Keep positional projection simple: only one positional `$` in the projection; multiple array conditions can create ambiguous/unsupported behavior. [MongoDB: positional projection](https://www.mongodb.com/docs/manual/reference/operator/projection/positional/)

### Projection `$elemMatch`: first element matching its own condition

```javascript
db.shows.find(
  { _id: 1 },
  { _id: 0, name: 1, reviews: { $elemMatch: { score: { $gte: 8 } } } }
)
// { name: "Orbit", reviews: [{ user: "Asha", score: 9 }] }
```

The condition lives in the projection. If no array element matches, the document can still be returned, with that array field omitted. Query `$elemMatch` decides whether a document qualifies; projection `$elemMatch` chooses the first qualifying array element to show. To return every matching element, use an aggregation `$filter` expression, a topic beyond this section. [MongoDB: projection $elemMatch](https://www.mongodb.com/docs/manual/reference/operator/projection/elemmatch/)

### `$slice`: choose elements by position

```javascript
db.shows.find({ _id: 1 }, { _id: 0, name: 1, reviews: { $slice: 1 } })
// reviews: [{ user: "Asha", score: 9 }] — first one

db.shows.find({ _id: 1 }, { _id: 0, name: 1, reviews: { $slice: -1 } })
// reviews: [{ user: "Ben", score: 6 }] — last one

db.shows.find({ _id: 1 }, { _id: 0, name: 1, reviews: { $slice: [1, 1] } })
// reviews: [{ user: "Ben", score: 6 }] — skip one, take one
```

The two-number form is `[skip, count]`, with a positive count. `$slice` works on stored array positions, not score rankings. `.limit(1)` limits documents; `$slice: 1` limits elements within each returned array. These explicit inclusion projections also restrict output to `name` and `reviews`; do not assume a standalone `$slice` projection always excludes other fields. [MongoDB: projection $slice](https://www.mongodb.com/docs/manual/reference/operator/projection/slice/)

## 14. A complete query you should be able to explain

**Requirement:** Find ended shows with both Crime and Drama genres and a rating of at least 8. Show only their names and ratings, highest rated first, and return at most five.

```javascript
db.shows.find(
  {
    status: "Ended",
    genres: { $all: ["Crime", "Drama"] },
    "rating.average": { $gte: 8 }
  },
  { _id: 0, name: 1, "rating.average": 1 }
)
.sort({ "rating.average": -1, _id: 1 })
.limit(5)
```

Expected result: `{ name: "Night Files", rating: { average: 8.5 } }`.

The filter's three fields mean AND. `$all` requires both genres. Projection hides everything except the named fields. Sorting can use `_id` even though `_id` is omitted from the returned view. The limit is a ceiling.

## 15. Practice — attempt before checking the answers

These are original exercises for the section's two practice themes.

1. Find running shows rated at least 8. Return names only, alphabetically.
2. Find shows with no website field. Do not include explicit null.
3. Find shows where Asha herself gave a score of at least 8.
4. Find shows containing both Drama and Crime, regardless of order.
5. Return the second page of two shows, ordered by descending runtime.
6. Return all show names, with only the first review scoring at least 9 when one exists. Predict the output for Laugh Lab.

### Answers

```javascript
// 1: Laugh Lab, Orbit
db.shows.find(
  { status: "Running", "rating.average": { $gte: 8 } },
  { _id: 0, name: 1 }
).sort({ name: 1, _id: 1 })

// 2: ID 3
db.shows.find({ website: { $exists: false } })

// 3: IDs 1, 4
db.shows.find({
  reviews: { $elemMatch: { user: "Asha", score: { $gte: 8 } } }
})

// 4: IDs 2, 4
db.shows.find({ genres: { $all: ["Drama", "Crime"] } })

// 5: IDs 1, 3 (complete ordering is 2, 4, 1, 3)
db.shows.find({}).sort({ runtime: -1, _id: 1 }).skip(2).limit(2)

// 6: All four documents; Laugh Lab is { name: "Laugh Lab" }.
// Its reviews field is omitted because no review reaches 9.
db.shows.find(
  {},
  { _id: 0, name: 1, reviews: { $elemMatch: { score: { $gte: 9 } } } }
).sort({ _id: 1 })
```

## 16. Fast revision for your future self

| If the requirement says… | Reach for… |
|---|---|
| One document | `findOne()` |
| All matching documents | `find()` and consume its cursor |
| Greater/less/equal | `$gt`, `$gte`, `$lt`, `$lte`, `$eq`, `$ne` |
| Any allowed value | `$in` |
| None of these values | `$nin`; decide how missing fields should behave |
| Either condition | `$or` |
| Every condition | Implicit AND or `$and` |
| Neither condition | `$nor` |
| Invert a field predicate | Field-level `$not` |
| Nested field | Quoted dot path |
| Field exists | `$exists` |
| Stored type | `$type` |
| Text pattern | `$regex` |
| Compare two fields | `$expr` with field references |
| Exact array length | Query `$size` |
| Array contains every value | `$all` |
| Same array element meets all conditions | Query `$elemMatch` |
| Fields to display | Projection, the second `find()` argument |
| First matching array element | Projection `$` or `$elemMatch` |
| First/last/position-based array portion | Projection `$slice` |
| Result order | `.sort()` plus a unique tie-breaker |
| Result page | `.skip()` and `.limit()` |

Before trusting a query, ask:

1. Are my values the correct types, especially numbers versus strings?
2. Should missing fields or explicit null qualify?
3. Must array conditions refer to the same element?
4. Am I selecting documents or shaping the returned data?
5. Does the ordering have a unique tie-breaker?
6. Am I accidentally overwriting duplicate object keys?
7. Am I materializing too much data with `toArray()`?

**The core memory:** A filter chooses documents. A projection chooses what you see. A cursor lets you consume results. Array conditions need special care when you mean the same element.

## 17. Course map and reference use — lecture 105

| Course lectures | Corresponding notes |
|---|---|
| 79–82: introduction, methods, operator overview, selectors/projections | 1–3 |
| 83: findOne/find | 3 |
| 84: comparisons | 4 |
| 85–86: embedded fields, arrays, in/nin | 5 |
| 87–89: or/nor, and, not | 6 |
| 90–91: element operators and type | 7 |
| 92–93: regex and expr | 8 |
| 94–97: deeper arrays, size, all, elemMatch | 9 |
| 98–99: cursors | 10 |
| 100–101: sorting and pagination | 11 |
| 102: projection | 12 |
| 103–104: array projection and slice | 13 |
| Two practice assignments | Original exercises in 15 |
| 105: useful resources and links | Documentation linked next to each concept |

In the future, first reread the dataset and sections 1 and 16. Then open the relevant detailed section. When adapting an example to an application, check the driver documentation for cursor consumption and asynchronous syntax, and the server documentation for your MongoDB version.
