import { Router } from 'express';
import { ListingController } from '../controllers/listing.controller.js';
import { TopupController } from '../controllers/topup.controller.js';
import { WalletController } from '../controllers/wallet.controller.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
console.log('[ROUTES] Initializing routes...');
const listingController = new ListingController();
const topupController = new TopupController();
const walletController = new WalletController();
const adminController = new AdminController();

// Health Check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

// Listing Routes
router.post('/listings', authenticate, authorize(['USER', 'ADMIN']), listingController.create);
router.get('/listings/user/:userId', authenticate, authorize(['USER', 'ADMIN']), listingController.getUserListings);

// Topup Routes
router.get('/coin-packages', topupController.getPackages); // Publicly accessible
router.post('/topup', authenticate, authorize(['USER', 'ADMIN']), topupController.createTopup);
router.post('/payment-webhook', topupController.webhook); // No auth needed for webhook

// Wallet Routes
router.get('/wallet/balance/:userId', authenticate, authorize(['USER', 'ADMIN']), walletController.getBalance);
router.get('/wallet/logs/:userId', authenticate, authorize(['USER', 'ADMIN']), walletController.getLogs);

// Admin Routes
router.get('/admin/coin-packages', authenticate, authorize(['ADMIN']), adminController.getAllCoinPackages);
router.post('/admin/coin-packages', authenticate, authorize(['ADMIN']), adminController.createCoinPackage);
router.put('/admin/coin-packages/:id', authenticate, authorize(['ADMIN']), adminController.updateCoinPackage);
router.delete('/admin/coin-packages/:id', authenticate, authorize(['ADMIN']), adminController.deleteCoinPackage);
router.get('/admin/transactions', authenticate, authorize(['ADMIN']), adminController.getAllTransactions);
router.get('/admin/coin-logs', authenticate, authorize(['ADMIN']), adminController.getAllCoinLogs);

export default router;
