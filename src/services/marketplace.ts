import { supabase } from '@/lib/supabase';
import { type User, type MarketplaceItem, mockMarketplaceItems } from '@/data/mockData';
import { logUserActivity } from '@/services/activity';

export const getMarketplaceItems = async (category?: string, sellerId?: string): Promise<MarketplaceItem[]> => {
  let query = supabase
    .from('marketplace_items')
    .select(`
      *,
      profiles (
        name,
        phone
      )
    `)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());

  if (category && category !== 'Semua') {
    query = query.ilike('category', category);
  }

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching marketplace items:', error);
    return [];
  }

  // FALLBACK: If database is empty and it's a public search, show mock data
  if (!sellerId && (!data || data.length === 0)) {
    return mockMarketplaceItems.filter(i => i.status !== 'pending');
  }

  return (data || []).map((i: any) => ({
    id: i.id,
    sellerId: i.seller_id,
    title: i.title,
    price: i.price,
    image: i.image || '',
    category: i.category || 'Lainnya',
    condition: i.condition || 'Bekas',
    sellerPhone: i.profiles?.phone || '',
    sellerName: i.profiles?.name || 'Penjual',
    location: i.location || '',
    description: i.description || '',
    createdAt: i.created_at,
    status: i.status
  })) as MarketplaceItem[];
};

export const getItemById = async (id: string): Promise<MarketplaceItem | null> => {
  const { data, error } = await supabase
    .from('marketplace_items')
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
    console.error(`Error fetching item with id ${id}:`, error);
    return null;
  }

  const i: any = data;
  return {
    id: i.id,
    sellerId: i.seller_id,
    title: i.title,
    price: i.price,
    image: i.image || '',
    category: i.category || 'Lainnya',
    condition: i.condition || 'Bekas',
    sellerPhone: i.profiles?.phone || '',
    sellerName: i.profiles?.name || 'Penjual',
    location: i.location || '',
    description: i.description || '',
    createdAt: i.created_at,
    status: i.status
  } as MarketplaceItem;
};

export const updateMarketplaceItem = async (id: string, userId: string, itemData: Partial<MarketplaceItem>) => {
  const dbData: any = {
    title: itemData.title,
    price: itemData.price,
    category: itemData.category,
    condition: itemData.condition,
    location: itemData.location,
    description: itemData.description,
    image: itemData.image,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('marketplace_items')
    .update(dbData)
    .eq('id', id)
    .eq('seller_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating marketplace item:', error);
    return { success: false, error };
  }

  // Log activity
  await logUserActivity(
    userId,
    'Memperbarui barang marketplace',
    itemData.title,
    `/item/${id}`
  );

  return { success: true, data };
};

export const deleteMarketplaceItem = async (id: string, userId: string) => {
  const { error } = await supabase
    .from('marketplace_items')
    .delete()
    .eq('id', id)
    .eq('seller_id', userId);

  if (error) {
    console.error('Error deleting marketplace item:', error);
    return { success: false, error };
  }

  // Log activity
  await logUserActivity(
    userId,
    'Menghapus barang marketplace'
  );

  return { success: true };
};

export const markItemAsSold = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from('marketplace_items')
    .update({ status: 'sold' })
    .eq('id', id)
    .eq('seller_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error marking item as sold:', error);
    return { success: false, error };
  }

  // Log activity
  await logUserActivity(
    userId,
    'Menandai barang sebagai terjual',
    data.title,
    `/item/${data.id}`
  );

  return { success: true };
};
