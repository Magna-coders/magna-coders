import { Request, Response } from 'express';
import { WalletService } from '../../services/coins/walletService';

export class WalletController {
  static async getWallet(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user;
      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const wallet = await WalletService.getOrCreateWallet(user_id);
      res.json(wallet);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get wallet';
      res.status(500).json({ error: message });
    }
  }

  static async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user;
      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await WalletService.getTransactionHistory(user_id, { limit, offset });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get transactions';
      res.status(500).json({ error: message });
    }
  }

  static async freezeWallet(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      if (!user_id) {
        res.status(400).json({ error: 'User ID required' });
        return;
      }
      const wallet = await WalletService.freezeWallet(user_id);
      res.json(wallet);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to freeze wallet';
      res.status(500).json({ error: message });
    }
  }

  static async unfreezeWallet(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      if (!user_id) {
        res.status(400).json({ error: 'User ID required' });
        return;
      }
      const wallet = await WalletService.unfreezeWallet(user_id);
      res.json(wallet);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unfreeze wallet';
      res.status(500).json({ error: message });
    }
  }
}