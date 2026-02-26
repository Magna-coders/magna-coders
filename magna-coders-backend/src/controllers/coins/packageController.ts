import { Request, Response } from 'express';
import { PackageService } from '../../services/coins/packageService';
import { PaymentMethod } from '../../types/coins';

export class PackageController {
  static async getPackages(req: Request, res: Response): Promise<void> {
    try {
      const packages = await PackageService.getPackages();
      res.json(packages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get packages';
      res.status(500).json({ error: message });
    }
  }

  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user;
      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { package_id, payment_method } = req.body;
      if (!package_id || !payment_method) {
        res.status(400).json({ error: 'Package ID and payment method required' });
        return;
      }

      const order = await PackageService.createOrder({
        user_id,
        package_id,
        payment_method: payment_method as PaymentMethod,
      });

      res.status(201).json(order);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      res.status(500).json({ error: message });
    }
  }

  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user;
      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await PackageService.getOrdersByUser(user_id, { limit, offset });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get orders';
      res.status(500).json({ error: message });
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { order_id } = req.params;
      if (!order_id) {
        res.status(400).json({ error: 'Order ID required' });
        return;
      }

      const order = await PackageService.getOrderById(order_id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get order';
      res.status(500).json({ error: message });
    }
  }

  static async handlePaymentCallback(req: Request, res: Response): Promise<void> {
    try {
      const { order_id } = req.params;
      const { payment_ref, success } = req.body;

      if (!order_id || !payment_ref) {
        res.status(400).json({ error: 'Order ID and payment reference required' });
        return;
      }

      const order = await PackageService.processPaymentCallback(
        order_id,
        payment_ref,
        success === true || success === 'true'
      );

      res.json(order);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment';
      res.status(500).json({ error: message });
    }
  }

  static async createPackage(req: Request, res: Response): Promise<void> {
    try {
      const { base_coins, bonus_coins, price_kes } = req.body;

      if (!base_coins || !price_kes) {
        res.status(400).json({ error: 'Base coins and price required' });
        return;
      }

      const pkg = await PackageService.createPackage({
        base_coins,
        bonus_coins: bonus_coins || 0,
        price_kes,
      });

      res.status(201).json(pkg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create package';
      res.status(500).json({ error: message });
    }
  }

  static async updatePackage(req: Request, res: Response): Promise<void> {
    try {
      const { package_id } = req.params;
      if (!package_id) {
        res.status(400).json({ error: 'Package ID required' });
        return;
      }

      const { base_coins, bonus_coins, price_kes, is_active } = req.body;
      const pkg = await PackageService.updatePackage(package_id, {
        base_coins,
        bonus_coins,
        price_kes,
        is_active,
      });

      res.json(pkg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update package';
      res.status(500).json({ error: message });
    }
  }
}