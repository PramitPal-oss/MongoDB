// seed-complex.js
const { faker } = require('@faker-js/faker');
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ecommerce_advanced';
const BATCH_SIZE = 1000;
const TOTAL_RECORDS = 100000;

// Helper to generate batches for memory efficiency
async function insertInBatches(collection, generator, total, batchSize) {
  console.log(`Starting to seed ${collection.collectionName}...`);
  let inserted = 0;

  while (inserted < total) {
    const batch = [];
    const remaining = Math.min(batchSize, total - inserted);

    for (let i = 0; i < remaining; i++) {
      batch.push(generator(inserted + i));
    }

    await collection.insertMany(batch, { ordered: false });
    inserted += remaining;

    if (inserted % 10000 === 0) {
      console.log(`${collection.collectionName}: ${inserted}/${total} inserted`);
    }
  }

  console.log(`✓ Completed ${collection.collectionName}: ${total} records`);
}

// COLLECTION 1: PRODUCTS (Highly nested with variants, inventory, reviews)
function generateProduct(index) {
  const categoryTree = [
    ['Electronics', 'Smartphones', faker.helpers.arrayElement(['iPhone', 'Samsung', 'OnePlus'])],
    ['Electronics', 'Laptops', faker.helpers.arrayElement(['Gaming', 'Business', 'Ultrabook'])],
    ['Fashion', 'Mens', faker.helpers.arrayElement(['Shirts', 'Pants', 'Shoes'])],
    ['Fashion', 'Womens', faker.helpers.arrayElement(['Dresses', 'Tops', 'Accessories'])],
    ['Home', 'Furniture', faker.helpers.arrayElement(['Sofa', 'Bed', 'Table'])],
    ['Home', 'Kitchen', faker.helpers.arrayElement(['Cookware', 'Appliances', 'Utensils'])],
  ];

  const [mainCat, subCat, subSubCat] = faker.helpers.arrayElement(categoryTree);

  const variants = Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, (_, vi) => {
    const warehouseStock = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
      warehouseId: faker.string.uuid(),
      warehouseName: `${faker.location.city()} Warehouse`,
      location: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        coordinates: {
          lat: parseFloat(faker.location.latitude()),
          lng: parseFloat(faker.location.longitude()),
        },
      },
      quantity: faker.number.int({ min: 0, max: 500 }),
      reservedQuantity: faker.number.int({ min: 0, max: 50 }),
      lastRestocked: faker.date.recent({ days: 90 }),
      binLocation: `${faker.string.alpha({ length: 2, casing: 'upper' })}-${faker.number.int({ min: 1, max: 99 })}-${faker.number.int({ min: 1, max: 20 })}`,
    }));

    return {
      variantId: faker.string.uuid(),
      sku: `SKU-${index}-${vi}-${faker.string.alphanumeric(8).toUpperCase()}`,
      attributes: {
        color: faker.color.human(),
        size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', '2XL']),
        material: faker.helpers.arrayElement(['Cotton', 'Polyester', 'Leather', 'Metal', 'Plastic']),
        weight: `${faker.number.float({ min: 0.1, max: 50, precision: 0.01 })} kg`,
      },
      pricing: {
        basePrice: parseFloat(faker.commerce.price({ min: 10, max: 5000 })),
        salePrice: parseFloat(faker.commerce.price({ min: 10, max: 4500 })),
        costPrice: parseFloat(faker.commerce.price({ min: 5, max: 3000 })),
        currency: 'USD',
        priceHistory: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () => ({
          price: parseFloat(faker.commerce.price()),
          effectiveFrom: faker.date.past({ years: 2 }),
          effectiveTo: faker.date.past({ years: 1 }),
          reason: faker.helpers.arrayElement(['Seasonal Sale', 'Clearance', 'Promotion', 'Price Correction']),
        })),
      },
      inventory: {
        totalStock: warehouseStock.reduce((sum, w) => sum + w.quantity, 0),
        availableStock: warehouseStock.reduce((sum, w) => sum + (w.quantity - w.reservedQuantity), 0),
        warehouses: warehouseStock,
      },
      images: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
        url: faker.image.url(),
        alt: faker.commerce.productDescription(),
        isPrimary: faker.datatype.boolean({ probability: 0.2 }),
        order: faker.number.int({ min: 1, max: 10 }),
      })),
    };
  });

  const reviews = Array.from({ length: faker.number.int({ min: 5, max: 50 }) }, () => ({
    reviewId: faker.string.uuid(),
    userId: faker.string.uuid(),
    userName: faker.person.fullName(),
    rating: faker.number.int({ min: 1, max: 5 }),
    title: faker.lorem.sentence(),
    comment: faker.lorem.paragraph(),
    verified: faker.datatype.boolean({ probability: 0.7 }),
    createdAt: faker.date.past({ years: 2 }),
    helpful: {
      upvotes: faker.number.int({ min: 0, max: 100 }),
      downvotes: faker.number.int({ min: 0, max: 20 }),
    },
    responses: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      responderId: faker.string.uuid(),
      responderName: faker.helpers.arrayElement(['Seller', 'Customer Support']),
      response: faker.lorem.paragraph(),
      respondedAt: faker.date.recent({ days: 30 }),
    })),
    images: faker.datatype.boolean({ probability: 0.3 })
      ? Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.image.url())
      : [],
  }));

  return {
    productId: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    brand: faker.company.name(),
    category: {
      main: mainCat,
      sub: subCat,
      subSub: subSubCat,
      path: `${mainCat}/${subCat}/${subSubCat}`,
    },
    tags: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () => faker.commerce.productAdjective()),
    variants: variants,
    reviews: {
      averageRating: parseFloat((faker.number.float({ min: 1, max: 5, precision: 0.1 })).toFixed(1)),
      totalReviews: reviews.length,
      ratingDistribution: {
        5: faker.number.int({ min: 0, max: reviews.length }),
        4: faker.number.int({ min: 0, max: reviews.length }),
        3: faker.number.int({ min: 0, max: reviews.length }),
        2: faker.number.int({ min: 0, max: reviews.length }),
        1: faker.number.int({ min: 0, max: reviews.length }),
      },
      items: reviews,
    },
    seo: {
      metaTitle: faker.lorem.sentence(),
      metaDescription: faker.lorem.paragraph(),
      keywords: Array.from({ length: faker.number.int({ min: 5, max: 15 }) }, () => faker.word.noun()),
      slug: faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
    },
    supplier: {
      supplierId: faker.string.uuid(),
      name: faker.company.name(),
      contact: {
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      leadTime: `${faker.number.int({ min: 1, max: 30 })} days`,
      minimumOrderQuantity: faker.number.int({ min: 10, max: 500 }),
    },
    status: faker.helpers.arrayElement(['Active', 'Inactive', 'Out of Stock', 'Discontinued']),
    createdAt: faker.date.past({ years: 3 }),
    updatedAt: faker.date.recent({ days: 30 }),
  };
}

// COLLECTION 2: CUSTOMERS (Deep nesting with orders, wishlists, interactions)
function generateCustomer(index) {
  const orders = Array.from({ length: faker.number.int({ min: 1, max: 15 }) }, () => {
    const items = Array.from({ length: faker.number.int({ min: 1, max: 8 }) }, () => {
      const quantity = faker.number.int({ min: 1, max: 5 });
      const unitPrice = parseFloat(faker.commerce.price({ min: 10, max: 500 }));

      return {
        productId: faker.string.uuid(),
        variantId: faker.string.uuid(),
        sku: `SKU-${faker.string.alphanumeric(12).toUpperCase()}`,
        name: faker.commerce.productName(),
        quantity: quantity,
        unitPrice: unitPrice,
        discount: parseFloat(faker.commerce.price({ min: 0, max: 50 })),
        tax: parseFloat((unitPrice * quantity * 0.1).toFixed(2)),
        subtotal: parseFloat((unitPrice * quantity).toFixed(2)),
        customization: faker.datatype.boolean({ probability: 0.2 }) ? {
          text: faker.lorem.sentence(),
          placement: faker.helpers.arrayElement(['Front', 'Back', 'Sleeve']),
          color: faker.color.human(),
          additionalCost: parseFloat(faker.commerce.price({ min: 5, max: 50 })),
        } : null,
        giftWrap: faker.datatype.boolean({ probability: 0.15 }) ? {
          message: faker.lorem.sentence(),
          wrapType: faker.helpers.arrayElement(['Standard', 'Premium', 'Luxury']),
          cost: parseFloat(faker.commerce.price({ min: 5, max: 20 })),
        } : null,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.tax, 0);
    const discountTotal = items.reduce((sum, item) => sum + item.discount, 0);

    return {
      orderId: faker.string.uuid(),
      orderNumber: `ORD-${Date.now()}-${faker.string.alphanumeric(8).toUpperCase()}`,
      placedAt: faker.date.past({ years: 2 }),
      status: faker.helpers.arrayElement(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']),
      items: items,
      pricing: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(taxTotal.toFixed(2)),
        discount: parseFloat(discountTotal.toFixed(2)),
        shippingCost: parseFloat(faker.commerce.price({ min: 0, max: 50 })),
        total: parseFloat((subtotal + taxTotal - discountTotal + parseFloat(faker.commerce.price({ min: 0, max: 50 }))).toFixed(2)),
      },
      payment: {
        method: faker.helpers.arrayElement(['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery']),
        status: faker.helpers.arrayElement(['Pending', 'Authorized', 'Captured', 'Failed', 'Refunded']),
        transactionId: faker.string.uuid(),
        paidAt: faker.date.recent({ days: 60 }),
        gateway: faker.helpers.arrayElement(['Stripe', 'PayPal', 'Square', 'Razorpay']),
        cardDetails: {
          last4: faker.finance.creditCardNumber().slice(-4),
          brand: faker.helpers.arrayElement(['Visa', 'MasterCard', 'Amex', 'Discover']),
          expiryMonth: faker.number.int({ min: 1, max: 12 }),
          expiryYear: faker.number.int({ min: 2024, max: 2030 }),
        },
      },
      shipping: {
        address: {
          fullName: faker.person.fullName(),
          phone: faker.phone.number(),
          addressLine1: faker.location.streetAddress(),
          addressLine2: faker.location.secondaryAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
          coordinates: {
            lat: parseFloat(faker.location.latitude()),
            lng: parseFloat(faker.location.longitude()),
          },
        },
        method: faker.helpers.arrayElement(['Standard', 'Express', 'Next Day', 'Same Day']),
        carrier: faker.helpers.arrayElement(['FedEx', 'UPS', 'DHL', 'USPS']),
        trackingNumber: faker.string.alphanumeric(20).toUpperCase(),
        estimatedDelivery: faker.date.soon({ days: 14 }),
        actualDelivery: faker.datatype.boolean({ probability: 0.6 }) ? faker.date.recent({ days: 30 }) : null,
        statusHistory: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => ({
          status: faker.helpers.arrayElement(['Order Placed', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered']),
          timestamp: faker.date.recent({ days: 30 }),
          location: faker.location.city(),
          notes: faker.lorem.sentence(),
        })),
      },
      notes: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.paragraph() : '',
    };
  });

  return {
    customerId: faker.string.uuid(),
    profile: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other', 'Prefer not to say']),
      avatar: faker.image.avatar(),
    },
    addresses: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      addressId: faker.string.uuid(),
      type: faker.helpers.arrayElement(['Home', 'Work', 'Other']),
      isDefault: faker.datatype.boolean({ probability: 0.3 }),
      fullName: faker.person.fullName(),
      phone: faker.phone.number(),
      addressLine1: faker.location.streetAddress(),
      addressLine2: faker.location.secondaryAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      landmark: faker.datatype.boolean({ probability: 0.4 }) ? faker.lorem.sentence() : '',
      coordinates: {
        lat: parseFloat(faker.location.latitude()),
        lng: parseFloat(faker.location.longitude()),
      },
    })),
    orders: orders,
    orderStats: {
      totalOrders: orders.length,
      totalSpent: parseFloat(orders.reduce((sum, o) => sum + o.pricing.total, 0).toFixed(2)),
      averageOrderValue: parseFloat((orders.reduce((sum, o) => sum + o.pricing.total, 0) / orders.length).toFixed(2)),
      lastOrderDate: orders.length > 0 ? orders[orders.length - 1].placedAt : null,
    },
    wishlist: Array.from({ length: faker.number.int({ min: 0, max: 20 }) }, () => ({
      productId: faker.string.uuid(),
      variantId: faker.string.uuid(),
      addedAt: faker.date.recent({ days: 90 }),
      notes: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : '',
    })),
    cart: {
      items: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
        productId: faker.string.uuid(),
        variantId: faker.string.uuid(),
        quantity: faker.number.int({ min: 1, max: 5 }),
        addedAt: faker.date.recent({ days: 7 }),
      })),
      lastUpdated: faker.date.recent({ days: 7 }),
    },
    loyaltyProgram: {
      memberId: faker.string.alphanumeric(10).toUpperCase(),
      tier: faker.helpers.arrayElement(['Bronze', 'Silver', 'Gold', 'Platinum']),
      points: faker.number.int({ min: 0, max: 10000 }),
      pointsHistory: Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, () => ({
        points: faker.number.int({ min: -500, max: 500 }),
        reason: faker.helpers.arrayElement(['Purchase', 'Refund', 'Bonus', 'Redemption', 'Expiry']),
        orderId: faker.datatype.boolean({ probability: 0.7 }) ? faker.string.uuid() : null,
        timestamp: faker.date.past({ years: 1 }),
      })),
      joinedAt: faker.date.past({ years: 3 }),
    },
    preferences: {
      newsletter: faker.datatype.boolean({ probability: 0.6 }),
      smsNotifications: faker.datatype.boolean({ probability: 0.4 }),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'ja']),
      currency: 'USD',
      favoriteCategories: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.commerce.department()),
    },
    interactions: {
      pageViews: Array.from({ length: faker.number.int({ min: 10, max: 50 }) }, () => ({
        url: faker.internet.url(),
        timestamp: faker.date.recent({ days: 30 }),
        duration: faker.number.int({ min: 5, max: 600 }),
      })),
      searches: Array.from({ length: faker.number.int({ min: 5, max: 30 }) }, () => ({
        query: faker.commerce.productName(),
        timestamp: faker.date.recent({ days: 30 }),
        resultsCount: faker.number.int({ min: 0, max: 100 }),
      })),
      supportTickets: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
        ticketId: faker.string.uuid(),
        subject: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved', 'Closed']),
        priority: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Urgent']),
        createdAt: faker.date.past({ years: 1 }),
        messages: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => ({
          from: faker.helpers.arrayElement(['Customer', 'Support Agent']),
          message: faker.lorem.paragraph(),
          timestamp: faker.date.recent({ days: 30 }),
          attachments: faker.datatype.boolean({ probability: 0.2 })
            ? Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.system.filePath())
            : [],
        })),
      })),
    },
    accountStatus: {
      isActive: faker.datatype.boolean({ probability: 0.95 }),
      isVerified: faker.datatype.boolean({ probability: 0.85 }),
      isSuspended: faker.datatype.boolean({ probability: 0.02 }),
      suspensionReason: faker.datatype.boolean({ probability: 0.02 }) ? faker.lorem.sentence() : null,
    },
    registeredAt: faker.date.past({ years: 5 }),
    lastLogin: faker.date.recent({ days: 30 }),
  };
}

// COLLECTION 3: SELLERS (Complex multi-level nesting with products, analytics, settlements)
function generateSeller(index) {
  const products = Array.from({ length: faker.number.int({ min: 5, max: 50 }) }, () => ({
    productId: faker.string.uuid(),
    name: faker.commerce.productName(),
    sku: `SELLER-${faker.string.alphanumeric(12).toUpperCase()}`,
    listedAt: faker.date.past({ years: 2 }),
    status: faker.helpers.arrayElement(['Active', 'Inactive', 'Pending Approval', 'Rejected']),
    pricing: {
      basePrice: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      commission: parseFloat(faker.commerce.price({ min: 5, max: 20 })),
      commissionType: faker.helpers.arrayElement(['Percentage', 'Fixed']),
    },
    inventory: faker.number.int({ min: 0, max: 1000 }),
    sales: {
      totalSold: faker.number.int({ min: 0, max: 500 }),
      revenue: parseFloat(faker.commerce.price({ min: 100, max: 50000 })),
      lastSaleDate: faker.date.recent({ days: 30 }),
    },
  }));

  const settlements = Array.from({ length: faker.number.int({ min: 5, max: 30 }) }, () => ({
    settlementId: faker.string.uuid(),
    periodStart: faker.date.past({ years: 1 }),
    periodEnd: faker.date.recent({ days: 30 }),
    orders: Array.from({ length: faker.number.int({ min: 1, max: 20 }) }, () => ({
      orderId: faker.string.uuid(),
      orderAmount: parseFloat(faker.commerce.price({ min: 50, max: 1000 })),
      commission: parseFloat(faker.commerce.price({ min: 5, max: 100 })),
      netAmount: parseFloat(faker.commerce.price({ min: 40, max: 900 })),
      orderedAt: faker.date.recent({ days: 60 }),
    })),
    totalAmount: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
    commissionDeducted: parseFloat(faker.commerce.price({ min: 100, max: 5000 })),
    netSettlement: parseFloat(faker.commerce.price({ min: 900, max: 45000 })),
    status: faker.helpers.arrayElement(['Pending', 'Processing', 'Completed', 'Failed']),
    paidAt: faker.datatype.boolean({ probability: 0.8 }) ? faker.date.recent({ days: 30 }) : null,
    paymentDetails: {
      method: faker.helpers.arrayElement(['Bank Transfer', 'PayPal', 'Check']),
      transactionId: faker.string.uuid(),
      accountNumber: `****${faker.finance.accountNumber().slice(-4)}`,
    },
  }));

  return {
    sellerId: faker.string.uuid(),
    businessInfo: {
      businessName: faker.company.name(),
      legalName: faker.company.name(),
      businessType: faker.helpers.arrayElement(['Individual', 'LLC', 'Corporation', 'Partnership']),
      taxId: faker.finance.accountNumber(9),
      registrationNumber: faker.string.alphanumeric(12).toUpperCase(),
      logo: faker.image.url(),
      description: faker.company.catchPhrase(),
      website: faker.internet.url(),
    },
    contactInfo: {
      primaryContact: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        position: faker.person.jobTitle(),
      },
      supportEmail: faker.internet.email(),
      supportPhone: faker.phone.number(),
    },
    addresses: {
      business: {
        addressLine1: faker.location.streetAddress(),
        addressLine2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      warehouse: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
        warehouseId: faker.string.uuid(),
        name: `${faker.location.city()} Warehouse`,
        addressLine1: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
        capacity: faker.number.int({ min: 1000, max: 50000 }),
        currentStock: faker.number.int({ min: 100, max: 40000 }),
      })),
    },
    bankingDetails: {
      accountHolderName: faker.person.fullName(),
      bankName: faker.company.name() + ' Bank',
      accountNumber: faker.finance.accountNumber(),
      routingNumber: faker.finance.routingNumber(),
      swiftCode: faker.finance.bic(),
      currency: 'USD',
    },
    products: products,
    productStats: {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'Active').length,
      totalRevenue: parseFloat(products.reduce((sum, p) => sum + p.sales.revenue, 0).toFixed(2)),
      totalUnitsSold: products.reduce((sum, p) => sum + p.sales.totalSold, 0),
    },
    settlements: settlements,
    settlementStats: {
      totalSettlements: settlements.length,
      totalEarned: parseFloat(settlements.reduce((sum, s) => sum + s.netSettlement, 0).toFixed(2)),
      pendingSettlements: settlements.filter(s => s.status === 'Pending').length,
      lastSettlementDate: settlements.length > 0 ? settlements[settlements.length - 1].periodEnd : null,
    },
    performance: {
      ratings: {
        average: parseFloat(faker.number.float({ min: 1, max: 5, precision: 0.1 }).toFixed(1)),
        total: faker.number.int({ min: 10, max: 1000 }),
        distribution: {
          5: faker.number.int({ min: 0, max: 500 }),
          4: faker.number.int({ min: 0, max: 300 }),
          3: faker.number.int({ min: 0, max: 150 }),
          2: faker.number.int({ min: 0, max: 50 }),
          1: faker.number.int({ min: 0, max: 20 }),
        },
      },
      metrics: {
        orderFulfillmentRate: parseFloat(faker.number.float({ min: 0.7, max: 1, precision: 0.01 }).toFixed(2)),
        avgShippingTime: faker.number.int({ min: 1, max: 10 }),
        returnRate: parseFloat(faker.number.float({ min: 0, max: 0.15, precision: 0.01 }).toFixed(2)),
        responseTime: faker.number.int({ min: 1, max: 48 }),
        disputeRate: parseFloat(faker.number.float({ min: 0, max: 0.05, precision: 0.01 }).toFixed(2)),
      },
      monthlyStats: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1),
        orders: faker.number.int({ min: 10, max: 500 }),
        revenue: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
        newCustomers: faker.number.int({ min: 5, max: 100 }),
        returningCustomers: faker.number.int({ min: 10, max: 200 }),
      })),
    },
    verification: {
      isVerified: faker.datatype.boolean({ probability: 0.9 }),
      verifiedAt: faker.date.past({ years: 2 }),
      documents: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
        type: faker.helpers.arrayElement(['Business License', 'Tax Certificate', 'ID Proof', 'Address Proof']),
        documentId: faker.string.uuid(),
        uploadedAt: faker.date.past({ years: 1 }),
        status: faker.helpers.arrayElement(['Approved', 'Pending', 'Rejected']),
      })),
    },
    subscriptionPlan: {
      planName: faker.helpers.arrayElement(['Basic', 'Pro', 'Enterprise']),
      startDate: faker.date.past({ years: 2 }),
      renewalDate: faker.date.future(),
      price: parseFloat(faker.commerce.price({ min: 29, max: 499 })),
      features: Array.from({ length: faker.number.int({ min: 5, max: 15 }) }, () => faker.commerce.productAdjective()),
    },
    notifications: Array.from({ length: faker.number.int({ min: 5, max: 30 }) }, () => ({
      notificationId: faker.string.uuid(),
      type: faker.helpers.arrayElement(['Order', 'Payment', 'Review', 'System', 'Promotion']),
      title: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      isRead: faker.datatype.boolean({ probability: 0.6 }),
      createdAt: faker.date.recent({ days: 30 }),
      priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
    })),
    policies: {
      shippingPolicy: faker.lorem.paragraph(),
      returnPolicy: faker.lorem.paragraph(),
      refundPolicy: faker.lorem.paragraph(),
      privacyPolicy: faker.lorem.paragraph(),
      processingTime: `${faker.number.int({ min: 1, max: 5 })} business days`,
    },
    accountStatus: {
      isActive: faker.datatype.boolean({ probability: 0.95 }),
      isSuspended: faker.datatype.boolean({ probability: 0.02 }),
      suspensionReason: faker.datatype.boolean({ probability: 0.02 }) ? faker.lorem.sentence() : null,
      warnings: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
        warningId: faker.string.uuid(),
        reason: faker.lorem.sentence(),
        issuedAt: faker.date.past({ years: 1 }),
        severity: faker.helpers.arrayElement(['Minor', 'Major', 'Critical']),
      })),
    },
    analytics: {
      trafficSources: {
        organic: faker.number.int({ min: 100, max: 10000 }),
        paid: faker.number.int({ min: 50, max: 5000 }),
        social: faker.number.int({ min: 20, max: 3000 }),
        direct: faker.number.int({ min: 10, max: 2000 }),
        referral: faker.number.int({ min: 5, max: 1000 }),
      },
      topProducts: Array.from({ length: faker.number.int({ min: 5, max: 10 }) }, () => ({
        productId: faker.string.uuid(),
        name: faker.commerce.productName(),
        views: faker.number.int({ min: 100, max: 10000 }),
        sales: faker.number.int({ min: 10, max: 500 }),
        revenue: parseFloat(faker.commerce.price({ min: 500, max: 50000 })),
        conversionRate: parseFloat(faker.number.float({ min: 0.01, max: 0.25, precision: 0.01 }).toFixed(2)),
      })),
      customerDemographics: {
        ageGroups: {
          '18-25': faker.number.int({ min: 50, max: 500 }),
          '26-35': faker.number.int({ min: 100, max: 1000 }),
          '36-45': faker.number.int({ min: 80, max: 800 }),
          '46-55': faker.number.int({ min: 50, max: 500 }),
          '55+': faker.number.int({ min: 30, max: 300 }),
        },
        genderDistribution: {
          male: faker.number.int({ min: 200, max: 2000 }),
          female: faker.number.int({ min: 200, max: 2000 }),
          other: faker.number.int({ min: 10, max: 100 }),
        },
        topLocations: Array.from({ length: 10 }, () => ({
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.country(),
          customers: faker.number.int({ min: 10, max: 500 }),
          revenue: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
        })),
      },
    },
    integrations: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => ({
      integrationId: faker.string.uuid(),
      service: faker.helpers.arrayElement(['Shopify', 'WooCommerce', 'Amazon', 'eBay', 'QuickBooks', 'Mailchimp']),
      status: faker.helpers.arrayElement(['Active', 'Inactive', 'Error']),
      connectedAt: faker.date.past({ years: 1 }),
      lastSyncAt: faker.date.recent({ days: 7 }),
      apiKey: faker.string.alphanumeric(32),
      settings: {
        autoSync: faker.datatype.boolean({ probability: 0.8 }),
        syncFrequency: faker.helpers.arrayElement(['Real-time', 'Hourly', 'Daily']),
      },
    })),
    registeredAt: faker.date.past({ years: 5 }),
    lastLoginAt: faker.date.recent({ days: 7 }),
  };
}

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db(dbName);

    // Create collections
    const productsCollection = db.collection('products');
    const customersCollection = db.collection('customers');
    const sellersCollection = db.collection('sellers');

    // Clear existing data
    console.log('\nClearing existing data...');
    await productsCollection.deleteMany({});
    await customersCollection.deleteMany({});
    await sellersCollection.deleteMany({});
    console.log('✓ Cleared all collections');

    console.log(`\nSeeding ${TOTAL_RECORDS} records per collection...\n`);

    // Seed all collections
    await insertInBatches(productsCollection, generateProduct, TOTAL_RECORDS, BATCH_SIZE);
    await insertInBatches(customersCollection, generateCustomer, TOTAL_RECORDS, BATCH_SIZE);
    await insertInBatches(sellersCollection, generateSeller, TOTAL_RECORDS, BATCH_SIZE);

    // Create indexes for better query performance
    console.log('\nCreating indexes...');

    await productsCollection.createIndexes([
      { key: { productId: 1 }, unique: true },
      { key: { 'category.path': 1 } },
      { key: { 'variants.sku': 1 } },
      { key: { status: 1 } },
      { key: { 'reviews.averageRating': -1 } },
      { key: { createdAt: -1 } },
    ]);

    await customersCollection.createIndexes([
      { key: { customerId: 1 }, unique: true },
      { key: { 'profile.email': 1 }, unique: true },
      { key: { 'orders.orderId': 1 } },
      { key: { 'orders.status': 1 } },
      { key: { 'loyaltyProgram.tier': 1 } },
      { key: { registeredAt: -1 } },
    ]);

    await sellersCollection.createIndexes([
      { key: { sellerId: 1 }, unique: true },
      { key: { 'businessInfo.businessName': 1 } },
      { key: { 'products.productId': 1 } },
      { key: { 'performance.ratings.average': -1 } },
      { key: { 'accountStatus.isActive': 1 } },
      { key: { registeredAt: -1 } },
    ]);

    console.log('✓ Created indexes');

    // Display statistics
    const productsCount = await productsCollection.countDocuments();
    const customersCount = await customersCollection.countDocuments();
    const sellersCount = await sellersCollection.countDocuments();

    console.log('\n' + '='.repeat(60));
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`Database: ${dbName}`);
    console.log(`Products: ${productsCount.toLocaleString()} documents`);
    console.log(`Customers: ${customersCount.toLocaleString()} documents`);
    console.log(`Sellers: ${sellersCount.toLocaleString()} documents`);
    console.log(`Total: ${(productsCount + customersCount + sellersCount).toLocaleString()} documents`);
    console.log('='.repeat(60));

    console.log('\nSample Query Examples:');
    console.log('1. Find products with rating > 4.5:');
    console.log('   db.products.find({ "reviews.averageRating": { $gt: 4.5 } })');
    console.log('\n2. Find customers with total spent > $5000:');
    console.log('   db.customers.find({ "orderStats.totalSpent": { $gt: 5000 } })');
    console.log('\n3. Find top sellers by rating:');
    console.log('   db.sellers.find().sort({ "performance.ratings.average": -1 }).limit(10)');
    console.log('\n4. Complex nested query - Products in specific warehouse with low stock:');
    console.log('   db.products.find({ "variants.inventory.warehouses": { $elemMatch: { "quantity": { $lt: 50 } } } })');
    console.log('\n5. Customer orders with specific status and payment method:');
    console.log('   db.customers.find({ "orders": { $elemMatch: { "status": "Delivered", "payment.method": "Credit Card" } } })');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the seed function
seed().catch(console.error);

/*
USAGE INSTRUCTIONS:
==================
1. Install dependencies:
   npm install @faker-js/faker mongodb

2. Make sure MongoDB is running on localhost:27017

3. Run the script:
   node seed-complex.js

4. The script will create:
   - Database: ecommerce_advanced
   - Collections: products, customers, sellers
   - 100,000 documents in each collection (300,000 total)

PERFORMANCE NOTES:
=================
- Seeding 100k records per collection takes 5-15 minutes depending on hardware
- Uses batch inserts (1000 docs per batch) for memory efficiency
- Progress is logged every 10,000 records
- Indexes are created after seeding for better insert performance

COMPLEXITY HIGHLIGHTS:
=====================
Products Collection:
- 2-8 variants per product
- 2-5 warehouses per variant with location coordinates
- 5-50 reviews with responses and voting
- Price history tracking
- Multi-level categories (3 levels deep)
- Supplier information

Customers Collection:
- 1-15 orders per customer with 1-8 items each
- Order tracking with status history
- Multiple addresses with coordinates
- Loyalty program with points history
- Wishlist and cart
- Support tickets with message threads
- Page view and search history

Sellers Collection:
- 5-50 products per seller
- 5-30 settlements with detailed order breakdowns
- Multiple warehouses with capacity tracking
- Monthly performance statistics (12 months)
- Rating distribution
- Document verification system
- Integration with external services
- Customer demographics and analytics
*/