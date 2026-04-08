import { supabase } from "@/lib/supabase";

export type AdminCoinPackage = {
  id: string;
  name: string;
  coin_amount: number;
  coinAmount: number; // Added for camelCase compatibility
  price: number;
  is_active: boolean;
  isActive: boolean; // Added for camelCase compatibility
  created_at: string;
};

export type AdminTransaction = {
  id: string;
  user_id: string;
  userId: string;
  coin_package_id: string;
  pricing_plan_id?: string; // Added for compatibility
  amount: number;
  adminFee: number; // Added
  totalAmount: number; // Added
  coin_amount: number;
  coinAmount: number; // Added for camelCase compatibility
  status: 'pending' | 'success' | 'failed';
  external_id?: string;
  externalId?: string; // Added for camelCase compatibility
  created_at: string;
  createdAt: string; // Added for camelCase compatibility
  coinPackage: {
    name: string;
  };
};

export type AdminCoinLog = {
  id: string;
  user_id: string;
  userId: string; // Added for camelCase compatibility
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  created_at: string;
  createdAt: string; // Added for camelCase compatibility
};

// Coin Packages
export const getAllAdminCoinPackages = async (userId: string, userRole: 'ADMIN'): Promise<AdminCoinPackage[]> => {
  const { data, error } = await supabase
    .from('coin_packages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map((pkg: any) => ({
    ...pkg,
    coinAmount: pkg.coin_amount,
    isActive: pkg.is_active
  }));
};

export const createAdminCoinPackage = async (userId: string, userRole: 'ADMIN', data: { name: string; coinAmount: number; price: number; isActive?: boolean }) => {
  const { data: newPackage, error } = await supabase
    .from('coin_packages')
    .insert({
      name: data.name,
      coin_amount: data.coinAmount,
      price: data.price,
      is_active: data.isActive ?? true
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...newPackage,
    coinAmount: newPackage.coin_amount,
    isActive: newPackage.is_active
  };
};

export const updateAdminCoinPackage = async (userId: string, userRole: 'ADMIN', id: string, data: { name?: string; coinAmount?: number; price?: number; isActive?: boolean }) => {
  const { data: updatedPackage, error } = await supabase
    .from('coin_packages')
    .update({
      name: data.name,
      coin_amount: data.coinAmount,
      price: data.price,
      is_active: data.isActive
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...updatedPackage,
    coinAmount: updatedPackage.coin_amount,
    isActive: updatedPackage.is_active
  };
};

export const deleteAdminCoinPackage = async (userId: string, userRole: 'ADMIN', id: string) => {
  const { error } = await supabase
    .from('coin_packages')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

// Transactions
export const getAllAdminTransactions = async (userId: string, userRole: 'ADMIN'): Promise<AdminTransaction[]> => {
  try {
    // 1. Fetch official transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    // 2. Fetch coin logs (credits) to catch simulated/fallback topups
    const { data: coinLogs, error: logError } = await supabase
      .from('coin_logs')
      .select('*')
      .or('type.eq.credit,type.eq.topup')
      .order('created_at', { ascending: false });

    if (logError) throw logError;

    // 3. Get unique package IDs from transactions
    const packageIds = [...new Set((transactions || []).map(t => t.coin_package_id || t.pricing_plan_id).filter(Boolean))];

    // 4. Fetch packages
    const { data: packages, error: pkgError } = await supabase
      .from('coin_packages')
      .select('id, name') // Remove admin_fee if missing in DB
      .in('id', packageIds);

    const packageMap: Record<string, any> = {};
    packages?.forEach(p => { packageMap[p.id] = p; });

    // 5. Map Supabase response to AdminTransaction type
    const mappedTransactions: AdminTransaction[] = (transactions || []).map((tx: any) => {
      const pkgId = tx.coin_package_id || tx.pricing_plan_id;
      const pkg = packageMap[pkgId];
      const adminFee = 2500; // Use static fee if missing in DB
      return {
        ...tx,
        userId: tx.user_id,
        coinAmount: tx.coin_amount || 0,
        externalId: tx.external_id,
        createdAt: tx.created_at,
        adminFee: Number(adminFee),
        totalAmount: Number(tx.amount || 0) + Number(adminFee),
        coinPackage: {
          name: pkg?.name || 'Unknown Package'
        }
      };
    });

    // 6. Map coin logs to AdminTransaction type (only those that aren't already represented in transactions)
    // We'll use a simple heuristic: if there's no transaction for that user at that exact time, we add it.
    const transactionTimes = new Set(mappedTransactions.map(t => `${t.user_id}-${t.created_at}`));
    
    const mappedLogs: AdminTransaction[] = (coinLogs || [])
      .filter(l => !transactionTimes.has(`${l.user_id}-${l.created_at}`))
      .map(l => ({
        id: l.id,
        user_id: l.user_id,
        userId: l.user_id,
        coin_package_id: '',
        amount: 0, // Unknown from log
        adminFee: 0,
        totalAmount: 0,
        coin_amount: l.amount,
        coinAmount: l.amount,
        status: 'success',
        created_at: l.created_at,
        createdAt: l.created_at,
        coinPackage: {
          name: l.description || 'Top Up (Audit Log)'
        }
      }));

    return [...mappedTransactions, ...mappedLogs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching admin transactions:', error);
    throw error;
  }
};

// Coin Logs
export const getAllAdminCoinLogs = async (userId: string, userRole: 'ADMIN'): Promise<AdminCoinLog[]> => {
  try {
    const { data: logs, error: logError } = await supabase
      .from('coin_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (logError) throw logError;
    if (!logs || logs.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(logs.map(l => l.user_id))];

    // Fetch profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => { 
      profileMap[p.id] = {
        ...p,
        avatar: p.avatar_url // Map avatar_url to avatar for consistency
      }; 
    });

    return logs.map((log: any) => ({
      ...log,
      userId: log.user_id,
      createdAt: log.created_at,
      profiles: profileMap[log.user_id] || { name: 'Unknown' }
    }));
  } catch (error) {
    console.error('Error fetching admin coin logs:', error);
    throw error;
  }
};

