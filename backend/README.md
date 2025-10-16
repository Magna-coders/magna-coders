# Magna Coders Backend

This is the backend API for magna-coders built with Express.js, TypeScript, and Prisma.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Update the database connection string and other variables

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

### Development
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Build & Production
```bash
npm run build
npm start
```

## Project Structure
- `src/api/` - API routes and controllers
- `src/middleware/` - Express middleware
- `src/models/` - Data models and types
- `src/services/` - Business logic services
- `src/utils/` - Utility functions
- `prisma/` - Database schema and migrations

## API Endpoints
- `GET /health` - Health check
- `GET /api` - API welcome message

## Technologies
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Helmet (Security)
- CORS