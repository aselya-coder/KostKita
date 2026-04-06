import { supabase } from '@/lib/supabase';

export const updateUserProfile = async (userId: string, data: {
  name?: string;
  phone?: string;
  location?: string;
  about?: string;
  avatar?: string;
}) => {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return { success: true };
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};
