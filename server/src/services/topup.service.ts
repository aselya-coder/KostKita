import prisma from '../config/prisma.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { Prisma } from '@prisma/client';

export class TopupService {
  private transactionRepository: TransactionRepository;
  private walletRepository: WalletRepository;
  private readonly COIN_PRICE: number;
  private readonly ADMIN_FEE_TYPE: 'flat' | 'percent';
  private readonly ADMIN_FEE_VALUE: number;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.walletRepository = new WalletRepository();
    this.COIN_PRICE = Number(process.env.COIN_PRICE || 10000);
    const t = (process.env.ADMIN_FEE_TYPE || 'flat').toLowerCase();
    this.ADMIN_FEE_TYPE = (t === 'percent' ? 'percent' : 'flat');
    this.ADMIN_FEE_VALUE = Number(process.env.ADMIN_FEE_VALUE || 2500);
  }

  private computeAdminFee(baseAmount: number) {
    if (this.ADMIN_FEE_TYPE === 'percent') {
      return Math.round((baseAmount * this.ADMIN_FEE_VALUE) / 100);
    }
    return this.ADMIN_FEE_VALUE;
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
    const calculatedAmount = coinPackage.coinAmount * this.COIN_PRICE;
    const adminFee = this.computeAdminFee(calculatedAmount);
    const totalAmount = calculatedAmount + adminFee;

    const transaction = await this.transactionRepository.createTransaction({
      userId,
      coinPackageId: packageId,
      amount: totalAmount,
      coinAmount: coinPackage.coinAmount,
      status: 'pending',
      externalId,
    });

    // Return app checkout URL for local/dev flow (avoid unreachable mock domain)
    const appBase = process.env.APP_BASE_URL || 'http://localhost:8080';
    const paymentUrl = `${appBase}/dashboard/topup/checkout?trx=${transaction.id}`;

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
        data: { status: updatedStatus },
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
    const pkgs = await prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { coinAmount: 'asc' },
    });
    return pkgs.map(p => {
      const price = p.coinAmount * this.COIN_PRICE;
      const adminFee = this.computeAdminFee(price);
      return {
        ...p,
        price,
        adminFee,
      };
    });
  }

  async getTransactionById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: { coinPackage: true },
    });
  }

  async initiatePayment(user: { id: string; role: 'USER' | 'ADMIN' }, transactionId: string, method: 'QRIS' | 'EWALLET' | 'VA', provider?: string) {
    const trx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { coinPackage: true },
    });
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (user.role === 'USER' && trx.userId !== user.id) throw new Error('Forbidden');
    if (trx.status !== 'pending') throw new Error('Transaksi tidak dalam status pending');

    if (method === 'VA') {
      const map: Record<string, string> = { BCA: '014', BRI: '002', MANDIRI: '008' };
      const bank = provider && map[provider] ? provider : 'BCA';
      const prefix = map[bank];
      const body = (trx.externalId || trx.id).replace(/\D/g, '').slice(-10).padStart(10, '0');
      const vaNumber = `${prefix}${body}`;
      return { method, provider: bank, vaNumber };
    }

    if (method === 'QRIS') {
      const payload = `KOSKITA|TRX|${trx.externalId || trx.id}|AMOUNT|${trx.amount}`;
      return { method, qrisPayload: payload, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
    }

    // EWALLET
    const appBase = process.env.APP_BASE_URL || 'http://localhost:8080';
    const redirectUrl = `${appBase}/dashboard/topup/checkout?trx=${trx.id}`;
    return { method, provider: provider || 'SHOPEEPAY', redirectUrl };
  }
}
