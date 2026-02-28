import dotenv from 'dotenv';
// import { v2 as cloudinary } from 'cloudinary';
const cloudinary = require('cloudinary').v2;

// Load environment variables
dotenv.config();

export const SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
export const PORT = process.env.PORT || 5000;
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/magna_coders';

// Cloudinary configuration (if using cloudinary)
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'default';

// Configure cloudinary
if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

export { cloudinary };

// Email configuration (for notifications)
export const EMAIL_SERVICE = process.env.EMAIL_SERVICE;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;

// Redis configuration (for caching/sessions)
export const REDIS_URL = process.env.REDIS_URL;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;