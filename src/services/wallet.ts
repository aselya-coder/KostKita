import { mockWallets, mockTransactions, type Wallet, type Transaction } from "@/data/mockData";

const BACKEND_URL = 'http://localhost:3000/api'; 

export const getWalletBalance = async (userId: string): Promise<number> => {
  // Use mock for now
  const wallet = mockWallets.find(w => w.userId === userId);
  return wallet ? wallet.balance : 0;
};

export const getWalletData = async (userId: string): Promise<Wallet | null> => {
  return mockWallets.find(w => w.userId === userId) || null;
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  return mockTransactions.filter(t => t.userId === userId);
};

export const topUpCoins = async (userId: string, packageId: string): Promise<{ success: boolean; message: string }> => {
  // Mock top up
  return { success: true, message: "Top up berhasil" };
};

