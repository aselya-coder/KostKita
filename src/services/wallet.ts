import { supabase } from '@/lib/supabase';
import { type Wallet, type Transaction } from "@/data/mockData";

export const getWalletData = async (userId: string): Promise<Wallet | null> => {
  const balance = await getWalletBalance(userId);
  return { userId, balance, totalEarnings: 0 };
};

export const getWalletBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Wallet doesn't exist, create it (fallback if trigger failed)
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: 0 })
          .select('balance')
          .single();
        
        if (createError) throw createError;
        return newWallet.balance;
      }
      throw error;
    }
    return data.balance;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return 0;
  }
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('coin_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped: Transaction[] = (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      type: log.type === 'credit' ? 'topup' : 'ad_payment',
      amount: 0, // In coins
      coins: log.amount,
      status: 'paid',
      description: log.description,
      createdAt: log.created_at,
    }));
    return mapped;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const addWalletBalance = async (userId: string, amount: number): Promise<boolean> => {
  try {
    const currentBalance = await getWalletBalance(userId);
    const newBalance = currentBalance + amount;

    const { error } = await supabase
      .from('wallets')
      .upsert({ 
        user_id: userId, 
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    // Log the transaction
    await supabase.from('coin_logs').insert({
      user_id: userId,
      type: 'credit',
      amount: amount,
      description: 'Top up koin (Simulasi)'
    });

    return true;
  } catch (error) {
    console.error('Error adding wallet balance:', error);
    return false;
  }
};
