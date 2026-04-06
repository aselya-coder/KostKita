import { supabase } from '@/lib/supabase';
import { type KosListing, type MarketplaceItem } from '@/data/mockData';
import { logUserActivity } from './activity';

const BACKEND_URL = 'http://localhost:3000/api'; // Adjust if your backend runs on a different port or domain

// KOS LISTINGS
export const createKosListing = async (listing: any, durationDays: number = 30) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { data, error } = await supabase
      .from('kos_listings')
      .insert([{
        ...listing,
        status: 'approved',
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (data) {
      await logUserActivity(
        data.owner_id,
        'Memasang kos baru',
        data.title,
        `/kos/${data.id}`
      );
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Supabase Error (Kos):', error);
    return { success: false, error: error.message };
  }
};

// MARKETPLACE ITEMS
export const createMarketplaceItem = async (item: any, durationDays: number = 30) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([{
        ...item,
        status: 'active',
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (data) {
      await logUserActivity(
        data.seller_id,
        'Menjual barang baru',
        data.title,
        `/item/${data.id}`
      );
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Supabase Error (Item):', error);
    return { success: false, error: error.message };
  }
};


