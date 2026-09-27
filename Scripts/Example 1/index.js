// seed.js
const { faker } = require('@faker-js/faker');
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ecommerce';

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const usersCollection = db.collection('users');

  await usersCollection.deleteMany({}); // Clear old data

  const users = [];

  for (let i = 0; i < 5000; i++) {
    const user = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      registeredAt: faker.date.past(),
      addresses: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
        type: faker.helpers.arrayElement(['Home', 'Work']),
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zip: faker.location.zipCode(),
        country: faker.location.country(),
      })),
      orders: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => {
        const products = Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
          name: faker.commerce.productName(),
          price: parseFloat(faker.commerce.price()),
          quantity: faker.number.int({ min: 1, max: 5 }),
        }));

        const total = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

        return {
          orderId: faker.string.uuid(),
          orderedAt: faker.date.recent({ days: 60 }),
          products,
          total,
          status: faker.helpers.arrayElement(['Pending', 'Shipped', 'Delivered', 'Cancelled']),
          payment: {
            method: faker.helpers.arrayElement(['Credit Card', 'PayPal', 'Bank Transfer']),
            paid: faker.datatype.boolean(),
            paidAt: faker.date.recent({ days: 30 }),
          },
          shipping: {
            provider: faker.company.name(),
            trackingNumber: faker.string.uuid(),
            estimatedDelivery: faker.date.soon(),
          },
        };
      }),
      reviews: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
        productId: faker.string.uuid(),
        productName: faker.commerce.productName(),
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.sentence(),
        createdAt: faker.date.recent({ days: 100 }),
      })),
    };

    users.push(user);
  }

  await usersCollection.insertMany(users);
  console.log('Seeded users collection with embedded documents.');
  await client.close();
}

seed().catch(console.dir);



