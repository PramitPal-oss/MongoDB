# MongoDB CRUD Practice Questions (No Aggregation)

## 🟢 Easy Level (1–30)

1. Find all users. ✅
2. Find one user. ✅
3. Find a user with a specific name.✅
4. Find a user with a specific email.✅
5. Find users who registered after January 1, 2023.✅
6. Find users who have the country as "India" in any of their addresses.✅
7. Insert a new user with minimal fields (name, email).✅
8. Update a user’s email by name.✅
9. Update a user’s phone by ID.✅
10. Delete one user with a specific email.✅
11. Delete all users who have the country as "Germany".✅
12. Find users whose phone number starts with "+1".✅
13. Find users with at least 2 addresses. ✅
14. Find users who have a “Work” address. ✅
15. Find users who placed at least 2 orders. ✅
16. Add a new address to a user.✅
17. Add a new order to a user.✅
18. Change a user’s name.✅
19. Remove one address from a user by index.✅
20. Set a specific field (`phone`) to `null` for a user.✅
21. Find users with the name "John Doe" or "Jane Doe".✅
22. Find users whose name contains "Smith".✅
23. Find users registered in the past 1 year.✅
24. Update the zip code of all addresses of a user.✅
25. Add a review to a user.✅
26. Find users who left at least one review.✅
27. Remove all reviews from a user.✅
28. Change the status of all orders for a user to “Delivered”.✅
29. Find users who have placed an order using “PayPal”.✅
30. Add a phone number to a user who doesn't have one.

## 🟡 Medium Level (31–70)

31. Find users who have ordered more than 3 products in any order.✅
32. Find users who gave a 5-star rating in any review.✅
33. Remove an order with a specific `orderId` from a user.✅
34. Update the quantity of a product in a user’s order.✅
35. Delete users who have never placed an order.✅
36. Find users who have both “Home” and “Work” addresses.✅
37. Update the tracking number for a specific order.✅
38. Add a product to the first order of a user.✅
39. Update the shipping provider in the latest order.
40. Find users whose orders include a product named "T-Shirt".
41. Find users with at least one unpaid order.
42. Change payment method to “Credit Card” for all unpaid orders.
43. Find users who have reviewed a product called “Wireless Mouse”.
44. Remove a review by `productId`.
45. Set `paid` to `true` and `paidAt` to now for all unpaid orders.
46. Delete orders with total value less than 50.
47. Find users who have more than 3 orders.
48. Rename the field `phone` to `contactNumber` in all documents.
49. Change the country of all addresses to "USA" for a specific user.
50. Add an empty review array to all users missing the `reviews` field.
51. Find users who ordered more than once in the last 30 days.
52. Set a specific user's all order statuses to "Cancelled".
53. Remove all products from a specific order by `orderId`.
54. Add a rating field to all reviews where it's missing.
55. Remove all orders where the `total` is more than 1000.
56. Set the `estimatedDelivery` to 7 days from now for all future orders.
57. Remove duplicate email users (based on email).
58. Set default shipping provider to "FedEx" if missing.
59. Find users with missing `registeredAt`.
60. Set current timestamp in a custom `updatedAt` field.
61. Add a promo code field to all orders.
62. Remove all addresses where `zip` is null.
63. Delete reviews that are older than 60 days.
64. Remove users who haven’t placed an order in last 6 months.
65. Find users whose address `state` is "California".
66. Find users who live in more than one city.
67. Update city name to "San Francisco" where it is "SF".
68. Add a new order with empty product array.
69. Update all products in an order with a 10% discount.
70. Find users who ordered a product more than once.

## 🔴 Hard Level (71–100)

71. Replace the entire `orders` array for a user.
72. Update the name of a product in all users’ orders.
73. Remove all orders where `status` is "Cancelled".
74. Update all “Work” addresses’ street name to “Workplace Street”.
75. Add a product to all orders with less than 3 products.
76. Remove all reviews with less than 3 stars.
77. Add a `shippingFee` field to all orders.
78. Normalize phone numbers to international format.
79. Add an “isPremium” field if user placed more than 5 orders.
80. Set review `comment` to "Updated" for 1-star reviews.
81. Delete orders that include a product with price > 500.
82. Update payment status for all orders paid before last month.
83. Find users who have ordered at least one product in quantity > 3.
84. Set all orders without tracking number to “Not Available”.
85. Copy `email` to a new field called `loginEmail`.
86. Find users with missing `orders` field.
87. Remove users whose every order is cancelled.
88. Add a new address and set it as default.
89. Remove orders that include product named "Expired Product".
90. Set a flag `hasPendingOrder` if any order status is "Pending".
91. Update zip codes to uppercase format in all addresses.
92. Delete all reviews that have empty comment.
93. Set `deliveredAt` date to today for all delivered orders.
94. Move `reviews` to a separate collection (use `$out` after aggregation later).
95. Delete all users where no address exists in “New York”.
96. Add order count field at root level (count of orders).
97. Update the name field to uppercase.
98. Find users who never reviewed a product.
99. Add a loyaltyPoints field to users with more than 3 orders.
100.  Remove all orders from users who have only 1 review.
