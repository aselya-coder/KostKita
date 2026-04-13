import { supabase } from '@/lib/supabase';
import { type KosListing, type MarketplaceItem } from '@/data/mockData';
import { logUserActivity } from './activity';
import { getSystemConfigs } from './settings';

// KOS LISTINGS
export const createKosListing = async (listing: any) => {
  try {
    const configs = await getSystemConfigs();
    // Use dynamic duration from configs (fallback to 30)
    const durationDays = parseInt(configs['ad_active_duration'] || '30');
    const autoApprove = configs['auto_approve_ads'] === 'true';
    
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { data, error } = await supabase
      .from('kos_listings')
      .insert([{
        ...listing,
        status: autoApprove ? 'approved' : 'pending',
        created_at: now.toISOString(),
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
export const createMarketplaceItem = async (item: any) => {
  try {
    const configs = await getSystemConfigs();
    // Use dynamic duration from configs (fallback to 30)
    const durationDays = parseInt(configs['ad_active_duration'] || '30');
    const autoApprove = configs['auto_approve_ads'] === 'true';

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([{
        ...item,
        status: autoApprove ? 'active' : 'pending',
        created_at: now.toISOString(),
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


