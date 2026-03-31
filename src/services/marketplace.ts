import { supabase } from '@/lib/supabase';
import { type MarketplaceItem } from '@/data/mockData';

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
    .select('*')
    .eq('status', 'active');

  if (category && category !== 'Semua') {
    query = query.ilike('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching marketplace items:', error);
    return [];
  }

  return (data || []).map((item: MarketplaceDbRecord) => ({
    id: item.id,
    sellerId: item.seller_id,
    title: item.title,
    price: item.price,
    image: item.image,
    category: item.category,
    condition: item.condition,
    sellerPhone: '', // Add if needed
    sellerName: '', // Add if needed
    location: item.location,
    description: item.description,
    createdAt: item.created_at,
    status: item.status
  })) as MarketplaceItem[];
};

export const getItemById = async (id: string): Promise<MarketplaceItem | null> => {
  const { data, error } = await supabase
    .from('marketplace_items')
    .select(
      `
      *,
      profiles!inner ( name, phone )
    `
    )
    .eq('id', id)
    .single<ItemWithSellerRecord>();

  if (error || !data) {
    console.error(`Error fetching item with id ${id}:`, error);
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
    sellerName: item.profiles?.name || 'Unknown Seller',
    location: item.location,
    description: item.description,
    createdAt: item.created_at,
    status: item.status,
  } as MarketplaceItem;
};