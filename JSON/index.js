const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');

// Configuration
const TOTAL_RECORDS = 10000; // 10 million records (1 core) 10000000
const BATCH_SIZE = 100;      // Reduced batch size from 1,000,000 to 100,000
const OUTPUT_FILE = 'mongodb_practice_data.json';
const NUM_WORKERS = Math.min(4, require('os').cpus().length); // Use up to 4 cores

// Sample data generators
const getRandomDate = (start = new Date(2020, 0, 1), end = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min, max, decimals = 2) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Sample data arrays
const productCategories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys', 'Sports', 'Beauty', 'Health', 'Automotive', 'Grocery'];
const paymentMethods = ['Credit Card', 'Debit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Gift Card', 'Cash on Delivery'];
const userStatuses = ['active', 'inactive', 'suspended', 'pending'];
const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'India', 'Brazil', 'Mexico'];
const cities = {
  'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
  'UK': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Sapporo'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
  'Brazil': ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana']
};

// Generate a single user document with embedded fields
function generateUser(userId) {
  const country = getRandomElement(countries);
  const registrationDate = getRandomDate();
  const lastLoginDate = new Date(Math.min(
    new Date().getTime(),
    registrationDate.getTime() + getRandomInt(0, 365 * 24 * 60 * 60 * 1000)
  ));

  return {
    _id: userId,
    username: `user_${userId}`,
    email: `user${userId}@example.com`,
    status: getRandomElement(userStatuses),
    registrationDate: registrationDate,
    lastLoginDate: lastLoginDate,
    profile: {
      firstName: `FirstName${userId % 1000}`,
      lastName: `LastName${userId % 1000}`,
      age: getRandomInt(18, 80),
      gender: getRandomElement(['Male', 'Female', 'Other']),
      preferences: {
        theme: getRandomElement(['light', 'dark', 'system']),
        notifications: getRandomElement([true, false]),
        language: getRandomElement(['en', 'es', 'fr', 'de', 'ja', 'zh'])
      }
    },
    address: {
      country: country,
      city: getRandomElement(cities[country]),
      zipCode: `${getRandomInt(10000, 99999)}`,
      street: `${getRandomInt(1, 999)} Main St`,
      coordinates: {
        latitude: getRandomFloat(-90, 90, 6),
        longitude: getRandomFloat(-180, 180, 6)
      }
    },
    paymentInfo: Array(getRandomInt(1, 3)).fill(null).map((_, index) => ({
      id: `payment_${userId}_${index}`,
      method: getRandomElement(paymentMethods),
      isDefault: index === 0, // First one is default
      lastUsed: getRandomDate(registrationDate)
    })),
    orders: Array(getRandomInt(0, 10)).fill(null).map((_, index) => {
      const orderDate = getRandomDate(registrationDate);
      const orderStatus = getRandomElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']);
      return {
        orderId: `order_${userId}_${index}`,
        date: orderDate,
        status: orderStatus,
        total: getRandomFloat(10, 500, 2),
        items: Array(getRandomInt(1, 5)).fill(null).map((_, itemIndex) => ({
          productId: `product_${getRandomInt(1, 10000)}`,
          name: `Product ${getRandomInt(1, 10000)}`,
          category: getRandomElement(productCategories),
          quantity: getRandomInt(1, 5),
          unitPrice: getRandomFloat(5, 100, 2),
          rating: orderStatus === 'delivered' ? getRandomInt(1, 5) : null
        })),
        shipping: {
          method: getRandomElement(['Standard', 'Express', 'Next Day']),
          cost: getRandomFloat(0, 25, 2),
          estimatedDelivery: new Date(orderDate.getTime() + getRandomInt(1, 10) * 24 * 60 * 60 * 1000),
          trackingNumber: `TRK${getRandomInt(1000000, 9999999)}`
        },
        payment: {
          method: getRandomElement(paymentMethods),
          transactionId: `txn_${getRandomInt(1000000, 9999999)}`,
          status: getRandomElement(['approved', 'pending', 'declined'])
        }
      };
    }),
    activity: {
      lastProductViewed: getRandomInt(1, 10000),
      savedItems: Array(getRandomInt(0, 8)).fill(null).map(() => getRandomInt(1, 10000)),
      searchHistory: Array(getRandomInt(0, 10)).fill(null).map(() =>
        getRandomElement(['phone', 'laptop', 'shoes', 'book', 'camera', 'watch', 'headphones', 'tv', 'chair', 'desk'])
      )
    },
    metrics: {
      totalSpent: getRandomFloat(0, 5000, 2),
      averageOrderValue: getRandomFloat(0, 200, 2),
      orderFrequency: getRandomFloat(0, 10, 2),
      loyaltyPoints: getRandomInt(0, 5000),
      referrals: getRandomInt(0, 10)
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