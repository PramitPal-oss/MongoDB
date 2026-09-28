# Section 3 — MongoDB Schemas & Relations: How to Structure Documents

**Purpose:** Be understandable years later, without reopening the videos.

**Course:** MongoDB — The Complete Developer's Guide, Academind / Maximilian Schwarzmüller. Aligned with the verified Section 3 curriculum, lectures 34–57. These are original explanations and examples, not a transcript or a reconstruction of the instructor's example exercise.

**Written:** 28 September 2026. Code uses `mongosh`. The lecture list was checked in the course; video transcripts were not reviewed. Technical behavior was checked against the linked MongoDB documentation. The examples were reasoned through but not executed against a server.

## 1. The idea to remember first — lectures 35–37

A **schema** is the shape and meaning you intend your documents to have: fields, types, required values, nesting, and links to other records. MongoDB allows documents in one collection to have different fields, but your application still needs a deliberate data model.

The key design question is: **What data is used together, and what data has its own life?**

- **Embed** related data inside one document when it is small/bounded, naturally belongs to that parent, and is usually read or changed with it.
- **Reference** another document by its `_id` when it is independent, large or unbounded, reused by many records, or queried/updated separately.
- **Validate** important invariants so flexibility does not become accidental inconsistency.

MongoDB's guidance emphasizes modeling around the application's access patterns. One “perfectly normalized” model or one “put everything in one document” rule will not serve every workload. [MongoDB: data modeling](https://www.mongodb.com/docs/manual/data-modeling/)

### Four questions before writing a schema

1. What screens and queries must be fast? What fields do they need together?
2. Can a related list grow without a practical bound?
3. Is the related entity shared or edited independently?
4. Must the related values change atomically with the parent?

## 2. A running example: an online learning app

We will use students, courses, enrollments, and lesson progress. The data is illustrative, not from the course videos.

Core requirements:

- Show a student profile and its small address/contact details together.
- Show a course's title and teacher frequently.
- A course can have many lessons, which may grow over time.
- Students can join many courses, and each course can have many students.
- Enrollment has its own information: enrolled date, status, and progress.
- Query enrollments by either student or course.

This requirement list drives the later choices: embed the student's small profile details; reference course and student in an enrollment; store independently managed lessons separately.

## 3. Resetting a database safely — lecture 34

The lecture begins with a reset. For your own practice, use a **dedicated practice database**:

```javascript
use section3_modeling_practice
db.getName() // Should show section3_modeling_practice
```

`use` switches the shell's current database; it does not by itself delete or necessarily create stored data. A database becomes visible when you create data in it. Avoid running a broad `dropDatabase()` command in a database containing work you want to keep. The examples below can be read without running them.

## 4. Documents, JSON, BSON, and types — lectures 38–40

Documents are stored as **BSON** (Binary JSON). The objects you type in `mongosh` look like JavaScript objects, but they can contain BSON-aware values that plain JSON cannot represent directly.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Asha",
  active: true,
  score: 9.5,
  joinedAt: ISODate("2026-01-01T00:00:00Z"),
  address: { city: "Kolkata" },
  interests: ["databases", "backend"],
  nickname: null
}
```

The example `_id` is a valid-looking illustrative ObjectId. In real inserts, omit `_id` when you want MongoDB or the driver to generate one.

| Concept | Example | Why it matters |
|---|---|---|
| String | `"42"` | Text, not the number 42 |
| Boolean | `true` | Different from the string `"true"` |
| Number | `42`, `9.5` | MongoDB has multiple numeric BSON types |
| Date | `ISODate(...)` | Date/time value, not a date-looking string |
| ObjectId | `ObjectId(...)` | Common `_id` type and reference value |
| Embedded document | `{ city: "Kolkata" }` | Nested fields inside a record |
| Array | `["A", "B"]` | Ordered values or documents |
| Null | `null` | Present field with no value; not a missing field |

**JSON versus BSON:** JSON has a smaller set of value types. BSON supports types such as ObjectId and Date. Extended JSON can serialize BSON values into JSON-compatible representations for transfer or files. `ISODate(...)` and `ObjectId(...)` are shell expressions, not valid raw JSON text. [MongoDB: BSON types](https://www.mongodb.com/docs/manual/reference/bson-types/)

Use explicit numeric constructors when an exact BSON numeric type matters, for example `Int32(42)`, `Long("9007199254740993")`, or `Decimal128("12.50")`. Do not put money into binary floating-point fields if exact decimal arithmetic is a requirement; choose a consistent monetary representation.

**Limits:** A stored BSON document has a 16 MiB size limit, and nesting has a depth limit. Unbounded embedded arrays can eventually collide with size and update-cost problems. Design them deliberately rather than waiting for the limit to appear. [MongoDB: limits](https://www.mongodb.com/docs/manual/reference/limits/)

## 5. Derive structure from requirements — lecture 41

Start with operations, not a list of entity nouns.

| Requirement | Likely structure | Reason |
|---|---|---|
| Profile page always shows a student's small address | Embed `address` in `students` | One read; address belongs to student |
| Teacher biography edited independently and used by many courses | Reference `teacherId` | One authoritative teacher record |
| Course has a few fixed settings | Embed `settings` in `courses` | Small, bounded, same lifecycle |
| Course has potentially hundreds of lessons | Reference each lesson to `courseId` | Independently queried and grows |
| Each student can enroll in many courses | `enrollments` collection with two IDs | Many-to-many with relationship data |

Also estimate cardinality: “many” could mean five or five million. Write-heavy and read-heavy paths may justify different degrees of duplication. If you duplicate a course title in an enrollment to serve a hot screen, treat it as a snapshot or plan how it stays synchronized; references alone do not provide that title. [MongoDB: schema design process](https://www.mongodb.com/docs/manual/data-modeling/schema-design-process/)

## 6. Relations: embed versus reference — lectures 42 and 49

**One-to-one:** one student has one profile. **One-to-many:** one course has many lessons. **Many-to-many:** students enroll in multiple courses, and courses have multiple students.

These cardinalities describe the relationship. They do **not** automatically dictate a storage pattern. Each can be represented by embedding, references, or a hybrid.

| Consideration | Embedding | Referencing |
|---|---|---|
| Common read | Parent and child together in one document | May require another query or `$lookup` |
| Atomic change | Parent and embedded child share one document-level atomic write | Separate documents need coordination for multi-record invariants |
| Growth | Parent document grows | Child count can grow independently |
| Shared entity | Duplicates may need synchronization | One authoritative record is natural |
| Independent access | Less natural | Natural separate collection |

An ObjectId reference is just a stored value pointing to an ID. MongoDB does not automatically fetch the other document, enforce foreign-key existence, or cascade deletions. Your application or data workflow must maintain those rules. [MongoDB: embedded data](https://www.mongodb.com/docs/manual/data-modeling/embedding/), [MongoDB: reference data](https://www.mongodb.com/docs/manual/data-modeling/referencing/)

## 7. One-to-one: embedded — lecture 43

```javascript
// students
{
  _id: 1,
  name: "Asha",
  profile: {
    bio: "Backend developer",
    address: { city: "Kolkata", country: "India" }
  }
}
```

One profile belongs to one student and is usually shown with that student. Reading the student gets the profile in the same document. A change to `profile.address.city` can be a single-document update.

```javascript
db.students.findOne({ _id: 1 }, { name: 1, profile: 1 })
db.students.updateOne({ _id: 1 }, { $set: { "profile.address.city": "Pune" } })
```

If the profile has independent access controls, large media, or a very different lifecycle, a separate collection can be better. Embedding is a design choice, not a requirement for one-to-one. [MongoDB: embedded data](https://www.mongodb.com/docs/manual/data-modeling/embedding/)

## 8. One-to-one: using references — lecture 44

```javascript
// students
{ _id: 1, name: "Asha" }

// profiles
{ _id: 101, studentId: 1, bio: "Backend developer" }
```

The `studentId` value is the link. A unique index on `profiles.studentId` can enforce **at most one** profile per student:

```javascript
db.profiles.createIndex({ studentId: 1 }, { unique: true })
```

It does not guarantee that every student has a profile, nor that `studentId` points to an existing student. Those are separate integrity rules. Query the profile with `db.profiles.findOne({ studentId: 1 })` or join it with `$lookup`.

Use a reference when profile data is large, sensitive to different access paths, or updated independently. Choose which side stores the link based on common queries; do not create two copies of the same relationship without a synchronization reason.

## 9. One-to-many: embedded — lecture 45

Suppose a course has a few fixed objectives:

```javascript
// courses
{
  _id: 10,
  title: "MongoDB Foundations",
  objectives: [
    { order: 1, text: "Understand documents" },
    { order: 2, text: "Write queries" }
  ]
}
```

The objectives are small, bounded, and normally read with the course. Embedding makes sense. Updating an objective and the course title within this one document can be atomic.

**Failure mode:** A course with millions of comments or an ever-growing activity log should not place every child in one parent array. The document grows, frequently updated arrays become expensive, and the 16 MiB limit becomes a real constraint. A page that needs only ten comments also should not have to fetch an enormous parent document.

**Rule of thumb:** Embed a bounded, parent-owned set. Reference an unbounded or independently useful set. [MongoDB: embedded data](https://www.mongodb.com/docs/manual/data-modeling/embedding/)

## 10. One-to-many: using references — lecture 46

```javascript
// courses
{ _id: 10, title: "MongoDB Foundations" }

// lessons
{ _id: 100, courseId: 10, order: 1, title: "Documents" }
{ _id: 101, courseId: 10, order: 2, title: "Queries" }
```

One course has many lesson records. Each lesson has a parent ID, so it can be found and paginated independently:

```javascript
db.lessons.find({ courseId: 10 }).sort({ order: 1 })
db.lessons.createIndex({ courseId: 1, order: 1 })
```

The index is a sensible starting point for this query shape. It does not enforce that the course exists. `courseId` should use the same value type as `courses._id`; `10` and `"10"` are not the same join key. If lesson order must be unique within a course, use a unique compound index `{ courseId: 1, order: 1 }` after checking existing data.

## 11. Many-to-many: embedding — lecture 47

A bounded many-to-many relation can be represented by small references or small snapshots inside each side:

```javascript
// A student document, when the list is genuinely small and bounded:
{ _id: 1, name: "Asha", courseIds: [10, 20] }

// A course document might contain a small instructorId list:
{ _id: 10, title: "MongoDB Foundations", instructorIds: [7, 8] }
```

This is an **array of references embedded in a document**, not an embedded copy of the full related records. It can be convenient for a short membership list.

Duplicating the full student in every course and the full course in every student creates two versions of shared data. Updating one name or title now requires multiple writes. A large enrollment relationship grows without bound, so a parent array is a poor fit.

For shared entities, distinguish **embedding IDs** from **embedding full entity data**. Both put values in the parent document, but their maintenance costs differ. [MongoDB: data modeling](https://www.mongodb.com/docs/manual/data-modeling/)

## 12. Many-to-many: references and a relationship collection — lecture 48

An enrollment belongs to exactly one student and one course, and has its own data:

```javascript
// students
{ _id: 1, name: "Asha" }
{ _id: 2, name: "Ben" }

// courses
{ _id: 10, title: "MongoDB Foundations" }
{ _id: 20, title: "Node Basics" }

// enrollments
{ _id: 1001, studentId: 1, courseId: 10,
  enrolledAt: ISODate("2026-01-10T00:00:00Z"), progressPercent: 40 }
{ _id: 1002, studentId: 1, courseId: 20,
  enrolledAt: ISODate("2026-02-10T00:00:00Z"), progressPercent: 10 }
{ _id: 1003, studentId: 2, courseId: 10,
  enrolledAt: ISODate("2026-03-10T00:00:00Z"), progressPercent: 70 }
```

Here Asha is enrolled in two courses and MongoDB Foundations has two students. The relationship itself is a document, which is useful when you need progress, status, or timestamps.

```javascript
db.enrollments.find({ studentId: 1 }) // Asha's two enrollments
db.enrollments.find({ courseId: 10 }) // Two students in course 10
```

If only one enrollment per student-course pair is allowed:

```javascript
db.enrollments.createIndex({ studentId: 1, courseId: 1 }, { unique: true })
db.enrollments.createIndex({ courseId: 1, studentId: 1 })
```

The first index prevents duplicate pairs and supports student-first queries; the second supports course-first queries. An enrollment ID still does not prove both referenced parents exist. [MongoDB: reference data](https://www.mongodb.com/docs/manual/data-modeling/referencing/)

## 13. Join referenced data with `$lookup` — lecture 50

The lecture title says `lookUp()`. The MongoDB aggregation **stage** is spelled `$lookup` (lowercase `l` after `$`), used inside `aggregate()`.

```javascript
// Assume the student, course, and enrollment documents above exist.
db.enrollments.aggregate([
  { $match: { studentId: 1 } },
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "course"
  } },
  { $project: {
      _id: 0, studentId: 1, progressPercent: 1,
      "course.title": 1
  } }
])
```

For Asha, the two enrollment outputs each contain a `course` array with the matching course title: `MongoDB Foundations` or `Node Basics`. `$lookup` adds an **array** of matching foreign documents, even if you expect zero or one. If an enrollment points to a missing course, `course` is `[]`; the source enrollment is still returned.

The related collection is named in `from`, not `db.courses`. For equality joins, index the foreign join field. Here `_id` already has an index. If you need a single course object rather than an array, you can unwind the lookup result, but decide what to do with unmatched enrollments. [MongoDB: $lookup](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)

**Design lesson:** `$lookup` is useful, but it is not a substitute for considering whether frequently read, bounded data should have been embedded.

## 14. Plan and implement the example exercise — lectures 51–52

These are **original** design steps, not a claim about the instructor's exact exercise.

### Requirements sheet

| Entity / operation | Decision |
|---|---|
| Student profile, usually displayed with student | Embed small profile in `students` |
| Course with independently managed lessons | `courses` and `lessons` collections, with `courseId` |
| Student-to-course enrollment with progress | `enrollments` collection with both IDs |
| Course title on the student's learning page | `$lookup` into `courses`, or deliberately maintain a snapshot if measured access warrants it |

### Minimal implementation in the dedicated practice database

```javascript
use section3_modeling_practice

db.students.insertMany([
  { _id: 1, name: "Asha", profile: { city: "Kolkata" } },
  { _id: 2, name: "Ben", profile: { city: "Mumbai" } }
])

db.courses.insertMany([
  { _id: 10, title: "MongoDB Foundations" },
  { _id: 20, title: "Node Basics" }
])

db.lessons.insertMany([
  { _id: 100, courseId: 10, order: 1, title: "Documents" },
  { _id: 101, courseId: 10, order: 2, title: "Queries" }
])

db.enrollments.insertMany([
  { _id: 1001, studentId: 1, courseId: 10, progressPercent: 40 },
  { _id: 1002, studentId: 1, courseId: 20, progressPercent: 10 },
  { _id: 1003, studentId: 2, courseId: 10, progressPercent: 70 }
])

db.lessons.createIndex({ courseId: 1, order: 1 })
db.enrollments.createIndex({ studentId: 1, courseId: 1 }, { unique: true })
db.enrollments.createIndex({ courseId: 1, studentId: 1 })
```

Run once in an empty practice database. If you already ran it, duplicate `_id` inserts fail; inspect existing data rather than blindly rerunning it. Real production models would also specify ownership, deletion behavior, authorization, validation, and migration strategy.

## 15. Schema validation — lectures 53–54

The flexible data model does **not** mean every document shape is equally valid for your app. Collection validation checks writes against defined rules. `$jsonSchema` is MongoDB's JSON Schema style validator and understands BSON types through `bsonType`.

Create a **new** validated practice collection:

```javascript
db.createCollection("validatedStudents", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "age"],
      properties: {
        name: { bsonType: "string", minLength: 1 },
        age: { bsonType: "int", minimum: 0, maximum: 130 },
        profile: {
          bsonType: "object",
          properties: { city: { bsonType: "string" } }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

db.validatedStudents.insertOne({ name: "Asha", age: Int32(28), profile: { city: "Kolkata" } })
```

`required` requires presence. A property rule describes the type **if present**; a property can be optional unless it appears in `required`. The example requires `age` to be BSON `int`; a different numeric BSON type may fail even when it represents 28. Use `bsonType: "number"` when any supported numeric BSON type is acceptable.

The validator does not rewrite invalid values into valid ones. It also does not automatically enforce referenced-parent existence. Continue validating meaningful relationships in application logic and with suitable indexes/constraints. [MongoDB: schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/), [MongoDB: `$jsonSchema` example](https://www.mongodb.com/docs/manual/core/schema-validation/specify-json-schema/)

### Test the failure deliberately

```javascript
// Expected to fail: age is a string, not BSON int.
db.validatedStudents.insertOne({ name: "Ben", age: "35" })

// Expected to fail: missing required name.
db.validatedStudents.insertOne({ age: Int32(35) })
```

Do not compare validation behavior using a different collection without checking its options; rules belong to a collection.

## 16. Change validation behavior — lecture 55

Two independent settings are easy to confuse:

| Setting | Question | Choices |
|---|---|---|
| `validationAction` | What happens when a checked write violates rules? | `error` rejects; `warn` allows but logs a warning |
| `validationLevel` | Which writes are checked? | `strict` applies rules to inserts/updates; `moderate` eases updates of already-invalid legacy documents |

Change validation action on the practice collection:

```javascript
db.runCommand({ collMod: "validatedStudents", validationAction: "warn" })

// This invalid document is now accepted, with a server log warning:
db.validatedStudents.insertOne({ name: "Cara", age: "22" })

// Restore rejection for later practice:
db.runCommand({ collMod: "validatedStudents", validationAction: "error" })
```

`warn` is useful when observing legacy data, but it does not protect the collection from invalid writes. `moderate` still checks inserts and valid existing documents; it can let updates of already-invalid documents pass without fixing them. Neither choice retroactively repairs stored data. [MongoDB: invalid document handling](https://www.mongodb.com/docs/manual/core/schema-validation/handle-invalid-documents/), [MongoDB: validation level](https://www.mongodb.com/docs/manual/core/schema-validation/specify-validation-level/)

To change the validator itself later, use `collMod` with a new `validator` document; first inspect the current collection options and test the new rules against existing data. [MongoDB: update schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/update-schema-validation/)

## 17. Common mistakes

| Mistake | Better interpretation |
|---|---|
| “MongoDB has no schema” | It has flexible storage; your app still has an intended schema |
| Model only by entity names | Start from reads, writes, lifecycle, cardinality, and growth |
| Embed every child | Unbounded arrays grow and can hit the document limit |
| Reference every child | Common reads may require extra queries or joins |
| Treat an ID reference like a foreign key | MongoDB does not automatically check that the target exists |
| Store full copies of shared data everywhere | Plan synchronization or store an ID/snapshot intentionally |
| Assume one-to-one requires embedding | Referencing may fit independent lifecycles |
| Assume many-to-many always means two huge ID arrays | A relationship collection can carry metadata and grow independently |
| Join on mismatched ID types | Numeric 10, string "10", and ObjectId are different values |
| Expect `$lookup` to yield one object | It returns an array of matches |
| Treat a shell object as literal JSON | `ObjectId(...)` and `ISODate(...)` are shell/BSON constructs |
| Require a field only under `properties` | Put it in `required` too |
| Think `warn` rejects bad writes | It allows them and logs a warning |
| Think changing a validator repairs old records | It controls future checked writes, not automatic migrations |

## 18. Practice — attempt before checking the answers

These are original exercises for revisiting the Section 3 ideas.

1. A user has one small address, displayed on every profile page. Embed or reference? Why?
2. A blog post can receive millions of comments. Where should comments live? Which ID would a comment store?
3. Students take many courses, and each enrollment has a grade and enrollment date. Model it.
4. You need a course list for student 1 with course titles. Which collection is the starting point, and what does `$lookup` produce?
5. A student document has `age: "22"`; a rule demands `bsonType: "int"`. Is it valid?
6. What does `validationAction: "warn"` do with an invalid insert?
7. Why does a unique index on `profiles.studentId` not prove every student has a profile?

### Answers

1. Usually embed: small, bounded, owned by one user, and read together. Reconsider if access/lifecycle requirements differ.
2. Separate `comments` collection; each comment can store `postId`. Index `postId` for retrieval and pagination.
3. Separate `enrollments` with `studentId`, `courseId`, `grade`, and `enrolledAt`; a unique compound index on the two IDs if duplicate enrollment is disallowed.
4. Start from `enrollments` filtered by `studentId: 1`, then `$lookup` `courses` on `courseId` to `_id`. The result field is an array, including `[]` for no match.
5. No. A string is not a BSON integer, even if it looks numeric.
6. The checked invalid write is allowed, and MongoDB records a warning in its log.
7. Uniqueness means at most one matching profile per student ID. It does not require a profile to be created for every student.

## 19. Fast revision for your future self — lecture 56

| Decision or concept | Remember |
|---|---|
| Schema | Your intended document shape and meaning |
| BSON | Stored format with more types than plain JSON |
| Embed | Small/bounded, owned, read/changed with parent |
| Reference | Large/unbounded, shared, independent, queried alone |
| One-to-one | Embed or reference according to lifecycle/access |
| One-to-many | Embed bounded children; reference growing independent children |
| Many-to-many | Relationship collection when the link grows or has metadata |
| Join references | `$lookup` stage; output is an array |
| Document limit | 16 MiB BSON document |
| Enforce at most one | Unique index on the linking key |
| Validate type/required fields | `$jsonSchema` with `bsonType`, `required`, `properties` |
| Reject invalid writes | `validationAction: "error"` |
| Observe invalid writes without rejecting | `validationAction: "warn"` |
| Apply validation broadly | `validationLevel: "strict"` |
| Ease migration of invalid legacy docs | `validationLevel: "moderate"` with its specific rules |

**The core memory:** Store together what is used and changed together, unless size, growth, sharing, or independent access argues for a reference. Flexible documents still need a coherent schema.

Before committing to a relationship model, draw one example record for each collection, write the three most common queries, estimate growth, and identify which consistency rules the database will enforce versus the application.

## 20. Course map and sources — lecture 57

| Course lecture | Notes section |
|---|---|
| 34: Resetting Your Database | 3 |
| 35–37: Introduction, Schemas, Structuring Documents | 1–2 |
| 38–40: Data Types, Types in Action, Limits | 4 |
| 41: Derive Structure from Requirements | 5 |
| 42: Understanding Relations | 6 |
| 43–44: One-to-One Embedded / References | 7–8 |
| 45–46: One-to-Many Embedded / References | 9–10 |
| 47–48: Many-to-Many Embedded / References | 11–12 |
| 49: Summarizing Relations | 6, 19 |
| 50: Using `$lookup` to Merge References | 13 |
| 51–52: Planning / Implementing Example Exercise | Original example in 14 |
| 53–55: Schema Validation, Adding Validation, Changing Action | 15–16 |
| 56: Wrap Up | 19 |
| 57: Useful Resources & Links | Official references beside each topic |

For a quick return years later, read sections 1 and 19, then examine the running example and the relevant relationship section. For implementation, check the documentation for your server and driver versions and test the model against real query patterns.
