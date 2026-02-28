import { Request, Response } from 'express';
import reviewService from '../../services/contracts/reviewService';
import { CreateMilestoneReviewInput, ReviewDecision } from '../../types/contracts';

export const reviewMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const milestoneId = req.params.id;
    if (!userId || !milestoneId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const input: CreateMilestoneReviewInput = {
      milestone_id: milestoneId,
      decision: req.body.decision as ReviewDecision,
      reason_code: req.body.reason_code,
      comments: req.body.comments
    };

    const review = await reviewService.reviewMilestone(input, userId);
    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const milestoneId = req.params.id;
    if (!userId || !milestoneId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const reviews = await reviewService.getReviews(milestoneId, userId);
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};