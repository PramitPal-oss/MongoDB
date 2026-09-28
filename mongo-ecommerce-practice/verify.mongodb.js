const name = (typeof process !== "undefined" && process.env.MONGO_DB) || "ecommerce_practice";
const database = db.getSiblingDB(name);
const names = ["customers", "sellers", "categories", "products", "warehouses", "inventory",
  "inventory_movements", "carts", "orders", "payments", "shipments", "returns", "reviews",
  "promotions", "wishlists", "audit_events"];
const counts = names.map(collection => ({ collection, count: database.getCollection(collection).countDocuments({}) }));
printjson(counts);
const missingProduct = database.orders.aggregate([
  { $unwind: "$lines" },
  { $lookup: { from: "products", localField: "lines.productId", foreignField: "_id", as: "product" } },
  { $match: { product: { $size: 0 } } }, { $count: "count" }
]).toArray()[0]?.count || 0;
const mismatchedTotals = database.orders.countDocuments({ $expr: { $ne: ["$totals.grandTotal",
  { $add: [{ $subtract: ["$totals.subtotal", "$totals.discount"] }, "$totals.shipping", "$totals.tax"] }] } });
printjson({ missingOrderLineProducts: missingProduct, mismatchedOrderTotals: mismatchedTotals });
