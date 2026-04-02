import { supabase } from '@/lib/supabase';
import { type KosListing, type MarketplaceItem } from '@/data/mockData';
import { logUserActivity } from './marketplace';
import { processListingPayment, getListingExpiration } from './coin';

// KOS LISTINGS
export const createKosListing = async (listing: any, durationDays: number = 30) => {
  // 0. Check Coin/Free Upload Eligibility
  const result = await processListingPayment(listing.owner_id, durationDays);
  if (!result.success) {
    return { success: false, error: result.message };
  }

  // 1. Set Expiration based on duration
  listing.expires_at = getListingExpiration(result.duration);
  listing.coin_used = result.cost;
  listing.is_free = result.is_free;
  listing.listing_status = 'active';

  console.log('Sending kos listing to Supabase with Daily Coin logic:', listing);

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
      'Memasang kos baru (Real-time)',
      data[0].title,
      `/kos/${data[0].id}`
    );
  }

  return { success: true, data: data[0] };
};

// MARKETPLACE ITEMS
export const createMarketplaceItem = async (item: any, durationDays: number = 30) => {
  // 0. Check Coin/Free Upload Eligibility
  const result = await processListingPayment(item.seller_id, durationDays);
  if (!result.success) {
    return { success: false, error: result.message };
  }

  // 1. Set Expiration based on duration
  item.expires_at = getListingExpiration(result.duration);
  item.coin_used = result.cost;
  item.is_free = result.is_free;
  item.listing_status = 'active';

  console.log('Sending item to Supabase with Daily Coin logic:', item);

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
      'Menjual barang baru (Real-time)',
      data[0].title,
      `/item/${data[0].id}`
    );
  }

  return { success: true, data: data[0] };
};


