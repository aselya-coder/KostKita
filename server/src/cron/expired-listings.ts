import cron from 'node-cron';
import { ListingService } from '../services/listing.service.js';

const listingService = new ListingService();

export const initCronJobs = () => {
  // Run every day at 00:00 (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Starting archive expired listings...');
    try {
      const result = await listingService.archiveExpiredListings();
      console.log(`[CRON] Successfully archived ${result.count} listings.`);
    } catch (error) {
      console.error('[CRON] Error archiving expired listings:', error);
    }
  });

  console.log('[CRON] Jobs initialized.');
};
