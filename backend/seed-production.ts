import prisma from './src/prisma.js';
import bcryptjs from 'bcryptjs';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Travel Order' },
  { id: 2, name: 'Memo Order' },
  { id: 3, name: 'Office Order' },
  { id: 4, name: 'Leave Application' },
  { id: 5, name: 'Incoming Documents' },
  { id: 6, name: 'Outgoing Documents' },
];

async function seed() {
  console.log('--- Starting Production Seeding ---');

  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name },
        create: cat,
      });
    }
    console.log('✔ Categories seeded.');

    // 2. Seed Initial Admin User
    const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'adminpassword';
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@cityhealthdms.com';

    console.log(`Checking for admin user: ${adminUsername}...`);
    
    const existingAdmin = await prisma.user.findUnique({
      where: { username: adminUsername },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcryptjs.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          username: adminUsername,
          fullName: 'System Administrator',
          password: hashedPassword,
          phoneNumber: '00000000000',
          address: 'Main Office',
          province: 'Metro Manila',
          cityMun: 'Manila',
          barangay: 'Barangay 1',
          isAdmin: true,
        },
      });
      console.log('✔ Production Admin account created.');
    } else {
      console.log('ℹ Admin account already exists. Skipping creation.');
    }

    console.log('--- Seeding Completed Successfully ---');
  } catch (error) {
    console.error('✘ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
