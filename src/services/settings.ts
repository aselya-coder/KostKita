import { supabase } from '@/lib/supabase';

export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export const getSystemConfigs = async (): Promise<Record<string, string>> => {
  try {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*');

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
      'user_reports_enabled': 'true'
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
    return { success: true };
  } catch (error) {
    console.error('Error updating multiple configs:', error);
    return { success: false, error };
  }
};
