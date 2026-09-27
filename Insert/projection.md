<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# MongoDB Projection

## What is Projection?

Projection in MongoDB is a technique used to retrieve only specific fields from a document rather than fetching the entire document. This helps in optimizing performance, reducing bandwidth usage, and improving overall efficiency when querying a database.

### Example Use Case

Consider a document in a MongoDB collection that holds information about a person:

```json
{
  "_id": "123abc",
  "name": "John Doe",
  "age": 30,
  "job": "Software Engineer"
}
```

If you only need the `name` and `age` fields in your application, fetching all fields would be unnecessary and would increase bandwidth usage. Instead, you can use projection to retrieve only the required fields.

## Using Projection in MongoDB

Projection is implemented using the `.find()` method in MongoDB. The first argument is the filter condition, and the second argument specifies the fields to include or exclude.

### Including Fields

To fetch only specific fields, set their value to `1`:

```js
db.passengers.find({}, { name: 1, age: 1 });
```

This query retrieves only the `name` and `age` fields from all documents. However, by default, MongoDB always includes the `_id` field.

### Excluding the `_id` Field

To exclude the `_id` field, set it to `0` explicitly:

```js
db.passengers.find({}, { name: 1, age: 1, _id: 0 });
```

This ensures that only the `name` and `age` fields are returned, and the `_id` is omitted from the results.

### Excluding Fields Instead of Including

Rather than specifying which fields to include, you can specify which fields to exclude by setting them to `0`. For example, to exclude `job`:

```js
db.passengers.find({}, { job: 0 });
```

This will return all fields except `job`.

## Key Takeaways

1. **Projection reduces the amount of data retrieved**, improving performance.
2. **Fields set to `1` are included in the result** (except `_id`, which is always included by default unless explicitly excluded).
3. **Fields set to `0` are excluded from the result**.
4. **Projection happens on the MongoDB server** before sending the data, reducing unnecessary data transfer.

## Additional Example

Consider a collection of products:

```json
{
  "_id": "001",
  "name": "Laptop",
  "price": 1200,
  "category": "Electronics",
  "stock": 50
}
```

If you only need the `name` and `price`, you can use:

```js
db.products.find({}, { name: 1, price: 1, _id: 0 });
```

This query will return:

```json
[{ "name": "Laptop", "price": 1200 }]
```

Projection is a powerful tool in MongoDB that allows for efficient data retrieval and minimizes unnecessary data transfer, making applications more performant and optimized.
