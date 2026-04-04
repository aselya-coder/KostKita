const BACKEND_URL = 'http://localhost:3000/api'; // Adjust if your backend runs on a different port or domain

// Mock Data for fallback
const mockAdminPackages: AdminCoinPackage[] = [
  { id: "p1", name: "Paket 5 Koin", coinAmount: 5, price: 50000, isActive: true, createdAt: new Date().toISOString() },
  { id: "p2", name: "Paket 10 Koin", coinAmount: 10, price: 100000, isActive: true, createdAt: new Date().toISOString() },
  { id: "p3", name: "Paket 50 Koin", coinAmount: 50, price: 500000, isActive: true, createdAt: new Date().toISOString() },
  { id: "p4", name: "Paket 100 Koin", coinAmount: 100, price: 1000000, isActive: true, createdAt: new Date().toISOString() },
];

const mockAdminTransactions: AdminTransaction[] = [
  {
    id: "t1",
    userId: "u2",
    coinPackageId: "p2",
    amount: 105000,
    coinAmount: 10,
    status: "success",
    createdAt: "2024-03-20T10:00:00Z",
    coinPackage: { name: "Paket 10 Koin" }
  }
];

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
    // Return mock data immediately to avoid ERR_CONNECTION_REFUSED
    return mockAdminPackages;
  } catch (error: any) {
    console.error('Backend API Error (getAllAdminCoinPackages):', error);
    return mockAdminPackages; // Fallback
  }
};

export const createAdminCoinPackage = async (userId: string, userRole: 'ADMIN', data: { name: string; coinAmount: number; price: number; isActive?: boolean }) => {
  try {
    const newPackage: AdminCoinPackage = {
      id: `p${Date.now()}`,
      name: data.name,
      coinAmount: data.coinAmount,
      price: data.price,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString()
    };
    return newPackage;
  } catch (error: any) {
    console.error('Backend API Error (createAdminCoinPackage):', error);
    throw error;
  }
};

export const updateAdminCoinPackage = async (userId: string, userRole: 'ADMIN', id: string, data: { name?: string; coinAmount?: number; price?: number; isActive?: boolean }) => {
  try {
    return { id, ...data } as AdminCoinPackage;
  } catch (error: any) {
    console.error('Backend API Error (updateAdminCoinPackage):', error);
    throw error;
  }
};

export const deleteAdminCoinPackage = async (userId: string, userRole: 'ADMIN', id: string) => {
  try {
    return { success: true };
  } catch (error: any) {
    console.error('Backend API Error (deleteAdminCoinPackage):', error);
    throw error;
  }
};

// Transactions
export const getAllAdminTransactions = async (userId: string, userRole: 'ADMIN') => {
  try {
    return mockAdminTransactions;
  } catch (error: any) {
    console.error('Backend API Error (getAllAdminTransactions):', error);
    return mockAdminTransactions;
  }
};

// Coin Logs
export const getAllAdminCoinLogs = async (userId: string, userRole: 'ADMIN') => {
  try {
    return [];
  } catch (error: any) {
    console.error('Backend API Error (getAllAdminCoinLogs):', error);
    return [];
  }
};

