require('dotenv').config();
const { connectDB, disconnectDB } = require('./db');
const User = require('./models/user');
const Customer = require('./models/customer');
const HistorySubscription = require('./models/historySubscription');

async function seed() {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Customer.deleteMany({});
  await HistorySubscription.deleteMany({});

  // Seed users
  const users = await User.insertMany([
    {
      username: 'admin',
      password: 'admin123', // Use hashed passwords in production
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'user1',
      password: 'user123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Seed customers
  const customers = await Customer.insertMany([
    {
      username: 'customer1',
      password: 'cust123',
      city: 'Jakarta',
      whatsapp: '08123456789',
      price: 150000,
      description: 'Professional photographer specializing in wedding and portrait photography',
      location: 'Jakarta Selatan, DKI Jakarta',
      subscriptionExpiredAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'customer2',
      password: 'cust456',
      city: 'Bandung',
      whatsapp: '08234567890',
      price: 200000,
      description: 'Event photographer with 5 years experience in corporate events',
      location: 'Bandung Utara, Jawa Barat',
      subscriptionExpiredAt: new Date(Date.now() + 30*24*60*60*1000), // 30 days from now
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Seed history_subscription
  await HistorySubscription.insertMany([
    {
      userId: users[0]._id,
      customerId: customers[0]._id,
      action: 'created',
      timestamp: new Date()
    },
    {
      userId: users[1]._id,
      customerId: customers[1]._id,
      action: 'subscribed',
      timestamp: new Date()
    }
  ]);

  console.log('Database seeded successfully');
  await disconnectDB();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});

