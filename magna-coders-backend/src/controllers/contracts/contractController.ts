import { Request, Response } from 'express';
import contractService from '../../services/contracts/contractService';
import { CreateContractInput, ContractStatus } from '../../types/contracts';

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const input: CreateContractInput = {
      title: req.body.title,
      description: req.body.description,
      currency: req.body.currency,
      total_amount: req.body.total_amount,
      funding_mode: req.body.funding_mode,
      start_at: req.body.start_at ? new Date(req.body.start_at) : undefined,
      terms_version: req.body.terms_version,
      metadata: req.body.metadata
    };

    const contract = await contractService.create(userId, input);
    res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { developer_id } = req.body;
    if (!developer_id) {
      res.status(400).json({ success: false, message: 'Developer ID is required' });
      return;
    }

    const contract = await contractService.send(contractId, userId, developer_id);
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const contract = await contractService.accept(contractId, userId);
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const declineContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const contract = await contractService.decline(contractId, userId);
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const contract = await contractService.getById(contractId, userId);
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const filter = {
      role: req.query.role as 'client' | 'developer' | undefined,
      status: req.query.status as ContractStatus | undefined
    };

    const contracts = await contractService.getMany(userId, filter);
    res.json({ success: true, data: contracts });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const pauseContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const contract = await contractService.pause(contractId, userId);
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resumeContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const contractId = req.params.id;
    if (!userId || !contractId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const contract = await contractService.resume(contractId, userId);
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};