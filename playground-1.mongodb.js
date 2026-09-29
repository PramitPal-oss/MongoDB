/* global use */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('ecommerce_practice');

// [M] Find orders whose lines.discounts array is nonempty. Do not accidentally include missing arrays

db.orders.find({
  lines: {
    $elemMatch: {
      'discounts.0': { $exists: true },
    },
  },
});
