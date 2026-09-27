const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Configuration
const TOTAL_RECORDS = 10000; // 10 million records (1 core)
const BATCH_SIZE = 100;      // Process in batches of 100,000
const OUTPUT_FILE = 'mongodb_practice_data.json';
const NUM_WORKERS = Math.min(4, require('os').cpus().length); // Use up to 4 cores

// Product categories with subcategories for more realistic data
const productCategories = {
  'Electronics': ['Smartphones', 'Laptops', 'Cameras', 'Audio', 'Wearables', 'TVs'],
  'Clothing': ['Men', 'Women', 'Kids', 'Sportswear', 'Footwear', 'Accessories'],
  'Home & Kitchen': ['Furniture', 'Appliances', 'Cookware', 'Decor', 'Bedding', 'Storage'],
  'Books': ['Fiction', 'Non-Fiction', 'Academic', 'Children', 'Comics', 'Self-Help'],
  'Beauty': ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Bath & Body', 'Tools'],
  'Health': ['Vitamins', 'Supplements', 'Fitness', 'Medical Supplies', 'Personal Care'],
  'Grocery': ['Snacks', 'Beverages', 'Dairy', 'Fruits & Vegetables', 'Meat', 'Bakery'],
  'Toys': ['Action Figures', 'Board Games', 'Dolls', 'Educational', 'Outdoor', 'Puzzles'],
  'Sports': ['Fitness', 'Outdoor Recreation', 'Team Sports', 'Water Sports', 'Cycling'],
  'Automotive': ['Parts', 'Accessories', 'Tools', 'Electronics', 'Exterior', 'Interior']
};

const paymentMethods = ['Credit Card', 'Debit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Gift Card', 'Cash on Delivery'];
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const shippingMethods = ['Standard', 'Express', 'Next Day', 'Economy', 'International'];
const paymentStatuses = ['approved', 'pending', 'declined', 'refunded'];

// Generate a single user document with embedded fields
function generateUser(userId) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });
  const username = faker.internet.userName({ firstName, lastName });

  // Ensure user ID is unique
  const uniqueEmail = `${username.toLowerCase()}${userId}@${email.split('@')[1]}`;

  // Generate random dates for user timeline
  const registrationDate = faker.date.between({
    from: '2018-01-01T00:00:00.000Z',
    to: '2024-01-01T00:00:00.000Z'
  });

  const lastLoginDate = faker.date.between({
    from: registrationDate,
    to: new Date()
  });

  // Generate address with consistent location data
  const country = faker.location.country();
  const state = faker.location.state();
  const city = faker.location.city();
  const street = faker.location.street();
  const zipCode = faker.location.zipCode();
  const latitude = faker.location.latitude();
  const longitude = faker.location.longitude();

  // Generate a realistic number of orders (weighted toward fewer orders)
  const orderCount = Math.floor(Math.pow(faker.number.float({ min: 0, max: 1 }), 1.5) * 20);

  // Generate a consistent amount of total spending based on order history
  let totalSpent = 0;

  const orders = Array(orderCount).fill(null).map((_, index) => {
    // Generate order date after registration but before now
    const orderDate = faker.date.between({
      from: registrationDate,
      to: new Date()
    });

    const orderStatus = faker.helpers.arrayElement(orderStatuses);

    // Generate between 1 and 5 items per order with weighted distribution
    const itemCount = Math.min(5, Math.max(1, Math.floor(Math.random() * Math.random() * 10)));

    // Select a random category and subcategory for consistent order
    const category = faker.helpers.objectKey(productCategories);
    const subcategory = faker.helpers.arrayElement(productCategories[category]);

    // Generate order items
    const items = Array(itemCount).fill(null).map((_, itemIndex) => {
      const unitPrice = faker.number.float({ min: 4.99, max: 299.99, fractionDigits: 2 });
      const quantity = faker.number.int({ min: 1, max: 5 });
      const itemTotal = unitPrice * quantity;

      return {
        productId: `prod_${faker.string.uuid().substring(0, 8)}`,
        name: faker.commerce.productName(),
        category: category,
        subcategory: subcategory,
        quantity: quantity,
        unitPrice: unitPrice,
        itemTotal: itemTotal,
        rating: orderStatus === 'delivered' ? faker.number.int({ min: 1, max: 5 }) : null,
        reviewText: orderStatus === 'delivered' && Math.random() > 0.7 ? faker.lorem.paragraph() : null,
        addedToCart: faker.date.recent({ days: 7, refDate: orderDate })
      };
    });

    // Calculate order subtotal and total
    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const shippingCost = faker.number.float({ min: 0, max: 25, fractionDigits: 2 });
    const taxRate = faker.number.float({ min: 0.05, max: 0.12, fractionDigits: 2 });
    const taxAmount = subtotal * taxRate;
    const orderTotal = subtotal + shippingCost + taxAmount;

    // Add to total spent
    totalSpent += orderTotal;

    const shippingMethod = faker.helpers.arrayElement(shippingMethods);

    // Calculate delivery estimate based on shipping method
    const deliveryDays =
      shippingMethod === 'Next Day' ? 1 :
        shippingMethod === 'Express' ? faker.number.int({ min: 2, max: 3 }) :
          shippingMethod === 'Standard' ? faker.number.int({ min: 3, max: 5 }) :
            faker.number.int({ min: 5, max: 10 });

    const estimatedDelivery = new Date(orderDate);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // Generate payment information
    const paymentMethod = faker.helpers.arrayElement(paymentMethods);

    return {
      orderId: `order_${faker.string.uuid().substring(0, 8)}`,
      date: orderDate,
      status: orderStatus,
      items: items,
      billing: {
        subtotal: subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        discount: Math.random() > 0.8 ? faker.number.float({ min: 5, max: 25, fractionDigits: 2 }) : 0,
        total: orderTotal
      },
      shipping: {
        method: shippingMethod,
        cost: shippingCost,
        address: {
          name: `${firstName} ${lastName}`,
          street: street,
          city: city,
          state: state,
          country: country,
          zipCode: zipCode
        },
        estimatedDelivery: estimatedDelivery,
        trackingNumber: Math.random() > 0.3 ? `TRK${faker.string.numeric(10)}` : null,
        carrier: faker.helpers.arrayElement(['FedEx', 'UPS', 'USPS', 'DHL', 'Amazon Logistics'])
      },
      payment: {
        method: paymentMethod,
        cardLast4: paymentMethod.includes('Card') ? faker.string.numeric(4) : null,
        transactionId: `txn_${faker.string.alphanumeric(10)}`,
        status: faker.helpers.arrayElement(paymentStatuses)
      }
    };
  });

  // Calculate metrics based on order history
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  // Sort orders by date for realism
  orders.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Generate between 1-3 payment methods with one marked as default
  const paymentInfoCount = faker.number.int({ min: 1, max: 3 });
  const defaultPaymentIndex = faker.number.int({ min: 0, max: paymentInfoCount - 1 });

  const paymentInfo = Array(paymentInfoCount).fill(null).map((_, index) => {
    const method = faker.helpers.arrayElement(paymentMethods);
    return {
      id: `payment_${faker.string.uuid().substring(0, 8)}`,
      method: method,
      isDefault: index === defaultPaymentIndex,
      lastUsed: faker.date.between({ from: registrationDate, to: new Date() }),
      details: method.includes('Card') ? {
        cardType: faker.helpers.arrayElement(['Visa', 'Mastercard', 'Amex', 'Discover']),
        last4: faker.string.numeric(4),
        expiryMonth: faker.number.int({ min: 1, max: 12 }),
        expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 5 })
      } : null
    };
  });

  // Generate search history with timestamps
  const searchCount = faker.number.int({ min: 0, max: 15 });
  const searchTerms = Array(searchCount).fill(null).map(() => {
    return {
      term: faker.helpers.arrayElement([
        faker.commerce.productName(),
        faker.commerce.productAdjective() + ' ' + faker.commerce.product(),
        faker.helpers.objectKey(productCategories),
        faker.word.adjective() + ' ' + faker.commerce.product()
      ]),
      timestamp: faker.date.between({ from: lastLoginDate, to: new Date() })
    };
  });

  // Generate saved/wishlist items
  const savedItemsCount = faker.number.int({ min: 0, max: 10 });
  const savedItems = Array(savedItemsCount).fill(null).map(() => {
    return {
      productId: `prod_${faker.string.uuid().substring(0, 8)}`,
      name: faker.commerce.productName(),
      price: faker.commerce.price(),
      addedOn: faker.date.recent({ days: 90 }),
      category: faker.helpers.objectKey(productCategories)
    };
  });

  // Create user preferences with realistic settings
  const preferences = {
    theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
    notifications: {
      email: faker.datatype.boolean(),
      sms: faker.datatype.boolean(),
      app: faker.datatype.boolean()
    },
    language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru']),
    currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']),
    privacy: {
      shareData: faker.datatype.boolean(),
      allowCookies: faker.datatype.boolean(),
      marketingEmails: faker.datatype.boolean()
    }
  };

  return {
    _id: userId,
    username: username,
    email: uniqueEmail,
    status: faker.helpers.arrayElement(['active', 'inactive', 'suspended', 'pending']),
    registrationDate: registrationDate,
    lastLoginDate: lastLoginDate,
    profile: {
      firstName: firstName,
      lastName: lastName,
      displayName: Math.random() > 0.7 ? `${firstName} ${lastName}` : username,
      avatar: Math.random() > 0.5 ? `https://avatar.example.com/${userId}` : null,
      phoneNumber: faker.phone.number(),
      birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other', 'Prefer not to say']),
      bio: Math.random() > 0.7 ? faker.lorem.paragraph() : null,
      preferences: preferences
    },
    address: {
      primary: {
        street: street,
        city: city,
        state: state,
        country: country,
        zipCode: zipCode,
        coordinates: {
          latitude: latitude,
          longitude: longitude
        },
        isDefault: true,
        label: 'Home'
      },
      additional: Math.random() > 0.3 ? [
        {
          street: faker.location.street(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: country, // Keep same country for consistency
          zipCode: faker.location.zipCode(),
          coordinates: {
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude()
          },
          isDefault: false,
          label: faker.helpers.arrayElement(['Work', 'Office', 'Secondary', 'Parent\'s House'])
        }
      ] : []
    },
    paymentInfo: paymentInfo,
    orders: orders,
    activity: {
      lastProductViewed: Math.random() > 0.5 ? {
        productId: `prod_${faker.string.uuid().substring(0, 8)}`,
        name: faker.commerce.productName(),
        viewedAt: faker.date.recent({ days: 7 })
      } : null,
      savedItems: savedItems,
      searchHistory: searchTerms,
      recentlyViewedCategories: Array(faker.number.int({ min: 0, max: 5 }))
        .fill(null)
        .map(() => faker.helpers.objectKey(productCategories))
    },
    metrics: {
      totalSpent: totalSpent,
      averageOrderValue: averageOrderValue,
      orderFrequency: orderCount > 0 ?
        (new Date() - registrationDate) / (1000 * 60 * 60 * 24 * 30) / orderCount : 0,
      loyaltyPoints: faker.number.int({ min: 0, max: Math.floor(totalSpent) }),
      referrals: faker.number.int({ min: 0, max: 5 }),
      loginCount: faker.number.int({ min: 1, max: 500 }),
      lastActive: faker.date.recent({ days: 30 })
    },
    marketing: {
      source: faker.helpers.arrayElement(['Google', 'Facebook', 'Instagram', 'Direct', 'Referral', 'Organic']),
      subscribedToNewsletter: faker.datatype.boolean(),
      emailEngagementRate: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      tags: Array(faker.number.int({ min: 0, max: 4 }))
        .fill(null)
        .map(() => faker.helpers.arrayElement([
          'vip', 'high_value', 'frequent_buyer', 'inactive', 'new_customer',
          'discount_seeker', 'cart_abandoner', 'seasonal_shopper'
        ]))
    }
  };
}

// Worker function to generate data in batches
function workerFunction(workerId, startId, endId) {
  const users = [];
  for (let i = startId; i < endId; i++) {
    users.push(generateUser(i));
  }
  return { workerId, users };
}

// Handle worker threads
if (!isMainThread) {
  const { workerId, startId, endId } = workerData;
  const result = workerFunction(workerId, startId, endId);
  parentPort.postMessage(result);
} else {
  async function main() {
    console.time('Data generation');
    console.log(`Starting to generate ${TOTAL_RECORDS} records using ${NUM_WORKERS} workers...`);

    // Create or clear the output file
    fs.writeFileSync(OUTPUT_FILE, '[\n', { flag: 'w' });
    let firstRecord = true;

    // Create file streams for each worker
    const tempFiles = [];
    for (let w = 0; w < NUM_WORKERS; w++) {
      const tempFile = path.join(__dirname, `temp_data_${w}.json`);
      fs.writeFileSync(tempFile, '', { flag: 'w' });
      tempFiles.push(tempFile);
    }

    // Process in batches
    for (let batchStart = 0; batchStart < TOTAL_RECORDS; batchStart += BATCH_SIZE) {
      console.log(`Processing batch starting at ${batchStart}...`);
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_RECORDS);
      const recordsPerWorker = Math.ceil((batchEnd - batchStart) / NUM_WORKERS);

      const workerPromises = [];

      // Create workers for this batch
      for (let w = 0; w < NUM_WORKERS; w++) {
        const workerStartId = batchStart + (w * recordsPerWorker);
        const workerEndId = Math.min(workerStartId + recordsPerWorker, batchEnd);

        if (workerStartId >= workerEndId) continue;

        workerPromises.push(new Promise((resolve) => {
          const worker = new Worker(__filename, {
            workerData: { workerId: w, startId: workerStartId, endId: workerEndId }
          });

          worker.on('message', ({ workerId, users }) => {
            // Write each record individually to temp file
            const tempFile = tempFiles[workerId];
            const writeStream = fs.createWriteStream(tempFile, { flags: 'a' });

            for (let i = 0; i < users.length; i++) {
              const jsonLine = JSON.stringify(users[i]);
              writeStream.write(jsonLine + '\n');
            }

            writeStream.end();
            resolve();
          });

          worker.on('error', (err) => {
            console.error(err);
            resolve();
          });
        }));
      }

      // Wait for all workers in this batch to complete
      await Promise.all(workerPromises);

      // Now append all temporary files to the main output file
      for (let w = 0; w < NUM_WORKERS; w++) {
        const tempFile = tempFiles[w];
        if (fs.existsSync(tempFile) && fs.statSync(tempFile).size > 0) {
          const lines = fs.readFileSync(tempFile, 'utf8').split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (firstRecord) {
              fs.appendFileSync(OUTPUT_FILE, line);
              firstRecord = false;
            } else {
              fs.appendFileSync(OUTPUT_FILE, ',\n' + line);
            }
          }

          // Clear temp file for the next batch
          fs.writeFileSync(tempFile, '');
        }
      }

      console.log(`Completed batch ending at ${batchEnd}`);
    }

    // Close the JSON array
    fs.appendFileSync(OUTPUT_FILE, '\n]');

    // Clean up temp files
    for (const tempFile of tempFiles) {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }

    console.timeEnd('Data generation');
    console.log(`Generated ${TOTAL_RECORDS} records. Data saved to ${OUTPUT_FILE}`);
    console.log('You can now import this data to MongoDB using:');
    console.log(`mongoimport --db practice --collection users --file ${OUTPUT_FILE} --jsonArray`);
  }

  main().catch(console.error);
}