import { Request, Response, NextFunction } from 'express';

// Validation middleware for user registration
export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password } = req.body;

  const errors: string[] = [];

  // Username validation
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
  } else if (username.length < 3 || username.length > 20) {
    errors.push('Username must be between 3 and 20 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    res.status(400).json({
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validation middleware for login
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { username, password } = req.body;

  const errors: string[] = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validation middleware for post creation
export const validatePostCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { title, postType, content, imageLink } = req.body;

  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }

  const validPostTypes = ['TEXT', 'IMAGE', 'LINK', 'PROJECT'];
  if (!postType || !validPostTypes.includes(postType)) {
    errors.push('Valid post type is required (TEXT, IMAGE, LINK, PROJECT)');
  }

  // Content validation based on post type
  if (postType === 'TEXT' && (!content || content.trim().length === 0)) {
    errors.push('Text content is required for text posts');
  }

  if (postType === 'IMAGE' && !imageLink) {
    errors.push('Image link is required for image posts');
  }

  if (postType === 'LINK' && (!content || !content.trim().includes('http'))) {
    errors.push('Valid URL is required for link posts');
  }

  if (content && content.length > 10000) {
    errors.push('Content cannot exceed 10000 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validation middleware for comment creation
export const validateCommentCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { content } = req.body;

  const errors: string[] = [];

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('Comment content is required');
  } else if (content.length > 2000) {
    errors.push('Comment cannot exceed 2000 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validation middleware for project creation
export const validateProjectCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description, projectType, technologies, budget, categoryId } = req.body;

  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required');
  } else if (description.length > 5000) {
    errors.push('Description cannot exceed 5000 characters');
  }

  const validProjectTypes = ['WEBSITE', 'MOBILE_APP', 'DESKTOP_APP', 'API', 'OTHER'];
  if (!projectType || !validProjectTypes.includes(projectType)) {
    errors.push('Valid project type is required');
  }

  if (!Array.isArray(technologies)) {
    errors.push('Technologies must be an array');
  } else if (technologies.length === 0) {
    errors.push('At least one technology is required');
  }

  if (!budget || typeof budget !== 'number' || budget <= 0) {
    errors.push('Valid budget amount is required');
  } else if (budget > 100000) {
    errors.push('Budget cannot exceed $100,000');
  }

  if (!categoryId || typeof categoryId !== 'string') {
    errors.push('Category ID is required');
  }
 {
    res.status(400).json({
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// Validation middleware for bid placement
export const validateBidPlacement = (req: Request, res: Response, next: NextFunction): void => {
  const { amount, proposal } = req.body;

  const errors: string[] = [];

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push('Valid bid amount is required');
  }

  if (!proposal || typeof proposal !== 'string' || proposal.trim().length === 0) {
    errors.push('Proposal is required');
  } else if (proposal.length > 2000) {
    errors.push('Proposal cannot exceed 2000 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({
      message: 'Validation failed',
      errors
    });
    return;
  }

  next();
};

// General validation middleware for required fields
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const field of fields) {
      if (!req.body[field]) {
        errors.push(`${field} is required`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        message: 'Validation failed',
        errors
      });
      return;
    }

    next();
  };
};

// Validation middleware for file uploads
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request & { file?: any }, res: Response, next: NextFunction): void => {
    if (!req.file) {
      res.status(400).json({ message: 'File is required' });
      return;
    }

    const file = req.file;

    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        message: 'Invalid file type',
        allowedTypes
      });
      return;
    }

    if (file.size > maxSize) {
      res.status(400).json({
        message: 'File too large',
        maxSize: `${maxSize / (1024 * 1024)}MB`
      });
      return;
    }

    next();
  };
};