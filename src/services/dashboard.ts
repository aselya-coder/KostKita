import { supabase } from '@/lib/supabase';

export const getStudentDashboardStats = async (userId: string) => {
  const { data: myListings, error: myListingsError } = await supabase
    .from('marketplace_items')
    .select('id', { count: 'exact' })
    .eq('seller_id', userId);

  const { data: favorites, error: favoritesError } = await supabase
    .from('favorites')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);

  if (myListingsError || favoritesError) {
    console.error('Error fetching student stats:', myListingsError || favoritesError);
  }

  return {
    myListingsCount: myListings?.length || 0,
    favoritesCount: favorites?.length || 0,
  };
};

export const getOwnerDashboardStats = async (userId: string) => {
  const { data: properties, error: propertiesError } = await supabase
    .from('kos_listings')
    .select('id', { count: 'exact' })
    .eq('owner_id', userId);

  const { data: inquiries, error: inquiriesError } = await supabase
    .from('inquiries')
    .select('id', { count: 'exact' })
    .eq('owner_id', userId);

  if (propertiesError || inquiriesError) {
    console.error('Error fetching owner stats:', propertiesError || inquiriesError);
  }

  return {
    propertiesCount: properties?.length || 0,
    inquiriesCount: inquiries?.length || 0,
  };
};

export const getUserDashboardStats = async (userId: string) => {
  const [studentStats, ownerStats] = await Promise.all([
    getStudentDashboardStats(userId),
    getOwnerDashboardStats(userId)
  ]);

  return {
    ...studentStats,
    ...ownerStats
  };
};

export const getAdminDashboardStats = async () => {
  try {
    const [
      { count: totalUsers },
      { count: totalKos },
      { count: totalItems },
      { count: activeAds },
      transactionsRes,
      coinLogsRes
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('kos_listings').select('id', { count: 'exact', head: true }),
      supabase.from('marketplace_items').select('id', { count: 'exact', head: true }),
      supabase.from('kos_advertisements').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('transactions').select('*').eq('status', 'success'),
      supabase.from('coin_logs').select('*')
    ]);

    const transactions = transactionsRes.data || [];
    const coinLogs = coinLogsRes.data || [];

    const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const coinsSold = coinLogs.filter(log => log.type === 'credit').reduce((sum, log) => sum + Number(log.amount || 0), 0);
    const coinsUsed = coinLogs.filter(log => log.type === 'debit').reduce((sum, log) => sum + Number(log.amount || 0), 0);

    // Revenue per day (last 7 days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const revenueData = last7Days.map(date => {
      const dailyTx = transactions.filter(tx => (tx.created_at || '').startsWith(date)) || [];
      const topup = dailyTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const fee = topup * 0.1;
      return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        total: topup + fee,
        topup,
        fee
      };
    });

    const usageData = last7Days.map(date => {
      const dailyLogs = coinLogs.filter(log => log.type === 'debit' && (log.created_at || '').startsWith(date)) || [];
      const coins = dailyLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
      return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        coins
      };
    });

    return {
      totalUsers: totalUsers || 0,
      totalKos: totalKos || 0,
      totalItems: totalItems || 0,
      totalActiveAds: activeAds || 0,
      totalRevenue,
      topUpRevenue: totalRevenue * 0.9,
      adminFeeRevenue: totalRevenue * 0.1,
      coinsSold,
      coinsUsed,
      revenueData,
      usageData
    };
  } catch (error) {
    console.error('Error fetching admin stats from Supabase:', error);
    // Return empty stats instead of crashing
    return {
      totalUsers: 0,
      totalKos: 0,
      totalItems: 0,
      totalRevenue: 0,
      topUpRevenue: 0,
      adminFeeRevenue: 0,
      coinsSold: 0,
      coinsUsed: 0,
      revenueData: [],
      usageData: []
    };
  }
};

export const getTopupUsersReport = async () => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'success');

    if (error) throw error;

    const map: Record<string, { userId: string; totalAmount: number; totalCoins: number; count: number; lastAt: string }> = {};
    
    transactions?.forEach(t => {
      if (!map[t.user_id]) {
        map[t.user_id] = {
          userId: t.user_id, 
          totalAmount: 0, 
          totalCoins: 0, 
          count: 0, 
          lastAt: t.created_at 
        };
      }
      map[t.user_id].totalAmount += Number(t.amount || 0);
      // Try coin_amount, coins, or coin_qty
      const coinQty = t.coin_amount || t.coins || t.coin_qty || 0;
      map[t.user_id].totalCoins += Number(coinQty);
      map[t.user_id].count += 1;
      
      if (new Date(t.created_at) > new Date(map[t.user_id].lastAt)) {
        map[t.user_id].lastAt = t.created_at;
      }
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error) {
    console.error('Error fetching topup report from Supabase:', error);
    return [];
  }
};
