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

export const getAdminDashboardStats = async () => {
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' });

  const { data: kos, error: kosError } = await supabase
    .from('kos_listings')
    .select('id', { count: 'exact' });

  const { data: items, error: itemsError } = await supabase
    .from('marketplace_items')
    .select('id', { count: 'exact' });

  if (usersError || kosError || itemsError) {
    console.error('Error fetching admin stats:', usersError || kosError || itemsError);
  }

  return {
    totalUsers: users?.length || 0,
    totalKos: kos?.length || 0,
    totalItems: items?.length || 0,
  };
};
