import { Request, Response } from 'express';
import changeRequestService from '../../services/contracts/changeRequestService';
import { CreateChangeRequestInput, ChangeRequestType } from '../../types/contracts';

export const createChangeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const input: CreateChangeRequestInput = {
      contract_id: contractId,
      type: req.body.type as ChangeRequestType,
      changes: req.body.changes
    };

    const changeRequest = await changeRequestService.create(input, userId);
    res.status(201).json({ success: true, data: changeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptChangeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const changeRequestId = req.params.id;
    if (!userId || !changeRequestId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const changeRequest = await changeRequestService.accept(changeRequestId, userId);
    res.json({ success: true, data: changeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectChangeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const changeRequestId = req.params.id;
    if (!userId || !changeRequestId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const changeRequest = await changeRequestService.reject(changeRequestId, userId);
    res.json({ success: true, data: changeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelChangeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const changeRequestId = req.params.id;
    if (!userId || !changeRequestId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const changeRequest = await changeRequestService.cancel(changeRequestId, userId);
    res.json({ success: true, data: changeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getChangeRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const changeRequests = await changeRequestService.getByContract(contractId, userId);
    res.json({ success: true, data: changeRequests });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};