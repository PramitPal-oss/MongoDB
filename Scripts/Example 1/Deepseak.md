# 100 MongoDB CRUD Practice Questions (No Aggregation)

Here are 100 MongoDB CRUD questions ranging from easy to hard, perfect for practicing in the MongoDB shell with your seeded ecommerce database:

## Basic CRUD Operations (1-20)

1. Find all documents in the users collection
2. Find the first 5 users in the collection
3. Find a user by their exact email address
4. Find users who registered in the last 30 days
5. Insert a new user document into the collection
6. Update a user's phone number by their email
7. Delete a user by their email address
8. Find users who have exactly 2 addresses
9. Find users who have at least one order
10. Find users who have no reviews
11. Count the total number of users in the collection
12. Find users and only return their name and email fields
13. Find users and exclude the \_id field from results
14. Find users sorted by their registration date (newest first)
15. Find users sorted by name alphabetically
16. Update a user's name and return the updated document
17. Increment the quantity of all products in a specific order by 1
18. Delete all users who registered before 2023
19. Find users who have a specific word in their name (e.g., "John")
20. Update all users to add a new "isActive" field set to true

## Embedded Document Queries (21-40)

21. Find users who have a "Home" type address
22. Find users who have an address in a specific city
23. Find users who have an order with status "Delivered"
24. Find users who have an order total greater than $100
25. Find users who have a product with quantity greater than 3 in any order
26. Find users who have a review with rating 5
27. Update a specific address's zip code for a user
28. Add a new address to a user's addresses array
29. Remove a specific address from a user's addresses array
30. Find users who have an order paid with "Credit Card"
31. Find users who have an unpaid order
32. Find users who have an order with estimated delivery in the next week
33. Update the status of a specific order to "Shipped"
34. Add a new product to a specific order
35. Remove a product from a specific order
36. Find users who have reviewed a specific product
37. Find users who have a review with a comment containing "excellent"
38. Update a specific review's rating
39. Add a new review to a user's reviews array
40. Remove a specific review from a user

## Advanced Query Techniques (41-60)

41. Find users with pagination (skip 5, limit 5)
42. Find users who have orders with status either "Pending" or "Shipped"
43. Find users who have orders with status not "Cancelled"
44. Find users who have at least 3 orders
45. Find users whose name starts with "A"
46. Find users with orders containing a specific product name
47. Find users with orders totaling between $50 and $100
48. Find users with at least one 5-star review and at least one delivered order
49. Find users who have both "Home" and "Work" addresses
50. Find users who have an address in "New York" or "California"
51. Update multiple users' isActive field based on registration date
52. Find users with orders that have more than 2 products
53. Find users whose most recent order was in the last 7 days
54. Find users with an average review rating above 4
55. Find users who have ordered a product more than once
56. Find users with orders that have all products with quantity > 1
57. Find users who have never placed a cancelled order
58. Find users who have placed orders in the last month but have no reviews
59. Find users with orders where at least one product price is > $50
60. Find users who have placed orders on weekends

## Complex Updates (61-80)

61. Add a "loyaltyPoints" field to all users, initialized to 0
62. Increment loyaltyPoints by 10 for users with more than 3 orders
63. Add a "discount" field to orders over $100 (set to 10)
64. Update all "Pending" orders older than 7 days to "Cancelled"
65. Add a "premium" field set to true for users with total orders > $500
66. Normalize all phone numbers to remove non-digit characters
67. Update all order dates to be in UTC format
68. Add a "fullAddress" field to each address combining street, city, etc.
69. Update all product prices to include 10% tax
70. Mark all orders as paid if they were shipped more than 3 days ago
71. Add a "lastActive" field set to the most recent order date
72. Update users to have a "totalSpent" field summing all order totals
73. Add a "favoriteCategory" field based on most ordered product category
74. Update all reviews to include a "verifiedPurchase" field (random boolean)
75. Add a "shippingNotes" field to orders with fragile products
76. Update all users to have a "hasUnpaidOrders" field
77. Normalize all email addresses to lowercase
78. Add a "orderCount" field to each user
79. Update all products to include a "category" field based on product name
80. Add a "isHighValue" field to users with average order > $200

## Hard Challenges (81-100)

81. Find users who have placed orders in consecutive months
82. Find users who have the same product in multiple orders
83. Find users who have ordered all types of payment methods
84. Find users who have orders with all different shipping providers
85. Find users with increasing order totals over time
86. Find users who always give ratings of 4 or 5 stars
87. Find users who have orders with products totaling exactly 10 items
88. Find users who have placed orders on every day of the week
89. Find users with orders containing at least 3 different products
90. Find users who have re-ordered the same product multiple times
91. Update users to have a "purchaseFrequency" field (days between orders)
92. Find users who have orders with all products having quantity > 2
93. Find users who have never changed their address
94. Find users who have orders with all possible status values
95. Find users with orders where product count matches quantity sum
96. Find users who have orders placed at the same time of day
97. Find users who have orders with sequential order IDs
98. Find users who have reviewed every product they ordered
99. Find users with orders containing products priced within 10% of each other
100.  Find users who have maintained at least a 4-star average over 3+ reviews

These questions cover a wide range of CRUD operations from basic finds to complex updates, all using the data structure you've seeded. They'll give you excellent practice with:

- Basic queries
- Projections
- Sorting and limiting
- Array operations
- Embedded document queries
- Complex updates
- Logical operators
- Array operators
- Element operators
- Comparison operators

Happy querying!
