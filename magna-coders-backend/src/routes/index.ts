import express, { Router } from 'express';
import authRoutes from './auth';
import postRoutes from './posts';
import projectRoutes from './projects';
import commentRoutes from './comments';
import chatRoutes from './chat';
import socialRoutes from './social';
import otpRoutes from './otp';
import integrationRoutes from './integrations';
import webhookRoutes from './webhooks';
import jobRoutes from './jobs';
import tagRoutes from './tags';
import applicationRoutes from './applications';
import bookmarkRoutes from './bookmarks';
import fileRoutes from './files';
import companyRoutes from './companies';
import opportunityRoutes from './opportunities';
import contractRoutes from './contracts';
import coinRoutes from './coins';
import adminRoutes from './admin';
import aiRoutes from './ai';
import newsRoutes from './news';
import usersRoutes from './users';
import friendsRoutes from './friends';
import notificationsRoutes from './notifications';
import skillsRoutes from './skills';

const router: Router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/friends', friendsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/skills', skillsRoutes);
router.use('/posts', postRoutes);
router.use('/jobs', jobRoutes);
router.use('/tags', tagRoutes);
router.use('/projects', projectRoutes);
router.use('/comments', commentRoutes);
router.use('/chat', chatRoutes);
router.use('/social', socialRoutes);
router.use('/otp', otpRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/applications', applicationRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/files', fileRoutes);
router.use('/companies', companyRoutes);

// Integration Routes (Social Media & Payments)
router.use('/integrations', integrationRoutes);

// Webhook Routes (Payment Providers)
router.use('/webhooks', webhookRoutes);

// Contracts Routes (Escrow, Milestones, Disputes)
router.use('/contracts', contractRoutes);

// Coins Routes (Wallet, Packages, Store, Admin)
router.use('/coins', coinRoutes);

// Admin Routes (Dashboard, User Management, Analytics)
router.use('/admin', adminRoutes);

// AI Routes (Backend Integration for Magna AI)
router.use('/ai', aiRoutes);

// News Routes (Tech News Aggregator)
router.use('/news', newsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Magna Coders API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      projects: '/api/projects',
      comments: '/api/comments',
      chat: '/api/chat',
      social: '/api/social',
      otp: '/api/otp',
      integrations: '/api/integrations',
      webhooks: '/api/webhooks',
      contracts: '/api/contracts',
      coins: '/api/coins',
      admin: '/api/admin',
      ai: '/api/ai'
    },
    docs: '/api/docs',
    integrations: {
      social: ['GitHub', 'LinkedIn', 'Twitter', 'Discord'],
      payments: ['Stripe', 'PayPal', 'M-Pesa', 'Wallet'],
      notifications: ['Email', 'SMS', 'WhatsApp']
    }
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    version: '1.0.0',
    documentation: {
      swagger: 'https://api.magna-coders.com/docs',
      postman: 'https://api.magna-coders.com/postman',
      github: 'https://github.com/magna-coders/api'
    },
    features: [
      'User Authentication & Authorization',
      'Social Media Integration',
      'Payment Processing',
      'Real-time Chat',
      'Project Marketplace',
      'Content Management',
      'Notification System',
      'OTP Services',
      'Magna Contracts (Escrow, Milestones, Disputes)',
      'Magna Coins (Wallet, Packages, Store, Platform Fees)',
      'Admin Dashboard (Analytics, User Management, Revenue)',
      'AI Backend Integration (Context-Aware AI Assistant)'
    ]
  });
});

export default router;