<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# MongoDB Embedded Documents and Arrays

## Embedded Documents

Embedded documents are a core feature of MongoDB. This feature allows you to have a field in a document that contains another document as its value. This is useful for structuring related data together within a single document.

For example, consider a document representing a user:

```json
{
  "_id": 1,
  "name": "John Doe",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipcode": "10001"
  }
}
```

Here, the `address` field is an embedded document containing fields like `street`, `city`, and `zipcode`.

MongoDB allows nesting of documents up to **100 levels deep**, though in practice, more than **three or four levels** is rarely needed. Additionally, a **single document cannot exceed 16MB** in size. While this might seem small, it is sufficient for most use cases since MongoDB is designed to store textual and structured data rather than large files (which should be handled using a dedicated file storage solution like GridFS).

## Arrays

Arrays in MongoDB allow storing multiple values in a field. These values can be of any data type, including other embedded documents.

Example of an array field:

```json
{
  "_id": 2,
  "name": "Alice",
  "hobbies": ["reading", "traveling", "cycling"]
}
```

Arrays can also hold embedded documents:

```json
{
  "_id": 3,
  "name": "Bob",
  "orders": [
    { "product": "Laptop", "price": 1200 },
    { "product": "Phone", "price": 800 }
  ]
}
```

This structure is useful for scenarios where related data should remain within a single document instead of being spread across multiple collections.

### Key Considerations:

- **Querying embedded documents and arrays**: MongoDB provides powerful querying capabilities, allowing filtering based on embedded fields and array elements.
- **Indexing**: Indexes can be created on embedded fields and array elements to improve query performance.
- **Updating embedded documents**: MongoDB supports dot notation (`address.city`) to update nested fields efficiently.

### Summary

- **Embedded documents** allow nesting documents within a field.
- **MongoDB supports up to 100 levels of nesting**, though practical usage rarely exceeds 3-4 levels.
- **Arrays** can store multiple values or embedded documents within a document.
- **A single document cannot exceed 16MB in size**.
- **MongoDB provides flexible querying, indexing, and updating capabilities for embedded documents and arrays.**
