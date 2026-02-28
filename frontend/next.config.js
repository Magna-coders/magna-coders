/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
  
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const isValid = typeof apiBase === 'string' && /^(https?:\/\/|\/)/.test(apiBase);
    if (!isValid) {
      // No valid API base URL set; skip rewrites to avoid invalid config
      return [];
    }
    const normalized = apiBase.replace(/\/$/, '');
    return [
      // Proxy all /api/* requests to backend EXCEPT /api/auth/* (NextAuth)
      // This ensures NextAuth routes stay on the frontend
      {
        source: '/api/posts/:path*',
        destination: `${normalized}/api/posts/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${normalized}/api/users/:path*`,
      },
      {
        source: '/api/projects/:path*',
        destination: `${normalized}/api/projects/:path*`,
      },
      {
        source: '/api/jobs/:path*',
        destination: `${normalized}/api/jobs/:path*`,
      },
      {
        source: '/api/tags/:path*',
        destination: `${normalized}/api/tags/:path*`,
      },
      {
        source: '/api/comments/:path*',
        destination: `${normalized}/api/comments/:path*`,
      },
      {
        source: '/api/chat/:path*',
        destination: `${normalized}/api/chat/:path*`,
      },
      {
        source: '/api/social/:path*',
        destination: `${normalized}/api/social/:path*`,
      },
      {
        source: '/api/otp/:path*',
        destination: `${normalized}/api/otp/:path*`,
      },
      {
        source: '/api/opportunities/:path*',
        destination: `${normalized}/api/opportunities/:path*`,
      },
      {
        source: '/api/applications/:path*',
        destination: `${normalized}/api/applications/:path*`,
      },
      {
        source: '/api/bookmarks/:path*',
        destination: `${normalized}/api/bookmarks/:path*`,
      },
      {
        source: '/api/files/:path*',
        destination: `${normalized}/api/files/:path*`,
      },
      {
        source: '/api/companies/:path*',
        destination: `${normalized}/api/companies/:path*`,
      },
      {
        source: '/api/integrations/:path*',
        destination: `${normalized}/api/integrations/:path*`,
      },
      {
        source: '/api/webhooks/:path*',
        destination: `${normalized}/api/webhooks/:path*`,
      },
      {
        source: '/api/contracts/:path*',
        destination: `${normalized}/api/contracts/:path*`,
      },
      {
        source: '/api/coins/:path*',
        destination: `${normalized}/api/coins/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${normalized}/api/admin/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: `${normalized}/api/ai/:path*`,
      },
      // Note: /api/auth/* is NOT proxied - it's handled by NextAuth on the frontend
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'your-domain.com',
      },
    ],
  },
  
  // Optimize for Vercel deployment (disable optimizeCss to avoid 'critters' dependency)
  experimental: {
    optimizeCss: false,
  },
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // HSTS - Force HTTPS for 1 year (only in production)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);