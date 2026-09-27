MongoDB **schema validation** allows you to enforce rules on the structure of documents within a collection. It’s similar to how schemas work in relational databases but is optional and more flexible in MongoDB. Schema validation helps maintain data integrity and consistency.

---

## ✅ Full Example Explained: MongoDB Schema Validation

You provided a great starting point. Let's break it down and enhance it for **full understanding**, and then list **all types of validations** supported.

### 🎯 Purpose

To create a `user` collection where documents must meet certain structural and data-type requirements using the **`$jsonSchema`** validator.

---

## 🧠 Detailed Explanation of Each Part

```js
db.createCollection('user', {
   validator: {
      $jsonSchema: {
         bsonType: 'object',
         title: "user Object Validation",
         required: ["firstName", "lastName", "username", "email", "birthdate"],
         properties: {
```

- **`bsonType: 'object'`**: Each document must be an object.
- **`title`**: Optional, useful for documentation or tooling.
- **`required`**: An array of fields that must be present.

---

## 🔍 Field-Level Validation

### Example for `firstName`:

```js
firstName: {
   bsonType: "string",
   pattern: '^[a-zA-Z]+$',
   description: "'firstname' must be an alphabetic string and is required"
}
```

- **`bsonType: "string"`**: Only strings allowed.
- **`pattern`**: Regex to allow only alphabets.
- **`description`**: Optional, useful for debugging or tools.

### Other Fields:

- `middlename`: Optional, same rules as firstName.
- `email`: Pattern checks for valid email format.
- `birthdate`: `bsonType: "date"` ensures only valid JavaScript `Date` objects are allowed.

---

## 🔐 All Available Validations in `$jsonSchema`

Here’s a table of most used schema validation keywords and their descriptions:

| Keyword                          | Description                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `bsonType`                       | Type of the field (`string`, `int`, `date`, `bool`, `array`, `object`, etc.) |
| `required`                       | Fields that must be present                                                  |
| `properties`                     | Fields inside the object                                                     |
| `pattern`                        | Regex pattern (for strings)                                                  |
| `minimum`                        | Minimum value (for numbers)                                                  |
| `maximum`                        | Maximum value (for numbers)                                                  |
| `minLength`                      | Minimum string length                                                        |
| `maxLength`                      | Maximum string length                                                        |
| `enum`                           | Restrict field to specific values                                            |
| `items`                          | Validation rules for array items                                             |
| `minItems`                       | Minimum number of items in an array                                          |
| `maxItems`                       | Maximum number of items in an array                                          |
| `uniqueItems`                    | Items in the array must be unique                                            |
| `additionalProperties`           | Whether extra fields are allowed                                             |
| `oneOf`, `anyOf`, `allOf`, `not` | Advanced logic conditions                                                    |

---

## 🧪 Example with More Validations

```js
db.createCollection('user', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'age', 'roles'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: 'Username must be between 3 and 30 characters',
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Must be a valid email',
        },
        age: {
          bsonType: 'int',
          minimum: 13,
          maximum: 120,
          description: 'Age must be a number between 13 and 120',
        },
        roles: {
          bsonType: 'array',
          items: {
            bsonType: 'string',
            enum: ['admin', 'user', 'moderator'],
          },
          minItems: 1,
          uniqueItems: true,
          description: 'Roles must include at least one unique valid role',
        },
        isActive: {
          bsonType: 'bool',
          description: 'Boolean flag to show if user is active',
        },
      },
    },
  },
});
```

---

## 📌 Important Notes

- Schema validation **does not retroactively apply** to existing documents unless they are updated.
- Use the `validationLevel` and `validationAction` options:

  - **`validationLevel: "strict"`** (default): Only validates inserts/updates that include schema-defined fields.
  - **`validationAction: "error"`** (default): Reject non-compliant documents.

    - `"warn"` logs a warning but allows the write.

Example:

```js
validationLevel: "strict",
validationAction: "warn"
```

---

## ✅ Use Case Summary

MongoDB schema validation is helpful when:

- You want to enforce consistent structure.
- You want to prevent bad data being inserted.
- You're working with tools or APIs that depend on consistent schemas.

---

If you want, I can help you build:

- A **complex schema** with nested objects or arrays.
- A **validation test script** in Node.js using Mongoose or native driver.

Just let me know!

Great question!

To **check the existing validation rules** of a collection in MongoDB, you can use the following command in the MongoDB shell:

---

### 🔍 View Validation of a Collection

```js
db.getCollectionInfos({ name: 'yourCollectionName' });
```

This returns the collection metadata including validation rules.

---

### ✅ Example

Suppose your collection is `userProfiles`. Run:

```js
db.getCollectionInfos({ name: 'userProfiles' });
```

You’ll get output like:

```json
[
  {
    "name": "userProfiles",
    "type": "collection",
    "options": {
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["username", "email", "isActive", "createdAt"],
          "properties": {
            ...
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    }
  }
]
```

This shows:

- The **validator rules**
- The **validation level**
- The **validation action**

---

### 📌 Alternative: `db.runCommand`

If you want just the validator and validation settings, use:

```js
db.runCommand({ collMod: 'userProfiles' });
```

But if there are no changes, this won't return the validator unless you're modifying it. So prefer `getCollectionInfos()` for inspecting.

---

### How to edit Previous Validation :

To **edit or update the validation schema** of an existing collection in MongoDB, you use the command:

```js
db.runCommand({
  collMod: "yourCollectionName",
  validator: { ... },
  validationLevel: "strict",     // optional (defaults to "strict")
  validationAction: "error"      // optional (defaults to "error")
});
```

---

## ✅ Step-by-Step Example

Let's say you want to update the `user` collection's validation (e.g., to **disallow extra fields**).

### 1. Use `collMod` to modify the validator:

```js
db.runCommand({
  collMod: 'user',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'user Object Validation',
      required: ['firstName', 'lastName', 'username', 'email', 'birthdate'],
      additionalProperties: false, // 👈 NEW LINE to disallow extra fields
      properties: {
        firstName: {
          bsonType: 'string',
          pattern: '^[a-zA-Z]+$',
          description: "'firstname' must be an alphabetic string and is required",
        },
        middlename: {
          bsonType: 'string',
          pattern: '^[a-zA-Z]+$',
          description: "'middlename' must be an alphabetic string if provided",
        },
        lastName: {
          bsonType: 'string',
          pattern: '^[a-zA-Z]+$',
          description: "'lastName' must be an alphabetic string and is required",
        },
        username: {
          bsonType: 'string',
          pattern: '^[a-zA-Z]+$',
          description: "'username' must be an alphabetic string and is required",
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: "'email' must be a valid email and is required",
        },
        birthdate: {
          bsonType: 'date',
          description: "'birthdate' must be a valid date and is required",
        },
      },
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
});
```

---

## 🔁 Repeat for Other Collections

You can use this same command to edit validation rules for **`post`**, or any other collection. Just replace:

- `"user"` with your collection name
- Update or add schema rules inside `validator`

---

## 🧠 Pro Tip

You can check if your changes worked with:

```js
db.getCollectionInfos({ name: 'user' });
```

Or try inserting invalid data and confirm it fails.

---

Would you like help updating the `post` collection with `additionalProperties: false` (including nested ones like in `comments[]`)?
