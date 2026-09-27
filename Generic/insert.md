<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# MongoDB Insert Method

## Introduction

Thanks for joining the session.

In this session, we're going to discuss the **insert** method.

So let's get started.

## Insert Method

The **insert** method is used to insert a document or a set of documents into a collection.

### Syntax

The syntax of the insert method looks like this:

```javascript
collection.insert(document, options);
```

Here, we specify the **document** or an array of documents with comma separation along with an optional subset of parameters.

### Parameters

- **document**: A regular JSON document that will be inserted into the MongoDB database.
- **writeConcern**: An optional parameter that helps in expressing the write acknowledgment by the MongoDB server.
- **ordered**: If inserting multiple documents, this parameter can be set to `true` or `false`. It defines whether the documents should be inserted in an ordered or unordered manner.

## Demonstration

### Inserting a Single Document

For this example, we will use **Studio 3T**, which is freely available on the Studio 3T official website.

#### Steps:

1. Open **Studio 3T**.
2. Create a new database:

   ```javascript
   use test_insert_DB;
   ```

3. Create a collection:

   ```javascript
   db.createCollection('test_collection');
   ```

4. Insert a single document:

   ```javascript
   db.test_collection.insert({
     Name: 'MongoDB',
     Type: 'NoSQL',
     Subtype: 'Document-based Database',
   });
   ```

5. Execute the command.

**Result:**

- The shell output confirms that one document has been inserted successfully.

### Inserting Multiple Documents

1. Open **Studio 3T**.
2. Insert multiple documents:

   ```javascript
   db.test_collection.insert([
     {
       Name: 'Cassandra',
       Type: 'NoSQL',
       Subtype: 'Column-Oriented',
     },
     {
       Name: 'Neo4j',
       Type: 'NoSQL',
       Subtype: 'Graph-Based',
     },
     {
       Name: 'Redis',
       Type: 'NoSQL',
       Subtype: 'Key-Value Store',
     },
   ]);
   ```

3. Execute the command.

**Result:**

- The shell output shows `inserted: 3`, meaning three documents have been inserted successfully.

## Understanding WriteConcern and Ordered Parameter

### WriteConcern

**WriteConcern** is an optional parameter that specifies the acknowledgment level for write operations.

Example:

```javascript
db.test_collection.insert(
  { Name: 'PostgreSQL', Type: 'SQL', Subtype: 'Relational' },
  { writeConcern: { w: 1, j: true } }
);
```

- `w: 1` ensures that MongoDB acknowledges the write operation after writing to the primary.
- `j: true` ensures that the operation is written to the journal before acknowledgment.

### Ordered Parameter

When inserting multiple documents, the **ordered** parameter determines whether MongoDB stops inserting after encountering an error.

#### Example with Ordered = true

```javascript
db.test_collection.insert(
  [
    { Name: 'DB1', Type: 'SQL' },
    { Name: 'DB2', Type: 'SQL' },
    { _id: 1, Name: 'DB3', Type: 'SQL' },
    { _id: 1, Name: 'DB4', Type: 'SQL' },
  ],
  { ordered: true }
);
```

- If an error occurs (e.g., duplicate `_id`), MongoDB stops inserting further documents.

#### Example with Ordered = false

```javascript
db.test_collection.insert(
  [
    { Name: 'DB1', Type: 'SQL' },
    { Name: 'DB2', Type: 'SQL' },
    { _id: 1, Name: 'DB3', Type: 'SQL' },
    { _id: 1, Name: 'DB4', Type: 'SQL' },
  ],
  { ordered: false }
);
```

- MongoDB skips the document that caused the error and continues inserting the rest.

## Conclusion

- The **insert** method allows inserting single or multiple documents into a MongoDB collection.
- **WriteConcern** helps in defining write acknowledgments.
- The **Ordered** parameter determines whether an insertion stops on encountering an error.

Thank you for attending this session!
