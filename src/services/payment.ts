import { supabase } from "@/lib/supabase";

const BACKEND_URL = 'http://localhost:3000/api'; // Adjust if your backend runs on a different port or domain

export type CoinPackage = {
  id: string;
  name: string;
  coinAmount: number;
  price: number;
  isActive: boolean;
  adminFee?: number;
};

export type TopupTransaction = {
  id: string;
  userId: string;
  coinPackageId: string;
  amount: number;
  coinAmount: number;
  status: 'pending' | 'success' | 'failed';
  externalId?: string;
};

// ==========================================
// 1. COIN PACKAGES
// ==========================================

export const getCoinPackages = async (): Promise<CoinPackage[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/coin-packages`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil paket koin');
    }
    return result.data;
  } catch (error: any) {
    console.error('Backend API Error (getCoinPackages):', error);
    throw error;
  }
};

// ==========================================
// 2. TOP-UP TRANSACTIONS
// ==========================================

export const createTopupRequest = async (userId: string, packageId: string, role: 'USER' | 'ADMIN' = 'USER') => {
  try {
    const response = await fetch(`${BACKEND_URL}/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-role': role,
      },
      body: JSON.stringify({ userId, packageId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal membuat permintaan topup');
    }
    return result.data;
  } catch (error: any) {
    console.error('Backend API Error (createTopupRequest):', error);
    throw error;
  }
};

export const simulatePaymentWebhook = async (externalId: string, status: 'success' | 'failed') => {
  const response = await fetch(`${BACKEND_URL}/payment-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ externalId, status }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Gagal memproses webhook');
  }
  return result.data;
};

export type InitiatePaymentResponse = {
  method: 'QRIS' | 'EWALLET' | 'VA';
  provider?: string;
  redirectUrl?: string;
  vaNumber?: string;
  qrisPayload?: string;
  expiresAt?: string;
};

export const initiatePayment = async (userId: string, role: 'USER' | 'ADMIN', transactionId: string, method: 'QRIS' | 'EWALLET' | 'VA', provider?: string) => {
  const response = await fetch(`${BACKEND_URL}/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': role,
    },
    body: JSON.stringify({ transactionId, method, provider }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Gagal menginisiasi pembayaran');
  }
  return result.data as InitiatePaymentResponse;
};
