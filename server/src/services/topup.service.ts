import prisma from '../config/prisma.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { TransactionStatus, Prisma } from '@prisma/client';

export class TopupService {
  private transactionRepository: TransactionRepository;
  private walletRepository: WalletRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.walletRepository = new WalletRepository();
  }

  async createTopup(userId: string, packageId: string) {
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage || !coinPackage.isActive) {
      throw new Error('Coin package not found or inactive');
    }

    // Validate min/max (redundant if stored in DB correctly, but good for security)
    if (coinPackage.coinAmount < 5 || coinPackage.coinAmount > 100) {
      throw new Error('Coin amount must be between 5 and 100');
    }

    const externalId = `TRX-${Date.now()}-${userId.substring(0, 8)}`;

    const transaction = await this.transactionRepository.createTransaction({
      userId,
      coinPackageId: packageId,
      amount: coinPackage.price,
      coinAmount: coinPackage.coinAmount,
      status: 'pending',
      externalId,
    });

    // Mock payment gateway URL (e.g., Midtrans)
    const paymentUrl = `https://mock-payment-gateway.com/pay/${externalId}`;

    return {
      transaction,
      paymentUrl,
    };
  }

  async handleWebhook(externalId: string, status: 'success' | 'failed') {
    const transaction = await this.transactionRepository.findByExternalId(externalId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      return transaction; // Already processed
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedStatus = status === 'success' ? 'success' : 'failed';
      
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: updatedStatus as TransactionStatus },
      });

      if (status === 'success') {
        // Update wallet
        await tx.wallet.upsert({
          where: { userId: transaction.userId },
          update: { balance: { increment: transaction.coinAmount } },
          create: { userId: transaction.userId, balance: transaction.coinAmount },
        });

        // Log the credit
        await tx.coinLog.create({
          data: {
            userId: transaction.userId,
            type: 'credit',
            amount: transaction.coinAmount,
            description: `Top up koin dari paket: ${transaction.coinPackage.name}`,
          },
        });
      }

      return updatedTransaction;
    });
  }

  async getAllPackages() {
    return prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { coinAmount: 'asc' },
    });
  }
}
