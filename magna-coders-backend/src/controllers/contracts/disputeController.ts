import { Request, Response } from 'express';
import disputeService from '../../services/contracts/disputeService';
import { CreateDisputeInput, DisputeResolution } from '../../types/contracts';

export const createDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const input: CreateDisputeInput = {
      contract_id: contractId,
      milestone_id: req.body.milestone_id,
      reason: req.body.reason
    };

    const dispute = await disputeService.create(input, userId);
    res.status(201).json({ success: true, data: dispute });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const disputeId = req.params.id;
    if (!userId || !disputeId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { resolution } = req.body;

    const result = await disputeService.resolve(disputeId, {
      resolution: resolution as DisputeResolution,
      admin_id: userId
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDisputes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const disputes = await disputeService.getByContract(contractId, userId);
    res.json({ success: true, data: disputes });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const disputeId = req.params.id;
    if (!userId || !disputeId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const dispute = await disputeService.getById(disputeId, userId);
    res.json({ success: true, data: dispute });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};