import prisma from '../config/prisma.js';

export class ListingRepository {
  async countByUserId(userId: string) {
    return prisma.listing.count({
      where: { userId },
    });
  }

  async createListing(data: any, tx?: any) {
    const db = tx || prisma;
    return db.listing.create({
      data,
    });
  }

  async findByUserId(userId: string) {
    return prisma.listing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findExpired() {
    return prisma.listing.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async archiveExpired() {
    return prisma.listing.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'archived',
      },
    });
  }
}
