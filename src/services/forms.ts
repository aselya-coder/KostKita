import { supabase } from '@/lib/supabase';
import { type KosListing, type MarketplaceItem } from '@/data/mockData';
import { logUserActivity } from './marketplace';

const BACKEND_URL = 'http://localhost:3000/api'; // Adjust if your backend runs on a different port or domain

// KOS LISTINGS
export const createKosListing = async (listing: any, durationDays: number = 30) => {
  try {
    const response = await fetch(`${BACKEND_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': listing.owner_id, // Simulate user ID from auth
        // 'x-user-role': 'USER', // Simulate user role if needed for testing
      },
      body: JSON.stringify({ ...listing, userId: listing.owner_id, durationDays }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal membuat listing kos');
    }

    // Log activity
    if (result.data) {
      await logUserActivity(
        result.data.listing.userId,
        'Memasang kos baru (Real-time)',
        result.data.listing.title,
        `/kos/${result.data.listing.id}`
      );
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('Backend API Error (Kos):', error);
    return { success: false, error: error.message };
  }
};

// MARKETPLACE ITEMS
export const createMarketplaceItem = async (item: any, durationDays: number = 30) => {
  try {
    const response = await fetch(`${BACKEND_URL}/listings`, { // Assuming marketplace items also use the /listings endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': item.seller_id, // Simulate user ID from auth
        // 'x-user-role': 'USER', // Simulate user role if needed for testing
      },
      body: JSON.stringify({ ...item, userId: item.seller_id, durationDays }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal membuat listing barang marketplace');
    }

    // Log activity
    if (result.data) {
      await logUserActivity(
        result.data.listing.userId,
        'Menjual barang baru (Real-time)',
        result.data.listing.title,
        `/item/${result.data.listing.id}`
      );
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('Backend API Error (Item):', error);
    return { success: false, error: error.message };
  }
};


