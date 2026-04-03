import prisma from '../config/prisma.js';
import { ListingRepository } from '../repositories/listing.repository.js';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { ListingStatus, Prisma } from '@prisma/client';

export class ListingService {
  private listingRepository: ListingRepository;
  private walletRepository: WalletRepository;

  constructor() {
    this.listingRepository = new ListingRepository();
    this.walletRepository = new WalletRepository();
  }

  async createListing(userId: string, listingData: {
    title: string;
    description: string;
    price: number;
    durationDays?: number;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Get user listing count
      const totalListings = await tx.listing.count({
        where: { userId },
      });

      let expiresAt: Date;
      let isFree = false;
      let dailyCost = 1;
      let totalCost = 0;

      if (totalListings === 0) {
        // First listing is free for 30 days
        isFree = true;
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      } else {
        // Paid listing
        if (!listingData.durationDays) {
          throw new Error('Paid listing requires duration');
        }

        totalCost = listingData.durationDays * dailyCost;

        // Check wallet and deduct coins
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet || wallet.balance < totalCost) {
          throw new Error('Koin tidak cukup, silakan top up terlebih dahulu');
        }

        // Deduct balance and log
        await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: totalCost } },
        });

        await tx.coinLog.create({
          data: {
            userId,
            type: 'debit',
            amount: totalCost,
            description: `Upload iklan berbayar (${listingData.durationDays} hari)`,
          },
        });

        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + listingData.durationDays);
      }

      // 2. Create the listing
      const listing = await tx.listing.create({
        data: {
          userId,
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          status: 'active' as ListingStatus,
          isFree,
          dailyCost,
          expiresAt,
        },
      });

      return {
        listing,
        cost: totalCost,
        isFree,
        expiresAt,
      };
    });
  }

  async getUserListings(userId: string) {
    return this.listingRepository.findByUserId(userId);
  }

  async archiveExpiredListings() {
    return this.listingRepository.archiveExpired();
  }
}
