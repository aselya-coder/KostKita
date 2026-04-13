import { supabase } from '@/lib/supabase';

export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export const getSystemConfigs = async (bypassCache: boolean = false): Promise<Record<string, string>> => {
  try {
    let query = supabase.from('system_configs').select('*');
    
    // Simple way to avoid potential Supabase client-side caching
    if (bypassCache) {
      query = query.neq('key', 'non_existent_key_to_force_fetch');
    }

    const { data, error } = await query;

    if (error) throw error;

    const configs: Record<string, string> = {};
    data?.forEach(item => {
      configs[item.key] = item.value;
    });

    return configs;
  } catch (error) {
    console.error('Error fetching system configs:', error);
    // Return defaults if fetch fails
    return {
      'coin_price': '10000',
      'ad_cost_per_day': '1',
      'free_ad_duration': '30',
      'admin_fee_type': 'Flat',
      'admin_fee_value': '2500',
      'min_topup': '5',
      'max_topup': '100',
      'auto_approve_ads': 'true',
      'user_reports_enabled': 'true',
      'ad_active_duration': '30',
      'qris_payload': '00020101021226660014ID.CO.QRIS.WWW01189360050300000768120215ID10202214433220303UMI51440014ID.CO.QRIS.WWW0215ID10202214433220303UMI5204599953033605802ID5911MAJU JAYA6005DEPOK61051642462070703A016304D9C2',
      'qris_image_url': ''
    };
  }
};

export const updateSystemConfig = async (key: string, value: string) => {
  try {
    const { error } = await supabase
      .from('system_configs')
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Error updating config ${key}:`, error);
    return { success: false, error };
  }
};

export const updateMultipleConfigs = async (configs: Record<string, string>) => {
  try {
    const updates = Object.entries(configs).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('system_configs')
      .upsert(updates);

    if (error) throw error;

    // If ad_active_duration is changed, update ALL active listings
    if (configs['ad_active_duration']) {
      const newDuration = parseInt(configs['ad_active_duration']);
      if (!isNaN(newDuration)) {
        // We use an RPC to safely update all active listings expiration dates
        // This calculates the new expires_at based on their created_at date
        await supabase.rpc('update_all_active_listings_duration', {
          p_new_duration_days: newDuration
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating multiple configs:', error);
    return { success: false, error };
  }
};
