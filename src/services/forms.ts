import { supabase } from '@/lib/supabase';
import { type KosListing, type MarketplaceItem } from '@/data/mockData';

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
  return { success: true, data: data[0] };
};
