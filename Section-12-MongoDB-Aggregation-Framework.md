# Section 12 — MongoDB: Understanding the Aggregation Framework

**Purpose:** Understand these notes years later without reopening the videos.

**Course:** MongoDB — The Complete Developer's Guide, Academind / Maximilian Schwarzmüller. Aligned with the verified Section 12 curriculum: lectures 160–185 plus Assignment 7, 27 curriculum items in total.

**Source transparency:** I read the section's lecture list in your course. These are original explanations and examples checked against MongoDB's official documentation. I did not review the Section 12 videos or their transcripts. The broad “Additional Stages” lesson is supported here with clearly identified supplementary examples rather than a claim about its exact demonstration.

**Written:** 28 September 2026. Examples use `mongosh`. Expected outputs are reasoned from the dataset, not executed against a MongoDB server. Actual explain output, optimization, and resource behavior depend on your server version and deployment.

## 1. The idea to remember first — lectures 160–163

An aggregation pipeline is a sequence of stages that process documents. Each stage receives the preceding stage's output.

```javascript
db.collection.aggregate([
  { $match: { /* select documents */ } },
  { $group: { /* summarize them */ } },
  { $sort: { /* order the summaries */ } }
])
```

**English:** “Take these records, keep the ones we need, combine them into summaries, and order the summaries.”

Think of a sequence of workstations: documents flow through them, and each workstation may change their shape or their number. The array order is the logical processing order.

- **Stage:** operates on a stream of documents, such as `$match`, `$group`, or `$project`.
- **Expression:** calculates a value inside a stage, such as `{ $multiply: ["$price", "$quantity"] }`.
- **Accumulator:** combines values from multiple input documents, such as group `$sum` or `$avg`.
- **Field reference:** `"$age"` means the current document's age value.
- **Variable reference:** `"$$hobby.frequency"` means a property of a pipeline variable.

`aggregate()` returns a cursor. Ordinary aggregation transforms the returned result without changing stored documents. `$out` and `$merge` are explicit exceptions that write results. [MongoDB: aggregation pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)

**The lasting question:** At this point in the pipeline, what does one document represent: a person, one hobby, or a city summary?

## 2. One dataset for all examples

Use a dedicated practice database. Insert this dataset once. Repeating it with the same IDs causes duplicate-key errors.

```javascript
use section12_aggregation_practice

db.people.insertMany([
  {
    _id: 1, name: { first: "Asha", last: "Sen" },
    city: "Kolkata", age: 28, active: true,
    birthdate: "1998-06-15T00:00:00Z",
    location: { longitude: "88.3639", latitude: "22.5726" },
    hobbies: [
      { title: "Reading", frequency: 5 },
      { title: "Sports", frequency: 3 }
    ]
  },
  {
    _id: 2, name: { first: "Ben", last: "Rao" },
    city: "Mumbai", age: 35, active: false,
    birthdate: "1991-01-01T00:00:00Z",
    location: { longitude: "72.8777", latitude: "19.0760" },
    hobbies: [{ title: "Reading", frequency: 4 }]
  },
  {
    _id: 3, name: { first: "Cara", last: "Das" },
    city: "Kolkata", age: 22, active: true,
    birthdate: "2004-12-30T00:00:00Z",
    location: { longitude: "88.3639", latitude: "22.5726" },
    hobbies: [
      { title: "Music", frequency: 2 },
      { title: "Sports", frequency: 1 }
    ]
  },
  {
    _id: 4, name: { first: "Dev", last: "Mehta" },
    city: "Delhi", age: 42, active: true,
    birthdate: "1984-07-20T00:00:00Z",
    location: { longitude: "77.2090", latitude: "28.6139" },
    hobbies: []
  }
])
```

Age is a fixed example field, not dynamically calculated from the current date. Frequencies mean sessions per month. Coordinate strings deliberately need conversion.

Except for the explicitly labeled writing examples, each pipeline starts from this original collection independently. Unless a pipeline includes `$sort`, output order is not promised.

## 3. Filter with `$match`, then summarize with `$group` — lectures 164–165

```javascript
db.people.aggregate([
  { $match: { active: true } },
  { $group: {
      _id: "$city",
      peopleCount: { $sum: 1 },
      averageAge: { $avg: "$age" }
  } },
  { $sort: { peopleCount: -1, _id: 1 } }
])
```

Expected output:

```javascript
[
  { _id: "Kolkata", peopleCount: 2, averageAge: 25 },
  { _id: "Delhi", peopleCount: 1, averageAge: 42 }
]
```

Trace the meaning of one document:

1. Input: four person documents.
2. After `$match`: three active person documents.
3. After `$group`: two city summary documents.
4. After `$sort`: those summaries are ordered by descending count.

### The group `_id` is the grouping key

`_id: "$city"` puts people with equal city values in the same group. It does not preserve their original numeric IDs.

```javascript
// One summary for all input people:
db.people.aggregate([
  { $group: { _id: null, count: { $sum: 1 }, averageAge: { $avg: "$age" } } }
])
// { _id: null, count: 4, averageAge: 31.75 }
```

A compound key can group by several attributes: `_id: { city: "$city", active: "$active" }`.

| Accumulator | Meaning within each group |
|---|---|
| `$sum: 1` | Add one per input document: count |
| `$sum: "$amount"` | Sum numeric amount values |
| `$avg: "$age"` | Average numeric age values |
| `$min` / `$max` | Lowest / highest value |
| `$first` / `$last` | Value from first / last input document; establish meaningful order first |
| `$push` | Collect values, including repeats |
| `$addToSet` | Collect distinct values |

`$group` does not sort output. Missing/null grouping values can share a group, and numeric accumulators have type rules—do not assume a numeric-looking string is a number. Fields not explicitly carried into the group output disappear. [MongoDB: $group](https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/)

**Stage-order trap:** After grouping by city, `$match: { active: true }` cannot inspect the original active field because it no longer exists. Filter people before grouping; filter summary fields afterward.

## 4. `$project`: choose and compute fields — lecture 166

```javascript
db.people.aggregate([
  { $project: {
      _id: 0,
      fullName: { $concat: ["$name.first", " ", "$name.last"] },
      city: 1,
      ageNextYear: { $add: ["$age", 1] }
  } }
])
```

For Asha, the output is:

```javascript
{ fullName: "Asha Sen", city: "Kolkata", ageNextYear: 29 }
```

Projection can include, exclude, rename, or compute fields. `_id` remains unless excluded. An inclusion/computed projection generally cannot mix exclusions of other fields; `_id` exclusion is the usual exception.

`city: 1` means include city, while `cityLabel: "$city"` creates a field using the city's value. To output a literal numeric 1, use an expression such as `{ $literal: 1 }`; plain `1` is an inclusion flag.

Do not rely on a computed field being visible to a sibling expression in the same stage. Use the next stage when one calculation depends on another newly created field. [MongoDB: $project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/)

Useful string expressions include `$concat`, `$toUpper`, and `$toLower`. Use them deliberately: uppercasing a name changes presentation, not its linguistic spelling. [MongoDB: $concat](https://www.mongodb.com/docs/manual/reference/operator/aggregation/concat/)

## 5. Convert coordinates to GeoJSON — lecture 167

GeoJSON uses **longitude first, latitude second**, as numbers:

```javascript
db.people.aggregate([
  { $project: {
      name: 1,
      geo: {
        type: { $literal: "Point" },
        coordinates: [
          { $convert: { input: "$location.longitude", to: "double" } },
          { $convert: { input: "$location.latitude", to: "double" } }
        ]
      }
  } }
])
```

Asha's computed field becomes:

```javascript
geo: { type: "Point", coordinates: [88.3639, 22.5726] }
```

The pipeline output contains `geo`, but the source record still has the original location strings. You must explicitly persist a transformed result before building an index on that computed output field.

`$convert` can specify `onError` and `onNull` fallback values. Invalid conversions otherwise can stop the pipeline. Validate converted coordinates before indexing; null is not a valid coordinate. Longitude must be in −180 to 180, latitude in −90 to 90. [MongoDB: $convert](https://www.mongodb.com/docs/manual/reference/operator/aggregation/convert/), [MongoDB: GeoJSON](https://www.mongodb.com/docs/manual/reference/geojson/)

## 6. Birthdates and conversion shortcuts — lectures 168–169

```javascript
db.people.aggregate([
  { $project: {
      name: 1,
      born: { $convert: { input: "$birthdate", to: "date" } }
  } }
])
```

The string becomes a BSON date representing an instant. For Asha: `ISODate("1998-06-15T00:00:00Z")`.

The short version is `{ $toDate: "$birthdate" }`. Similarly, `{ $toDouble: "$location.longitude" }` replaces the simple conversion to double. Shortcuts are convenient when inputs are valid; use `$convert` when you need custom error handling. [MongoDB: $toDate](https://www.mongodb.com/docs/manual/reference/operator/aggregation/todate/), [MongoDB: $toDouble](https://www.mongodb.com/docs/manual/reference/operator/aggregation/todouble/)

```javascript
// Explicitly tolerate invalid/missing birthdate values:
db.people.aggregate([
  { $project: {
      name: 1,
      born: { $convert: {
        input: "$birthdate", to: "date", onError: null, onNull: null
      } }
  } }
])
```

A tolerated invalid input becomes null; decide what later date operations should do with it. Do not silently treat invalid data as a valid birthdate.

## 7. Calendar year versus ISO week year — lecture 170

`$year` returns a calendar year. `$isoWeekYear` returns the year belonging to the ISO week-numbering system. Near New Year, they can differ.

```javascript
db.people.aggregate([
  { $match: { _id: 2 } },
  { $project: { _id: 0, born: { $toDate: "$birthdate" } } },
  { $project: {
      born: 1,
      calendarYear: { $year: "$born" },
      weekYear: { $isoWeekYear: "$born" }
  } }
])
// Ben: born 1991-01-01, calendarYear 1991, weekYear 1991.
```

Boundary example independent of the dataset:

```javascript
// For 2021-01-01T00:00:00Z:
// calendar year = 2021, ISO week year = 2020.
```

ISO weeks begin Monday; ISO week 1 contains the year's first Thursday. Use calendar years for birth-year reports, ISO week years for ISO weekly reports. Pair `$isoWeek` with `$isoWeekYear` when grouping weeks. Date operators default to UTC unless you specify a supported timezone. [MongoDB: $isoWeekYear](https://www.mongodb.com/docs/manual/reference/operator/aggregation/isoweekyear/)

## 8. `$group` versus `$project` — lecture 171

| Stage | Main job | Meaning of output document |
|---|---|---|
| `$project` | Reshape/calculate each input document | Still represents that individual input record |
| `$group` | Combine documents sharing a key | Represents a group summary |

Projection does not combine Asha and Cara into one city. Grouping does. After grouping, project the group result if you want nicer field names:

```javascript
db.people.aggregate([
  { $group: { _id: "$city", count: { $sum: 1 } } },
  { $project: { _id: 0, city: "$_id", count: 1 } },
  { $sort: { city: 1 } }
])
// Delhi 1; Kolkata 2; Mumbai 1.
```

## 9. Collect values into arrays — lecture 172

```javascript
db.people.aggregate([
  { $sort: { _id: 1 } },
  { $group: { _id: "$city", names: { $push: "$name.first" } } }
])
// Kolkata names: ["Asha", "Cara"]
```

Aggregation `$push` appends each input expression value to a result array. It does not update an array in stored person documents. Its order follows the incoming document order, so sort before grouping when order matters.

If you push an array, you collect arrays: `$push: "$hobbies"` makes an array of hobby arrays. It does not flatten them. [MongoDB: accumulator $push](https://www.mongodb.com/docs/manual/reference/operator/aggregation/push/)

## 10. `$unwind`: one output per array element — lecture 173

```javascript
db.people.aggregate([
  { $match: { _id: 1 } },
  { $unwind: "$hobbies" },
  { $project: { _id: 0, person: "$name.first", hobby: "$hobbies.title" } }
])
```

Expected output:

```javascript
[
  { person: "Asha", hobby: "Reading" },
  { person: "Asha", hobby: "Sports" }
]
```

Each output repeats the parent fields but replaces the array value with one element. All people produce five hobby documents; Dev's empty array contributes none by default.

To keep empty, missing, or null array cases:

```javascript
{ $unwind: { path: "$hobbies", preserveNullAndEmptyArrays: true } }
```

An `includeArrayIndex` option can record the element position. Unwinding increases record counts: after it, `$sum: 1` counts hobby records, not necessarily distinct people. Unwinding two arrays can multiply rows further. [MongoDB: $unwind](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/)

## 11. Eliminate duplicate values — lecture 174

```javascript
db.people.aggregate([
  { $unwind: "$hobbies" },
  { $group: { _id: null, titles: { $addToSet: "$hobbies.title" } } }
])
// titles contains Reading, Sports, Music once each; order unspecified.
```

Aggregation `$addToSet` collects distinct values in a group result. It does not modify stored arrays. Whole arrays are treated as values rather than automatically flattened; embedded document equality also considers their complete contents and field order. [MongoDB: accumulator $addToSet](https://www.mongodb.com/docs/manual/reference/operator/aggregation/addtoset/)

For one record per hobby title with a count:

```javascript
db.people.aggregate([
  { $unwind: "$hobbies" },
  { $group: { _id: "$hobbies.title", count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } }
])
// Reading 2, Sports 2, Music 1.
```

## 12. Project array elements and measure length — lectures 175–176

```javascript
db.people.aggregate([
  { $match: { _id: 1 } },
  { $project: {
      _id: 0,
      firstHobby: { $arrayElemAt: ["$hobbies", 0] },
      lastHobby: { $arrayElemAt: ["$hobbies", -1] },
      firstTwo: { $slice: ["$hobbies", 2] },
      hobbyCount: { $size: "$hobbies" }
  } }
])
```

Asha: first is Reading 5; last is Sports 3; firstTwo is both hobby documents; hobbyCount is 2.

`$arrayElemAt` uses zero-based indexes; negative indexes count backward. `$slice` returns an array portion; the three-argument expression form is `[array, start, count]`. These are expressions, not Section 7's projection-operator grammar. [MongoDB: $arrayElemAt](https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayelemat/), [MongoDB: expression $slice](https://www.mongodb.com/docs/manual/reference/operator/aggregation/slice/)

Aggregation `$size` returns an array's length. Query `$size: 2` instead filters documents by an exact length. The aggregation expression errors for non-array inputs. A robust guard is:

```javascript
{ $cond: {
    if: { $isArray: "$hobbies" },
    then: { $size: "$hobbies" },
    else: 0
} }
```

Use the guard if your schema permits absent/null/non-array values; the sample dataset always stores arrays. [MongoDB: expression $size](https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/)

## 13. `$filter`: retain every qualifying element — lecture 177

```javascript
db.people.aggregate([
  { $project: {
      name: 1,
      frequentHobbies: { $filter: {
        input: "$hobbies",
        as: "hobby",
        cond: { $gte: ["$$hobby.frequency", 3] }
      } }
  } }
])
```

Expected arrays: Asha has Reading and Sports; Ben has Reading; Cara and Dev have empty arrays.

`input` is the array, `as` names each element variable, and `cond` decides whether to keep that element. `$$hobby` is a variable; `$hobby` would refer to a document field. The original element order is preserved.

Unlike a document filter, this does not remove Cara's person record. Unlike projection `$elemMatch`, it can return every matching element. Null/missing input returns null; non-array non-null input errors. [MongoDB: $filter](https://www.mongodb.com/docs/manual/reference/operator/aggregation/filter/)

## 14. Combine multiple array operations — lecture 178

**Requirement:** Keep hobbies practiced at least three times monthly, count them, and show only people with at least one such hobby.

```javascript
db.people.aggregate([
  { $project: {
      fullName: { $concat: ["$name.first", " ", "$name.last"] },
      frequentHobbies: { $filter: {
        input: "$hobbies", as: "hobby",
        cond: { $gte: ["$$hobby.frequency", 3] }
      } }
  } },
  { $project: {
      _id: 0, fullName: 1, frequentHobbies: 1,
      frequentCount: { $size: "$frequentHobbies" }
  } },
  { $match: { frequentCount: { $gt: 0 } } },
  { $sort: { fullName: 1 } }
])
```

Asha Sen has count 2; Ben Rao has count 1. Cara and Dev are filtered out by the last match. The second projection can read the first projection's new array.

For ranking individual hobby entries, another pattern is unwind → sort → group with `$push`. Track whether you are ranking hobbies globally or separately for each person; preserve the person key for the latter.

## 15. `$bucket`: group by explicit ranges — lecture 179

```javascript
db.people.aggregate([
  { $bucket: {
      groupBy: "$age",
      boundaries: [0, 25, 35, 50],
      default: "OutsideRanges",
      output: { count: { $sum: 1 }, names: { $push: "$name.first" } }
  } }
])
```

Expected groups:

| Output `_id` | Range | People | Count |
|---:|---|---|---:|
| 0 | 0 ≤ age < 25 | Cara | 1 |
| 25 | 25 ≤ age < 35 | Asha | 1 |
| 35 | 35 ≤ age < 50 | Ben, Dev | 2 |

The lower bound is inclusive; the upper bound is exclusive. Ben at exactly 35 belongs to the bucket beginning 35. The final boundary 50 is excluded, so age 50 would enter the default bucket. Empty buckets are not output automatically. Without a default, an unmatched value can error. [MongoDB: $bucket](https://www.mongodb.com/docs/manual/reference/operator/aggregation/bucket/)

Supplementary comparison: `$bucketAuto` requests a number of automatically chosen buckets, aiming to distribute documents roughly evenly. It does not mean equally wide numeric ranges, and the actual number of buckets can be lower than requested. [MongoDB: $bucketAuto](https://www.mongodb.com/docs/manual/reference/operator/aggregation/bucketauto/)

## 16. Additional useful stages — lecture 180 topic

These examples supplement the broad lesson title; they are not claimed as its exact content.

### Sort, skip, and limit

```javascript
db.people.aggregate([
  { $sort: { age: -1, _id: 1 } },
  { $skip: 1 },
  { $limit: 2 },
  { $project: { _id: 0, name: "$name.first", age: 1 } }
])
// Ben 35, Asha 28.
```

Unlike cursor method chaining, pipeline stage order directly matters: limiting before sorting means sorting only the already-limited subset. Use a unique tie-breaker for stable ordering. [MongoDB: $sort](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/)

### `$sortByCount`: group and rank frequencies

```javascript
db.people.aggregate([{ $unwind: "$hobbies" }, { $sortByCount: "$hobbies.title" }])
// Reading 2 and Sports 2 (tie order unspecified), then Music 1.
```

This is shorthand for grouping by the expression, counting, and sorting counts descending. [MongoDB: $sortByCount](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sortbycount/)

### `$facet`: several summaries from the same input stream

```javascript
db.people.aggregate([
  { $facet: {
      byCity: [{ $sortByCount: "$city" }],
      activePeople: [
        { $match: { active: true } },
        { $project: { _id: 0, name: "$name.first" } }
      ]
  } }
])
```

One output document contains two arrays: city counts and active names. Each branch receives the same facet input, independently; one branch cannot read the other branch's output. Facet results have memory/size limits and cannot spill that facet document to disk via `allowDiskUse`. [MongoDB: $facet](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/)

## 17. Pipeline optimization — lecture 181

Write the correct logical pipeline, then inspect execution. MongoDB may move independent matches earlier or combine compatible stages without changing the intended result. A filter depending on a computed field cannot simply run before that computation.

Useful habits:

- Filter early when the condition applies to original input fields.
- Use indexes for suitable initial matches and sorts.
- Reduce unnecessary unwind expansion before expensive grouping.
- Do not assume an early projection is required just to reduce fields; MongoDB can optimize field dependencies itself.

```javascript
db.people.explain("executionStats").aggregate([
  { $match: { city: "Kolkata" } },
  { $group: { _id: "$active", count: { $sum: 1 } } }
])
```

This diagnoses execution; it does not guarantee an index scan or fixed timing. Explain structure varies with execution engine and version. [MongoDB: pipeline optimization](https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/)

Blocking stages such as group or certain sorts can require substantial memory. Some stages can spill to disk depending on `allowDiskUse` and server settings; that does not remove all limits. Returned BSON documents remain subject to the 16 MiB document limit. Avoid collecting an unbounded number of values into one huge array. [MongoDB: pipeline limits](https://www.mongodb.com/docs/manual/core/aggregation-pipeline-limits/)

## 18. Write pipeline results to a collection — lecture 182

**This example writes data.** Ordinary preceding examples only return transformed results.

```javascript
db.people.aggregate([
  { $group: { _id: "$city", peopleCount: { $sum: 1 } } },
  { $out: "citySummary" }
])

db.citySummary.find({})
// Delhi 1; Kolkata 2; Mumbai 1 (order unspecified).
```

`$out` must be the final stage. It creates the target collection, or replaces the target collection's documents when that collection already exists. It is not “append another summary.” The source `people` collection remains unchanged here.

Use a distinct target name to make the purpose clear. `$merge` offers other write behaviors, but is a separate stage with separate matching/update rules. [MongoDB: $out](https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/)

## 19. `$geoNear`: nearest documents with distances — lecture 183

First persist the converted coordinates in a separate practice collection and index them. This setup writes/replaces `peopleGeo`:

```javascript
db.people.aggregate([
  { $project: {
      name: 1, city: 1, active: 1,
      geo: {
        type: { $literal: "Point" },
        coordinates: [
          { $toDouble: "$location.longitude" },
          { $toDouble: "$location.latitude" }
        ]
      }
  } },
  { $out: "peopleGeo" }
])

db.peopleGeo.createIndex({ geo: "2dsphere" })
```

Now query near the sample Kolkata coordinate:

```javascript
db.peopleGeo.aggregate([
  { $geoNear: {
      near: { type: "Point", coordinates: [88.3639, 22.5726] },
      key: "geo",
      distanceField: "distanceMeters",
      spherical: true,
      query: { active: true },
      maxDistance: 10000
  } },
  { $project: { _id: 0, name: "$name.first", distanceMeters: 1 } }
])
```

Asha and Cara qualify; both are at the identical example coordinate, so their distance is zero and their tie order is unspecified. Dev is outside this ten-kilometer radius. No numerical distances for other cities are assumed here.

`$geoNear` must be first, requires a suitable geospatial index, and normally returns nearest-to-farthest results. Use its `query` option for an initial document filter. With GeoJSON, distances and maxDistance are in meters. The `key` identifies the location field. Add an explicit `$limit` when you want a maximum result count; do not rely on historical default limits. [MongoDB: $geoNear](https://www.mongodb.com/docs/manual/reference/operator/aggregation/geonear/)

## 20. A complete pipeline you should be able to explain

**Requirement:** For active people, calculate the total monthly hobby sessions per city, counting only hobbies practiced at least twice monthly. Show the busiest cities first.

```javascript
db.people.aggregate([
  { $match: { active: true } },
  { $unwind: "$hobbies" },
  { $match: { "hobbies.frequency": { $gte: 2 } } },
  { $group: {
      _id: "$city",
      totalSessions: { $sum: "$hobbies.frequency" },
      hobbyRecords: { $sum: 1 },
      people: { $addToSet: "$_id" }
  } },
  { $project: {
      _id: 0, city: "$_id", totalSessions: 1, hobbyRecords: 1,
      distinctPeople: { $size: "$people" }
  } },
  { $sort: { totalSessions: -1, city: 1 } }
])
```

Expected result:

```javascript
{ city: "Kolkata", totalSessions: 10, hobbyRecords: 3, distinctPeople: 2 }
```

Arithmetic: Asha contributes Reading 5 and Sports 3; Cara contributes Music 2. Cara's Sports 1 fails the threshold. Ben is inactive; Dev has no hobbies and drops out at unwind. Three hobby records represent two distinct people—this is why we collect person IDs rather than equating row count with person count.

## 21. Common mistakes

| Mistake | Correction |
|---|---|
| `"city"` instead of `"$city"` in an expression | The first is literal text; the second reads a field |
| `$hobby` instead of `$$hobby` in filter condition | Variables use double dollar signs |
| Thinking aggregation `$push` updates stored arrays | It accumulates into pipeline output |
| Matching an original field after group removed it | Match earlier or explicitly carry the field forward |
| Assuming group output is ordered | Add `$sort` |
| Counting people after unwind with sum 1 | Count distinct person keys if that is the requirement |
| Using `$size` on a possibly non-array value | Validate or guard with `$isArray` |
| Expecting filter to remove whole documents | It removes array elements; add `$match` to remove documents |
| Reversing longitude and latitude | GeoJSON is longitude, then latitude |
| Treating a date string as a BSON date | Convert before date expressions |
| Using ISO week year for birth calendar year | Pick the date concept the report requires |
| Reading a new sibling computed field immediately | Use a later stage |
| Expecting out to append | It replaces the target contents |
| Limiting before sorting while intending global top N | Sort before limit |

## 22. Practice — attempt before checking answers

These are original exercises for the section's practice theme, not the instructor's Assignment 7 solution.

1. Count people per city and sort by descending count, then city name.
2. Return each first name and its hobby count, including Dev with zero.
3. Return only hobby elements with frequency at least 4; keep every person record.
4. Count distinct people having Sports as a hobby. Avoid accidentally counting every hobby.
5. Put people into age buckets `[0, 30)` and `[30, 50)`. Which names go where?
6. Why does `{ $group: { _id: "city" } }` make one group?

### Answers

```javascript
// 1: Kolkata 2; Delhi 1; Mumbai 1.
db.people.aggregate([
  { $group: { _id: "$city", count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } }
])

// 2: Asha 2, Ben 1, Cara 2, Dev 0.
db.people.aggregate([
  { $project: { _id: 0, name: "$name.first", hobbyCount: { $size: "$hobbies" } } }
])

// 3: Asha Reading 5; Ben Reading 4; Cara/Dev empty arrays.
db.people.aggregate([
  { $project: {
      name: 1,
      hobbies: { $filter: {
        input: "$hobbies", as: "h", cond: { $gte: ["$$h.frequency", 4] }
      } }
  } }
])

// 4: 2 people: Asha and Cara. Match membership without unwind.
db.people.aggregate([
  { $match: { "hobbies.title": "Sports" } },
  { $group: { _id: null, peopleCount: { $sum: 1 } } }
])

// 5: bucket 0 has Asha/Cara; bucket 30 has Ben/Dev.
db.people.aggregate([
  { $bucket: {
      groupBy: "$age", boundaries: [0, 30, 50], default: "Other",
      output: { names: { $push: "$name.first" }, count: { $sum: 1 } }
  } }
])
```

Answer 6: `"city"` is the same literal string for every input record. `"$city"` reads each record's actual city value.

## 23. Fast revision for your future self — lecture 184

| Requirement | Reach for |
|---|---|
| Keep qualifying documents | `$match` |
| Combine records by a key | `$group` |
| Count records in a group | `$sum: 1` |
| Reshape or compute per record | `$project` |
| Read a current field | `"$field"` |
| Read an element variable | `"$$variable.field"` |
| Convert with custom fallbacks | `$convert` |
| Simple date/number conversion | `$toDate`, `$toDouble` |
| Calendar year / ISO week year | `$year` / `$isoWeekYear` |
| Collect values / distinct values | Group `$push` / `$addToSet` |
| Expand array elements to documents | `$unwind` |
| Pick array element or portion | `$arrayElemAt`, expression `$slice` |
| Array length | Expression `$size` |
| Keep qualifying array elements | `$filter` |
| Explicit numeric ranges | `$bucket` |
| Automatically chosen ranges | `$bucketAuto` |
| Multiple summaries of the same stream | `$facet` |
| Frequency ranking | `$sortByCount` |
| Inspect execution | `explain("executionStats").aggregate(...)` |
| Persist/replace a result collection | Final `$out` |
| Nearest records and distances | First `$geoNear` with geospatial index |

Before trusting a pipeline, check:

1. What does one document represent after each stage?
2. Which fields still exist at that point?
3. Are numbers, dates, arrays, and coordinates correctly typed?
4. Does unwind change what my count measures?
5. Are order and tie-breaking explicit where needed?
6. Does the pipeline return a view or write persistent data?
7. Could one group or facet become too large?

**The core memory:** A pipeline passes the previous output to the next stage. Group changes the unit of analysis; project changes its shape; unwind changes its granularity. Always know what one current document means.

## 24. Course map and references — lecture 185

| Course lesson | Notes section |
|---|---|
| 160–163: Introduction, Framework, Pipeline, Using Framework | 1–2 |
| 164–165: Group Stage / Deeper Group Stage | 3 |
| Assignment 7: Aggregation Framework | Original exercises in 22 |
| 166: project | 4 |
| 167: GeoJSON Location | 5 |
| 168–169: Birthdate / Transformation Shortcuts | 6 |
| 170: isoWeekYear | 7 |
| 171: group vs project | 8 |
| 172: Pushing Into New Arrays | 9 |
| 173: unwind | 10 |
| 174: Eliminating Duplicates | 11 |
| 175–176: Array Projection / Array Length | 12 |
| 177: filter | 13 |
| 178: Multiple Array Operations | 14 |
| 179: bucket | 15 |
| 180: Additional Stages | Supplementary examples in 16 |
| 181: Pipeline Optimization | 17 |
| 182: Writing Results to a Collection | 18 |
| 183: geoNear | 19 |
| 184: Wrap Up | 23 |
| 185: Resources & Links | Official references beside each explanation |

For a refresher, read sections 1 and 23, then the dataset and the relevant detailed example. For exact course demonstrations, revisit the videos or provide the transcripts. For implementation years later, consult documentation matching your server and driver versions.
