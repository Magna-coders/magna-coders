import { Request, Response } from 'express';
import activityLogService from '../../services/contracts/activityLogService';

export const getContractActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const logs = await activityLogService.getByContract(contractId, userId);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const logs = await activityLogService.getRecentActivity(userId, limit);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};