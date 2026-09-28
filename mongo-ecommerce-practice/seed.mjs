import { faker } from '@faker-js/faker';
import { ObjectId, Decimal128, Int32, EJSON } from 'bson';
import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';

const COUNT = Number(process.env.COUNT || 5000);
if (!Number.isSafeInteger(COUNT) || COUNT < 1) throw new Error('COUNT must be a positive integer');
faker.seed(Number(process.env.SEED || 20260928));
const outDir = resolve(process.env.OUT_DIR || './data');
await mkdir(outDir, { recursive: true });

const collections = [
  'customers', 'sellers', 'categories', 'products', 'warehouses', 'inventory',
  'inventory_movements', 'carts', 'orders', 'payments', 'shipments', 'returns',
  'reviews', 'promotions', 'wishlists', 'audit_events'
];
const code = Object.fromEntries(collections.map((name, i) => [name, i + 1]));
// Stable disjoint ID spaces. Every reference can be generated without retaining all documents.
const id = (name, n) => new ObjectId(code[name].toString(16).padStart(4, '0') + n.toString(16).padStart(20, '0'));
const subId = (prefix, n) => new ObjectId(prefix.toString(16).padStart(4, '0') + n.toString(16).padStart(20, '0'));
const number = (min, max) => faker.number.int({ min, max });
const pick = values => values[number(0, values.length - 1)];
const ref = name => id(name, number(0, COUNT - 1));
const D = cents => Decimal128.fromString((cents / 100).toFixed(2));
const I = value => new Int32(value);
const date = () => faker.date.between({ from: '2025-01-01T00:00:00Z', to: '2026-09-01T00:00:00Z' });
const later = (base, days) => new Date(base.getTime() + days * 86400000);
const orderDate = n => later(new Date('2025-01-01T00:00:00Z'), n % 600);
const cities = ['Kolkata', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Delhi', 'Pune'];
const states = { Kolkata: 'West Bengal', Mumbai: 'Maharashtra', Bengaluru: 'Karnataka',
  Hyderabad: 'Telangana', Delhi: 'Delhi', Pune: 'Maharashtra' };
const address = (name = faker.person.fullName()) => {
  const city = pick(cities);
  return { recipient: name, lines: [faker.location.streetAddress()], city,
    state: states[city], postalCode: faker.location.zipCode('######'), country: 'IN' };
};
const summary = {};

async function emit(name, build) {
  const file = resolve(outDir, `${name}.json`);
  const stream = createWriteStream(file, { encoding: 'utf8' });
  for (let n = 0; n < COUNT; n++) {
    // Canonical Extended JSON keeps ObjectId, Date, Decimal128 and Int32 types.
    if (!stream.write(EJSON.stringify(build(n), { relaxed: false }) + '\n')) await once(stream, 'drain');
  }
  stream.end();
  await once(stream, 'finish');
  summary[name] = COUNT;
  console.log(`${name}: ${COUNT} -> ${file}`);
}

await emit('customers', n => {
  const first = faker.person.firstName(), last = faker.person.lastName();
  return {
    _id: id('customers', n), email: `customer${n}@example.test`,
    phone: `+91${String(7000000000 + n)}`, name: { first, last }, status: 'ACTIVE',
    loyalty: { tier: pick(['BRONZE', 'SILVER', 'GOLD']), pointsBalance: I(number(0, 2000)),
      historySummary: { earned: I(3000), redeemed: I(1000) } },
    preferences: { language: 'en', marketingOptIn: faker.datatype.boolean(),
      favoriteCategories: [ref('categories')] },
    addresses: [{ addressId: subId(101, n), label: 'Home', ...address(`${first} ${last}`), isDefault: true }],
    createdAt: date(), updatedAt: new Date('2026-09-01T00:00:00Z')
  };
});

await emit('sellers', n => ({
  _id: id('sellers', n), sellerCode: `SELL-${String(n).padStart(5, '0')}`,
  displayName: `${faker.company.name()} ${n}`, status: 'ACTIVE',
  legal: { businessName: faker.company.name(), taxIds: { gstin: `GST-TEST-${n}` } },
  serviceRegions: [{ country: 'IN', states: ['West Bengal', 'Maharashtra'] }],
  commission: { model: 'PERCENTAGE', rate: D(number(300, 1500)) },
  createdAt: date(), updatedAt: new Date('2026-09-01T00:00:00Z')
}));

await emit('categories', n => {
  const parent = n === 0 ? null : Math.floor((n - 1) / 8);
  const ancestors = [];
  for (let p = parent; p !== null; p = p === 0 ? null : Math.floor((p - 1) / 8)) ancestors.unshift(id('categories', p));
  return { _id: id('categories', n), name: `${faker.commerce.department()} ${n}`,
    slug: `category-${n}`, parentId: parent === null ? null : id('categories', parent),
    ancestorIds: ancestors, level: I(ancestors.length), status: 'ACTIVE' };
});

const productInfo = n => ({ productId: id('products', n), variantId: subId(102, n),
  sku: `SKU-${String(n).padStart(6, '0')}` });
await emit('products', n => {
  const p = productInfo(n);
  return { _id: p.productId, sellerId: id('sellers', n), categoryIds: [id('categories', n)],
    title: `Product ${n}`, slug: `product-${n}`, status: 'ACTIVE',
    brand: { name: `Brand ${n}`, manufacturerId: `MFG-${n}` },
    attributes: { technical: { processor: { brand: pick(['AMD', 'Intel']), family: 'Example', cores: I(number(4, 16)) },
      memory: { sizeGb: I(pick([8, 16, 32])), type: 'DDR5' },
      display: { inches: 14, resolution: { width: I(1920), height: I(1080) } } },
      compliance: { certifications: [{ code: 'BIS', issuer: 'BIS', validUntil: new Date('2028-01-01T00:00:00Z') }] } },
    variants: [{ variantId: p.variantId, sku: p.sku,
      optionValues: [{ option: 'color', value: pick(['black', 'blue', 'silver']) }, { option: 'storage', value: '512GB' }],
      pricing: { currency: 'INR', listPrice: D(1000000 + (n % 20) * 100000), salePrice: D(900000 + (n % 20) * 100000) },
      dimensions: { lengthCm: I(32), widthCm: I(22), heightCm: I(2) }, weightKg: D(140),
      images: [{ url: `https://example.test/images/product-${n}.webp`, sortOrder: I(1) }], status: 'ACTIVE' }],
    ratingSummary: { average: 1 + n % 5, count: I(1) }, createdAt: date(), updatedAt: new Date('2026-09-01T00:00:00Z') };
});

await emit('warehouses', n => ({
  _id: id('warehouses', n), code: `WH-${String(n).padStart(5, '0')}`,
  name: `${pick(cities)} Fulfilment ${n}`, location: {
    address: { city: pick(cities), state: 'West Bengal', country: 'IN' },
    geo: { type: 'Point', coordinates: [88.3639, 22.5726] }
  }, status: 'ACTIVE'
}));

await emit('inventory', n => ({
  _id: id('inventory', n), ...productInfo(n), warehouseId: id('warehouses', n),
  quantity: { onHand: I(100 + n % 20), reserved: I(n % 8), damaged: I(n % 3) },
  reorderPoint: I(20), version: I(1), updatedAt: new Date('2026-09-01T00:00:00Z')
}));

await emit('inventory_movements', n => ({
  _id: id('inventory_movements', n), ...productInfo(n), warehouseId: id('warehouses', n),
  type: 'RECEIPT', quantityDelta: I(100 + n % 20),
  reference: { type: 'PURCHASE_ORDER', id: subId(103, n) }, balanceAfter: I(100 + n % 20), occurredAt: date()
}));

await emit('carts', n => ({
  _id: id('carts', n), customerId: id('customers', n), status: 'ACTIVE',
  items: [0, 1].map((offset) => ({ lineId: subId(104 + offset, n),
    ...productInfo((n + offset) % COUNT), sellerId: id('sellers', (n + offset) % COUNT),
    quantity: I(number(1, 3)), addedAt: date() })),
  couponCodes: n % 5 === 0 ? [`PROMO-${n}`] : [],
  expiresAt: new Date('2027-01-01T00:00:00Z'), updatedAt: new Date('2026-09-01T00:00:00Z')
}));

// Exactly one line per order makes monetary invariants and references easy to audit.
// Additional nested arrays (discount allocations, tax components, packages) remain rich.
const orderFacts = n => {
  const qty = 1 + n % 3, unitCents = 900000 + (n % 20) * 100000;
  const subtotal = qty * unitCents, discount = n % 5 === 0 ? Math.round(subtotal * .05) : 0;
  const taxable = subtotal - discount, cgst = Math.round(taxable * .09), sgst = Math.round(taxable * .09);
  return { qty, unitCents, subtotal, discount, cgst, sgst, grand: taxable + cgst + sgst };
};
await emit('orders', n => {
  const f = orderFacts(n), p = productInfo(n), placed = orderDate(n);
  const lineId = subId(105, n), packageId = subId(106, n), groupId = subId(107, n);
  const customerId = id('customers', n), sellerId = id('sellers', n), warehouseId = id('warehouses', n);
  const shipping = address();
  return { _id: id('orders', n), orderNumber: `ORD-2026-${String(n).padStart(6, '0')}`,
    customerId, status: 'DELIVERED', placedAt: placed, currency: 'INR',
    customerSnapshot: { name: shipping.recipient, email: `customer${n}@example.test` },
    addresses: { shipping, billing: { ...shipping } },
    lines: [{ lineId, ...p, sellerId, sku: p.sku,
      productSnapshot: { title: `Product ${n}`, brand: `Brand ${n}`, categoryPath: ['Electronics', 'Computers'],
        options: [{ option: 'storage', value: '512GB' }] },
      quantity: I(f.qty), unitPrice: D(f.unitCents),
      discounts: f.discount ? [{ promotionId: id('promotions', n), code: `PROMO-${n}`, type: 'PERCENTAGE',
        amount: D(f.discount), allocation: [{ unitNumber: I(1), amount: D(f.discount) }] }] : [],
      tax: { jurisdiction: 'IN-WB', components: [
        { name: 'CGST', rate: D(900), amount: D(f.cgst) },
        { name: 'SGST', rate: D(900), amount: D(f.sgst) }] },
      fulfilment: { requestedMethod: 'DELIVERY', shippedQuantity: I(f.qty), returnedQuantity: I(0) },
      lineTotal: D(f.grand) }],
    totals: { subtotal: D(f.subtotal), discount: D(f.discount), shipping: D(0),
      tax: D(f.cgst + f.sgst), grandTotal: D(f.grand) },
    fulfilmentGroups: [{ groupId, sellerId, warehouseId,
      packages: [{ packageId, contents: [{ lineId, quantity: I(f.qty) }], status: 'DELIVERED' }] }],
    statusHistory: [{ status: 'PLACED', at: placed, actor: 'CUSTOMER' },
      { status: 'SHIPPED', at: later(placed, 1), actor: 'SYSTEM' },
      { status: 'DELIVERED', at: later(placed, 4), actor: 'SYSTEM' }],
    createdAt: placed, updatedAt: later(placed, 4) };
});

await emit('payments', n => {
  const f = orderFacts(n);
  return { _id: id('payments', n), orderId: id('orders', n), provider: 'sandbox-provider',
    providerPaymentId: `pay_${n}`, idempotencyKey: `checkout-${n}-attempt-1`, status: 'CAPTURED', currency: 'INR',
    authorizedAmount: D(f.grand), capturedAmount: D(f.grand), refunds: [], createdAt: orderDate(n) };
});

await emit('shipments', n => {
  const shippedAt = later(orderDate(n), 1);
  return { _id: id('shipments', n), orderId: id('orders', n), sellerId: id('sellers', n),
    warehouseId: id('warehouses', n), packageId: subId(106, n), carrierName: 'Example Express',
    carrier: { name: 'Example Express', service: 'STANDARD' }, trackingNumber: `EX${String(n).padStart(8, '0')}`,
    items: [{ lineId: subId(105, n), quantity: I(orderFacts(n).qty) }], status: 'DELIVERED',
    trackingEvents: [{ code: 'PICKED_UP', location: { city: 'Kolkata' }, occurredAt: shippedAt },
      { code: 'IN_TRANSIT', location: { city: 'Bhubaneswar' }, occurredAt: later(shippedAt, 1) },
      { code: 'DELIVERED', location: { city: 'Kolkata' }, occurredAt: later(shippedAt, 3) }],
    shippedAt, deliveredAt: later(shippedAt, 3) };
});

// The exercise intentionally has one return case per order so every collection has COUNT rows.
// REQUESTED means no refund or inventory restock has occurred yet.
await emit('returns', n => ({
  _id: id('returns', n), returnNumber: `RET-2026-${String(n).padStart(6, '0')}`,
  orderId: id('orders', n), customerId: id('customers', n), status: 'REQUESTED',
  items: [{ lineId: subId(105, n), quantity: I(1),
    reason: { code: pick(['DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED']), detail: faker.lorem.sentence() },
    evidence: [{ url: `https://example.test/evidence/${n}.webp`, type: 'IMAGE' }],
    inspection: { condition: 'PENDING', checklist: [{ question: 'Original packaging?', answer: null },
      { question: 'Serial matches?', answer: null }], inspectedAt: null },
    resolution: { type: 'PENDING', approvedAmount: D(0) } }], createdAt: later(orderDate(n), 5)
}));

await emit('reviews', n => ({
  _id: id('reviews', n), ...productInfo(n), customerId: id('customers', n), orderId: id('orders', n),
  rating: I(1 + n % 5), title: faker.lorem.words(4), body: faker.lorem.sentences(2),
  verifiedPurchase: true, status: 'PUBLISHED',
  aspects: [{ name: 'quality', rating: I(number(1, 5)) }, { name: 'delivery', rating: I(number(1, 5)) }],
  createdAt: later(orderDate(n), 6)
}));

await emit('promotions', n => ({
  _id: id('promotions', n), code: `PROMO-${n}`, status: 'ACTIVE',
  validFrom: new Date('2025-01-01T00:00:00Z'), validUntil: new Date('2027-01-01T00:00:00Z'),
  usage: { globalLimit: I(10000), perCustomerLimit: I(1), redeemedCount: I(n % 5 === 0 ? 1 : 0) },
  eligibility: { all: [{ field: 'cart.subtotal', operator: 'GTE', value: D(500000) }],
    any: [{ field: 'item.categoryId', operator: 'IN', values: [id('categories', n)] },
      { field: 'item.sellerId', operator: 'IN', values: [id('sellers', n)] }],
    exclusions: [{ field: 'item.sku', operator: 'IN', values: [`EXCLUDED-${n}`] }] },
  benefit: { type: 'PERCENTAGE', rate: D(500), maxDiscount: D(500000), appliesTo: 'ELIGIBLE_ITEMS' },
  stacking: { stackable: false, priority: I(20) }
}));

await emit('wishlists', n => ({
  _id: id('wishlists', n), customerId: id('customers', n), name: `Wishlist ${n}`,
  items: [0, 1, 2].map(offset => ({ ...productInfo((n + offset) % COUNT), addedAt: date() })),
  updatedAt: new Date('2026-09-01T00:00:00Z')
}));

await emit('audit_events', n => ({
  _id: id('audit_events', n), actor: { type: 'SELLER_ADMIN', id: id('sellers', n) },
  action: 'PRODUCT_PRICE_CHANGED', entity: { type: 'PRODUCT', id: id('products', n) },
  changes: [{ path: 'variants.0.pricing.salePrice', before: D(1000000), after: D(900000) }],
  requestId: `req_${n}`, occurredAt: date()
}));

await writeFile(resolve(outDir, 'manifest.json'), JSON.stringify({ collections: summary, total: COUNT * collections.length,
  format: 'newline-delimited canonical MongoDB Extended JSON' }, null, 2) + '\n');
console.log(`Done: ${COUNT * collections.length} documents across ${collections.length} collections.`);
