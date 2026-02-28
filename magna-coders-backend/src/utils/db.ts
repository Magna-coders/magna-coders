import { PrismaClient } from '@prisma/client';

/**
 * Centralized Prisma Client instance with connection pooling configuration.
 * 
 * Connection pool settings are optimized for 100+ concurrent sessions:
 * - connection_limit: Maximum number of database connections (default: 10 per Prisma instance)
 * - pool_timeout: Time to wait for a connection from the pool (default: 10 seconds)
 * 
 * For production with 100+ concurrent sessions, we configure:
 * - connection_limit=20: Allows up to 20 concurrent database connections
 * - pool_timeout=20: Waits up to 20 seconds for an available connection
 * 
 * These settings are appended to the DATABASE_URL via query parameters.
 */

// Parse DATABASE_URL and add connection pool parameters if not already present
const getDatabaseUrl = (): string => {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // Check if connection pool parameters are already in the URL
  if (baseUrl.includes('connection_limit') && baseUrl.includes('pool_timeout')) {
    return baseUrl;
  }
  
  // Add connection pool parameters
  const separator = baseUrl.includes('?') ? '&' : '?';
  const poolParams = `connection_limit=20&pool_timeout=20`;
  
  return `${baseUrl}${separator}${poolParams}`;
};

// Create a single Prisma Client instance with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default prisma;
