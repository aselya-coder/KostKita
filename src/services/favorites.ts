import { supabase } from '@/lib/supabase';

export const getFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('target_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
  return data.map(f => f.target_id);
};

export const addFavorite = async (userId: string, targetId: string, type: 'kos' | 'item') => {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, target_id: targetId, type });

  if (error) {
    console.error('Error adding favorite:', error);
  }
};

export const removeFavorite = async (userId: string, targetId: string) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('target_id', targetId);

  if (error) {
    console.error('Error removing favorite:', error);
  }
};
