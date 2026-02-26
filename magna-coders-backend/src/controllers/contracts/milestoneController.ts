import { Request, Response } from 'express';
import milestoneService from '../../services/contracts/milestoneService';
import { CreateMilestoneInput, UpdateMilestoneInput } from '../../types/contracts';

export const createMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const input: CreateMilestoneInput = {
      title: req.body.title,
      description: req.body.description,
      acceptance_criteria: req.body.acceptance_criteria,
      amount: req.body.amount,
      due_at: req.body.due_at ? new Date(req.body.due_at) : undefined,
      order_index: req.body.order_index
    };

    const milestone = await milestoneService.create(contractId, userId, input);
    res.status(201).json({ success: true, data: milestone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const milestoneId = req.params.id;
    if (!userId || !milestoneId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const input: UpdateMilestoneInput = {
      title: req.body.title,
      description: req.body.description,
      acceptance_criteria: req.body.acceptance_criteria,
      amount: req.body.amount,
      due_at: req.body.due_at ? new Date(req.body.due_at) : undefined,
      order_index: req.body.order_index
    };

    const milestone = await milestoneService.update(milestoneId, userId, input);
    res.json({ success: true, data: milestone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMilestones = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const milestones = await milestoneService.getByContract(contractId, userId);
    res.json({ success: true, data: milestones });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const startMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const milestoneId = req.params.id;
    if (!userId || !milestoneId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const milestone = await milestoneService.startWork(milestoneId, userId);
    res.json({ success: true, data: milestone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const milestoneId = req.params.id;
    if (!userId || !milestoneId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { summary, evidence_items } = req.body;

    const result = await milestoneService.submitForReview(milestoneId, userId, summary, evidence_items || []);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const milestoneId = req.params.id;
    if (!userId || !milestoneId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const submissions = await milestoneService.getSubmissions(milestoneId, userId);
    res.json({ success: true, data: submissions });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};