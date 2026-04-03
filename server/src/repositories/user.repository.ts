import prisma from '../config/prisma.js';
import { Role } from '@prisma/client';

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  async createUser(data: { id?: string; email: string; role?: Role }) {
    if (data.id) {
      return prisma.user.upsert({
        where: { id: data.id },
        update: {},
        create: {
          id: data.id,
          email: data.email,
          role: data.role || 'USER',
        },
      });
    }
    return prisma.user.create({
      data: {
        email: data.email,
        role: data.role || 'USER',
      },
    });
  }
}
