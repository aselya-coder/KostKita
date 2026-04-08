import prisma from '../config/prisma.js';

export type CoinLogType = 'credit' | 'debit';

export class WalletRepository {
  async findByUserId(userId: string) {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  }

  async createWallet(userId: string, initialBalance: number = 0) {
    return prisma.wallet.create({
      data: {
        userId,
        balance: initialBalance,
      },
    });
  }

  async updateBalance(userId: string, amount: number, type: CoinLogType, description: string, tx?: any) {
    const db = tx || prisma;

    // Use a transaction if not already in one to ensure balance and logs are updated together
    return db.$transaction(async (prismaTx: any) => {
      const wallet = await prismaTx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet && type === 'debit') {
        throw new Error('Wallet not found');
      }

      const newBalance = type === 'credit' 
        ? (wallet?.balance || 0) + amount 
        : (wallet?.balance || 0) - amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      const updatedWallet = await prismaTx.wallet.upsert({
        where: { userId },
        update: { balance: newBalance },
        create: { userId, balance: newBalance },
      });

      await prismaTx.coinLog.create({
        data: {
          userId,
          type,
          amount,
          description,
        },
      });

      return updatedWallet;
    });
  }

  async getLogs(userId?: string) {
    return prisma.coinLog.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}
