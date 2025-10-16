# Magna Coders

A modern full-stack web application built with React (Next.js), Node.js (Express), and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Setup with Docker (Recommended)
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd magna-coders
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Access the applications:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **Database**: localhost:5432

### Manual Setup
1. **Database Setup**:
   ```bash
   # Start PostgreSQL and create database
   createdb magna_coders_db
   psql magna_coders_db < db/schema.sql
   psql magna_coders_db < db/seed.sql
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update DATABASE_URL in .env
   npx prisma generate
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📁 Project Structure

```
magna-coders/
│
├── frontend/           # React (Next.js) Application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── pages/      # Next.js pages and API routes
│   │   ├── layouts/    # Layout components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── store/      # State management
│   │   ├── utils/      # Utility functions
│   │   └── services/   # API services
│   ├── public/         # Static assets
│   ├── styles/         # Global styles
│   └── package.json
│
├── backend/            # Node.js (Express) API
│   ├── src/
│   │   ├── api/        # API routes and controllers
│   │   ├── middleware/ # Express middleware
│   │   ├── models/     # Data models
│   │   ├── services/   # Business logic
│   │   ├── utils/      # Utility functions
│   │   └── index.ts    # Application entry point
│   ├── prisma/         # Database schema and migrations
│   └── package.json
│
├── db/                 # Database files
│   ├── schema.sql      # Database schema
│   ├── seed.sql        # Sample data
│   ├── migrations/     # Migration files
│   └── backups/        # Database backups
│
├── docs/               # Documentation
├── docker-compose.yml  # Docker services configuration
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── LICENSE             # GPLv3 License
└── README.md           # This file
```

## 🛠 Technologies

### Frontend
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: CSS Modules
- **State Management**: Redux Toolkit / Zustand
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: JWT
- **Security**: Helmet, CORS
- **Validation**: Zod

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload for both frontend and backend
- **Database**: PostgreSQL with automated migrations

## 🔧 Development

### Available Scripts

#### Root Level
```bash
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
```

#### Frontend
```bash
npm run dev                 # Start development server
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run ESLint
```

#### Backend
```bash
npm run dev                 # Start development server
npm run build               # Build TypeScript
npm run start               # Start production server
npm run db:generate         # Generate Prisma client
npm run db:migrate          # Run database migrations
npm run db:studio           # Open Prisma Studio
```

## 🌐 API Endpoints

- `GET /health` - Health check
- `GET /api` - API welcome message

## 📊 Database

The application uses PostgreSQL with the following key features:
- UUID primary keys
- Automatic timestamps
- Indexed columns for performance
- Sample data for development

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Open an issue on GitHub
- Contact the development team

## 🎯 Roadmap

- [ ] User authentication system
- [ ] API documentation with Swagger
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Production deployment guides
- [ ] Performance monitoring

---

**Happy Coding! 🚀**