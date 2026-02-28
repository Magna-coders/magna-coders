import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const categories = [
  { name: 'Web Development', description: 'Full-stack, frontend, and backend web projects' },
  { name: 'Mobile Development', description: 'iOS, Android, and cross-platform mobile apps' },
  { name: 'AI & Machine Learning', description: 'Artificial intelligence and ML projects' },
  { name: 'Game Development', description: 'Video games and interactive experiences' },
  { name: 'DevOps & Cloud', description: 'Infrastructure, deployment, and cloud services' },
  { name: 'Data Science', description: 'Data analysis, visualization, and big data' },
  { name: 'Blockchain', description: 'Cryptocurrency and blockchain applications' },
  { name: 'IoT', description: 'Internet of Things and embedded systems' },
  { name: 'Cybersecurity', description: 'Security tools and ethical hacking' },
  { name: 'Open Source', description: 'Open source contributions and projects' },
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  try {
    // Check if categories already exist
    const existingCount = await prisma.categories.count();
    
    if (existingCount > 0) {
      console.log(`✅ Database already has ${existingCount} categories. Skipping seed.`);
      return;
    }

    // Insert categories
    for (const category of categories) {
      await prisma.categories.create({
        data: {
          id: uuidv4(),
          name: category.name,
          description: category.description,
        },
      });
      console.log(`✓ Created category: ${category.name}`);
    }

    console.log('✅ Successfully seeded categories!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
