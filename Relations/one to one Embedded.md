# 📘 MongoDB One-to-One Relationship: Embedding vs Referencing (Detailed Notes)

This note explores how to model a **one-to-one relationship** in MongoDB, particularly for a hospital management system where each **patient** has a single **disease summary**. The content is based on a real-world example with detailed MongoDB shell operations and explanation.

---

## 🏥 Scenario: Hospital Database

We are creating a **hospital database**. In our application:

- Every **patient** has one **disease summary**.
- Each **disease summary** belongs to exactly one **patient**.
- We are not dealing with medical history (like previous visits), but a **summary**.
  - e.g., `"is ill"`, `"had previous diseases"`, `list of diseases`, etc.

This establishes a **strict one-to-one relationship**.

---

## 🔁 Two Ways to Model 1:1 Relationships in MongoDB

1. **Referencing** (storing summary separately and referring to it using an ID)
2. **Embedding** (storing the summary as part of the patient document)

---

## 🔗 Approach 1: Referencing (Manual Reference ID)

### ➕ Step 1: Insert Patient

```js
use hospital; // Switch to new or create if not exists

db.patients.insertOne({
  name: "Max",
  age: 29,
  diseaseSummary: "summary-max-1" // manual reference ID
});
```

````

### ✅ Output Check:

```js
db.patients.findOne();
```

Should return:

```js
{
  _id: ObjectId("..."),
  name: "Max",
  age: 29,
  diseaseSummary: "summary-max-1"
}
```

---

### ➕ Step 2: Insert Disease Summary

```js
db.diseaseSummaries.insertOne({
  _id: 'summary-max-1', // using custom ID
  diseases: ['cold', 'broken leg'],
});
```

You could also have used an `ObjectId`, but then you'd have to insert this first to reference it properly.

---

### 🔍 Fetching Full Data in Two Steps

In your backend app (Node.js, PHP, Java, etc.), you'll typically:

1. Find the patient
2. Use the `diseaseSummary` field to find the actual summary

MongoDB Shell version:

```js
var dsid = db.patients.findOne({ name: 'Max' }).diseaseSummary;

db.diseaseSummaries.findOne({ _id: dsid });
```

### ⚠️ Drawback of Reference:

- Requires **two database reads**.
- Not optimal for **strong one-to-one relationships**.
- Could add unnecessary complexity and **slight performance overhead** in large-scale systems.

---

## 🧬 Approach 2: Embedding (Recommended for 1:1)

When there's a strong one-to-one relationship, embedding is usually the **preferred and efficient** option.

### 🧹 Step 1: Clean Patients Collection

```js
db.patients.deleteMany({});
```

### ➕ Step 2: Insert Patient with Embedded Summary

```js
db.patients.insertOne({
  name: 'Max',
  age: 29,
  diseaseSummary: {
    diseases: ['cold', 'broken leg'],
  },
});
```

### ✅ Fetch All at Once

```js
db.patients.findOne({ name: 'Max' });
```

Returns the complete patient data including the embedded summary:

```js
{
  _id: ObjectId("..."),
  name: "Max",
  age: 29,
  diseaseSummary: {
    diseases: ["cold", "broken leg"]
  }
}
```

---

## 🏁 Conclusion: Which One to Use?

| Factor                | Referencing                               | Embedding                            |
| --------------------- | ----------------------------------------- | ------------------------------------ |
| Relationship Type     | Loose, 1-to-many, many-to-many            | Strong 1-to-1 or 1-to-few            |
| Performance           | 2 DB calls (slightly slower)              | 1 DB call (faster)                   |
| Complexity            | Higher, requires managing two collections | Lower, single document               |
| Data Integrity        | More scalable for changes in summary data | Simpler for static/small summaries   |
| Data Access Frequency | Summary rarely accessed                   | Summary always accessed with patient |

🟢 **Use Embedding** when:

- You always need the summary with patient data.
- The summary size is relatively small.
- Data is not shared among other documents.

🔴 **Use Referencing** when:

- Disease summaries are large or accessed separately.
- You need to decouple patient and summary documents.

---

## 🧠 Key Takeaways

- MongoDB gives you flexibility in schema design.
- One-to-one relationships can be modeled via **embedding** or **referencing**.
- Choose the approach based on **use case**, **data access patterns**, and **performance** needs.
- For **strong 1:1** links like Patient ⇨ DiseaseSummary, **embedding** is often more efficient and clean.

---

```

Let me know if you'd like this saved as an actual `.md` file or need another topic from the same course transcribed like this!
```
````
