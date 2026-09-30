// Run: mongosh "mongodb://127.0.0.1:27017" setup.mongodb.js
// Override database: MONGO_DB=ecommerce_aggregation mongosh ... setup.mongodb.js
const databaseName = (typeof process !== "undefined" && process.env.MONGO_DB) || "ecommerce_practice";
const database = db.getSiblingDB(databaseName);

// Minimal schema validation enforces document identity and key reference types.
// Application validation should additionally enforce business rules and totals.
const schemas = {
  customers: { required: ["email", "name", "status", "createdAt"], properties: { email: { bsonType: "string" }, name: { bsonType: "object" }, addresses: { bsonType: "array" } } },
  sellers: { required: ["sellerCode", "displayName", "status"], properties: { sellerCode: { bsonType: "string" }, commission: { bsonType: "object" } } },
  categories: { required: ["name", "slug", "ancestorIds", "level"], properties: { slug: { bsonType: "string" }, ancestorIds: { bsonType: "array" }, parentId: { bsonType: ["objectId", "null"] } } },
  products: { required: ["sellerId", "title", "variants", "status"], properties: { sellerId: { bsonType: "objectId" }, categoryIds: { bsonType: "array" }, variants: { bsonType: "array" }, attributes: { bsonType: "object" } } },
  warehouses: { required: ["code", "name", "location"], properties: { code: { bsonType: "string" }, location: { bsonType: "object" } } },
  inventory: { required: ["productId", "variantId", "warehouseId", "quantity"], properties: { productId: { bsonType: "objectId" }, variantId: { bsonType: "objectId" }, warehouseId: { bsonType: "objectId" }, quantity: { bsonType: "object" } } },
  inventory_movements: { required: ["variantId", "warehouseId", "type", "quantityDelta", "occurredAt"], properties: { variantId: { bsonType: "objectId" }, warehouseId: { bsonType: "objectId" }, quantityDelta: { bsonType: "int" } } },
  carts: { required: ["customerId", "status", "items"], properties: { customerId: { bsonType: "objectId" }, items: { bsonType: "array" } } },
  orders: { required: ["orderNumber", "customerId", "lines", "totals", "placedAt"], properties: { customerId: { bsonType: "objectId" }, lines: { bsonType: "array" }, totals: { bsonType: "object" } } },
  payments: { required: ["orderId", "idempotencyKey", "status"], properties: { orderId: { bsonType: "objectId" }, refunds: { bsonType: "array" } } },
  shipments: { required: ["orderId", "warehouseId", "items", "trackingEvents"], properties: { orderId: { bsonType: "objectId" }, warehouseId: { bsonType: "objectId" }, trackingEvents: { bsonType: "array" } } },
  returns: { required: ["returnNumber", "orderId", "items"], properties: { orderId: { bsonType: "objectId" }, items: { bsonType: "array" } } },
  reviews: { required: ["productId", "customerId", "rating", "aspects"], properties: { productId: { bsonType: "objectId" }, customerId: { bsonType: "objectId" }, rating: { bsonType: "int", minimum: 1, maximum: 5 } } },
  promotions: { required: ["code", "eligibility", "benefit"], properties: { code: { bsonType: "string" }, eligibility: { bsonType: "object" }, benefit: { bsonType: "object" } } },
  wishlists: { required: ["customerId", "name", "items"], properties: { customerId: { bsonType: "objectId" }, items: { bsonType: "array" } } },
  audit_events: { required: ["actor", "action", "entity", "occurredAt"], properties: { actor: { bsonType: "object" }, entity: { bsonType: "object" }, occurredAt: { bsonType: "date" } } }
};

for (const [name, shape] of Object.entries(schemas)) {
  const validator = { $jsonSchema: { bsonType: "object", required: shape.required, properties: shape.properties } };
  if (!database.getCollectionNames().includes(name)) {
    database.createCollection(name, { validator, validationAction: "error" });
  } else {
    database.runCommand({ collMod: name, validator, validationAction: "error" });
  }
}

const indexes = {
  customers: [[{ email: 1 }, { unique: true }]],
  sellers: [[{ sellerCode: 1 }, { unique: true }]],
  categories: [[{ slug: 1 }, { unique: true }], [{ parentId: 1, status: 1 }], [{ ancestorIds: 1 }]],
  products: [[{ "variants.sku": 1 }, { unique: true }], [{ sellerId: 1, status: 1, createdAt: -1 }], [{ categoryIds: 1, status: 1 }]],
  warehouses: [[{ code: 1 }, { unique: true }]],
  inventory: [[{ variantId: 1, warehouseId: 1 }, { unique: true }], [{ warehouseId: 1, updatedAt: -1 }]],
  inventory_movements: [[{ variantId: 1, warehouseId: 1, occurredAt: -1 }]],
  carts: [[{ customerId: 1, status: 1 }]],
  orders: [[{ orderNumber: 1 }, { unique: true }], [{ customerId: 1, placedAt: -1 }], [{ status: 1, placedAt: -1 }], [{ "lines.sellerId": 1, placedAt: -1 }]],
  payments: [[{ idempotencyKey: 1 }, { unique: true }], [{ provider: 1, providerPaymentId: 1 }, { unique: true }], [{ orderId: 1 }]],
  shipments: [[{ carrierName: 1, trackingNumber: 1 }, { unique: true }], [{ orderId: 1 }]],
  returns: [[{ returnNumber: 1 }, { unique: true }], [{ orderId: 1, createdAt: -1 }]],
  reviews: [[{ productId: 1, status: 1, createdAt: -1 }], [{ customerId: 1, orderId: 1 }]],
  promotions: [[{ code: 1 }, { unique: true }]],
  wishlists: [[{ customerId: 1, name: 1 }, { unique: true }]],
  audit_events: [[{ "entity.type": 1, "entity.id": 1, occurredAt: -1 }]]
};

for (const [name, definitions] of Object.entries(indexes)) {
  for (const [key, options = {}] of definitions) database.getCollection(name).createIndex(key, options);
}
print(`Ready: ${databaseName}; ${Object.keys(schemas).length} collections.`);
