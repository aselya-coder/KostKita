import { supabase } from "@/lib/supabase";

export type CoinPackage = {
  id: string;
  name: string;
  coin_amount: number;
  price: number;
  is_active: boolean;
};

export type Wallet = {
  user_id: string;
  balance: number;
  updated_at: string;
};

export type CoinLog = {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
};

// ==========================================
// 1. WALLET & COIN LOGIC
// ==========================================

/**
 * Get user wallet balance.
 * Automatically creates wallet if doesn't exist.
 */
export const getWalletBalance = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Wallet not found, create one
    const { data: newWallet } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: 0 })
      .select('balance')
      .single();
    return newWallet?.balance || 0;
  }

  if (error) throw error;
  return data?.balance || 0;
};

/**
 * Get coin usage history for a user.
 */
export const getCoinLogs = async (userId: string): Promise<CoinLog[]> => {
  const { data, error } = await supabase
    .from('coin_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ==========================================
// 2. LISTING & UPLOAD LOGIC
// ==========================================

/**
 * Process coin logic for a new listing.
 * Returns success, message, and whether it was a free upload.
 */
export const processListingPayment = async (userId: string, durationDays: number = 30) => {
  const { data, error } = await supabase.rpc('process_listing_upload', {
    p_user_id: userId,
    p_duration_days: durationDays
  });

  if (error) {
    console.error('Error processing coin payment:', error);
    throw new Error('Gagal memproses pembayaran koin.');
  }

  return data as { 
    success: boolean; 
    message: string; 
    is_free: boolean; 
    cost: number; 
    duration: number;
  };
};

/**
 * Helper to calculate expiration date based on duration.
 */
export const getListingExpiration = (durationDays: number = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + durationDays);
  return date.toISOString();
};


/**
 * Webhook handler for payment gateway success.
 */
export const handlePaymentWebhook = async (userId: string, planId: string, transactionId: string) => {
  // 1. Update Transaction to success
  const { error: txError } = await supabase
    .from('transactions')
    .update({ status: 'success' })
    .eq('id', transactionId);

  if (txError) throw txError;

  // 2. Call RPC to update wallet and log
  const { error: rpcError } = await supabase.rpc('update_wallet_on_success', {
    p_user_id: userId,
    p_plan_id: planId
  });

  if (rpcError) throw rpcError;

  return { success: true };
};


// ==========================================
// 3. TOP UP & PACKAGES
// ==========================================

export const getCoinPackages = async (): Promise<CoinPackage[]> => {
  const { data, error } = await supabase
    .from('coin_packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create top-up transaction.
 */
export const createTopUpRequest = async (userId: string, packageId: string) => {
  const pkg = (await supabase.from('coin_packages').select('*').eq('id', packageId).single()).data;
  
  if (!pkg) throw new Error('Paket koin tidak ditemukan.');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      coin_package_id: packageId,
      amount: pkg.price,
      coin_amount: pkg.coin_amount,
      payment_provider: 'midtrans', // default provider
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ==========================================
// 4. ADMIN & SCHEDULER
// ==========================================

/**
 * Run this to trigger auto-expiration manually or via cron.
 */
export const triggerListingExpirations = async () => {
  const { error } = await supabase.rpc('handle_expired_listings');
  if (error) console.error('Error running expiration task:', error);
};
