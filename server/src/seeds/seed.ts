import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../utils/database';
import { User } from '../models';
import { hashPassword } from '../utils/helpers';

dotenv.config();

const seedUsers = [
  { fullName: 'Admin User', email: 'admin@lms.com', password: 'Admin@123', role: 'admin' },
  { fullName: 'Sales Executive', email: 'sales@lms.com', password: 'Sales@123', role: 'sales' },
  { fullName: 'Sanction Officer', email: 'sanction@lms.com', password: 'Sanction@123', role: 'sanction' },
  { fullName: 'Disburse Officer', email: 'disburse@lms.com', password: 'Disburse@123', role: 'disbursement' },
  { fullName: 'Collection Agent', email: 'collection@lms.com', password: 'Collection@123', role: 'collection' },
  { fullName: 'Test Borrower', email: 'borrower@lms.com', password: 'Borrower@123', role: 'borrower' },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('\n📋 Starting database seeding...\n');

    for (const userData of seedUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⏭️  User already exists: ${userData.email}`);
        continue;
      }

      // Hash password and create user
      const passwordHash = await hashPassword(userData.password);

      const user = new User({
        fullName: userData.fullName,
        email: userData.email,
        passwordHash,
        role: userData.role,
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email} (Role: ${userData.role})`);
    }

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📝 Login credentials:\n');
    seedUsers.forEach((u) => {
      console.log(`   ${u.email} / ${u.password}`);
    });
    console.log();

    await disconnectDB();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();
