import { supabase } from '@/lib/supabase';
import { type MarketplaceItem } from '@/data/mockData';

export const getMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  const { data, error } = await supabase
    .from('marketplace_items')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching marketplace items:', error);
    return [];
  }

  // Map database fields to interface
  return (data || []).map((item: any) => ({
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
