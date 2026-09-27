<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# Working with Ordered and Unordered Inserts in MongoDB

## Overview

In this module, we explore the different insert methods available in MongoDB and how they function. Additionally, we briefly touch on an alternative way of inserting data that appears in the update module, where documents can be updated or inserted if they do not exist yet.

## Insert Methods in MongoDB

MongoDB provides multiple ways to insert data into collections. Understanding how these methods function allows for optimized data management.

### Inserting Multiple Documents

A common use case in MongoDB is inserting multiple documents into a collection. For example, let's consider a `hobbies` collection that stores different hobbies.

```json
[{ "name": "sports" }, { "name": "cooking" }, { "name": "cars" }]
```

Executing an insert operation will generate auto-generated `_id` fields for each document. These IDs are unique and ensure distinct records.

### Custom IDs for Documents

In certain cases, you may want to define your own `_id` values instead of using MongoDB's default object IDs. This might be necessary if:

- The data is fetched from another database that already has an ID.
- A shorter or more meaningful ID is needed.

Example:

```json
[
  { "_id": "sports", "name": "sports" },
  { "_id": "cooking", "name": "cooking" },
  { "_id": "cars", "name": "cars" }
]
```

- The `_id` field must be explicitly defined.
- It must be unique within the collection.
- Case sensitivity does not matter (e.g., "Cooking" and "cooking" would be different IDs).

### Handling Duplicate Inserts

If an attempt is made to insert a document with an `_id` that already exists, MongoDB will throw a **duplicate key error**.

Example:

```json
[
  { "_id": "yoga", "name": "yoga" },
  { "_id": "cooking", "name": "cooking" },
  { "_id": "hiking", "name": "hiking" }
]
```

If `cooking` already exists in the collection, MongoDB will return an error.

#### Error Message Breakdown:

- **Write error at item 1**: Indicates failure at index `1` (arrays start from `0`).
- **Duplicate key error collection**: The insertion failed due to an existing `_id`.
- **Yoga was inserted but cooking failed**: This demonstrates MongoDB's default behavior where operations halt upon encountering an error.

## Ordered vs Unordered Inserts

MongoDB handles batch inserts using **ordered** and **unordered** modes. Understanding these modes helps in efficiently managing bulk inserts.

### Ordered Inserts (Default Behavior)

- Each document is processed sequentially.
- If an error occurs, MongoDB stops further inserts.
- **Inserted documents remain in the collection, but no rollback occurs**.

#### Example of an Ordered Insert:

```javascript
db.hobbies.insertMany([
  { _id: 'yoga', name: 'yoga' },
  { _id: 'cooking', name: 'cooking' },
  { _id: 'hiking', name: 'hiking' },
]);
```

- If `cooking` already exists, the operation will fail at index `1`, and `hiking` will not be inserted.
- The already inserted documents (e.g., `yoga`) remain in the collection.

### Unordered Inserts (Handling Errors Gracefully)

- MongoDB attempts to insert all documents, even if some fail.
- Errors do not halt the operation; instead, failures are logged.
- This is useful when duplicate data might already exist in the database.

#### Example of an Unordered Insert:

```javascript
db.hobbies.insertMany(
  [
    { _id: 'yoga', name: 'yoga' },
    { _id: 'cooking', name: 'cooking' },
    { _id: 'hiking', name: 'hiking' },
  ],
  { ordered: false }
);
```

#### Behavior:

- Even if `cooking` already exists, MongoDB will continue inserting `hiking`.
- The error message will list all failed inserts, but successful ones remain.
- This method prevents unnecessary failures when checking for existing data is impractical.

## Key Takeaways

1. **Ordered Inserts (Default)**:

   - Stops at the first error.
   - Already inserted documents remain.
   - Useful when all data must be inserted without conflict.

2. **Unordered Inserts**:

   - Continues inserting despite errors.
   - Logs all errors.
   - Useful when duplicate entries are expected and should be ignored.

3. **Custom `_id` Fields**:

   - Helps in cases where predefined IDs are required.
   - Avoids unnecessary MongoDB-generated ObjectIDs.

4. **Rollback is not supported in batch inserts**:
   - MongoDB does not revert changes in case of errors.
   - Transactions must be used for rollback (covered in the transactions module).

By understanding how ordered and unordered inserts work, you can optimize bulk insert operations based on your application's requirements.
