import { supabase } from '@/lib/supabase';
import { type KosListing, mockKosListings } from '@/data/mockData';
import { logUserActivity } from '@/services/activity';

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

  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  } else {
    const now = new Date().toISOString();
    query = query.eq('status', 'approved').gt('expires_at', now);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching kos listings:', error);
    return [];
  }

  // FALLBACK: If database is empty and it's a public search, show mock data
  if (!ownerId && (!data || data.length === 0)) {
    return mockKosListings.filter(k => k.status !== 'pending');
  }

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

  const k: any = data;
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
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

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
    status: 'approved',
    expires_at: expiresAt.toISOString(),
  };

  const { data, error } = await supabase
    .from('kos_listings')
    .insert([dbData])
    .select()
    .single();

  if (error) {
    console.error('Error adding kos listing:', error);
    return { success: false, error };
  }

  await logUserActivity(
    userId,
    'Memasang kos baru',
    kosData.title,
    `/kos/${data.id}`
  );

  return { success: true, data };
};

export const updateKosListing = async (id: string, userId: string, kosData: Partial<KosListing>) => {
  const dbData: any = {};
  if (kosData.title !== undefined) dbData.title = kosData.title;
  if (kosData.location !== undefined) dbData.location = kosData.location;
  if (kosData.price !== undefined) dbData.price = kosData.price;
  if (kosData.images !== undefined) dbData.images = kosData.images;
  if (kosData.amenities !== undefined) dbData.amenities = kosData.amenities;
  if (kosData.description !== undefined) dbData.description = kosData.description;
  if (kosData.rules !== undefined) dbData.rules = kosData.rules;
  if (kosData.type !== undefined) dbData.type = kosData.type;
  if (kosData.availableRooms !== undefined) dbData.available_rooms = kosData.availableRooms;
  if (kosData.rating !== undefined) dbData.rating = kosData.rating;

  const { data, error } = await supabase
    .from('kos_listings')
    .update(dbData)
    .eq('id', id)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating kos listing:', error);
    return { success: false, error };
  }

  await logUserActivity(
    userId,
    'Memperbarui informasi kos',
    kosData.title || 'Kos',
    `/kos/${id}`
  );

  return { success: true, data };
};

export const deleteKosListing = async (id: string, userId: string) => {
  const { error } = await supabase
    .from('kos_listings')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) {
    console.error('Error deleting kos listing:', error);
    return { success: false, error };
  }

  await logUserActivity(
    userId,
    'Menghapus kos'
  );

  return { success: true };
};
