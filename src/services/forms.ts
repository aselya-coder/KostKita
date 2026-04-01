import { supabase } from '@/lib/supabase';
import { type KosListing, type MarketplaceItem } from '@/data/mockData';
import { logUserActivity } from './marketplace';

// KOS LISTINGS
export const createKosListing = async (listing: any) => {
  console.log('Sending kos listing to Supabase:', listing);
  const { data, error } = await supabase
    .from('kos_listings')
    .insert([listing])
    .select();

  if (error) {
    console.error('Supabase Error (Kos):', error);
    return { success: false, error: error.message };
  }

  // Log activity
  if (data?.[0]) {
    await logUserActivity(
      data[0].owner_id,
      'Memasang kos baru',
      data[0].title,
      `/kos/${data[0].id}`
    );
  }

  return { success: true, data: data[0] };
};

// MARKETPLACE ITEMS
export const createMarketplaceItem = async (item: any) => {
  console.log('Sending item to Supabase:', item);
  const { data, error } = await supabase
    .from('marketplace_items')
    .insert([item])
    .select();

  if (error) {
    console.error('Supabase Error (Item):', error);
    return { success: false, error: error.message };
  }

  // Log activity
  if (data?.[0]) {
    await logUserActivity(
      data[0].seller_id,
      'Menjual barang baru',
      data[0].title,
      `/item/${data[0].id}`
    );
  }

  return { success: true, data: data[0] };
};
