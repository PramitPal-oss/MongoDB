<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# MongoDB: Understanding `find()` and Cursor Object

## Inserting Passenger Data

We've worked with our flight data quite a bit. Now, let's add another kind of data. First, clear the console using the `cls` command.

Now, add a `passengers` collection to the flight database and use `insertMany()` to insert multiple passenger documents. A file named `passengers.json` is attached, containing an array of passenger data (dummy names and ages). Copy the contents and insert them using:

```javascript
use flights;
db.passengers.insertMany([
    { name: "John Doe", age: 34 },
    { name: "Jane Smith", age: 29 },
    { name: "Albert Twostone", age: 45 },
    { name: "Gordon Black", age: 39 }
]);
```

This inserts multiple documents with automatically generated `_id`s.

## Viewing Passenger Data

To retrieve and pretty-print the data:

```javascript
db.passengers.find().pretty();
```

On first sight, the order appears correct, but upon closer inspection, the last entry may not be what you expected. To find the missing entry, use:

```javascript
db.passengers.find();
```

This may show a prompt like `type it for more`, meaning there are more results.

### Why Does This Happen?

The `find()` command does **not** return an array of documents. Instead, it returns a **cursor object**.

### Understanding Cursor Object

A cursor object is an iterable pointer to a set of results in MongoDB. Instead of fetching all documents at once, it efficiently retrieves them in batches. This is beneficial because:

1. The database can have millions of documents.
2. Fetching all documents at once would be **slow** and **consume excessive memory**.
3. Sending all documents over the network at once could cause **high latency and network congestion**.

By default, MongoDB shell retrieves only **the first 20 documents** and prompts for more.

## Converting Cursor to an Array

To fetch **all documents** at once and avoid seeing `type it for more`, use:

```javascript
db.passengers.find().toArray();
```

This exhausts the cursor and loads all results into memory.

### ForEach Method for Efficient Iteration

Instead of loading all data at once, `forEach()` processes documents **one at a time**, making it more memory-efficient:

```javascript
db.passengers.find().forEach((passenger) => printjson(passenger));
```

This fetches and processes each document **on demand**.

## Key Takeaways

1. **`find()` does not return all documents immediately** but instead returns a **cursor object**.
2. The MongoDB shell **automatically fetches the first 20 documents**.
3. To fetch all documents:
   - Use `.toArray()` to retrieve everything at once (not optimal for large datasets).
   - Use `.forEach()` to process documents **one at a time**.
4. **Find One vs. Find**:
   - `findOne()` returns **a single document directly** (not a cursor).
   - `find()` returns a **cursor**, which can be iterated over.

## Example Queries

### 1. Find All Passengers (Default Behavior):

```javascript
db.passengers.find();
```

### 2. Fetch and Pretty Print All Documents:

```javascript
db.passengers.find().pretty();
```

### 3. Convert Cursor to Array:

```javascript
db.passengers.find().toArray();
```

### 4. Use `forEach()` for Efficient Iteration:

```javascript
db.passengers.find().forEach((passenger) => printjson(passenger));
```

### 5. Find a Single Document:

```javascript
db.passengers.findOne();
```

> **Note:** `findOne()` does not return a cursor, so `.pretty()` does not work with it.

## Summary

- `find()` returns a **cursor**, not an array.
- The shell **limits output to 20 documents** at a time.
- Use `.toArray()` to load all documents at once (not optimal for large datasets).
- Use `.forEach()` for memory-efficient processing.
- `findOne()` returns a single document directly, not a cursor.

Understanding cursors is crucial for handling large datasets efficiently in MongoDB. 🚀
