import { supabase } from "@/lib/supabase";
import { logUserActivity } from './activity';
import { getSystemConfigs } from './settings';

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
  { id: '82c2b3bc-34e9-4b34-87d9-f03d26d3fbd0', name: 'Paket 1 Koin', coinAmount: 1, price: 10000, isActive: true, adminFee: 2500 },
  { id: 'c139f6df-4543-4838-8432-0ecd7e105b18', name: 'Paket 5 Koin', coinAmount: 5, price: 50000, isActive: true, adminFee: 2500 },
  { id: 'da7bab2b-2fcc-4fee-8c4b-03f41c13e964', name: 'Paket 10 Koin', coinAmount: 10, price: 100000, isActive: true, adminFee: 2500 },
  { id: '7cd70982-f012-4737-b3db-39d632cc96b2', name: 'Paket 50 Koin', coinAmount: 50, price: 500000, isActive: true, adminFee: 2500 },
  { id: 'ed7b94f3-a599-4b63-972f-19caaacf1309', name: 'Paket 100 Koin', coinAmount: 100, price: 1000000, isActive: true, adminFee: 2500 },
];

// ==========================================
// 1. COIN PACKAGES
// ==========================================

export const getCoinPackages = async (): Promise<CoinPackage[]> => {
  try {
    const [packagesRes, configs] = await Promise.all([
      supabase.from('coin_packages').select('*').eq('is_active', true).order('price', { ascending: true }),
      getSystemConfigs()
    ]);

    if (packagesRes.error) throw packagesRes.error;
    
    const adminFee = Number(configs['admin_fee_value'] || 2500);
    
    if (!packagesRes.data || packagesRes.data.length === 0) {
      return FALLBACK_COIN_PACKAGES.map(p => ({ ...p, adminFee }));
    }

    return packagesRes.data.map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      coinAmount: pkg.coin_amount,
      price: pkg.price,
      isActive: pkg.is_active,
      adminFee: pkg.admin_fee || adminFee
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
      const [{ data: pkg, error: pkgError }, configs] = await Promise.all([
        supabase.from('coin_packages').select('*').eq('id', packageId).maybeSingle(),
        getSystemConfigs()
      ]);
      
      if (!pkgError && pkg) {
        selectedPackage = {
          id: pkg.id,
          name: pkg.name,
          coinAmount: pkg.coin_amount,
          price: pkg.price,
          isActive: pkg.is_active,
          adminFee: pkg.admin_fee || Number(configs['admin_fee_value'] || 2500)
        };
        foundInDb = true;
      }
    }

    // If package not found in DB, throw an error.
    // Transactions must always reference a real package in the database.
    if (!foundInDb || !selectedPackage) {
        throw new Error("Paket koin tidak ditemukan di database. Pastikan tabel 'coin_packages' sudah terisi dengan ID yang sesuai.");
    }

    if (!isUserUuid) {
      throw new Error("Invalid User ID format (UUID expected)");
    }

    const transaction = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: selectedPackage.price,
        pricing_plan_id: selectedPackage.id, // Always use the ID from the found package
        status: 'pending',
        payment_provider: 'simulated',
      }])
      .select()
      .single();

    if (transaction.error) throw transaction.error;

    // Log activity
    await logUserActivity(
      userId,
      'Membuat permintaan Top Up Koin',
      `${selectedPackage.coinAmount} Koin (Rp ${selectedPackage.price.toLocaleString('id-ID')})`,
      `/dashboard/topup/checkout?trx=${transaction.data.id}`
    );

    // Return app checkout URL for local/dev flow (avoid unreachable mock domain)
    const appBase = process.env.APP_BASE_URL || 'http://localhost:8080';
    const paymentUrl = `${appBase}/dashboard/topup/checkout?trx=${transaction.data.id}`;

    return {
      transaction: transaction.data,
      paymentUrl,
    };
  } catch (error: any) {
    console.error('Supabase Error (createTopupRequest):', error.message);
    throw new Error(error.message || "Gagal membuat transaksi topup.");
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
