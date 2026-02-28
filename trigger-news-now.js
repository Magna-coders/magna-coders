// Simple script to trigger news fetch manually
const http = require('http');

// First, let's call the scheduler's runNow method directly
// We'll make a request to trigger it

console.log('🔄 Triggering manual news fetch...');
console.log('This will post new tech news articles to the feed.');
console.log('');

// Import and run the scheduler
(async () => {
  try {
    // We need to use the backend's internal method
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Find magnanews user
    const systemUser = await prisma.users.findFirst({
      where: { username: 'magnanews' },
    });
    
    if (!systemUser) {
      console.error('❌ magnanews user not found!');
      process.exit(1);
    }
    
    console.log(`✅ Found magnanews user: ${systemUser.id}`);
    console.log('');
    
    // Import the aggregator
    const newsAggregator = require('./magna-coders-backend/src/services/news/newsAggregator').default;
    
    // Fetch and post news
    await newsAggregator.fetchAndPostNews(systemUser.id, 5);
    
    console.log('');
    console.log('✅ Done! Check your feed at http://localhost:3000/feed');
    console.log('   Click the "Tech News" filter to see only tech news posts.');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
