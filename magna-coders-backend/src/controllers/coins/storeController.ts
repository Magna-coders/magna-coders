import { Request, Response } from 'express';
import { StoreService } from '../../services/coins/storeService';
import { StoreItemType, EntitlementStatus } from '../../types/coins';

export class StoreController {
  static async getStoreItems(req: Request, res: Response): Promise<void> {
    try {
      const items = await StoreService.getStoreItems();
      res.json(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get store items';
      res.status(500).json({ error: message });
    }
  }

  static async purchaseItem(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user;
      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { item_id } = req.body;
      if (!item_id) {
        res.status(400).json({ error: 'Item ID required' });
        return;
      }

      const entitlement = await StoreService.purchaseItem({ user_id, item_id });
      res.status(201).json(entitlement);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to purchase item';
      res.status(500).json({ error: message });
    }
  }

  static async getEntitlements(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user;
      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { type, status } = req.query;
      const entitlements = await StoreService.getUserEntitlements(user_id, {
        type: type as StoreItemType,
        status: status as EntitlementStatus,
      });

      res.json(entitlements);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get entitlements';
      res.status(500).json({ error: message });
    }
  }

  static async checkEntitlement(req: Request, res: Response): Promise<void> {
    try {
      const user_id = req.user;
      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { item_type } = req.params;
      if (!item_type) {
        res.status(400).json({ error: 'Item type required' });
        return;
      }

      const hasEntitlement = await StoreService.checkEntitlement(
        user_id,
        item_type as StoreItemType
      );

      res.json({ has_entitlement: hasEntitlement });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check entitlement';
      res.status(500).json({ error: message });
    }
  }

  static async createStoreItem(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, price_coins, type, duration_days } = req.body;

      if (!name || !price_coins || !type) {
        res.status(400).json({ error: 'Name, price, and type required' });
        return;
      }

      const item = await StoreService.createStoreItem({
        name,
        description,
        price_coins,
        type: type as StoreItemType,
        duration_days,
      });

      res.status(201).json(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create store item';
      res.status(500).json({ error: message });
    }
  }

  static async updateStoreItem(req: Request, res: Response): Promise<void> {
    try {
      const { item_id } = req.params;
      if (!item_id) {
        res.status(400).json({ error: 'Item ID required' });
        return;
      }

      const { name, description, price_coins, is_active } = req.body;
      const item = await StoreService.updateStoreItem(item_id, {
        name,
        description,
        price_coins,
        is_active,
      });

      res.json(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update store item';
      res.status(500).json({ error: message });
    }
  }
}