import { supabase } from '@/lib/supabase';
import { type KosListing } from '@/data/mockData'; // We'll reuse the type for now

export const getKosListings = async (ownerId?: string): Promise<KosListing[]> => {
  let query = supabase
    .from('kos_listings')
    .select('*');

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
    ownerPhone: '', // Add if needed
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
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching kos with id ${id}:`, error);
    return null;
  }

  const k = data;
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
    ownerPhone: '',
    description: k.description || '',
    rules: k.rules || [],
    type: k.type,
    availableRooms: k.available_rooms || 0,
    status: k.status
  } as KosListing;
};

export const deleteKosListing = async (id: string) => {
  const { error } = await supabase
    .from('kos_listings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting kos listing:', error);
    return { success: false, error };
  }
  return { success: true };
};
