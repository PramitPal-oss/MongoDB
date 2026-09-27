<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

## InsertMany

### Introduction

Hi there.

Thanks for joining the session.

In this session, we're going to discuss the `insertMany` method and explore some examples.

### InsertMany Method

This method is useful for inserting multiple documents into the collection.

#### Syntax

```javascript
// Example Syntax
db.collection.insertMany([document1, document2, ...], options)
```

### Explanation

1. **Collection**: The MongoDB collection where the documents will be inserted.
2. **Documents**: An array of JSON documents to insert into the collection.
3. **Options**:
   - **Write Concern** (optional) - Expresses write acknowledgment.
   - **Order** (optional) - Defines whether to insert documents in order.

### Write Concern

Similar to `insertOne`, the write concern determines the level of acknowledgment for writing data.

### Order Parameter

The `order` parameter is a boolean value:

- **`true` (default)**: Inserts documents in the given order and stops on the first error.
- **`false`**: Tries to insert all documents even if some fail.

### Demo

#### Example: Inserting Multiple Documents

We will use **Studio 3T** for inserting data.

```javascript
db.test_insert.testCollection3.insertMany([
  { name: 'Alan', age: 25 },
  { name: 'Ellis', age: 20 },
  { name: 'John', age: 30 },
]);
```

**Output:**

```
{
  "acknowledged": true,
  "insertedIds": [ ObjectId("..."), ObjectId("..."), ObjectId("...") ]
}
```

This confirms that three documents were inserted successfully with unique `_id` values.

#### Post Execution Check

- Refresh the database in **Studio 3T**.
- Check that `testCollection3` contains `3` documents.

---

## Summary

- **`insertOne`**: Inserts a single document.
- **`insertMany`**: Inserts multiple documents.
- **Write Concern**: Ensures acknowledgment of write operations.
- **Order Parameter**: Controls ordered vs unordered inserts.

This concludes the session on MongoDB `insertOne` and `insertMany` methods.

**Thank you!**
