const BACKEND_URL = 'http://localhost:3000/api'; // Adjust if your backend runs on a different port or domain

export type AdminCoinPackage = {
  id: string;
  name: string;
  coinAmount: number;
  price: number;
  isActive: boolean;
  createdAt: string;
};

export type AdminTransaction = {
  id: string;
  userId: string;
  coinPackageId: string;
  amount: number;
  coinAmount: number;
  status: 'pending' | 'success' | 'failed';
  externalId?: string;
  createdAt: string;
  coinPackage: {
    name: string;
  };
};

export type AdminCoinLog = {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  createdAt: string;
};

const getAuthHeaders = (userId: string, userRole: 'USER' | 'ADMIN') => ({
  'Content-Type': 'application/json',
  'x-user-id': userId,
  'x-user-role': userRole,
});

// Coin Packages
export const getAllAdminCoinPackages = async (userId: string, userRole: 'ADMIN') => {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/coin-packages`, {
      headers: getAuthHeaders(userId, userRole),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil paket koin admin');
    }
    return result.data as AdminCoinPackage[];
  } catch (error: any) {
    console.error('Backend API Error (getAllAdminCoinPackages):', error);
    throw error;
  }
};

export const createAdminCoinPackage = async (userId: string, userRole: 'ADMIN', data: { name: string; coinAmount: number; price: number; isActive?: boolean }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/coin-packages`, {
      method: 'POST',
      headers: getAuthHeaders(userId, userRole),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal membuat paket koin');
    }
    return result.data as AdminCoinPackage;
  } catch (error: any) {
    console.error('Backend API Error (createAdminCoinPackage):', error);
    throw error;
  }
};

export const updateAdminCoinPackage = async (userId: string, userRole: 'ADMIN', id: string, data: { name?: string; coinAmount?: number; price?: number; isActive?: boolean }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/coin-packages/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(userId, userRole),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal memperbarui paket koin');
    }
    return result.data as AdminCoinPackage;
  } catch (error: any) {
    console.error('Backend API Error (updateAdminCoinPackage):', error);
    throw error;
  }
};

export const deleteAdminCoinPackage = async (userId: string, userRole: 'ADMIN', id: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/coin-packages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(userId, userRole),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal menghapus paket koin');
    }
    return result.data;
  } catch (error: any) {
    console.error('Backend API Error (deleteAdminCoinPackage):', error);
    throw error;
  }
};

// Transactions
export const getAllAdminTransactions = async (userId: string, userRole: 'ADMIN') => {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/transactions`, {
      headers: getAuthHeaders(userId, userRole),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil semua transaksi');
    }
    return result.data as AdminTransaction[];
  } catch (error: any) {
    console.error('Backend API Error (getAllAdminTransactions):', error);
    throw error;
  }
};

// Coin Logs
export const getAllAdminCoinLogs = async (userId: string, userRole: 'ADMIN') => {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/coin-logs`, {
      headers: getAuthHeaders(userId, userRole),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil semua log koin');
    }
    return result.data as AdminCoinLog[];
  } catch (error: any) {
    console.error('Backend API Error (getAllAdminCoinLogs):', error);
    throw error;
  }
};
