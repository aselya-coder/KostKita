import { supabase } from '@/lib/supabase';
import { type User, type MarketplaceItem } from '@/data/mockData';

// Raw database record types
type MarketplaceDbRecord = {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  condition: string;
  location: string;
  description: string;
  created_at: string;
  status: string;
};

type ProfileRecord = {
  name: string;
  phone: string;
};

type ItemWithSellerRecord = MarketplaceDbRecord & {
  profiles: ProfileRecord | null;
};

export const getMarketplaceItems = async (category?: string): Promise<MarketplaceItem[]> => {
  let query = supabase
    .from('marketplace_items')
    .select(`
      *,
      profiles (
        name,
        phone
      )
    `)
    .eq('status', 'active');

  if (category && category !== 'Semua') {
    query = query.ilike('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching marketplace items:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    sellerId: item.seller_id,
    title: item.title,
    price: item.price,
    image: item.image,
    category: item.category,
    condition: item.condition,
    sellerPhone: item.profiles?.phone || '',
    sellerName: item.profiles?.name || 'Penjual',
    location: item.location,
    description: item.description,
    createdAt: item.created_at,
    status: item.status
  })) as MarketplaceItem[];
};

export const getItemById = async (id: string): Promise<MarketplaceItem | null> => {
  console.log(`Fetching item with ID: ${id}`);
  const { data, error } = await supabase
    .from('marketplace_items')
    .select(
      `
      *,
      profiles ( name, phone )
    `
    )
    .eq('id', id)
    .single<ItemWithSellerRecord>();

  if (error) {
    console.error(`Supabase error fetching item with id ${id}:`, error);
    return null;
  }

  if (!data) {
    console.warn(`No data found for item with id ${id}`);
    return null;
  }

  const item = data;

  return {
    id: item.id,
    sellerId: item.seller_id,
    title: item.title,
    price: item.price,
    image: item.image,
    category: item.category,
    condition: item.condition,
    sellerPhone: item.profiles?.phone || '', 
    sellerName: item.profiles?.name || 'Penjual',
    location: item.location,
    description: item.description,
    createdAt: item.created_at,
    status: item.status,
  } as MarketplaceItem;
};

export const updateUserProfile = async (userId: string, updates: { name?: string; phone?: string; location?: string; about?: string; }) => {
  // Supabase expects snake_case column names. Map camelCase to snake_case.
  const profileUpdate: { [key: string]: string | undefined } = {
    name: updates.name,
    phone: updates.phone,
    location: updates.location,
    about: updates.about,
  };

  // Remove properties that are undefined, so we only update what's provided.
  Object.keys(profileUpdate).forEach(key => {
    if (profileUpdate[key] === undefined) {
      delete profileUpdate[key];
    }
  });

  const { error } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  // Log the activity after a successful update
  await logUserActivity(userId, 'Memperbarui profil');
};

/**
 * Fetches all user profiles from the database for the admin panel.
 * NOTE: This function retrieves data from the public 'profiles' table.
 * For security reasons, it does not include sensitive data like email, which is stored separately.
 * @returns A promise that resolves to an array of partial User objects.
 */
export const getAllUsers = async (): Promise<Partial<User>[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, avatar, phone, location, about');

  if (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }

  return data || [];
};

/**
 * Deletes a user activity by ID.
 * Only intended for admin use.
 * @param activityId The ID of the activity to delete.
 */
export const deleteActivity = async (activityId: string) => {
  const { error } = await supabase
    .from('user_activities')
    .delete()
    .eq('id', activityId);

  if (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};

/**
 * Logs a user activity to the user_activities table.
 * @param userId The ID of the user performing the action.
 * @param action A short description of the action (e.g., 'Membuat kos baru').
 * @param description Optional details about the item being acted upon (e.g., the name of the kos).
 * @param target_url Optional URL to the item.
 */
export const logUserActivity = async (
  userId: string,
  action: string,
  description?: string,
  target_url?: string
) => {
  const { error } = await supabase.from('user_activities').insert([
    {
      user_id: userId,
      action,
      description,
      target_url,
    },
  ]);

  if (error) {
    console.error('Error logging user activity:', error);
    // We don't throw an error here because logging is a background task
    // and shouldn't block the main user action.
  }
};

// --- ADMIN & LOGGING FUNCTIONS ---

export const getUserActivities = async () => {
  const { data, error } = await supabase
    .from('user_activities')
    .select(`
      *,
      profiles ( name, avatar )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }

  return data || [];
};