/* global use */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('ecommerce_practice');

// [E] Find products whose first variant's sale price is greater than NumberDecimal("15000.00").

db.products.find({ 'variants.0.pricing.salePrice': { $gt: NumberDecimal('15000.00') } });
