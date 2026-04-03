import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service.js';

const walletService = new WalletService();

export class WalletController {
  async getBalance(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const targetUserId = req.params.userId as string;

      // A user can only view their own wallet, unless they are an admin
      if (req.user.role === 'USER' && req.user.id !== targetUserId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own wallet' });
      }

      const balance = await walletService.getBalance(targetUserId);

      return res.json({
        success: true,
        data: { balance },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengambil saldo wallet',
      });
    }
  }

  async getLogs(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const targetUserId = req.params.userId as string;

      // A user can only view their own coin logs, unless they are an admin
      if (req.user.role === 'USER' && req.user.id !== targetUserId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own coin logs' });
      }

      const logs = await walletService.getTransactionLogs(targetUserId);

      return res.json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengambil log koin',
      });
    }
  }
}
