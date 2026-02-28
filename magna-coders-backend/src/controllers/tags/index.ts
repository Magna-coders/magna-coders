import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Get all tags/categories for filtering
 */
const getAllTags = async (req: Request, res: Response): Promise<void> => {
	const { search } = req.query;

	const where: any = {};
	if (search) {
		where.name = {
			contains: String(search),
			mode: 'insensitive'
		};
	}

	const tags = await prisma.tags.findMany({
		where,
		orderBy: { name: 'asc' }
	});

	res.status(200).json(tags);
};

/**
 * Get popular tags
 */
const getPopularTags = async (req: Request, res: Response): Promise<void> => {
	const limit = Math.min(Number(req.query.limit || 10), 50);

	const tags = await prisma.tags.findMany({
		take: limit,
		orderBy: {
			post_tags: {
				_count: 'desc'
			}
		},
		include: {
			_count: {
				select: { post_tags: true }
			}
		}
	});

	res.status(200).json(tags);
};

/**
 * Create a new tag
 */
const createTag = async (req: Request, res: Response): Promise<void> => {
	const { name } = req.body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		res.status(400).json({ message: 'Tag name is required' });
		return;
	}

	// Check if tag already exists
	const existing = await prisma.tags.findUnique({
		where: { name: name.trim().toLowerCase() }
	});

	if (existing) {
		res.status(200).json(existing);
		return;
	}

	const tag = await prisma.tags.create({
		data: {
			id: uuidv4(),
			name: name.trim().toLowerCase()
		}
	});

	res.status(201).json(tag);
};

/**
 * Get all categories
 */
const getAllCategories = async (req: Request, res: Response): Promise<void> => {
	const categories = await prisma.categories.findMany({
		orderBy: { name: 'asc' }
	});

	res.status(200).json(categories);
};

export { getAllTags, getPopularTags, createTag, getAllCategories };
