import { Request, Response } from 'express';
import { PlatformFeeService, AdminService } from '../../services/coins';

export class AdminController {
  static async getPlatformFees(req: Request, res: Response): Promise<void> {
    try {
      const { contract_id } = req.query;

      if (contract_id) {
        const fees = await PlatformFeeService.getPlatformFeesByContract(contract_id as string);
        res.json(fees);
        return;
      }

      const total = await PlatformFeeService.getTotalPlatformFees();
      res.json({ total_platform_fees: total });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get platform fees';
      res.status(500).json({ error: message });
    }
  }

  static async getPlatformFeesStats(req: Request, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;

      const stats = await PlatformFeeService.getPlatformFeesStats(
        start_date ? new Date(start_date as string) : undefined,
        end_date ? new Date(end_date as string) : undefined
      );

      res.json(stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get platform fees stats';
      res.status(500).json({ error: message });
    }
  }

  static async getAdminActions(req: Request, res: Response): Promise<void> {
    try {
      const { admin_id, action_type, limit, offset } = req.query;

      const result = await AdminService.getAdminActions({
        admin_id: admin_id as string,
        action_type: action_type as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get admin actions';
      res.status(500).json({ error: message });
    }
  }

  static async calculateFee(req: Request, res: Response): Promise<void> {
    try {
      const { amount } = req.query;

      if (!amount) {
        res.status(400).json({ error: 'Amount required' });
        return;
      }

      const result = await PlatformFeeService.calculateFee(parseFloat(amount as string));
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate fee';
      res.status(500).json({ error: message });
    }
  }
}