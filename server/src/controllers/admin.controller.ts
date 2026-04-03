import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';

const adminService = new AdminService();

export class AdminController {
  async getAllCoinPackages(req: Request, res: Response) {
    try {
      const packages = await adminService.getAllCoinPackages();
      return res.json({ success: true, data: packages });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async createCoinPackage(req: Request, res: Response) {
    try {
      const { name, coinAmount, price, isActive } = req.body;
      const newPackage = await adminService.createCoinPackage({ name, coinAmount, price, isActive });
      return res.status(201).json({ success: true, data: newPackage });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateCoinPackage(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, coinAmount, price, isActive } = req.body;
      const updatedPackage = await adminService.updateCoinPackage(id, { name, coinAmount, price, isActive });
      return res.json({ success: true, data: updatedPackage });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteCoinPackage(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await adminService.deleteCoinPackage(id);
      return res.json({ success: true, message: 'Coin package deleted' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await adminService.getAllTransactions();
      return res.json({ success: true, data: transactions });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllCoinLogs(req: Request, res: Response) {
    try {
      const coinLogs = await adminService.getAllCoinLogs();
      return res.json({ success: true, data: coinLogs });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
