<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# Understanding the insert() Method in MongoDB

## Starting the MongoDB Server

If your MongoDB server is not running, you need to start it again. Once started, you can connect to it.

## Checking Database Content

After connecting, if you find that there is no data in your MongoDB instance, it means that the database is either empty or has been reset.

## Dropping a Database

If there is any existing data that you want to remove, you can use the following command:

```javascript
db.dropDatabase();
```

This command will delete the current database and all its data. If the database does not exist, MongoDB will not throw an error.

## Inserting Data into MongoDB

### Switching to a Database

To store data, you first need to switch to a database. For example, you can use:

```javascript
use contactData
```

### Inserting a Single Document

To insert a document into a collection, use the `insertOne` method. If the collection does not exist, MongoDB will create it automatically.

```javascript
db.persons.insertOne({
  name: 'Max',
  age: 30,
  hobbies: ['sports', 'cooking'],
});
```

- Documents in MongoDB are written inside `{}` (curly braces).
- Fields are written as `key: value` pairs.
- String values are enclosed in quotes, while numbers are not.
- Arrays are enclosed in `[]` (square brackets).
- An `_id` field is automatically generated, which is unique and contains a temporal component.

If another document is inserted, the order of documents will follow their `_id` values.

```javascript
db.persons.insertOne({
  name: 'Manuel',
  age: 31,
  hobbies: ['cooking', 'cars'],
});
```

### Inserting Multiple Documents

To insert multiple documents at once, use `insertMany`.

```javascript
db.persons.insertMany([
  { name: 'Anna', age: 29, hobbies: ['sports', 'yoga'] },
  { name: 'Maria', age: 27 },
  { name: 'Chris', age: 35 },
]);
```

- Unlike `insertOne`, `insertMany` requires an array of documents.
- Each document is separated by a comma inside the square brackets.
- Documents within the same collection do not need to have the same structure.

#### Important Notes on `insertMany`

- You **must** use an array even if inserting a single document.
- If an array is not used, MongoDB will throw an error.
- `insertMany` is useful when bulk-inserting data.

### Using the `insert` Method

Although MongoDB supports the `insert` method, it is **not recommended**. However, it is still usable for inserting data.

```javascript
db.persons.insert({
  name: 'Phil',
  age: 40,
});
```

#### Differences Between `insert`, `insertOne`, and `insertMany`

- `insertOne` and `insertMany` explicitly return the inserted document's `_id`.
- `insert` does **not** return `_id` directly, making it harder to track the inserted document.
- When inserting multiple documents with `insert`, MongoDB performs a bulk write operation.

Example:

```javascript
db.persons.insert([
  { name: 'Sandeep', age: 28 },
  { name: 'Hans', age: 38 },
]);
```

This works, but the response does not include `_id`, making it less useful.

## Why Prefer `insertOne` and `insertMany`?

- They return the `_id` of inserted documents, which is crucial for application logic.
- In an application, retrieving the `_id` immediately helps with features like deleting a document.
- `insert` provides unnecessary output, such as confirming that no elements were removed, which is redundant for an insert operation.
- `insertOne` and `insertMany` have clearer syntax and better error handling.

## Querying Inserted Data

To verify inserted data, use:

```javascript
db.persons.find().pretty();
```

This command retrieves all documents from the `persons` collection and formats them for better readability.

## Conclusion

- `insertOne` is used for inserting a single document and returns `_id`.
- `insertMany` is used for inserting multiple documents efficiently.
- `insert` is outdated and should be avoided.
- Always verify inserted data using `find().pretty()`.
- The `_id` field is essential for tracking documents, especially in frontend applications where user actions (e.g., delete) depend on it.

By following these best practices, you can efficiently manage data insertion in MongoDB while maintaining clarity and usability in your applications.
