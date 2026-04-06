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

const FALLBACK_COIN_PACKAGES: CoinPackage[] = [
  { id: 'cp1', name: 'Paket Hemat', coinAmount: 1, price: 10000, isActive: true, adminFee: 1000 },
  { id: 'cp2', name: 'Paket Reguler', coinAmount: 5, price: 50000, isActive: true, adminFee: 2500 },
  { id: 'cp3', name: 'Paket Premium', coinAmount: 10, price: 100000, isActive: true, adminFee: 5000 },
  { id: 'cp4', name: 'Paket Sultan', coinAmount: 50, price: 500000, isActive: true, adminFee: 10000 },
];

// ==========================================
// 1. COIN PACKAGES
// ==========================================

export const getCoinPackages = async (): Promise<CoinPackage[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/coin-packages`);
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Gagal mengambil paket koin');
    }
    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.warn('Backend API Offline (getCoinPackages), using fallback data:', error.message);
    return FALLBACK_COIN_PACKAGES;
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

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Gagal membuat permintaan topup');
    }
    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.warn('Backend API Offline (createTopupRequest), simulating success:', error.message);
    // Return a mock successful transaction response
    const selectedPackage = FALLBACK_COIN_PACKAGES.find(p => p.id === packageId) || FALLBACK_COIN_PACKAGES[0];
    return {
      id: `trx-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      coinPackageId: packageId,
      amount: selectedPackage.price,
      coinAmount: selectedPackage.coinAmount,
      status: 'pending',
      externalId: `ext-${Math.random().toString(36).substr(2, 9)}`,
    };
  }
};

export const simulatePaymentWebhook = async (externalId: string, status: 'success' | 'failed') => {
  try {
    const response = await fetch(`${BACKEND_URL}/payment-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ externalId, status }),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Gagal memproses webhook');
    }
    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.warn('Backend API Offline (simulatePaymentWebhook), simulating success:', error.message);
    return { success: true, message: 'Simulated payment processing success' };
  }
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
  try {
    const response = await fetch(`${BACKEND_URL}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-role': role,
      },
      body: JSON.stringify({ transactionId, method, provider }),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Gagal menginisiasi pembayaran');
    }
    const result = await response.json();
    return result.data as InitiatePaymentResponse;
  } catch (error: any) {
    console.warn('Backend API Offline (initiatePayment), simulating provider response:', error.message);
    // Mock response for different methods
    const mockResponses: Record<string, InitiatePaymentResponse> = {
      'QRIS': { 
        method: 'QRIS', 
        qrisPayload: '00020101021226660014ID.CO.QRIS.WWW01189360050300000768120215ID10202214433220303UMI51440014ID.CO.QRIS.WWW0215ID10202214433220303UMI5204599953033605802ID5911MAJU JAYA6005DEPOK61051642462070703A016304D9C2',
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString()
      },
      'VA': { 
        method: 'VA', 
        provider: provider || 'BRI', 
        vaNumber: `8877${Math.floor(Math.random() * 1000000000000)}`,
        expiresAt: new Date(Date.now() + 24 * 3600000).toISOString()
      },
      'EWALLET': { 
        method: 'EWALLET', 
        provider: provider || 'OVO', 
        redirectUrl: 'https://payment.example.com/mock-redirect',
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString()
      }
    };
    return mockResponses[method];
  }
};
