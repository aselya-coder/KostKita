import { CoinPackageRepository } from '../repositories/coinPackage.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { CoinLogType, TransactionStatus } from '@prisma/client';

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
}
