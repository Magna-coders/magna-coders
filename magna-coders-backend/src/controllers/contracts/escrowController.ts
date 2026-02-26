import { Request, Response } from 'express';
import escrowService from '../../services/contracts/escrowService';
import { FundEscrowInput } from '../../types/contracts';

export const fundEscrow = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const input: FundEscrowInput = {
      amount: req.body.amount,
      provider_reference: req.body.provider_reference,
      idempotency_key: req.body.idempotency_key
    };

    const result = await escrowService.fundEscrow(contractId, userId, input);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const fundCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const transactionId = req.params.transaction_id;
    if (!transactionId) {
      res.status(400).json({ success: false, message: 'Transaction ID required' });
      return;
    }

    const { provider_reference, status } = req.body;

    if (!['SUCCESS', 'FAILED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const result = await escrowService.confirmFunding(transactionId, provider_reference, status);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const releaseMilestone = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const milestoneId = req.params.id;
    if (!userId || !milestoneId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await escrowService.releaseMilestone(milestoneId, userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEscrowStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await escrowService.getEscrowStatus(contractId, userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};