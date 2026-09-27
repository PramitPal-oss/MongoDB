# Understanding One-to-Many (Reference) Relationships in MongoDB

## Overview

Previously, we looked at a **one-to-many relationship** where **embedding** made sense. Now, we’ll explore a scenario where **referencing (splitting data into collections)** is more appropriate — both from **application** and **technical** perspectives.

---

## Scenario: Cities and Their Citizens

Let’s consider a database that holds information about:

- Major cities (e.g., New York, Berlin)
- Citizens living in those cities

Conceptually, each city can have **millions of citizens** — making this a classic **one-to-many** relationship (one city → many citizens).

---

## The Embedding Problem

While embedding documents is often desirable for performance and simplicity, it comes with significant limitations in this case:

### 🔹 **1. Performance Overhead**

- When retrieving a list of all cities with their **metadata** (e.g., name, coordinates), we often **do not need** the list of citizens.
- Embedding millions of citizens would:
  - Increase the **data payload** unnecessarily
  - Slow down queries
  - Increase **network overhead** when transferring data over the wire

### 🔹 **2. Document Size Limitation (16MB)**

- MongoDB documents have a strict **16MB size limit**
- If we embed all citizens within a city document:
  - We can **easily hit** this limit for large cities
  - Keep in mind: the **16MB applies to the whole document**, including all **nested documents**
  - It’s **not** 16MB per nested element; it's **16MB total**

### ✅ **Conclusion**: For technical and application reasons, **splitting** this one-to-many relationship into **multiple collections** (referencing) makes sense.

---

## Recommended Data Modeling with Referencing

### 📁 **Cities Collection**

Each city has:

- A **name**
- **Coordinates** (latitude and longitude)
- **No embedded citizen data**

Example:

```json
{
  "_id": ObjectId("..."),
  "name": "New York City",
  "coordinates": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

### 📁 **Citizens Collection**

Each citizen:

- Has a **name**
- Has a **reference (foreign key)** to the city (by `cityId`)
- The `cityId` is stored as an `ObjectId` referencing the city document

Example:

```json
{
  "_id": ObjectId("..."),
  "name": "Max Schwarzmüller",
  "cityId": ObjectId("...") // references New York City
}
```

Another citizen:

```json
{
  "_id": ObjectId("..."),
  "name": "Manuel Lorenz",
  "cityId": ObjectId("...") // also references New York City
}
```

> 🔸 Note: You should always use a **unique and immutable identifier** to reference — usually, MongoDB’s `_id` (ObjectId) works best.

---

## Insert Operations

- You **insert cities** normally in the `cities` collection.
- You **insert citizens** in bulk using `insertMany`:

```js
db.citizens.insertMany([
  {
    name: 'Max Schwarzmüller',
    cityId: ObjectId('...'), // ID of New York City
  },
  {
    name: 'Manuel Lorenz',
    cityId: ObjectId('...'), // ID of New York City
  },
]);
```

> ⚠️ Don’t forget to wrap the inserted documents in square brackets `[]` when using `insertMany`.

> 🛠️ Also ensure you close all parentheses properly — for example when using `ObjectId("...")`.

---

## Querying Data

### ➕ Retrieve Cities (without citizens)

```js
db.cities.find().pretty();
```

This returns only **metadata** about cities — no unnecessary citizen data is fetched.

### ➕ Retrieve Citizens (and match them to cities)

```js
db.citizens.find().pretty();
```

You can match citizens to their cities using the `cityId`. Optionally, you can use `$lookup` for a join-like operation (aggregation).

---

## Key Advantages of Referencing

1. **Efficient Querying**:

   - Fetch only what you need (e.g., cities without citizens).

2. **Avoids Document Size Limit**:

   - 16MB limit is not a problem when documents are small and separate.

3. **Better Read/Write Performance**:

   - Updates to citizens don’t affect city documents.

4. **Flexible Schema Design**:

   - Easy to add more data to citizens or cities independently.

---

## Summary

| Aspect                  | Embedding                                    | Referencing                                     |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| **Performance**         | Heavy for large subdocuments                 | Light; selective querying                       |
| **Document Size Limit** | Risk of hitting 16MB                         | No risk (individual documents are small)        |
| **Use Case**            | Small subdocuments (e.g., comments on posts) | Large subdocuments (e.g., millions of citizens) |
| **Relationship**        | 1-to-few                                     | 1-to-many / many-to-many                        |

---

## Final Thoughts

When deciding between **embedding** and **referencing**, always consider:

- **Size of subdocuments**
- **Access patterns**
- **Update frequency**
- **Query optimization**

In this case — **millions of citizens per city** — referencing is the **clear and scalable choice**.

```

---

Let me know if you’d like the actual `.md` file download or if you want a visual diagram for this model!
```
