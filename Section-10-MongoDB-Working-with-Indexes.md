# Section 10 — MongoDB: Working with Indexes

**Purpose:** Understand these notes years later without reopening the videos.

**Course:** MongoDB — The Complete Developer's Guide, Academind / Maximilian Schwarzmüller. Covers the verified Section 10 curriculum: lectures 126–149.

**Source transparency:** I inspected the course's lecture list and a frame of its introductory video. I attempted to open the transcript, but the player did not expose a usable transcript. I did not watch all lectures or read their full transcripts. These are original, curriculum-aligned explanations checked against MongoDB's official documentation, not a transcription of the instructor's examples.

**Written:** 28 September 2026. Examples use `mongosh`. Expected query results are reasoned from the dataset; no MongoDB server was used to execute them. Explain plans, timings, and planner choices vary with server version, data distribution, and available indexes. No performance numbers below are claimed as measurements.

## 1. What problem does an index solve? — lectures 126–127

Imagine a book with 100,000 pages. To find every mention of “Kolkata,” you could read every page. A book index instead tells you where that word occurs.

A MongoDB **index** is an additional data structure storing selected field values and references to their documents. It can let the server find relevant records without examining the whole collection.

- **Collection scan:** inspect documents directly to find matches.
- **Index scan:** traverse index entries to locate candidates.
- **Fetch:** retrieve full documents when the index does not contain everything needed.

An index is not a second copy of the full collection. Ordinary ordered indexes use a B-tree structure. [MongoDB: indexes](https://www.mongodb.com/docs/manual/indexes/)

**The lasting idea:** Design an index for a recurring query, including its filter, sort, and returned fields. “This field is important” is not enough to justify an index.

## 2. A small, shared dataset

Use a dedicated practice database. Insert these records once; repeating insertion with the same IDs causes duplicate-key errors.

```javascript
use section10_index_practice

db.users.insertMany([
  { _id: 1, name: "Asha", age: 28, city: "Kolkata", active: true,
    email: "asha@example.test", hobbies: ["Reading", "Sports"] },
  { _id: 2, name: "Ben", age: 35, city: "Mumbai", active: false,
    email: "ben@example.test", hobbies: ["Reading"] },
  { _id: 3, name: "Cara", age: 22, city: "Kolkata", active: true,
    email: "cara@example.test", hobbies: ["Music", "Sports"] },
  { _id: 4, name: "Dev", age: 42, city: "Delhi", active: true,
    hobbies: ["Cooking"] },
  { _id: 5, name: "Esha", age: 31, city: "Kolkata", active: false,
    hobbies: ["Reading", "Music"] }
])
```

Five documents are enough to understand correctness, but not enough to prove a useful performance improvement. The planner may reasonably choose a collection scan on tiny datasets.

Examples in the following sections introduce different indexes. For a meaningful before/after comparison, inspect `getIndexes()` and explicitly keep track of which indexes already exist. Later indexes can change earlier queries' plans.

## 3. Create, inspect, and remove an index — lecture 128

```javascript
// Before: examine the plan with whatever indexes currently exist.
db.users.find({ age: { $gte: 30 } }).explain("executionStats")

// Create an ascending index on age.
db.users.createIndex({ age: 1 }, { name: "age_asc" })

// Same query after index creation: still returns IDs 2, 4, 5.
db.users.find({ age: { $gte: 30 } }).explain("executionStats")

db.users.getIndexes()

// Optional practice cleanup: removes this index, not the documents.
db.users.dropIndex("age_asc")
```

`1` is ascending index order; `-1` is descending. An ordinary single-field ordered index can be traversed in either direction. Creating an index does not change the logical result set or promise that MongoDB will use it. [MongoDB: single-field indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-single/)

**Do not confuse contexts:** `1` in a projection means include; `1` in an index specification means ascending order.

## 4. Behind the scenes and practical restrictions — lectures 129–130

A simplified age index for the dataset is:

| Ordered age | Referenced user |
|---:|---|
| 22 | Cara |
| 28 | Asha |
| 31 | Esha |
| 35 | Ben |
| 42 | Dev |

For `age >= 30`, the server can seek to the relevant part of the index and scan onward. If it must return the full user, it still retrieves documents.

**Indexes have costs:** storage, memory pressure, and extra maintenance during inserts, deletes, and updates to indexed values. A query returning most of a collection may gain little from an index; reading many index entries and fetching many records can be more work than a collection scan. [MongoDB: index costs](https://www.mongodb.com/docs/manual/indexes/)

**Selectivity** means how strongly a condition narrows the candidates. In a large collection, a unique email lookup is usually selective; a boolean condition matching 95% of records usually is not.

Ask “Does this index reduce work for our important queries?” rather than “Did an IXSCAN appear?”

## 5. Compound indexes and field order — lecture 131

A compound index stores ordered combinations of fields:

```javascript
db.users.createIndex({ city: 1, age: 1 }, { name: "city_age" })
```

Imagine a directory organized first by city, then by age within each city.

| Query shape | How the index relates to it |
|---|---|
| `{ city: "Kolkata" }` | Uses the leading city prefix |
| `{ city: "Kolkata", age: { $gte: 25 } }` | Narrows within one city |
| `{ age: { $gte: 25 } }` | No leading city condition; generally less efficient for this purpose |

The useful **prefixes** of `{ city: 1, age: 1, name: 1 }` are city; city+age; city+age+name. An index on city+age is not interchangeable with age+city. Omitting the leading field does not make index use categorically impossible, but it can prevent a tightly bounded scan. [MongoDB: compound indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/)

### A practical starting guideline: Equality → Sort → Range

For a query with an equality condition, a requested ordering, and a range condition, **ESR** is a useful starting point:

```javascript
// Equality: city. Sort: name. Range: age.
db.users.find({ city: "Kolkata", age: { $gte: 25 } })
  .sort({ name: 1 })

db.users.createIndex({ city: 1, name: 1, age: 1 }, { name: "city_name_age" })
```

Expected names: Asha, Esha. ESR favors avoiding a separate sort. A very selective range may justify putting Range before Sort and accepting a sort step. Measure the actual workload; this is a guideline, not a guarantee of the best plan. [MongoDB: ESR guideline](https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/)

## 6. Using indexes for sorting — lecture 132

```javascript
db.users.find({ city: "Kolkata" }).sort({ age: 1 })
// With city_age: Cara 22, Asha 28, Esha 31.
```

The equality filter selects one city; the entries within it are already age-ordered. This can avoid a separate blocking sort. Sorting by age alone across all cities is not the same ordering.

For a compound ordering `{ city: 1, age: -1 }`, the exact ordering or its full reverse `{ city: -1, age: 1 }` can be supported. Reversing only one direction is a different ordering.

A sort on a later index field generally requires equality conditions on the preceding fields. Look for a separate `SORT` stage when diagnosing whether the index supplied the requested order. Add a unique tie-breaker when stable page ordering matters. [MongoDB: indexes and sorting](https://www.mongodb.com/docs/manual/tutorial/sort-results-with-indexes/)

## 7. The default `_id` index — lecture 133

Ordinary collections have a unique `_id` index, commonly named `_id_`. It supports lookups such as:

```javascript
db.users.findOne({ _id: 3 }) // Cara
```

That index does not automatically optimize filtering by age, email, or city. It cannot normally be dropped. Sharded and specialized collection types have additional rules; these notes' examples use a normal unsharded collection. [MongoDB: default index](https://www.mongodb.com/docs/manual/indexes/)

## 8. Configuring indexes: uniqueness and sparse behavior — lecture 134

### A unique index is a constraint as well as an access path

```javascript
// Example on a separate collection whose records all have distinct emails:
db.accounts.createIndex({ email: 1 }, { unique: true, name: "unique_email" })
```

Subsequent writes that produce duplicate indexed keys fail. Building a unique index also fails if existing data already violates it. For a compound unique index, the **combination** must be unique; individual fields may repeat.

A normal single-field unique index treats missing/null values as a null index key, so multiple records with no email can prevent its creation. Our users have two missing emails, making a plain unique email index unsuitable as written. [MongoDB: unique indexes](https://www.mongodb.com/docs/manual/core/index-unique/)

### Sparse index: omit documents missing the indexed field

```javascript
db.users.createIndex(
  { email: 1 },
  { unique: true, sparse: true, name: "unique_email_when_present" }
)
```

For this single-field index, documents without email are omitted. A present `email: null` is still indexed; sparse does not mean “ignore null.” A sparse index may be unsuitable for a query requiring omitted records. Partial indexes offer a more explicit subset condition. [MongoDB: sparse indexes](https://www.mongodb.com/docs/manual/core/index-sparse/)

## 9. Partial indexes — lectures 135–136

A partial index stores entries only for documents satisfying a specified filter:

```javascript
db.users.createIndex(
  { age: 1 },
  { name: "active_age", partialFilterExpression: { active: true } }
)
```

Only Asha, Cara, and Dev enter this index. A suitable query includes the same subset restriction:

```javascript
db.users.find({ active: true, age: { $gte: 25 } }) // Asha, Dev
```

`{ age: { $gte: 25 } }` alone also needs inactive Ben and Esha, so this partial index cannot supply all required results. The query must imply the partial condition; the exact condition can be stronger, rather than textually identical.

Partial uniqueness applies only to included records. For example, a unique email index with `partialFilterExpression: { email: { $type: "string" } }` enforces uniqueness among string-email records while omitting absent and null emails. Partial filtering controls **index membership**, not access permissions. Not every query operator is supported in a partial filter; check the server-version reference. [MongoDB: partial indexes](https://www.mongodb.com/docs/manual/core/index-partial/)

## 10. TTL indexes: automatic expiration — lecture 137

**TTL** means Time To Live. This index causes expired documents to be deleted automatically. Use a separate practice collection for the example:

```javascript
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600, name: "expire_after_hour" }
)

db.sessions.insertOne({ userId: 1, createdAt: new Date() })
```

The session becomes eligible for deletion one hour after its stored BSON date. Deletion runs asynchronously; eligibility time is not a promise of deletion at that exact second. The whole session document is deleted, not only `createdAt`.

For an explicit per-document expiration timestamp:

```javascript
// Separate alternative collection:
db.expiringSessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.expiringSessions.insertOne({ userId: 1, expiresAt: new Date("2030-01-01T00:00:00Z") })
```

Ordinary TTL indexes are single-field indexes using dates, not compound indexes. A date-looking string is not a BSON date. Documents lacking a suitable date do not expire through that field. TTL is cleanup; for time-sensitive authorization, check expiration in application logic too. [MongoDB: TTL indexes](https://www.mongodb.com/docs/manual/core/index-ttl/)

## 11. Explain: diagnose actual query work — lecture 138

```javascript
db.users.find({ city: "Kolkata", age: { $gte: 25 } })
  .explain("executionStats")
```

| Explain detail | What to ask |
|---|---|
| `nReturned` | How many documents came back? |
| `totalKeysExamined` | How many index entries were inspected? |
| `totalDocsExamined` | How many documents were inspected? |
| `executionTimeMillis` | How long did this execution report? |
| Winning plan / index name | Which strategy and index were selected? |
| `COLLSCAN` | Did the plan scan collection documents? |
| `IXSCAN` | Did it scan an index? |
| `FETCH` | Did it retrieve documents beyond index entries? |
| `SORT` | Was a separate sort needed? |

For selective queries, examined counts close to returned counts are often encouraging. A low document count with an enormous key scan still deserves investigation. Timings on tiny examples are noisy. Stage layouts differ between execution engines and versions; inspect the full plan tree rather than one assumed JSON path. [MongoDB: explain results](https://www.mongodb.com/docs/manual/reference/explain-results/)

## 12. Covered queries — lecture 139

A **covered query** can answer the filter and projection from index data without fetching collection documents.

```javascript
db.users.createIndex({ city: 1, name: 1 }, { name: "city_name" })

db.users.find(
  { city: "Kolkata" },
  { _id: 0, city: 1, name: 1 }
).explain("executionStats")
```

Both needed fields are indexed. `_id: 0` matters because `_id` would otherwise be returned, and this secondary index does not include it as a queryable indexed field. A covering plan should avoid fetching documents and report `totalDocsExamined: 0`.

Adding `age: 1` to the projection makes this particular index insufficient for coverage. Merely seeing `IXSCAN` does not establish coverage. There are additional restrictions for null predicates, multikey indexes, and sharded queries. [MongoDB: covered queries](https://www.mongodb.com/docs/manual/core/query-optimization/)

## 13. Query planning and rejected plans — lecture 140

Several indexes may be candidates for the same query. MongoDB's planner compares possible strategies and selects a winning plan; other candidates may appear as rejected plans.

```javascript
db.users.find({ city: "Kolkata", age: { $gte: 25 } })
  .explain("allPlansExecution")
```

The candidate statistics reflect the plan-selection trial, not necessarily full execution of every alternative. A rejected plan is not a broken index; it lost for that query and environment. Changing the dataset or indexes can change the winner.

MongoDB also caches plans for query shapes. `explain()` ignores existing plan-cache entries and does not create a new cached entry, so its output is not direct proof of the plan currently cached for normal application requests. Use it alongside real workload evidence. [MongoDB: query plans](https://www.mongodb.com/docs/manual/core/query-plans/)

For a controlled comparison, a hint can request an index:

```javascript
db.users.find({ city: "Kolkata", age: { $gte: 25 } })
  .hint("city_age").explain("executionStats")
```

A hint is an experiment, not evidence that the forced plan is best.

## 14. Multikey indexes: indexing arrays — lecture 141

```javascript
db.users.createIndex({ hobbies: 1 }, { name: "hobbies_idx" })
db.users.find({ hobbies: "Sports" }) // IDs 1, 3
```

MongoDB automatically makes an index multikey when it indexes array data; there is no separate `multikey: true` creation option. Conceptually, several element values can point to the same document. Array membership searches can then use those entries.

A compound multikey index cannot index two array-valued fields in the same document as parallel arrays. Scalar+array combinations are common, for example `{ city: 1, hobbies: 1 }`. Multikey coverage and sorting have restrictions; returning the array itself is not a simple covered-query case. `$elemMatch` remains important for correctness and for combining bounds when conditions must refer to one element. [MongoDB: multikey indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/)

## 15. Text indexes: word search — lecture 142

Use a separate collection:

```javascript
db.articles.insertMany([
  { _id: 1, title: "MongoDB Index Guide", body: "Improve database query performance." },
  { _id: 2, title: "Cooking Guide", body: "Prepare pasta with tomato sauce." },
  { _id: 3, title: "Database Security", body: "Protect MongoDB users and credentials." }
])

db.articles.createIndex({ title: "text", body: "text" }, { name: "article_text" })
db.articles.find({ $text: { $search: "MongoDB" } }) // IDs 1, 3
```

Traditional text indexes support `$text` searches. They tokenize and apply language processing; they do not act like arbitrary substring regex searches. A collection can have one traditional text index containing multiple fields. MongoDB Search is a separate search system with its own indexes; a `$text` index is not a Search index. [MongoDB: text indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-text/)

## 16. Text ranking, combined fields, and exclusions — lectures 143–145

### Sort by relevance score

```javascript
db.articles.find(
  { $text: { $search: "MongoDB" } },
  { title: 1, score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

This asks for the relevance score and descending relevance order. Do not infer ranking from unsorted results or memorize a numeric score as a stable business value. [MongoDB: text scores](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-text/control-text-search-results/)

### Combined text fields

The existing `article_text` index indexes both title and body, so matching content in either field can qualify. If you need a different traditional text definition, drop and recreate that text index rather than adding a second one.

### Search terms and exclusions

```javascript
db.articles.find({ $text: { $search: "MongoDB pasta" } }) // IDs 1, 2, 3: OR terms
db.articles.find({ $text: { $search: "MongoDB -credentials" } }) // ID 1
db.articles.find({ $text: { $search: '"query performance"' } }) // ID 1: phrase
```

Unquoted positive terms are generally ORed. A minus sign excludes a term. Quotes inside the search string specify a phrase. These examples use English language processing; stemming and stop words can affect matches. [MongoDB: $text search syntax](https://www.mongodb.com/docs/manual/reference/operator/query/text/)

## 17. Text language and weights — lecture 146

Default language affects stemming and stop-word handling. It is not automatic translation. For example, English stemming can relate different forms of a word. `default_language: "none"` disables language-specific stemming and stop-word removal.

Documents can override the default through the configured language-override field. Choose a supported language appropriate to the content. [MongoDB: text index language](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-text/specify-text-index-language/)

An alternative definition gives title matches more scoring weight:

```javascript
// In this practice collection, first remove the previous text index.
db.articles.dropIndex("article_text")
db.articles.createIndex(
  { title: "text", body: "text" },
  {
    name: "article_text_weighted",
    default_language: "english",
    weights: { title: 10, body: 1 }
  }
)
```

Weights change relevance scoring; they do not guarantee a fixed score ratio or automatically sort query output. Changing weights requires reindexing. [MongoDB: text weights](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-text/control-text-search-results/)

## 18. Building indexes: older lessons versus current servers — lecture 147

Index creation must scan data and build the structure. Large builds consume CPU, memory, and I/O, and can affect concurrent work. Unique indexes must validate uniqueness; a build can fail if duplicates exist.

Older MongoDB lessons may discuss foreground versus background index builds or show `{ background: true }`. Modern MongoDB's optimized build process differs from that older model and ignores the background option. Do not treat it as a current switch guaranteeing a nonblocking build.

For large collections, check the current build behavior, deployment topology, resource limits, and operational impact before applying an index. A build is not simply an instantaneous metadata edit. [MongoDB: index builds](https://www.mongodb.com/docs/manual/core/index-creation/)

## 19. A complete design example

**Requirement:** Frequently list active users in one city, oldest first, returning only name and age with stable ordering.

```javascript
db.users.createIndex(
  { city: 1, age: -1, _id: 1, name: 1 },
  { name: "active_city_listing", partialFilterExpression: { active: true } }
)

db.users.find(
  { active: true, city: "Kolkata" },
  { _id: 0, name: 1, age: 1 }
).sort({ age: -1, _id: 1 })
```

Expected output order: Asha 28, Cara 22. The partial condition limits index membership to active users. City equality selects one part of the index; age and `_id` support its ordering; name is included to support the returned view.

Coverage is a separate question from ordered access. The filter includes `active`, which is not an index key; do not assume this partial index necessarily produces a covered plan. Check whether the actual plan fetches records. If coverage is necessary, test a definition including all required filter fields as keys too.

## 20. Common mistakes

| Assumption | Better interpretation |
|---|---|
| Every query needs an index | Prioritize recurring, costly query shapes |
| More indexes always help | Each additional index costs storage and write maintenance |
| An index changes returned documents | It changes access strategy; TTL and unique indexes additionally impose behavior |
| IXSCAN means optimal performance | Compare keys, documents, sorting, and workload latency |
| Index direction matters only for equality | It matters particularly for compound sorting |
| Every field subset is an equally useful compound prefix | Leading field order matters |
| Sparse means not-null | Missing fields and present null are different |
| Partial index can answer any query on its keys | Query must not need excluded documents |
| TTL deletes exactly at the deadline | Cleanup is asynchronous |
| Returning `_id` is free for coverage | A secondary index may need `_id` explicitly indexed |
| A rejected plan is an unusable index | It lost this planning decision |
| Multikey needs a creation flag | MongoDB detects array indexing automatically |
| Text search is substring matching | It uses words and language processing |
| Background option makes a modern build safe by itself | Check current index-build behavior |

## 21. Practice with answers

Attempt these before reading the answers:

1. For queries `{ city: "Kolkata", age: { $gte: 25 } }`, propose a basic compound index. Which users match?
2. Why is age-only filtering not the strongest use of `{ city: 1, age: 1 }`?
3. What must a query include to safely use an index restricted to `active: true`?
4. Which option can let multiple missing emails coexist while enforcing uniqueness for present string emails?
5. With `{ city: 1, name: 1 }`, how can a city-and-name query avoid fetching documents?
6. Does a TTL expiry deadline promise the document has disappeared immediately?
7. How do you find MongoDB articles while excluding credentials?
8. What would you inspect when an index scan examines 90,000 keys to return 10 users?

### Answers

1. `{ city: 1, age: 1 }`; Asha and Esha qualify. Confirm the plan on realistic data.
2. Entries are grouped by city first, so ages are not one globally contiguous ordering.
3. Include a condition implying `active: true`; an age condition alone is insufficient.
4. A unique partial email index with `partialFilterExpression: { email: { $type: "string" } }`.
5. Filter on city, project city/name, explicitly exclude `_id`, and verify a covering plan with no document examination.
6. No. Expired documents become eligible for asynchronous deletion.
7. `{ $text: { $search: "MongoDB -credentials" } }` with a suitable text index.
8. Index bounds, field order, selectivity, sorting, and alternative plans. IXSCAN alone is not success.

## 22. Fast revision for your future self — lecture 148

| Need | Remember |
|---|---|
| Create an index | `createIndex(keys, options)` |
| Inspect definitions | `getIndexes()` |
| Remove an index | `dropIndex(name)` |
| Optimize multiple fields | Compound index; leading order matters |
| Choose a starting order | Equality → Sort → Range, then measure |
| Enforce uniqueness | `unique: true`; existing data must comply |
| Omit missing fields | Single-field sparse index |
| Index a defined subset | `partialFilterExpression` |
| Automatic expiry | Date-field TTL index with `expireAfterSeconds` |
| Understand actual work | `explain("executionStats")` |
| Inspect candidate-plan trials | `explain("allPlansExecution")` |
| Avoid document fetches | Covered query; needed fields in index |
| Index array values | Automatically multikey |
| Word-based search | Traditional text index + `$text` |
| Relevance order | `$meta: "textScore"` |
| Exclude text term | Minus-prefixed search term |
| Influence relevance | Text-index weights |

**The core memory:** An index is an ordered shortcut with a maintenance cost. Choose it for a real query; verify how much work it saves. Compound order, subset membership, and array behavior determine whether the shortcut applies.

When returning after years, start with sections 1 and 22. Use section 11 to interpret diagnostics, then revisit the index type you need.

## 23. Course map — lecture 149 and reference use

| Lecture | Notes section |
|---|---|
| 126: Module Introduction | 1 |
| 127: What Are Indexes & Why Do We Use Them? | 1, 4 |
| 128: Adding a Single Field Index | 3 |
| 129: Indexes Behind the Scenes | 4 |
| 130: Understanding Index Restrictions | 4 |
| 131: Creating Compound Indexes | 5 |
| 132: Using Indexes for Sorting | 6 |
| 133: Understanding the Default Index | 7 |
| 134: Configuring Indexes | 8 |
| 135–136: Partial Filters / Applying Partial Index | 9 |
| 137: Time-To-Live Index | 10 |
| 138: Query Diagnosis & Query Planning | 11 |
| 139: Covered Queries | 12 |
| 140: How MongoDB Rejects a Plan | 13 |
| 141: Multi-Key Indexes | 14 |
| 142: Text Indexes | 15 |
| 143–145: Text Sorting, Combined Fields, Excluded Words | 16 |
| 146: Default Language & Weights | 17 |
| 147: Building Indexes | 18 |
| 148: Wrap Up | 22 |
| 149: Useful Resources & Links | Official links beside each explanation |

The examples and exercises are original teaching material. For exact instructor wording, datasets, and demonstrations, revisit the lectures or provide their transcripts. For future implementation, use the MongoDB documentation matching your installed version and deployment.
