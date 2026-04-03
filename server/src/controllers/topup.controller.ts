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
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengambil paket koin',
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
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal membuat transaksi topup',
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
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal memproses webhook',
      });
    }
  }
}
