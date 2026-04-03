const BACKEND_URL = 'http://localhost:3000/api'; // Adjust if your backend runs on a different port or domain

export type CoinLog = {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  createdAt: string;
};

export const getWalletBalance = async (userId: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/wallet/balance/${userId}`, {
      headers: {
        'x-user-id': userId,
        'x-user-role': 'USER', // Assuming regular user for this call
      },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil saldo wallet');
    }
    return result.data.balance;
  } catch (error: any) {
    console.error('Backend API Error (getWalletBalance):', error);
    throw error;
  }
};

export const getCoinLogs = async (userId: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/wallet/logs/${userId}`, {
      headers: {
        'x-user-id': userId,
        'x-user-role': 'USER', // Assuming regular user for this call
      },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil log koin');
    }
    return result.data as CoinLog[];
  } catch (error: any) {
    console.error('Backend API Error (getCoinLogs):', error);
    throw error;
  }
};
