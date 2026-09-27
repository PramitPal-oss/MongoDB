<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# MongoDB InsertOne and InsertMany Methods

## InsertOne

### Introduction

Hi there.

Thanks for joining the session.

In this session, we will explore the `insertOne` method.

So let's get started.

### InsertOne Method

This method helps in inserting a single document into the collection.

The `insertOne` method syntax looks like this:

```javascript
// Example Syntax
collection.insertOne(document, options);
```

### Explanation

1. **Collection**: The MongoDB collection where the document will be inserted.
2. **Document**: A single JSON document to insert into the collection.
3. **Options**: An optional parameter where we can specify the write concern.

### Write Concern

The write concern is an optional parameter that helps in expressing the write acknowledgment from MongoDB. It determines the level of assurance requested from MongoDB when writing data.

Write concern options include:

- `{ w: 0 }` – No acknowledgment.
- `{ w: 1 }` – Acknowledgment from the primary.
- `{ w: "majority" }` – Acknowledgment from the majority of replica set members.

### Demo

#### Example 1: Regular Insert

We will use **Studio 3T** for inserting and exploring the data.

```javascript
db.test_insert.testCollection.insertOne({
  name: 'Golan',
  item: 'Card',
  quantity: 15,
});
```

**Output:**

```
{ "acknowledged": true, "insertedId": ObjectId("...") }
```

The output confirms that the document is inserted successfully, and an `insertedId` is returned.

#### Example 2: Insert with `_id` Field

By default, MongoDB assigns an `_id` field. However, we can also specify our own `_id`.

```javascript
db.test_insert.testCollection.insertOne({
  _id: 1234,
  item: 'Peanuts',
  quantity: 2000,
});
```

**Output:**

```
{ "acknowledged": true, "insertedId": 1234 }
```

Here, the `_id` is explicitly set to `1234`.

---
