import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';

const adminService = new AdminService();

export class AdminController {
  async getAllCoinPackages(req: Request, res: Response) {
    try {
      const packages = await adminService.getAllCoinPackages();
      return res.json({ success: true, data: packages });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async createCoinPackage(req: Request, res: Response) {
    try {
      const { name, coinAmount, price, isActive } = req.body;
      const newPackage = await adminService.createCoinPackage({ name, coinAmount, price, isActive });
      return res.status(201).json({ success: true, data: newPackage });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async updateCoinPackage(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, coinAmount, price, isActive } = req.body;
      const updatedPackage = await adminService.updateCoinPackage(id, { name, coinAmount, price, isActive });
      return res.json({ success: true, data: updatedPackage });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async deleteCoinPackage(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await adminService.deleteCoinPackage(id);
      return res.json({ success: true, message: 'Coin package deleted' });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await adminService.getAllTransactions();
      return res.json({ success: true, data: transactions });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async getAllCoinLogs(req: Request, res: Response) {
    try {
      const coinLogs = await adminService.getAllCoinLogs();
      return res.json({ success: true, data: coinLogs });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async getTopupUsers(req: Request, res: Response) {
    try {
      const data = await adminService.getTopupUsers();
      return res.json({ success: true, data });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }
}
