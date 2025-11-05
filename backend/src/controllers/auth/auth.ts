import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { SECRET } from '../../utils/config';
import { prisma, db } from '../../utils/prismaClient';

interface TokenPayload {
  id: string;
}

const jwtSign = (payload: TokenPayload, expiresIn: string): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, SECRET, options);
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  const user = await (prisma as any).users.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive' as const
      }
    }
  });

  if (!user) {
    res
      .status(401)
      .send({ message: 'No account with this username has been registered.' });
    return;
  }

  const credentialsValid = await bcrypt.compare(password, user.passwordHash);

  if (!credentialsValid) {
    res.status(401).send({ message: 'Invalid username or password.' });
    return;
  }

  const accessToken = jwtSign(
    { id: user.id },
    process.env.ACCESS_TOKEN_EXPIRES_IN || '30m'
  );

  // Create refresh token and persist (guarded: some deployments may not have a refresh token table)
  const refreshToken = jwtSign({ id: user.id }, process.env.REFRESH_TOKEN_EXPIRES_IN || '1d');
  const expiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30') * 24 * 60 * 60 * 1000));

  try {
    if ((db as any).refresh_tokens) {
      await (db as any).refresh_tokens.create({
        data: { user_id: user.id, token: refreshToken, expires_at: expiresAt }
      });
    } else if ((prisma as any).refreshToken) {
      await (prisma as any).refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });
    } else {
      console.warn('Refresh token model not present in Prisma client; skipping persistence');
    }
  } catch (err) {
    console.warn('Error persisting refresh token:', err);
  }

  res.status(200).json({
    accessToken,
    refreshToken,
    username: user.username,
    id: user.id,
    avatar: user.avatar,
    karma: user.postKarma + user.commentKarma,
    role: user.role,
    isVerified: user.isVerified,
    tokens: user.tokens,
  });
};

const signupUser = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!password || password.length < 6) {
    res
      .status(400)
      .send({ message: 'Password needs to be atleast 6 characters long.' });
    return;
  }

  if (!username || username.length > 20 || username.length < 3) {
    res
      .status(400)
      .send({ message: 'Username character length must be in range of 3-20.' });
    return;
  }

  if (!email || !email.includes('@')) {
    res
      .status(400)
      .send({ message: 'Valid email is required.' });
    return;
  }

  const existingUser = await (prisma as any).users.findFirst({
    where: {
      OR: [
        {
          username: {
            equals: username,
            mode: 'insensitive' as const
          }
        },
        { email }
      ]
    }
  });

  if (existingUser) {
    const field = existingUser.username.toLowerCase() === username.toLowerCase() ? 'username' : 'email';
    res.status(400).send({
      message: `${field === 'username' ? `Username '${username}'` : `Email '${email}'`} is already taken. Choose another one.`,
    });
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await (prisma as any).users.create({
    data: {
      username,
      email,
      passwordHash,
    }
  });

  const accessToken = jwt.sign({ id: user.id }, SECRET as any, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' } as any);
  const refreshToken = jwt.sign({ id: user.id }, SECRET as any, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' } as any);
  const expiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30') * 24 * 60 * 60 * 1000));

  try {
    if ((prisma as any).refreshToken) {
      await (prisma as any).refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });
    } else if ((prisma as any).refresh_tokens) {
      await (prisma as any).refresh_tokens.create({ data: { user_id: user.id, token: refreshToken, expires_at: expiresAt } });
    } else if ((db as any).refresh_tokens) {
      await (db as any).refresh_tokens.create({ data: { user_id: user.id, token: refreshToken, expires_at: expiresAt } });
    } else {
      console.warn('Refresh token model not present in Prisma client; skipping persistence');
    }
  } catch (err) {
    console.warn('Error persisting refresh token:', err);
  }

  res.status(200).json({
    accessToken,
    refreshToken,
    username: user.username,
    email: user.email,
    id: user.id,
    avatar: user.avatar,
    karma: 0,
    role: user.role,
    isVerified: user.isVerified,
    tokens: user.tokens,
  });
};

const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token required' });
    return;
  }

  try {
    // Verify JWT signature
    const decoded = jwt.verify(refreshToken, SECRET as any) as { id: string };

    // If no refresh token storage exists, indicate unsupported
    if (!(prisma as any).refreshToken && !(prisma as any).refresh_tokens && !(db as any).refresh_tokens) {
      res.status(501).json({ message: 'Refresh tokens not supported on this deployment' });
      return;
    }

    // Find token in database (support a few naming conventions)
    let tokenRecord: any = null;
    if ((prisma as any).refreshToken) {
      tokenRecord = await (prisma as any).refreshToken.findFirst({ where: { token: refreshToken } });
    } else if ((db as any).refresh_tokens) {
      tokenRecord = await (db as any).refresh_tokens.findFirst({ where: { token: refreshToken } });
    } else if ((prisma as any).refresh_tokens) {
      tokenRecord = await (prisma as any).refresh_tokens.findFirst({ where: { token: refreshToken } });
    }

    if (!tokenRecord || tokenRecord.revoked) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ message: 'Refresh token expired' });
      return;
    }

    // Rotate: revoke old token and create a new refresh token
    try {
      if ((prisma as any).refreshToken) {
        await (prisma as any).refreshToken.update({ where: { id: tokenRecord.id }, data: { revoked: true } });
      } else if ((db as any).refresh_tokens) {
        await (db as any).refresh_tokens.update({ where: { id: tokenRecord.id }, data: { revoked: true } });
      }
    } catch (err) {
      console.warn('Failed to revoke old refresh token:', err);
    }

    const newRefreshToken = jwt.sign({ id: decoded.id }, SECRET as any, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' } as any);
    const newExpiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30') * 24 * 60 * 60 * 1000));
    try {
      if ((prisma as any).refreshToken) {
        await (prisma as any).refreshToken.create({ data: { userId: decoded.id, token: newRefreshToken, expiresAt: newExpiresAt } });
      } else if ((db as any).refresh_tokens) {
        await (db as any).refresh_tokens.create({ data: { user_id: decoded.id, token: newRefreshToken, expires_at: newExpiresAt } });
      }
    } catch (err) {
      console.warn('Failed to create new refresh token record:', err);
    }

    const newAccessToken = jwt.sign({ id: decoded.id }, SECRET as any, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' } as any);
    res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh token error', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await (prisma as any).users.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      postKarma: true,
      commentKarma: true,
      tokens: true,
      isVerified: true,
      verificationBadge: true,
      portfolioUrl: true,
      skills: true,
      experience: true,
      location: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
          clientProjects: true,
          assignedProjects: true,
        }
      },
      createdAt: true,
    }
  });

  if (!user) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  res.status(200).json(user);
};

const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user;

  if (id !== userId) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  const {
    bio,
    portfolioUrl,
    skills,
    experience,
    location
  } = req.body;

  const updatedUser = await (prisma as any).users.update({
    where: { id },
    data: {
      bio,
      portfolioUrl,
      skills,
      experience,
      location,
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      portfolioUrl: true,
      skills: true,
      experience: true,
      location: true,
    }
  });

  res.status(200).json(updatedUser);
};

export { loginUser, signupUser, getUserProfile, updateUserProfile, refreshAccessToken };