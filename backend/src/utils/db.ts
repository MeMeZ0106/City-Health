import prisma from '../prisma.js';

export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Travel Order' },
  { id: 2, name: 'Memo Order' },
  { id: 3, name: 'Office Order' },
  { id: 4, name: 'Leave Application' },
  { id: 5, name: 'Incoming Documents' },
  { id: 6, name: 'Outgoing Documents' },
];

export const seedCategories = async () => {
  try {
    const existingCount = await prisma.category.count();
    if (existingCount === 0) {
      console.log('Seeding initial categories...');
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES,
      });
      console.log('Categories seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};
