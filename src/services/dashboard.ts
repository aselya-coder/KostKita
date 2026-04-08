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
      { count: newUsersToday },
      transactionsRes,
      coinLogsRes,
      coinPackagesRes
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('kos_listings').select('id', { count: 'exact', head: true }),
      supabase.from('marketplace_items').select('id', { count: 'exact', head: true }),
      supabase.from('kos_listings').select('id', { count: 'exact', head: true }).eq('is_premium', true).eq('status', 'approved').gt('expires_at', new Date().toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      supabase.from('transactions').select('*'), // Filter success in JS to avoid 400
      supabase.from('coin_logs').select('*'),
      supabase.from('coin_packages').select('id, price, coin_amount') // Remove admin_fee if missing
    ]);

    // Filter success in JS
    const txList = (transactionsRes.data || []).filter((tx: any) => 
      ['success', 'paid', 'completed'].includes(String(tx.status || '').toLowerCase())
    );
    const logsList = coinLogsRes.data || [];
    const pkgsList = coinPackagesRes.data || [];

    // --- REVENUE CALCULATION ---
    const topUpRevenueOfficial = txList.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const adminFeeRevenueOfficial = txList.reduce((sum, tx) => {
      // Use static 2500 fee since admin_fee might not exist in coin_packages table
      return sum + 2500;
    }, 0);

    const creditsFromLogs = logsList.filter(l => ['credit', 'topup'].includes(String(l.type).toLowerCase()));
    const totalCoinsFromLogs = creditsFromLogs.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    const totalCoinsFromTx = txList.reduce((sum, tx) => {
      const pkgId = tx.pricing_plan_id || tx.coin_package_id;
      const pkg = pkgsList.find(p => p.id === pkgId);
      return sum + Number(tx.coin_amount || tx.coins || tx.coin_qty || pkg?.coin_amount || 0);
    }, 0);

    const missingCoins = Math.max(0, totalCoinsFromLogs - totalCoinsFromTx);
    const estimatedMissingTopupRevenue = missingCoins * 10000;
    const estimatedMissingAdminFeeRevenue = Math.max(0, creditsFromLogs.length - txList.length) * 2500;

    const topUpRevenue = topUpRevenueOfficial + estimatedMissingTopupRevenue;
    const adminFeeRevenue = adminFeeRevenueOfficial + estimatedMissingAdminFeeRevenue;
    const totalRevenue = topUpRevenue + adminFeeRevenue;
    
    const coinsSold = totalCoinsFromLogs;
    const coinsUsed = logsList.filter(l => ['debit', 'ad_payment'].includes(String(l.type).toLowerCase())).reduce((sum, l) => sum + Number(l.amount || 0), 0);

    // Revenue per day (last 7 days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const revenueData = last7Days.map(date => {
      const dailyTx = txList.filter(tx => (tx.created_at || '').startsWith(date)) || [];
      const dailyLogs = creditsFromLogs.filter(log => (log.created_at || '').startsWith(date)) || [];
      
      const topupTx = dailyTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const coinsInLogs = dailyLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
      const coinsInTx = dailyTx.reduce((sum, tx) => {
        const pkgId = tx.pricing_plan_id || tx.coin_package_id;
        const pkg = pkgsList.find(p => p.id === pkgId);
        return sum + Number(tx.coin_amount || tx.coins || tx.coin_qty || pkg?.coin_amount || 0);
      }, 0);
      
      const missingCoinsDaily = Math.max(0, coinsInLogs - coinsInTx);
      const topupTotal = topupTx + (missingCoinsDaily * 10000);
      
      const feeTx = dailyTx.reduce((sum, tx) => {
        // Use static 2500 fee since admin_fee might not exist in coin_packages table
        return sum + 2500;
      }, 0);
      const feeEstimated = Math.max(0, dailyLogs.length - dailyTx.length) * 2500;
      const feeTotal = feeTx + feeEstimated;

      return {
        name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
        total: topupTotal + feeTotal,
        topup: topupTotal,
        fee: feeTotal
      };
    });

    const usageData = last7Days.map(date => {
      const dailyLogs = logsList.filter(l => ['debit', 'ad_payment'].includes(String(l.type).toLowerCase()) && (l.created_at || '').startsWith(date)) || [];
      const coins = dailyLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
      return {
        name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
        coins
      };
    });

    return {
      totalUsers: totalUsers || 0,
      newUsersToday: newUsersToday || 0,
      totalKos: totalKos || 0,
      totalItems: totalItems || 0,
      totalActiveAds: activeAds || 0,
      totalRevenue,
      topUpRevenue,
      adminFeeRevenue,
      coinsSold,
      coinsUsed,
      revenueData,
      usageData
    };
  } catch (error) {
    console.error('DEBUG: Critical Error in getAdminDashboardStats:', error);
    return {
      totalUsers: 0,
      newUsersToday: 0,
      totalKos: 0,
      totalItems: 0,
      totalActiveAds: 0,
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
    // 1. Fetch ALL transactions
    const { data: allTx, error: txError } = await supabase
      .from('transactions')
      .select('*');

    if (txError) {
      console.error('Transactions Fetch Error:', txError);
    }

    // Filter successful ones in JS
    const successfulTx = (allTx || []).filter(t => 
      ['success', 'paid', 'completed'].includes(String(t.status || '').toLowerCase())
    );

    // 2. Fetch ALL coin logs
    const { data: allLogs, error: logError } = await supabase
      .from('coin_logs')
      .select('*');

    if (logError) {
      console.error('Coin Logs Fetch Error:', logError);
    }

    const creditLogs = (allLogs || []).filter(l => 
      ['credit', 'topup', 'top up'].includes(String(l.type || '').toLowerCase())
    );

    // 3. Fetch coin packages
    const { data: coinPackages } = await supabase
      .from('coin_packages')
      .select('*');

    // 4. Get unique user IDs
    const userIds = [...new Set([
      ...successfulTx.map(t => t.user_id),
      ...creditLogs.map(l => l.user_id)
    ])];

    if (userIds.length === 0) {
      return [];
    }

    // 5. Fetch ALL profiles (more robust, fetch only existing columns)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url');

    if (profileError) {
      console.error('Profiles Fetch Error:', profileError);
    }

    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => { 
      profileMap[p.id] = p; 
    });

    const map: Record<string, { userId: string; name: string; avatar: string; totalAmount: number; totalCoins: number; count: number; lastAt: string }> = {};
    
    const initUser = (uid: string) => {
      if (!map[uid]) {
        const profile = profileMap[uid];
        
        map[uid] = {
          userId: uid, 
          name: profile?.name || `User-${uid.slice(0, 4)}`,
          avatar: profile?.avatar_url || '',
          totalAmount: 0, 
          totalCoins: 0, 
          count: 0, 
          lastAt: new Date(0).toISOString()
        };
      }
    };

    // 6. Process official transactions
    successfulTx.forEach(t => {
      initUser(t.user_id);
      
      const pkgId = t.pricing_plan_id || t.coin_package_id;
      const pkg = coinPackages?.find(p => p.id === pkgId);
      const fee = Number(pkg?.admin_fee || 2500); // Fallback to 2500 if unknown
      const baseAmount = Number(t.amount || 0);
      
      map[t.user_id].totalAmount += (baseAmount + fee);
      const coinQty = Number(t.coin_amount || t.coins || t.coin_qty || pkg?.coin_amount || 0);
      map[t.user_id].totalCoins += coinQty;
      map[t.user_id].count += 1;
      
      if (new Date(t.created_at) > new Date(map[t.user_id].lastAt)) {
        map[t.user_id].lastAt = t.created_at;
      }
    });

    // 7. Process logs as backup
    const transactionCounts: Record<string, number> = {};
    successfulTx.forEach(t => { 
      transactionCounts[t.user_id] = (transactionCounts[t.user_id] || 0) + 1; 
    });

    const userLogGroups: Record<string, any[]> = {};
    creditLogs.forEach(l => {
      if (!userLogGroups[l.user_id]) userLogGroups[l.user_id] = [];
      userLogGroups[l.user_id].push(l);
    });

    Object.keys(userLogGroups).forEach(uid => {
      initUser(uid);
      const logs = userLogGroups[uid];
      const txCount = transactionCounts[uid] || 0;
      
      if (logs.length > txCount) {
        const extraLogs = logs
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, logs.length - txCount);
        
        extraLogs.forEach(l => {
          const coinQty = Number(l.amount || 0);
          const estimatedAmount = (coinQty * 10000) + 2500;
          
          map[uid].totalAmount += estimatedAmount;
          map[uid].totalCoins += coinQty;
          map[uid].count += 1;
          
          if (new Date(l.created_at) > new Date(map[uid].lastAt)) {
            map[uid].lastAt = l.created_at;
          }
        });
      }
    });

    const result = Object.values(map)
      .filter(u => u.totalCoins > 0)
      .sort((a, b) => b.totalCoins - a.totalCoins);
    
    return result;
  } catch (error) {
    console.error('Critical Error in getTopupUsersReport:', error);
    return [];
  }
};
