# Magna Coders Backend API

A comprehensive backend API for a developer community platform built with Node.js, TypeScript, Express, and Prisma.

## Features

### Core Features
- **User Authentication & Authorization** - JWT-based auth with role management and Google OAuth 2.0
- **Social Media Integration** - GitHub, LinkedIn, Twitter, Discord connections
- **Payment Processing** - Stripe, PayPal, M-Pesa, and wallet system
- **Real-time Chat** - Direct and group messaging
- **Project Marketplace** - Freelance project posting and bidding
- **Content Management** - Posts, comments, categories
- **Notification System** - Email, SMS, WhatsApp notifications
- **OTP Services** - Multi-channel verification

### Security Features
- **2FA/MFA** - TOTP and backup codes
- **Account Security** - Login attempt tracking and locking
- **Data Encryption** - Secure password hashing
- **Rate Limiting** - Request throttling
- **Input Validation** - Comprehensive data validation

## Architecture

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── auth/            # Authentication controllers
│   │   ├── posts/           # Content controllers
│   │   ├── projects/        # Project marketplace
│   │   ├── comments/        # Discussion system
│   │   ├── chat/            # Messaging controllers
│   │   ├── social/          # Social features
│   │   ├── integrations/    # Social media & payments
│   │   └── webhooks/        # Payment webhooks
│   ├── services/            # Business logic
│   │   ├── authService.ts
│   │   ├── paymentService.ts
│   │   ├── socialIntegrationService.ts
│   │   ├── notificationService.ts
│   │   └── otpService.ts
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   ├── integrations.ts
│   │   ├── webhooks.ts
│   │   └── index.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── utils/               # Utility functions
│   │   ├── config.ts
│   │   ├── postTypeValidator.ts
│   │   └── paginateResults.ts
│   ├── types/               # TypeScript definitions
│   └── index.ts             # Application entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── db/                      # Database management
│   ├── migrations/          # SQL migrations
│   ├── backups/             # Backup scripts
│   ├── recovery/            # Recovery procedures
│   └── optimization/        # Performance scripts
└── docker/                  # Containerization
```

##  API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/oauth/callback` - OAuth callback handler
- `POST /api/auth/oauth/link` - Link OAuth account to existing user
- `POST /api/auth/signout` - Sign out and invalidate session
- `GET /api/auth/profile/:id` - Get user profile
- `PUT /api/auth/profile/:id` - Update user profile

### Content Management
- `GET /api/posts` - Get posts with pagination
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Project Marketplace
- `GET /api/projects` - Get projects
- `POST /api/projects` - Create project
- `POST /api/projects/:id/bid` - Place bid
- `POST /api/projects/:projectId/bid/:bidId/accept` - Accept bid

### Social Features
- `POST /api/social/follow/:userId` - Follow user
- `GET /api/social/feed` - Get user feed
- `GET /api/social/notifications` - Get notifications

### Integrations
- `POST /api/integrations/social/github/connect` - Connect GitHub
- `POST /api/integrations/payments/create` - Create payment
- `GET /api/integrations/wallet/balance` - Get wallet balance

### OTP Services
- `POST /api/otp/request` - Request OTP
- `POST /api/otp/verify` - Verify OTP

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Setup
```bash
# Clone repository
git clone https://github.com/magna-coders/backend.git
cd backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

##  Environment Configuration

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/magna_coders"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Social Media APIs
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-secret"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"

# M-Pesa (Kenya)
MPESA_CONSUMER_KEY="your-mpesa-consumer-key"
MPESA_CONSUMER_SECRET="your-mpesa-secret"
MPESA_SHORTCODE="your-mpesa-shortcode"
MPESA_PASSKEY="your-mpesa-passkey"

# Email Service
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

> **Note**: For detailed Google OAuth setup instructions, see [OAUTH_SETUP.md](./OAUTH_SETUP.md)

## Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d

# Or build manually
docker build -t magna-coders-backend .
docker run -p 5000:5000 magna-coders-backend
```

### Production Scripts
```bash
# Build for production
npm run build

# Start production server
npm start

# Database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

## Database Schema

### Core Models
- **User** - Platform users with roles and verification
- **Account** - OAuth provider accounts linked to users
- **Session** - User authentication sessions
- **Post** - Content posts with categories and verification
- **Project** - Freelance projects with bidding
- **Comment** - Discussion system
- **Chat** - Real-time messaging
- **Payment** - Multi-gateway payment processing
- **Wallet** - Internal wallet system

### Relations
- Users can create posts, projects, and participate in chat
- Projects have bids and payments
- Posts have comments and likes
- Users have social media integrations and wallets

##  Security

### Authentication & Authorization
- JWT tokens with expiration
- Role-based access control (Developer, Client, Admin)
- Account verification system
- 2FA/MFA support

### Data Protection
- Password hashing with bcrypt
- Input sanitization and validation
- SQL injection prevention with Prisma
- XSS protection with helmet

### Payment Security
- PCI compliance ready
- Secure webhook signatures
- Transaction encryption
- Fraud detection hooks

## Monitoring & Logging

### Health Checks
- `GET /health` - Application health
- `GET /api/health` - API health

### Logging
- Request/response logging
- Error tracking
- Payment transaction logs
- User activity monitoring

##  Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## API Documentation

- **Swagger UI**: `http://localhost:5000/api/docs`
- **Postman Collection**: Available in `/docs` folder
- **API Reference**: Comprehensive endpoint documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/magna-coders/backend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/magna-coders/backend/discussions)
- **Email**: support@magna-coders.com

##  Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database ORM: [Prisma](https://prisma.io/)
- Authentication: [JWT](https://jwt.io/)
- Payments: [Stripe](https://stripe.com/), [PayPal](https://paypal.com/)
- TypeScript for type safety

---

**Magna Coders** - Connecting Developers Worldwide 