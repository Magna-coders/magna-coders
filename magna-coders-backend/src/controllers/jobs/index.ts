import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Get all job posts with pagination
 */
const getJobs = async (req: Request, res: Response): Promise<void> => {
	const page = Math.max(Number(req.query.page || 1), 1);
	const limit = Math.max(Number(req.query.limit || 10), 1);
	const skip = (page - 1) * limit;
	const { categoryId, jobType, location, sortBy } = req.query as Record<string, string>;

	const where: any = {};
	if (categoryId) where.category_id = categoryId;
	if (jobType) where.job_type = jobType;
	if (location) where.location = { contains: location, mode: 'insensitive' };

	const orderBy: any = {};
	if (sortBy === 'newest') {
		orderBy.created_at = 'desc';
	} else if (sortBy === 'deadline') {
		orderBy.deadline = 'asc';
	} else {
		orderBy.created_at = 'desc';
	}

	const [jobs, total] = await Promise.all([
		prisma.opportunities.findMany({
			where,
			skip,
			take: limit,
			orderBy,
			include: {
				users: {
					select: { id: true, username: true, avatar_url: true }
				},
				categories: {
					select: { id: true, name: true }
				}
			}
		}),
		prisma.opportunities.count({ where })
	]);

	const totalPages = Math.ceil(total / limit);

	res.status(200).json({
		jobs: jobs.map(job => ({
			...job,
			type: 'job',
			deadlineProgress: job.deadline
				? Math.max(0, Math.min(100, 100 - ((Date.now() - job.created_at!.getTime()) / (job.deadline.getTime() - job.created_at!.getTime())) * 100))
				: null,
			timeLeft: job.deadline ? Math.max(0, Math.floor((job.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
		})),
		totalPages,
		currentPage: page,
		total
	});
};

/**
 * Get a single job by ID
 */
const getJobById = async (req: Request, res: Response): Promise<void> => {
	const { id } = req.params;

	const job = await prisma.opportunities.findUnique({
		where: { id },
		include: {
			users: {
				select: { id: true, username: true, avatar_url: true }
			},
			categories: {
				select: { id: true, name: true }
			}
		}
	});

	if (!job) {
		res.status(404).json({ message: 'Job not found' });
		return;
	}

	res.status(200).json({
		...job,
		type: 'job',
		deadlineProgress: job.deadline
			? Math.max(0, Math.min(100, 100 - ((Date.now() - job.created_at!.getTime()) / (job.deadline.getTime() - job.created_at!.getTime())) * 100))
			: null,
		timeLeft: job.deadline ? Math.max(0, Math.floor((job.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
	});
};

/**
 * Create a new job post
 */
const createJob = async (req: Request, res: Response): Promise<void> => {
	const authorId = req.user;
	const { title, description, company, location, salary, jobType, deadline, categoryId, tags } = req.body;

	if (!authorId) {
		res.status(401).json({ message: 'Authentication required' });
		return;
	}

	if (!title || typeof title !== 'string' || title.trim().length === 0) {
		res.status(400).json({ message: 'Title is required' });
		return;
	}

	if (!company || typeof company !== 'string' || company.trim().length === 0) {
		res.status(400).json({ message: 'Company is required' });
		return;
	}

	const jobId = uuidv4();

	const job = await prisma.opportunities.create({
		data: {
			id: jobId,
			title: title.trim(),
			description: description || null,
			company: company.trim(),
			location: location || null,
			salary: salary || null,
			job_type: jobType || null,
			deadline: deadline ? new Date(deadline) : null,
			category_id: categoryId || null,
			author_id: authorId
		}
	});

	res.status(201).json({
		...job,
		type: 'job',
		deadlineProgress: job.deadline
			? Math.max(0, Math.min(100, 100 - ((Date.now() - job.created_at!.getTime()) / (job.deadline.getTime() - job.created_at!.getTime())) * 100))
			: null,
		timeLeft: job.deadline ? Math.max(0, Math.floor((job.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
	});
};

/**
 * Update a job post
 */
const updateJob = async (req: Request, res: Response): Promise<void> => {
	const { id } = req.params;
	const userId = req.user;
	const { title, description, company, location, salary, jobType, deadline, categoryId } = req.body;

	if (!userId) {
		res.status(401).json({ message: 'Authentication required' });
		return;
	}

	const job = await prisma.opportunities.findUnique({ where: { id } });
	if (!job) {
		res.status(404).json({ message: 'Job not found' });
		return;
	}

	if (job.author_id !== userId) {
		res.status(403).json({ message: 'Access denied' });
		return;
	}

	const updated = await prisma.opportunities.update({
		where: { id },
		data: {
			title: title !== undefined ? title : job.title,
			description: description !== undefined ? description : job.description,
			company: company !== undefined ? company : job.company,
			location: location !== undefined ? location : job.location,
			salary: salary !== undefined ? salary : job.salary,
			job_type: jobType !== undefined ? jobType : job.job_type,
			deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : job.deadline,
			category_id: categoryId !== undefined ? categoryId : job.category_id
		},
		include: {
			users: {
				select: { id: true, username: true, avatar_url: true }
			},
			categories: {
				select: { id: true, name: true }
			}
		}
	});

	res.status(200).json({
		...updated,
		type: 'job',
		deadlineProgress: updated.deadline
			? Math.max(0, Math.min(100, 100 - ((Date.now() - updated.created_at!.getTime()) / (updated.deadline.getTime() - updated.created_at!.getTime())) * 100))
			: null,
		timeLeft: updated.deadline ? Math.max(0, Math.floor((updated.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
	});
};

/**
 * Delete a job post
 */
const deleteJob = async (req: Request, res: Response): Promise<void> => {
	const { id } = req.params;
	const userId = req.user;

	if (!userId) {
		res.status(401).json({ message: 'Authentication required' });
		return;
	}

	const job = await prisma.opportunities.findUnique({ where: { id } });
	if (!job) {
		res.status(404).json({ message: 'Job not found' });
		return;
	}

	if (job.author_id !== userId) {
		res.status(403).json({ message: 'Access denied' });
		return;
	}

	await prisma.opportunities.delete({ where: { id } });

	res.status(200).json({ message: 'Job deleted successfully' });
};

export { getJobs, getJobById, createJob, updateJob, deleteJob };
