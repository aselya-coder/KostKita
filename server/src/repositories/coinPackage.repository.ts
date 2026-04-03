import prisma from '../config/prisma.js';

export class CoinPackageRepository {
  async findAll() {
    return prisma.coinPackage.findMany({
      orderBy: { coinAmount: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.coinPackage.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; coinAmount: number; price: number; isActive?: boolean }) {
    return prisma.coinPackage.create({
      data,
    });
  }

  async update(id: string, data: { name?: string; coinAmount?: number; price?: number; isActive?: boolean }) {
    return prisma.coinPackage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.coinPackage.delete({
      where: { id },
    });
  }
}
