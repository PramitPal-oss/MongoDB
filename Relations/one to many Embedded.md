# MongoDB One-to-Many Relationship - Embedded vs Referenced

In this lesson, we explore how to model a **one-to-many relationship** in MongoDB using both the **reference approach** and the **embedded documents approach**. The example used is similar to a Q&A section, like that of Udemy, where:

- One **question thread** can have **multiple answers**.
- Each **answer** belongs to **only one question thread**.

This is a **typical one-to-many relationship**.

---

## 🛠 Setup

We'll start by creating a **`support` database** and within it, a **`questionThreads` collection**.

### Example Question Thread (without answers yet):

```json
{
  "creator": "Max",
  "question": "How does that all work? By the way, not how you should pose a question but more details please."
}
```

---

## 🔗 Modeling with References

In the **reference approach**, we separate the answers into their own collection (`answers`) and store **only the IDs of the answers** in the question thread.

### Step 1: Insert a Question Thread with Answer IDs

```json
{
  "_id": "q1",
  "creator": "Max",
  "question": "How does that all work? By the way, not how you should pose a question but more details please.",
  "answers": ["q1a1", "q1a2"]
}
```

> 📝 Note: We're manually assigning IDs here for simplicity.

### Step 2: Create the `answers` Collection and Insert Answers

```json
[
  {
    "_id": "q1a1",
    "text": "It works like that."
  },
  {
    "_id": "q1a2",
    "text": "Thanks."
  }
]
```

> Use `insertMany()` with an **array** of documents.

### Step 3: Querying the Data

- First, fetch the question thread.
- Then, using the array of answer IDs, fetch the answers from the `answers` collection.

> 🔍 MongoDB supports querying multiple documents using the `$in` operator. For example:

```js
db.answers.find({ _id: { $in: ['q1a1', 'q1a2'] } });
```

This avoids the need for multiple queries, but it's **still an additional request** beyond fetching the main document.

---

## 📦 Modeling with Embedded Documents

Now, let’s take a look at the **embedded approach**, which is often more practical and efficient for one-to-many relations **when the "many" side isn't massive**.

### Step 1: Start Fresh

Delete all existing documents from the `questionThreads` collection to avoid duplication.

```js
db.questionThreads.deleteMany({});
```

### Step 2: Insert a New Question Thread with Embedded Answers

```json
{
  "creator": "Max",
  "question": "How does that all work?",
  "answers": [{ "text": "It works like that." }, { "text": "Thanks." }]
}
```

### Step 3: Fetching Data

Now if we use `findOne()` to retrieve the question thread:

```js
db.questionThreads.findOne();
```

The result will include both the question and the embedded answers in a **single document**.

---

## ✅ When to Use Embedding

Embedding is **ideal** in scenarios like:

- Posts and comments
- Questions and answers
- Orders and items

### Embedding is better when:

- You **always need** the related data (e.g., fetch question and answers together).
- The "many" side is **not too large** (e.g., we don’t expect thousands of answers).
- You want to **reduce the number of reads** (fetch in one query).

> ⚠️ MongoDB has a 16MB document size limit. If the number of embedded documents might grow very large, **prefer references**.

---

## 📌 Summary

| Feature                       | Reference Approach            | Embedded Approach                     |
| ----------------------------- | ----------------------------- | ------------------------------------- |
| Structure                     | Separate `answers` collection | Answers are part of the question      |
| Querying                      | Requires 2 queries or `$in`   | Single query retrieves all data       |
| Suitable for large datasets   | ✅                            | ❌ Avoid if data size can exceed 16MB |
| Use when related data grows   | ✅                            | ❌                                    |
| Use when fetching all at once | ❌ Extra read                 | ✅ Efficient single read              |

---

## 🔍 Real-world Analogy

Think of:

- A **reference** approach as linking documents like foreign keys in SQL.
- An **embedded** approach as packing related data together for quick access.

> For a Q\&A app, embedding answers in a question thread makes a lot of sense because:
>
> - We rarely have too many answers.
> - We usually want to fetch both question and answers together.

---

## 🧠 Additional Notes

- MongoDB documents can store arrays and nested structures—ideal for JSON-like data modeling.
- Always consider the **read/write patterns** of your application when choosing between embedding and referencing.
- Use indexes wisely when using references to improve lookup performance.

---

## 📚 Related Topics

- MongoDB `$lookup` for joining collections
- Aggregation Framework
- Data Modeling Best Practices
- Indexing strategies in MongoDB

---
