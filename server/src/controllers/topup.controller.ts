import { Request, Response } from 'express';
import { TopupService } from '../services/topup.service.js';

const topupService = new TopupService();

export class TopupController {
  async getPackages(req: Request, res: Response) {
    try {
      const packages = await topupService.getAllPackages();
      return res.json({
        success: true,
        data: packages,
      });
    } catch (error: unknown) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Gagal mengambil paket koin',
      });
    }
  }

  async createTopup(req: Request, res: Response) {
    try {
      const userId = req.body.userId as string;
      const packageId = req.body.packageId as string;
      const result = await topupService.createTopup(userId, packageId);

      return res.status(201).json({
        success: true,
        message: 'Transaksi topup berhasil dibuat',
        data: result,
      });
    } catch (error: unknown) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Gagal membuat transaksi topup',
      });
    }
  }

  async webhook(req: Request, res: Response) {
    try {
      const { externalId, status } = req.body; // Mocked webhook data
      const result = await topupService.handleWebhook(externalId, status);

      return res.json({
        success: true,
        message: 'Webhook processed successfully',
        data: result,
      });
    } catch (error: unknown) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Gagal memproses webhook',
      });
    }
  }

  async getTransaction(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const id = req.params.id as string;
      const trx = await topupService.getTransactionById(id);
      if (!trx) {
        return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
      }
      if (req.user.role === 'USER' && trx.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      return res.json({ success: true, data: trx });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Gagal mengambil transaksi' });
    }
  }

  async initiatePayment(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const { transactionId, method, provider } = req.body as { transactionId: string; method: 'QRIS' | 'EWALLET' | 'VA'; provider?: string };
      const result = await topupService.initiatePayment(req.user, transactionId, method, provider);
      return res.json({ success: true, data: result });
    } catch (error: unknown) {
      return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Gagal menginisiasi pembayaran' });
    }
  }
}
