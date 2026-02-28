# Magna Coders Frontend

A modern, full-stack developer community platform built with Next.js 16, React 19, and TypeScript. Magna Coders connects developers, facilitates collaboration, and provides a comprehensive ecosystem for learning, networking, and professional growth.

## Features

- Social networking for developers (posts, comments, likes, connections)
- Project marketplace for freelance opportunities
- Job board with advanced filtering
- Real-time messaging system
- Learning platform (Magna School)
- Podcast integration (Magna Podcast)
- Magna Coin reward system
- User verification and profiles
- Responsive mobile-first design
- Progressive Web App (PWA) support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: NextAuth 5 (beta)
- **HTTP Client**: Axios
- **PWA**: @ducanh2912/next-pwa

## Prerequisites

- Node.js 22.x or higher
- pnpm 10.x or higher (recommended) or npm

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Magna-coders/magna-coders.git
cd magna-coders/frontend
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Optional: External Services
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### 4. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

### Build the Application

```bash
pnpm build
# or
npm run build
```

This will:
- Compile TypeScript
- Optimize assets
- Generate static pages
- Create production-ready build in `.next/` directory

### Start Production Server

```bash
pnpm start
# or
npm start
```

The production server will run on [http://localhost:3000](http://localhost:3000).

## Project Structure

```
frontend/
├── public/              # Static assets (images, icons, fonts)
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── feed/              # Social feed
│   │   ├── jobs/              # Job listings
│   │   ├── projects/          # Project marketplace
│   │   ├── messages/          # Messaging system
│   │   ├── magna-school/      # Learning platform
│   │   ├── magna-podcast/     # Podcast feature
│   │   ├── magna-coin/        # Reward system
│   │   └── ...                # Other pages
│   ├── components/     # Reusable React components
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Layout components
│   ├── store/          # State management
│   └── utils/          # Utility functions
├── styles/             # Global styles
├── .eslintrc.json      # ESLint configuration
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically

## Key Features Implementation

### Authentication
- NextAuth 5 integration for secure authentication
- Support for multiple providers
- JWT-based session management

### Responsive Design
- Mobile-first approach
- Tailwind CSS breakpoints
- Optimized for all screen sizes

### Performance
- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Image optimization with Next.js Image
- Code splitting and lazy loading

### PWA Support
- Offline functionality
- Install prompt
- Service worker for caching
- App manifest configuration

## Environment Configuration

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.magnacoders.com
NEXTAUTH_URL=https://magnacoders.com
NEXTAUTH_SECRET=production_secret_here
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
# Build image
docker build -t magna-coders-frontend .

# Run container
docker run -p 3000:3000 magna-coders-frontend
```

### Manual Deployment

```bash
# Build
pnpm build

# Start with PM2
pm2 start npm --name "magna-frontend" -- start
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- Image optimization with Next.js Image component
- Font optimization with next/font
- Automatic code splitting
- Tree shaking for smaller bundle sizes
- CSS optimization with Tailwind CSS
- Lazy loading for components and routes

## Troubleshooting

### Build Errors

If you encounter TypeScript errors during build:
```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful commit messages
- Add comments for complex logic

## Testing

```bash
# Run tests (when configured)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@magnacoders.com or join our Discord community.

## Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- All contributors who have helped build Magna Coders

## Links

- [Website](https://magnacoders.com)
- [Documentation](https://docs.magnacoders.com)
- [API Documentation](https://api.magnacoders.com/docs)
- [GitHub](https://github.com/Magna-coders/magna-coders)

---

Built with passion by the Magna Coders team
