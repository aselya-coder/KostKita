import { CoinPackageRepository } from '../repositories/coinPackage.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { WalletRepository } from '../repositories/wallet.repository.js';

export class AdminService {
  private coinPackageRepository: CoinPackageRepository;
  private transactionRepository: TransactionRepository;
  private walletRepository: WalletRepository;

  constructor() {
    this.coinPackageRepository = new CoinPackageRepository();
    this.transactionRepository = new TransactionRepository();
    this.walletRepository = new WalletRepository();
  }

  // Coin Packages
  async getAllCoinPackages() {
    return this.coinPackageRepository.findAll();
  }

  async createCoinPackage(data: { name: string; coinAmount: number; price: number; isActive?: boolean }) {
    if (data.coinAmount < 5 || data.coinAmount > 100) {
      throw new Error('Coin amount must be between 5 and 100');
    }
    return this.coinPackageRepository.create(data);
  }

  async updateCoinPackage(id: string, data: { name?: string; coinAmount?: number; price?: number; isActive?: boolean }) {
    if (data.coinAmount && (data.coinAmount < 5 || data.coinAmount > 100)) {
      throw new Error('Coin amount must be between 5 and 100');
    }
    return this.coinPackageRepository.update(id, data);
  }

  async deleteCoinPackage(id: string) {
    return this.coinPackageRepository.delete(id);
  }

  // Transactions
  async getAllTransactions() {
    return this.transactionRepository.findUserTransactions(); // Admin can view all transactions
  }

  // Coin Logs
  async getAllCoinLogs() {
    return this.walletRepository.getLogs(); // Admin can view all coin logs
  }

  async getTopupUsers() {
    const all = await this.transactionRepository.findUserTransactions();
    const map: Record<string, { userId: string; totalAmount: number; totalCoins: number; count: number; lastAt: string }> = {};
    for (const t of all) {
      if (t.status !== 'success') continue;
      if (!map[t.userId]) {
        map[t.userId] = { userId: t.userId, totalAmount: 0, totalCoins: 0, count: 0, lastAt: t.createdAt as unknown as string };
      }
      map[t.userId].totalAmount += t.amount;
      map[t.userId].totalCoins += t.coinAmount;
      map[t.userId].count += 1;
      const prev = new Date(map[t.userId].lastAt).getTime();
      const cur = new Date(t.createdAt as unknown as string).getTime();
      if (cur > prev) map[t.userId].lastAt = t.createdAt as unknown as string;
    }
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }
}
