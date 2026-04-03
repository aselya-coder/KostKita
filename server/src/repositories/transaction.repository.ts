import prisma from '../config/prisma.js';
import { TransactionStatus } from '@prisma/client';

export class TransactionRepository {
  async createTransaction(data: {
    userId: string;
    coinPackageId: string;
    amount: number;
    coinAmount: number;
    status: TransactionStatus;
    externalId?: string;
  }) {
    return prisma.transaction.create({
      data,
    });
  }

  async findByExternalId(externalId: string) {
    return prisma.transaction.findUnique({
      where: { externalId },
      include: { coinPackage: true },
    });
  }

  async updateStatus(id: string, status: TransactionStatus) {
    return prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }

  async findUserTransactions(userId?: string) {
    return prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      include: { coinPackage: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
