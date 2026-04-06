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
  try {
    let query = supabase
      .from('user_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: activities, error } = await query;

    if (error) throw error;
    if (!activities || activities.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(activities.map(a => a.user_id))];

    // Fetch profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', userIds);

    if (profileError) {
      console.warn('Could not fetch profiles for activities:', profileError);
    }

    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => {
      profileMap[p.id] = p;
    });

    // Merge data
    return activities.map(a => ({
      ...a,
      profiles: profileMap[a.user_id] || null
    }));
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
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
