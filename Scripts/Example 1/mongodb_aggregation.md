Awesome! Here's a set of **100 MongoDB aggregation pipeline practice questions**, divided into **Easy (1–40), Medium (41–80), and Hard (81–100)** based on your `users` collection structure from the seed you provided.

---

## ✅ Easy (1–40): Basic `$match`, `$project`, `$sort`, `$limit`

1. List all user names and emails.
2. Show name and number of addresses for each user.
3. Show name and number of orders per user.
4. Find users who registered in 2024.
5. Project each user’s name and city of their first address.
6. Get users who have at least 2 addresses.
7. Show users who have ordered more than 3 times.
8. Get a list of all product names from all users’ orders (flattened).
9. Find all users who have reviewed at least one product.
10. Project user name and count of reviews.
11. Get the first product name from the first order of each user.
12. Find users who have at least one order marked as "Delivered".
13. Show users who have used "PayPal" as a payment method.
14. Get users with any unpaid orders.
15. Show user name and the first review comment (if exists).
16. Show users who have a phone number starting with "+1".
17. Show users who have both Home and Work addresses.
18. Project name and country of their first address.
19. Sort users by registration date (latest first).
20. Find users who registered before 2023.
21. Count how many users have "gmail.com" emails.
22. Project user name and number of products in their first order.
23. Find users whose first order has total above 1000.
24. Get all unique product names ordered.
25. Show all users who have reviewed "Tasty Wooden Salad".
26. Project user name and total number of reviews.
27. Get users with at least 2 orders and 2 reviews.
28. Project user name and total price of their first order.
29. Find users who have ordered any product costing over 5000.
30. Get the names of users who placed at least 1 cancelled order.
31. List names of users who have used Bank Transfer.
32. Show users whose first product in any order is "Awesome Granite Hat".
33. Project name and total number of products ordered (sum across all orders).
34. Get names of users whose first order has more than 2 products.
35. Find users who have never reviewed anything.
36. Show users whose last order was not delivered.
37. Get names of users who have ordered more than once in the last 30 days.
38. List product names from all reviews (flattened list).
39. Project user name and the zip code of their first address.
40. Find users whose reviews contain the word “excellent”.

---

## 🟡 Medium (41–80): `$unwind`, `$group`, `$addFields`, `$lookup`, nested arrays

41. Count total number of products each user has ever ordered.
42. Get average order total per user.
43. Find total number of orders by status (grouped).
44. Group all orders across all users by `payment.method` and count.
45. Calculate total revenue from all users.
46. Find the top 5 most ordered product names.
47. List all cities and how many users live in each.
48. Group by `country` from addresses and count users.
49. Find users who reviewed the same product multiple times.
50. Get all shipping providers used and how often.
51. Find the highest single order total per user.
52. Count number of orders per shipping provider.
53. List products that appear in both orders and reviews (match by name).
54. Count how many times each product was ordered.
55. Find users who placed their first order within 7 days of registering.
56. Show total number of paid vs unpaid orders.
57. Get number of users who have used each payment method.
58. Find average rating given by each user.
59. Show average order total per payment method.
60. List all unique zip codes used by users.
61. Get average product price in all orders.
62. Show most recent review per user.
63. Count how many products were ordered in total by all users.
64. Find average number of reviews per user.
65. Get top 3 users with highest total spent across all orders.
66. List top 3 most active reviewers.
67. Find users who always pay using Credit Card.
68. Show all users who have never used "Shipped" status.
69. Calculate the total quantity of each product name ordered across all users.
70. Group orders by `status` and calculate average total.
71. Find users who have at least 2 orders with same `shipping.provider`.
72. Calculate delivery success rate (Delivered / Total orders).
73. Count how many users registered each year.
74. Show average order total per country (from address).
75. List all cities where users received more than 2 orders.
76. Get list of all products sorted by most frequently reviewed.
77. Show user name and the average rating they've given in reviews.
78. Get top 5 most common product names across all orders.
79. Count how many users have more than 1 unpaid order.
80. Calculate average number of products per order.

---

## 🔴 Hard (81–100): Deep nesting, conditionals, multi-level grouping

81. For each user, show the total spent per year (group orders by year).
82. Find the top 5 users who spent the most in the last 30 days.
83. For each product, calculate average rating and total times ordered.
84. List users whose all orders are marked as "Paid" but never Delivered.
85. Create a list of users with an array of their unpaid order IDs.
86. Calculate most common shipping provider per user.
87. For each user, show month-wise order count in the last year.
88. Detect duplicate shipping tracking numbers (across all users).
89. List users whose average rating is below 3.
90. Find top 3 most ordered products per user.
91. For each user, show orders grouped by status and count per status.
92. Compare total ordered vs total reviewed products (by name).
93. Find products that were reviewed but never ordered.
94. List top 5 products with the highest total revenue.
95. For each user, show average delivery time (estimatedDelivery - orderedAt).
96. Find users who ordered the same product more than once.
97. List users who reviewed a product before they ordered it.
98. List users whose all orders used the same payment method and same shipping provider.
99. Find users whose address country is different from shipping country in any order.
100.  For each country, calculate total revenue generated by users.

---
