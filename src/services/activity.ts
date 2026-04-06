import { supabase } from '@/lib/supabase';

export const logUserActivity = async (
  userId: string,
  activity: string,
  targetName?: string,
  targetUrl?: string
) => {
  const { error } = await supabase
    .from('user_activities')
    .insert({
      user_id: userId,
      activity,
      target_name: targetName,
      target_url: targetUrl
    });

  // Silent error handling for RLS or other non-critical issues
  if (error) {
    // Only log in development and only if it's not a permission error
    if (error.code !== '42501') {
      console.debug('Activity logging skipped:', error.message);
    }
  }
};

export const getUserActivities = async (userId?: string) => {
  let query = supabase
    .from('user_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }

  return data || [];
};

export const deleteActivity = async (id: string) => {
  const { error } = await supabase
    .from('user_activities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }

  return { success: true };
};
