# MongoDB Ecommerce: 200-Question Interview Workbook

This workbook uses the 16-collection `ecommerce_practice` dataset. Work in `mongosh`. Questions deliberately have **no solutions** so you can solve them yourself. Write the query, run it, and explain *why* it works. Difficulty: **E** = easy, **M** = medium, **H** = hard.

## Before you start

```javascript
use ecommerce_practice
db.orders.countDocuments({}) // expected: 5000
```

For exercises that **write, delete, create indexes, or change validators**, use a separate practice database so your original import remains intact. One option is to import the same JSON into `ecommerce_practice_lab` and rerun `setup.mongodb.js` with `MONGO_DB=ecommerce_practice_lab`. In Git Bash: `MONGO_DB=ecommerce_practice_lab mongosh "mongodb://127.0.0.1:27017" setup.mongodb.js` and `MONGO_DB=ecommerce_practice_lab bash import.sh`. Run reads against either database.

The generated dataset intentionally has **one order line and one return request per order**, one variant per product, and all shipments marked delivered. Exercises requiring multiple lines, multiple variants, payment failures, approved returns, or changing states explicitly ask you to create a few additional test documents or adapt a copy. Do not mistake this practice distribution for normal ecommerce ratios. IDs are BSON `ObjectId`, money is `Decimal128`, dates are BSON dates, and integer fields may be BSON `Int32`.

For each question, save: (1) your query, (2) a sample result, (3) one sentence explaining the operators, and (4) whether an index could help. For aggregation questions, also explain what one document looks like after each stage.

### Ten-minute syntax refresher

```javascript
db.customers.findOne({ email: "customer0@example.test" })
db.customers.find({ status: "ACTIVE" }, { email: 1, _id: 0 }).limit(5)
db.customers.countDocuments({ status: "ACTIVE" })
db.customers.updateOne({ email: "customer0@example.test" }, { $set: { "preferences.marketingOptIn": true } })
db.orders.aggregate([{ $match: { status: "DELIVERED" } }, { $group: { _id: "$currency", orders: { $sum: 1 } } }])
db.orders.find({ customerId: ObjectId("000100000000000000000000") })
db.orders.find({ "totals.grandTotal": { $gte: NumberDecimal("10000.00") } })
```

`find()` reads documents; the second argument is a projection. `$` introduces query, update, or aggregation operators depending on context. Dot notation addresses nested paths. `ObjectId`, `NumberDecimal`, and `ISODate` are constructors in `mongosh`. An aggregation is an ordered array of stages; inspect intermediate results while learning. Run write examples in your lab copy.

## 1. Shell, documents, and first reads (1–20)

1. **[E]** Switch to `ecommerce_practice` and list all collection names. How many are there?
2. **[E]** Count documents in every collection without manually writing 16 separate commands.
3. **[E]** Return one customer document and identify its `_id`, embedded objects, arrays, and dates.
4. **[E]** Fetch the customer whose email is `customer0@example.test`.
5. **[E]** Fetch the order with `orderNumber` `ORD-2026-000000`.
6. **[E]** Return five product titles and slugs, excluding `_id`.
7. **[E]** Show ten sellers sorted by `sellerCode` ascending.
8. **[E]** Count active products using `countDocuments`.
9. **[E]** Find products belonging to the seller referenced by a product you first selected. Reuse its `ObjectId`, not its string representation.
10. **[E]** Find the product variant whose SKU is `SKU-000000`.
11. **[E]** Return only the `technical.memory` object for product `product-0`.
12. **[E]** Find customers whose loyalty tier is `GOLD`.
13. **[E]** Find warehouses with `location.address.city` equal to `Kolkata`.
14. **[E]** Find orders placed in January 2025 using an inclusive start and exclusive end date.
15. **[E]** Find products whose first variant's sale price is greater than `NumberDecimal("15000.00")`.
16. **[E]** Return the distinct loyalty tiers present in `customers`.
17. **[E]** Count return requests with status `REQUESTED`.
18. **[M]** Explain the difference between `findOne`, `find`, and `countDocuments` on these collections, then demonstrate each.
19. **[M]** Compare an order's `customerId` with a customer's `_id`. Why would querying with the same hex text as a plain string fail?
20. **[M]** Inspect one canonical Extended JSON line from `data/orders.json`. Identify the representations of `ObjectId`, date, and `Decimal128` after import.

## 2. Filters, arrays, and operators (21–40)

21. **[E]** Find customers who opted into marketing and have a `GOLD` loyalty tier.
22. **[E]** Find customers with loyalty points between 500 and 1,000 inclusive.
23. **[E]** Find products with status in `ACTIVE` or `DRAFT`.
24. **[E]** Find orders whose grand total is at least `NumberDecimal("25000.00")`.
25. **[E]** Find products with `16` GB of technical memory.
26. **[M]** Find customers whose `preferences.favoriteCategories` contains a category `_id` you selected.
27. **[M]** Find orders whose `lines.discounts` array is nonempty. Do not accidentally include missing arrays.
28. **[M]** Find orders with a line discount whose code begins with `PROMO-1`.
29. **[M]** Find shipments with a `trackingEvents` entry whose `code` is `IN_TRANSIT`.
30. **[M]** Find returns with an item whose `reason.code` is `DAMAGED`.
31. **[M]** Find reviews where at least one aspect has `name: "quality"` and rating at most 2. Use `$elemMatch` so both predicates apply to the same element.
32. **[M]** Find products where one variant has `color: black` and `storage: 512GB` in its `optionValues`. Explain what `$elemMatch` can and cannot prove across two different elements.
33. **[M]** Find customers with at least one saved address marked `isDefault: true`.
34. **[M]** Find promotions whose `eligibility.any` includes a rule for `item.sellerId`.
35. **[M]** Find orders with exactly one line using `$size`.
36. **[M]** Find carts with at least two items without relying on `$size` inside an ordinary range predicate.
37. **[M]** Find products whose `attributes.compliance.certifications` has a `BIS` certificate valid after a given date.
38. **[H]** Find shipments where `DELIVERED` occurs after `PICKED_UP` in the same tracking array. Use an expression or aggregation; explain why a simple dot-notation filter is insufficient.
39. **[H]** Find orders where any line's `shippedQuantity` is less than its `quantity`, using `$expr` with array expressions. Expect zero in the untouched seed.
40. **[H]** Compare `$in`, `$all`, `$elemMatch`, `$exists`, and `$type` with one concrete query against this dataset for each.

## 3. Projection, sorting, pagination, and joins for reads (41–60)

41. **[E]** Show the ten newest orders with order number, placement date, and grand total only.
42. **[E]** Sort products by `createdAt` descending and return page 2 with page size 20 using `skip` and `limit`.
43. **[M]** Implement keyset pagination for orders sorted by `placedAt` descending and `_id` descending. Write the second-page filter from the last item on page 1.
44. **[M]** Explain why the two-field sort in question 43 needs a tie-breaker.
45. **[E]** Project only customer name, email, and the label of the first saved address.
46. **[M]** Return a product's `variants` entry for SKU `SKU-000010` using an array projection technique.
47. **[M]** Compare positional `$`, `$elemMatch`, and `$slice` projections against product or cart arrays.
48. **[M]** Find 20 reviews sorted by rating descending and creation time descending, returning only title, rating, and aspects.
49. **[M]** Return the five highest-value orders from the earliest 100 orders by placement date. State which sort happens first.
50. **[M]** Find customers whose email starts with `customer1` and explain whether your regex can use the email index efficiently.
51. **[M]** Find products whose title contains `Product 12`; compare a regex approach with an indexed search design.
52. **[M]** Use `$lookup` to attach customer name and email to five orders.
53. **[M]** Use `$lookup` to show a payment's order number and grand total.
54. **[M]** Find orders with no matching payment record using `$lookup` and an empty-array check. Expect zero on the untouched seed.
55. **[M]** Join a shipment with its warehouse, returning warehouse name and carrier tracking number.
56. **[M]** Show a product's seller name and category names using two lookups.
57. **[H]** Return each order with an array of its reviews, but project only rating and title in the joined array.
58. **[H]** Use a pipeline form of `$lookup` to return at most three recent reviews per product.
59. **[H]** Compare the order's product snapshot with the current product title. How should a real report behave when the catalog title changes?
60. **[H]** For a paginated product API, compare `skip` pagination and keyset pagination as the collection grows and receives new writes.

## 4. Create, replace, upsert, and delete (61–80)

61. **[E]** Insert one new customer with valid required fields and a unique email. Read it back by `_id`.
62. **[E]** Insert three sellers in one `insertMany` call with unique `sellerCode` values.
63. **[E]** Insert a category with `parentId: null`, `ancestorIds: []`, and `level: NumberInt(0)`.
64. **[M]** Insert a child category whose `parentId`, `ancestorIds`, and `level` agree with its parent.
65. **[M]** Try inserting two customers with the same email. What error do you get, and which index enforces it?
66. **[M]** Try inserting a review with rating 6. Which rule rejects it? Inspect the validator.
67. **[M]** Insert a valid review for a product and customer of your choice, avoiding a fake verified-purchase claim unless you link an actual order.
68. **[M]** Insert a product containing two variants with distinct SKUs. State what else a real catalog write should validate.
69. **[M]** Use `updateOne` and `$set` to change a customer's marketing preference.
70. **[M]** Use `updateMany` to set a temporary `trainingTag` on sellers matching a chosen criterion. Count matched and modified documents.
71. **[M]** Use `$inc` to add 50 loyalty points to one customer and return the updated document.
72. **[M]** Use `$currentDate` to set `updatedAt` as part of an update.
73. **[M]** Use `replaceOne` on a practice customer. Show what happens if you omit an existing optional field.
74. **[M]** Upsert a warehouse by a unique `code`, using `$set` and `$setOnInsert` appropriately.
75. **[M]** Explain the difference between `matchedCount`, `modifiedCount`, and `upsertedId` using an actual update result.
76. **[E]** Delete one seller you inserted for practice by its exact `_id` and inspect `deletedCount`.
77. **[M]** Delete all temporary training sellers using a distinctive marker you created. Why is a precise filter critical?
78. **[M]** Implement soft deletion of one product by setting status rather than removing the document. Define its effect on catalog reads.
79. **[H]** Use `bulkWrite` to insert one product, update a customer, and delete one disposable practice document. Inspect the result and ordered/unordered behavior.
80. **[H]** Explain what happens to order snapshots if a referenced product is deleted. Which data should remain available for historical orders?

## 5. Nested writes and concurrency (81–100)

81. **[E]** Add a second saved address to a practice customer using `$push`.
82. **[M]** Add a favorite category with `$addToSet`; run the same update twice and explain the result.
83. **[M]** Remove one favorite category with `$pull`.
84. **[M]** Update the `isDefault` flag of one address selected by `addressId` using the positional `$` operator.
85. **[M]** Set all of one customer's addresses to `isDefault: false` using `$[]`, then select one default address.
86. **[H]** Use `$[address]` and `arrayFilters` to update a specific address's postal code without replacing the entire array.
87. **[M]** Append a cart item to an existing cart and update `updatedAt` in the same operation.
88. **[M]** Increment the quantity of one cart item selected by `variantId` using a filtered positional update.
89. **[H]** Remove cart items whose product belongs to a chosen list of product IDs. Compare `$pull` with an update pipeline using `$filter`.
90. **[H]** Update the sale price of one product variant selected by SKU. Avoid changing another variant in a two-variant practice product.
91. **[H]** Change one value in a variant's nested `optionValues` array, targeting both the correct variant and correct option with two array-filter identifiers.
92. **[H]** Add a certification only if its code is not already present. Explain why `$addToSet` on an object may not implement uniqueness by one field.
93. **[M]** Append a new tracking event to a shipment and change its status in the same single-document update.
94. **[H]** Update one return item's inspection checklist answer by `lineId` and question text, using nested array filters.
95. **[H]** Set a return item's approved amount only when its parent return has the expected status. Inspect the matched count to detect a stale state.
96. **[H]** Reserve two inventory units only if `onHand - reserved - damaged >= 2`. Use one atomic conditional update and increment `version`.
97. **[H]** Implement optimistic concurrency for inventory with `version`: two writers both read version 17; only one should succeed.
98. **[H]** Use an update pipeline to compute and store `available = onHand - reserved - damaged` for a selected inventory document.
99. **[H]** Recompute an order's `totals.grandTotal` from its stored totals using an update pipeline in your lab copy. Explain why changing a historical total needs audit controls.
100. **[H]** Design an idempotent operation to append a status-history event exactly once for a given event ID. What happens when the same request is retried?

## 6. Aggregation foundations (101–120)

101. **[E]** Group customers by loyalty tier and count each tier.
102. **[E]** Calculate minimum, maximum, and average order grand total.
103. **[E]** Count orders by calendar month using `$dateTrunc`.
104. **[M]** Count orders by month using the `Asia/Kolkata` timezone and compare a boundary date with UTC grouping.
105. **[E]** `$unwind` order lines and count total units sold.
106. **[M]** Find total pre-discount sales (`quantity × unitPrice`) per seller.
107. **[M]** Find total discount amount per seller by unwinding `lines.discounts`; preserve sellers with zero discounts in a separate version.
108. **[M]** Calculate total CGST and SGST separately by unwinding the tax components.
109. **[M]** Calculate monthly gross merchandise value using order totals and define whether shipping and tax belong in your metric.
110. **[M]** Group reviews by rating and calculate percentage distribution.
111. **[M]** Calculate average `quality` and `delivery` aspect ratings separately.
112. **[M]** Count return requests by reason code after unwinding `items`.
113. **[M]** Calculate total on-hand, reserved, damaged, and available units across inventory.
114. **[M]** Find the 10 highest-priced product variants using `$unwind`, `$sort`, and `$limit`.
115. **[M]** Calculate average variant sale price by seller.
116. **[M]** Count products by category ID, correctly handling the `categoryIds` array.
117. **[H]** Group order lines by product and calculate units, gross revenue, discount, tax, and net collected amount. Define each field explicitly.
118. **[H]** Create price bands with `$bucket` and show the number of variants in each band.
119. **[H]** Use `$bucketAuto` to split order totals into five buckets. Compare its boundaries with fixed business price bands.
120. **[H]** Build a `$facet` response containing total matching products, the first 20 products, and a price histogram.

## 7. Joins, hierarchy, and reporting (121–140)

121. **[M]** Join orders to customers and report monthly revenue by loyalty tier at order time. What limitation arises from reading today's customer tier?
122. **[M]** Join orders to sellers and show total units and revenue per seller name.
123. **[M]** Join orders to returns and report how many orders have a return request.
124. **[M]** Join shipments to orders and calculate `deliveredAt - placedAt` in days.
125. **[M]** Join reviews to products and compare computed average rating with `ratingSummary.average`.
126. **[M]** Join inventory to products and report available units with product title and SKU.
127. **[M]** Join inventory to warehouses and aggregate available units by warehouse city.
128. **[H]** Use a pipeline `$lookup` to find shipments for each order where shipment status is `DELIVERED`; project only tracking number and delivery date.
129. **[H]** Find orders with captured payments but no shipment; describe how to test this when the untouched seed has none.
130. **[H]** Find products with no inventory documents using `$lookup` and an empty joined array.
131. **[H]** Starting from a child category, use `$graphLookup` on `parentId` to get all ancestors. Compare with stored `ancestorIds`.
132. **[H]** Starting from a parent category, find all descendants with `$graphLookup`. Limit depth to two and explain how the depth field is measured.
133. **[H]** Roll up sales for a chosen parent category using products' `categoryIds` and categories' `ancestorIds`.
134. **[H]** Report each seller's product count, distinct sold products, and sold units. Prevent fan-out from multiplying counts after lookups.
135. **[H]** Join promotions to discounted order lines by `promotionId` and compute redeemed orders, total discount, and gross order value.
136. **[H]** Find customers who have an active cart but have never placed an order; create test data if the seed has no such customers.
137. **[H]** Find a customer's products appearing in both a wishlist and an order; return the overlap as product IDs.
138. **[H]** Report the average time from a shipment's `PICKED_UP` to `DELIVERED` tracking events without assuming those are at fixed array positions.
139. **[H]** Identify return requests whose referenced order does not contain the requested `lineId`; explain how to detect such referential errors in a document database.
140. **[H]** Create a seller dashboard in one pipeline: product count, units sold, revenue, average rating, and return requests. Document where duplicate rows could inflate totals.

## 8. Advanced aggregation and analytics (141–160)

141. **[M]** Use `$project` with `$map` to show each cart item's product ID and quantity without unwinding the cart.
142. **[M]** Use `$filter` to return only discount-bearing lines in an order.
143. **[M]** Use `$reduce` to total a line's tax components and compare with the stored order tax.
144. **[H]** Write an aggregation that finds orders whose stored grand total differs from subtotal minus discount plus shipping plus tax.
145. **[H]** Calculate customer RFM metrics: days since last order, order count, and lifetime spend. State your chosen reference date.
146. **[H]** Group customers by first-order month and produce a monthly cohort retention table.
147. **[H]** Use `$setWindowFields` to rank sellers by monthly revenue within each month.
148. **[H]** Use `$setWindowFields` to compute a seven-day moving average of daily order revenue.
149. **[H]** Compute each seller's cumulative revenue by month with a window calculation.
150. **[H]** Find the top three products per seller by units sold, breaking ties deterministically.
151. **[H]** Use `$facet` to build a dashboard with monthly revenue, top sellers, review-rating distribution, and return-reason distribution. State whether a single starting collection is sufficient.
152. **[H]** Use `$unionWith` to produce one chronological activity feed from order creation, payment capture, and shipment delivery events.
153. **[H]** Find the median delivery time per warehouse city and explain which MongoDB version/operator your solution requires; provide an alternative if unavailable.
154. **[H]** Find products in the top 10% of revenue, and distinguish percentile threshold from “top 10% of product count.”
155. **[H]** Detect customers whose monthly spend is more than twice their own prior monthly average.
156. **[H]** Determine products that are frequently bought together. The seed has one line per order: first add controlled multi-line lab orders, then avoid self-pairs and mirrored duplicate pairs.
157. **[H]** Find the most common two-step carrier transition in `trackingEvents`, preserving event order.
158. **[H]** Calculate promotion effectiveness by code: usage, total discount, revenue after discount, and average order value. Explain why correlation does not prove incremental sales.
159. **[H]** Materialize a monthly seller revenue report into a new lab collection using `$merge`; choose merge keys and rerun behavior deliberately.
160. **[H]** Build one pipeline that flags anomalies: negative available stock, returned quantity above sold quantity, and stored order totals that do not reconcile. Decide whether to use `$unionWith` or separate pipelines.

## 9. Indexes, query plans, validation, and scaling (161–180)

161. **[E]** List the indexes on `orders`, `products`, and `inventory`.
162. **[M]** Run `explain("executionStats")` for a customer lookup by email. Identify the winning plan and keys/documents examined.
163. **[M]** Compare query plans for finding orders by `customerId` sorted by `placedAt` descending and sorted by `grandTotal` descending.
164. **[M]** Explain the leftmost-prefix behavior of `{ customerId: 1, placedAt: -1 }` using two test queries.
165. **[M]** Identify which indexes become multikey and why `products.variants.sku` is one of them.
166. **[H]** Explain the compound multikey restriction. Propose an alternative to one index spanning two independent arrays in `products`.
167. **[M]** Design an index for active products by seller sorted newest first. Compare it with the existing index.
168. **[H]** Design a partial index for active orders or products and state which filters must appear for MongoDB to use it safely.
169. **[H]** Create a case-insensitive uniqueness strategy for customer email. Compare normalized lowercase storage with collation-based indexing.
170. **[M]** Explain why an anchored prefix regex may use an index differently from an unanchored substring regex.
171. **[M]** Use `explain` to compare an order lookup by order number against a filter on a deeply nested unindexed field.
172. **[H]** Evaluate whether an index on `shipments.trackingEvents.code` helps a real tracking query. Discuss array size and write cost.
173. **[H]** Choose an index for a monthly order dashboard filtered by seller and date. Check its actual query shape and the existing multikey index.
174. **[M]** Inspect the JSON Schema validator for `reviews` and show one accepted and one rejected insert in the lab database.
175. **[H]** Extend a lab validator so `orders.currency` is required and limited to a controlled list. What happens to existing documents and future updates?
176. **[H]** Explain why MongoDB validation alone cannot guarantee that `orders.lines.productId` references an existing product.
177. **[H]** Compare embedding 5,000 reviews inside a product document with the existing separate `reviews` collection. Include document growth and query patterns.
178. **[H]** Find the largest orders by BSON document size. Explain the document-size limit and a redesign for an order with tens of thousands of lines.
179. **[H]** Explain when a materialized seller dashboard is preferable to recalculating joins for every request. How will you keep it fresh?
180. **[H]** Propose a shard key for a very large `orders` collection. Discuss customer history queries, high write rates, distribution, and scatter-gather tradeoffs.

## 10. Production scenarios and interview explanations (181–200)

181. **[M]** Explain atomicity of one document update versus updates to multiple documents, using an order and inventory reservation.
182. **[H]** Design checkout steps for cart validation, stock reservation, order creation, payment initiation, and failure recovery. Mark which steps need atomicity or idempotency.
183. **[H]** In a replica-set lab, implement a transaction that creates an order and reserves inventory. Abort on insufficient stock; explain why external payment calls should not occur inside it.
184. **[H]** A payment provider sends the same success webhook three times. Use `providerPaymentId` and an idempotency strategy to avoid three captures or three status events.
185. **[H]** Two customers try to buy the final item simultaneously. Show the exact conditional inventory update outcome and how the loser learns it failed.
186. **[H]** A network timeout occurs after an order write but before the client receives the response. Explain how an idempotency key changes retry behavior.
187. **[M]** Compare read concern `local` and `majority` and write concern `w:1` and `majority` for an order confirmation flow.
188. **[H]** Explain why a transaction is not a replacement for an atomic single-document conditional update in every inventory operation.
189. **[H]** Design a safe return workflow: request, inspection, approval, refund, and restock. Which events must be idempotent and auditable?
190. **[H]** An order has a product snapshot and a product reference. Explain which one to use for an invoice, current catalog link, historical analytics, and inventory lookup.
191. **[H]** Explain how you would migrate products from embedded variants to a separate `product_variants` collection without stopping reads and writes.
192. **[H]** A seller has millions of products. Explain how you would paginate its catalog and avoid expensive large `skip` values.
193. **[H]** A reporting aggregation is slow. Describe a step-by-step diagnosis using filters, stage order, indexes, `explain`, cardinality, and memory pressure.
194. **[H]** Compare `$lookup` with embedding a seller snapshot in an order line. When is denormalization justified, and how do you handle changes?
195. **[H]** Design a product search experience with title, category, price, and facets. Separate what a basic MongoDB index can do from dedicated search features.
196. **[H]** A customer asks to delete their account. Identify records that may need deletion, anonymization, or retention, and explain how references and snapshots complicate it. State that actual retention rules depend on applicable law and policy.
197. **[H]** A dashboard needs near-real-time order totals. Compare polling, change streams, and a maintained summary collection. Note the server topology required for change streams.
198. **[H]** Explain how you would back up, restore, and verify this practice database. Include what `mongoexport`/`mongoimport` preserve differently from BSON backups.
199. **[H]** In a 45-minute machine-coding interview, implement a small Node.js endpoint that filters and paginates orders, returns customer summary, validates input, and reports database errors cleanly. Write the index you expect it to use.
200. **[H]** Design and defend the whole ecommerce data model in five minutes: embedding versus references, snapshots, bounded arrays, indexes, consistency, checkout, analytics, and one change you would make before real production traffic.

## A practical study rhythm

- **Pass 1:** Questions 1–40. Relearn shell syntax, BSON types, filters, and arrays.
- **Pass 2:** Questions 41–100. Practice CRUD and nested updates in the lab database. Reimport if needed.
- **Pass 3:** Questions 101–160. Draw the shape of documents after each aggregation stage before running it.
- **Pass 4:** Questions 161–200. Explain your query plan and design choices aloud as in an interview.
- **Final review:** Re-solve 20 randomly chosen questions without notes, including at least five nested updates, five aggregations, and three production scenarios.

### Documentation to keep beside you

- MongoDB [CRUD operations](https://www.mongodb.com/docs/manual/crud/)
- MongoDB [aggregation pipeline stages](https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/)
- MongoDB [update operators and array filters](https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/)
- MongoDB [indexes](https://www.mongodb.com/docs/manual/indexes/)
- MongoDB [schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/)
- MongoDB [transactions](https://www.mongodb.com/docs/manual/core/transactions/)
