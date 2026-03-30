import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFavorites, addFavorite, removeFavorite } from "@/services/favorites";

export function useFavorites(type: 'kos' | 'item') {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const favs = await getFavorites(user.id);
      setFavorites(favs);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggleFavorite = async (id: string) => {
    if (!user) return; // Or prompt to login

    const isFav = isFavorite(id);
    
    if (isFav) {
      setFavorites(prev => prev.filter(favId => favId !== id));
      await removeFavorite(user.id, id);
    } else {
      setFavorites(prev => [...prev, id]);
      await addFavorite(user.id, id, type);
    }
  };

  return { favorites, isFavorite, toggleFavorite, isLoading };
}
