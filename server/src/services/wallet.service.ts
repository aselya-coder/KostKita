import { WalletRepository } from '../repositories/wallet.repository.js';
import { CoinLogType } from '@prisma/client';

export class WalletService {
  private walletRepository: WalletRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
  }

  async getBalance(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);
    return wallet ? wallet.balance : 0;
  }

  async addCoins(userId: string, amount: number, description: string = 'Top up koin') {
    return this.walletRepository.updateBalance(userId, amount, 'credit', description);
  }

  async deductCoins(userId: string, amount: number, description: string) {
    return this.walletRepository.updateBalance(userId, amount, 'debit', description);
  }

  async getTransactionLogs(userId: string) {
    return this.walletRepository.getLogs(userId);
  }
}
