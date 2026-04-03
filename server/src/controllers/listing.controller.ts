import { Request, Response } from 'express';
import { ListingService } from '../services/listing.service.js';

const listingService = new ListingService();

export class ListingController {
  async create(req: Request, res: Response) {
    try {
      // Assuming userId comes from auth middleware (e.g., req.user.id)
      const userId = req.body.userId as string;
      const { title, description, price } = req.body;
      const durationDays = req.body.durationDays ? parseInt(req.body.durationDays) : undefined;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await listingService.createListing(userId, {
        title,
        description,
        price: parseFloat(price),
        durationDays,
      });

      return res.status(201).json({
        success: true,
        message: result.isFree ? 'Iklan gratis berhasil dibuat' : 'Iklan berbayar berhasil dibuat',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal membuat iklan',
      });
    }
  }

  async getUserListings(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const targetUserId = req.params.userId as string;
      
      // A user can only view their own listings, unless they are an admin
      if (req.user.role === 'USER' && req.user.id !== targetUserId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own listings' });
      }

      const listings = await listingService.getUserListings(targetUserId);

      return res.json({
        success: true,
        data: listings,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengambil data iklan',
      });
    }
  }
}
