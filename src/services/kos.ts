import { supabase } from '@/lib/supabase';
import { type KosListing } from '@/data/mockData'; // We'll reuse the type for now

// Type for database records
type KosDbRecord = {
  id: string;
  owner_id: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  amenities: string[];
  rating: number;
  is_premium: boolean;
  description: string;
  rules: string[];
  type: string;
  available_rooms: number;
  status: string;
  profiles?: {
    name: string;
    phone: string;
  };
};
import { logUserActivity } from '@/services/marketplace';
import { notifyAdmins } from './notifications';

export const getKosListings = async (ownerId?: string): Promise<KosListing[]> => {
  let query = supabase
    .from('kos_listings')
    .select(`
      *,
      profiles (
        name,
        phone
      )
    `);

  // If no ownerId provided, only show approved listings (public view)
  // If ownerId provided, show all listings for that owner (including pending)
  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  } else {
    query = query.eq('status', 'approved');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching kos listings:', error);
    return [];
  }

  // Map database fields to interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((k: any) => ({
    id: k.id,
    ownerId: k.owner_id,
    title: k.title,
    location: k.location,
    price: k.price,
    images: k.images || [],
    amenities: k.amenities || [],
    rating: k.rating || 0,
    isPremium: k.is_premium || false,
    ownerName: k.profiles?.name || 'Pemilik Kos',
    ownerPhone: k.profiles?.phone || '',
    description: k.description || '',
    rules: k.rules || [],
    type: k.type,
    availableRooms: k.available_rooms || 0,
    status: k.status
  })) as KosListing[];
};

export const getKosById = async (id: string): Promise<KosListing | null> => {
  const { data, error } = await supabase
    .from('kos_listings')
    .select(`
      *,
      profiles (
        name,
        phone
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching kos with id ${id}:`, error);
    return null;
  }

  const k: KosDbRecord = data as KosDbRecord;
  return {
    id: k.id,
    ownerId: k.owner_id,
    title: k.title,
    location: k.location,
    price: k.price,
    images: k.images || [],
    amenities: k.amenities || [],
    rating: k.rating || 0,
    isPremium: k.is_premium || false,
    ownerName: k.profiles?.name || 'Pemilik Kos',
    ownerPhone: k.profiles?.phone || '', 
    description: k.description || '',
    rules: k.rules || [],
    type: k.type,
    availableRooms: k.available_rooms || 0,
    status: k.status
  } as KosListing;
};

export const addKosListing = async (userId: string, kosData: Partial<KosListing>) => {
  const dbData = {
    owner_id: userId,
    title: kosData.title,
    location: kosData.location,
    price: kosData.price,
    images: kosData.images,
    amenities: kosData.amenities,
    description: kosData.description,
    rules: kosData.rules,
    type: kosData.type,
    available_rooms: kosData.availableRooms,
    rating: kosData.rating,
    status: 'approved', // Listings from the form are now approved by default
  };

  const { data, error } = await supabase
    .from('kos_listings')
    .insert([dbData]) // Wrap in array for insert
    .select()
    .single();

  if (error) {
    console.error('Error adding kos listing:', error);
    throw new Error(error.message);
  }

  // Log activity
  if (data) {
    await logUserActivity(
      userId,
      'Memasang kos baru',
      data.title,
      `/kos/${data.id}`
    );

    // Notify admins
    await notifyAdmins(
      'Listing Kos Baru',
      `Kos baru '${data.title}' telah ditambahkan dan menunggu verifikasi.`,
      `/admin/kos`
    );
  }

  return data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateKosListing = async (id: string, userId: string, updates: Partial<any>) => {
  // Map to snake_case for Supabase
  const dbUpdates = {
    title: updates.title,
    location: updates.location,
    price: updates.price,
    type: updates.type,
    description: updates.description,
    available_rooms: updates.availableRooms,
    images: updates.images,
    amenities: updates.amenities,
    rules: updates.rules,
    rating: updates.rating,
  };

  const { data, error } = await supabase
    .from('kos_listings')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating kos listing:', error);
    throw new Error(error.message);
  }

  // Log activity
  if (data) {
    await logUserActivity(
      userId,
      'Memperbarui data kos',
      data.title,
      `/kos/${data.id}`
    );
  }

  return data;
};

export const deleteKosListing = async (id: string, userId: string) => {
  // First, get the kos title for the log
  const kosToDelete = await getKosById(id);
  if (!kosToDelete) {
    // Or handle this case gracefully
    throw new Error("Kos not found, cannot delete.");
  }
  const kosTitle = kosToDelete.title;

  const { error } = await supabase
    .from('kos_listings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting kos listing:', error);
    return { success: false, error };
  }

  // Log activity
  await logUserActivity(
    userId,
    'Menghapus kos',
    kosTitle
    // No target_url as it's deleted
  );

  return { success: true };
};