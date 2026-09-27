# 100 MongoDB Aggregation Practice Questions

## Basic Aggregation (1-20)

1. Count total number of users ✅
2. Calculate average number of orders per user ✅
3. Find total revenue from all orders ✅
4. Count how many users have each type of address (Home/Work) ✅
5. Calculate average order value ✅
6. Group orders by status and count them ✅
7. Find the user who spent the most money ✅
8. Calculate total quantity of all products ordered ✅
9. Find the most popular payment method ✅
10. Count reviews by rating (1-5 stars) ✅
11. Find the most common city in user addresses ✅
12. Calculate average rating across all reviews ✅
13. Find the most ordered products ✅
14. Count users by registration month ✅
15. Find the shipping provider with most orders ✅
16. Calculate percentage of paid vs unpaid orders ✅
17. Find the state with most users ✅
18. Count how many users have 0, 1-3, and 4+ reviews
19. Find the day of week with most orders ✅
20. Calculate average time between user registration and first order ✅

## Intermediate Aggregation (21-50)

21. Find users who spent more than $500 in total ✅
22. Calculate average order value by payment method
23. Find products that appear in orders most frequently
24. Calculate total sales by month ✅
25. Find users with perfect 5-star review average
26. Compare average order value between credit card and PayPal
27. Find the most common product quantity ordered
28. Calculate percentage of orders that get cancelled
29. Find users who ordered the same product multiple times
30. Calculate average delivery time (orderedAt to estimatedDelivery)
31. Find the most active hour for placing orders
32. Compare average rating by product category
33. Find users who consistently give low ratings (avg < 2.5)
34. Calculate repeat purchase rate (users with >1 order)
35. Find the most loyal customers (by order count)
36. Compare average order value between first-time and repeat customers
37. Find products frequently bought together
38. Calculate customer lifetime value by acquisition month
39. Find the most profitable products (total revenue)
40. Compare order completion rates by shipping provider
41. Find seasonal patterns in ordering
42. Calculate average number of products per order by status
43. Find users who upgraded from small to large orders
44. Compare review ratings between paid and unpaid orders
45. Find the most common order status transitions
46. Calculate average time between orders for repeat customers
47. Find users who always use the same payment method
48. Compare order totals between different address types
49. Find products with the most consistent ratings
50. Calculate percentage of users who leave reviews ✅

## Advanced Aggregation (51-80)

51. Find users who increased their spending over time
52. Calculate retention rate by user cohort
53. Find products that are trending upward in purchases
54. Identify user segments based on purchase patterns
55. Find the most common paths in order status changes
56. Calculate average time from order to shipment
57. Find users who always order the same product category
58. Identify potential fraud (unusually large orders)
59. Find products with high review ratings but low sales
60. Calculate average order value growth rate
61. Find users who decreased their purchase frequency
62. Identify abandoned carts (pending orders >7 days old)
63. Find products that are frequently returned (cancelled)
64. Calculate customer satisfaction score by product
65. Find the most effective shipping providers by region
66. Identify power users (top 10% by spend)
67. Find products that attract new vs returning customers
68. Calculate net promoter score from reviews
69. Find users who refer others (same address, different emails)
70. Identify potential subscription products (regular purchases)
71. Find the most profitable customer acquisition channels
72. Calculate average customer lifespan (first to last order)
73. Find products with seasonal demand patterns
74. Identify upsell opportunities (users who bought X but not Y)
75. Calculate customer satisfaction by order volume
76. Find the most effective promotions (discount impact)
77. Identify at-risk customers (declining engagement)
78. Calculate inventory turnover by product
79. Find the optimal reorder point for each product
80. Identify cross-selling opportunities

## Expert Aggregation (81-100)

81. Build a customer lifetime value prediction model
82. Calculate RFM (Recency, Frequency, Monetary) scores
83. Identify micro-segments with unusual behavior
84. Find the most influential customers (social proof)
85. Calculate price elasticity for products
86. Identify potential bundle deals
87. Find the optimal product mix for promotions
88. Calculate customer satisfaction impact on retention
89. Identify early warning signs of churn
90. Find the most efficient shipping routes
91. Calculate inventory carrying costs by product
92. Identify products with complementary demand
93. Find the optimal pricing strategy by region
94. Calculate marketing ROI by customer segment
95. Identify supply chain bottlenecks
96. Find the most effective review length for sales
97. Calculate customer effort score from reviews
98. Identify potential quality issues from reviews
99. Find the most profitable customer acquisition time
100.  Build a complete customer 360-degree view

## Usage Tips

1. Start with simple `$group` and `$match` stages
2. Progress to using `$project`, `$unwind`, and `$lookup`
3. Master array operators like `$map`, `$filter`, and `$reduce`
4. Practice date operators (`$dayOfWeek`, `$month`, etc.)
5. Combine multiple stages for complex analytics
6. Use `$facet` for multi-dimensional analysis
7. Optimize with indexes for large datasets
8. Validate with `$match` before complex operations
9. Use `$sample` for testing on large collections
10. Always check `explain()` for performance tuning
