import { type Wallet, type Transaction } from "@/data/mockData";

const BACKEND_URL = 'http://localhost:3000/api'; 

type RoleHeader = 'USER' | 'ADMIN';

type BackendCoinLog = {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
};

export const getWalletData = async (userId: string): Promise<Wallet | null> => {
  const balance = await getWalletBalance(userId);
  return { userId, balance, totalEarnings: 0 };
};

export const getWalletBalance = async (userId: string, role: RoleHeader = 'USER'): Promise<number> => {
  const res = await fetch(`${BACKEND_URL}/wallet/balance/${userId}`, {
    headers: {
      'x-user-id': userId,
      'x-user-role': role,
    },
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Gagal mengambil saldo wallet');
  }
  return result.data?.balance ?? 0;
};

export const getTransactions = async (userId: string, role: RoleHeader = 'USER'): Promise<Transaction[]> => {
  const res = await fetch(`${BACKEND_URL}/wallet/logs/${userId}`, {
    headers: {
      'x-user-id': userId,
      'x-user-role': role,
    },
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Gagal mengambil log koin');
  }
  const logs: BackendCoinLog[] = result.data || [];
  // Map Coin Logs to Transaction-like entries for UI consumption
  const mapped: Transaction[] = logs.map(log => ({
    id: log.id,
    userId: log.userId,
    type: log.type === 'credit' ? 'topup' : 'ad_payment',
    amount: 0,
    coins: log.amount,
    status: 'paid',
    description: log.description,
    createdAt: log.createdAt,
  }));
  return mapped;
};
