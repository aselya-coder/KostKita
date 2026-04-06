import { supabase } from "@/lib/supabase";

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

export const FALLBACK_COIN_PACKAGES: CoinPackage[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Paket 1 Koin', coinAmount: 1, price: 10000, isActive: true, adminFee: 2500 },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Paket 5 Koin', coinAmount: 5, price: 50000, isActive: true, adminFee: 2500 },
  { id: '00000000-0000-0000-0000-000000000010', name: 'Paket 10 Koin', coinAmount: 10, price: 100000, isActive: true, adminFee: 2500 },
  { id: '00000000-0000-0000-0000-000000000050', name: 'Paket 50 Koin', coinAmount: 50, price: 500000, isActive: true, adminFee: 2500 },
  { id: '00000000-0000-0000-0000-000000000100', name: 'Paket 100 Koin', coinAmount: 100, price: 1000000, isActive: true, adminFee: 2500 },
];

// ==========================================
// 1. COIN PACKAGES
// ==========================================

export const getCoinPackages = async (): Promise<CoinPackage[]> => {
  try {
    const { data, error } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    
    if (!data || data.length === 0) return FALLBACK_COIN_PACKAGES;

    return data.map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      coinAmount: pkg.coin_amount,
      price: pkg.price,
      isActive: pkg.is_active,
      adminFee: pkg.admin_fee || 2500
    }));
  } catch (error: any) {
    console.warn('Supabase Error (getCoinPackages), using fallback data:', error.message);
    return FALLBACK_COIN_PACKAGES;
  }
};

// ==========================================
// 2. TOP-UP TRANSACTIONS
// ==========================================

export const createTopupRequest = async (userId: string, packageId: string, role: 'USER' | 'ADMIN' = 'USER') => {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId);
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    // Get package details first
    let selectedPackage: CoinPackage | undefined;
    let foundInDb = false;
    
    if (isUuid) {
      const { data: pkg, error: pkgError } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('id', packageId)
        .maybeSingle();
      
      if (!pkgError && pkg) {
        selectedPackage = {
          id: pkg.id,
          name: pkg.name,
          coinAmount: pkg.coin_amount,
          price: pkg.price,
          isActive: pkg.is_active,
          adminFee: pkg.admin_fee || 2500
        };
        foundInDb = true;
      }
    }

    if (!selectedPackage) {
      selectedPackage = FALLBACK_COIN_PACKAGES.find(p => p.id === packageId) || FALLBACK_COIN_PACKAGES[0];
    }

    if (!isUserUuid) {
      throw new Error("Invalid User ID format (UUID expected)");
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: selectedPackage.price,
        pricing_plan_id: foundInDb ? packageId : null,
        status: 'pending',
        payment_provider: 'simulated',
        external_id: `ext-${Math.random().toString(36).substr(2, 9)}`
      }])
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error("Gagal membuat transaksi");

    return {
      transaction: {
        id: data.id,
        userId: data.user_id,
        amount: data.amount,
        status: data.status,
        createdAt: data.created_at
      },
      paymentUrl: `/dashboard/topup/checkout?trx=${data.id}`
    };
  } catch (error: any) {
    console.warn('Supabase Error (createTopupRequest), simulating success:', error.message);
    const selectedPackage = FALLBACK_COIN_PACKAGES.find(p => p.id === packageId) || FALLBACK_COIN_PACKAGES[0];
    return {
      transaction: {
        id: `trx-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        coinPackageId: packageId,
        amount: selectedPackage.price,
        coinAmount: selectedPackage.coinAmount,
        status: 'pending',
      },
      paymentUrl: `/dashboard/topup/checkout?trx=trx-${Math.random().toString(36).substr(2, 9)}`
    };
  }
};

export const simulatePaymentWebhook = async (externalId: string, status: 'success' | 'failed') => {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: status === 'success' ? 'success' : 'failed' })
      .eq('external_id', externalId);

    if (error) throw error;
    return { success: true, message: 'Payment status updated' };
  } catch (error: any) {
    console.warn('Supabase Error (simulatePaymentWebhook), simulating success:', error.message);
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
  // Since we don't have a real payment gateway backend, we simulate the response
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
      redirectUrl: undefined,
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString()
    }
  };
  
  return mockResponses[method];
};
