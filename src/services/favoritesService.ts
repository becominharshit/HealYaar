import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FavoritePlace } from '../types';

function getStorageKey(userId: string): string {
  return `healyaar_user_${userId}_favorite_places`;
}

function readLocalFavorites(userId: string): FavoritePlace[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(userId: string, list: FavoritePlace[]): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}

export const favoritesService = {
  async getFavorites(userId: string): Promise<FavoritePlace[]> {
    if (!userId) return [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('favorite_places')
          .select('id, user_id, place_name, category, address, lat, lng, maps_url, phone, notes, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const mapped: FavoritePlace[] = data.map((row) => ({
            id: row.id,
            userId: row.user_id,
            placeName: row.place_name,
            category: row.category || 'Healthcare',
            address: row.address || '',
            lat: Number(row.lat),
            lng: Number(row.lng),
            mapsUrl: row.maps_url || '',
            phone: row.phone || undefined,
            notes: row.notes || undefined,
            createdAt: row.created_at
          }));
          writeLocalFavorites(userId, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase favorite_places fetch fallback:', err);
      }
    }

    return readLocalFavorites(userId);
  },

  async addFavorite(
    userId: string,
    place: Omit<FavoritePlace, 'id' | 'userId' | 'createdAt'>
  ): Promise<FavoritePlace> {
    const localId = `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let saved: FavoritePlace = {
      ...place,
      id: localId,
      userId,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('favorite_places')
          .insert({
            user_id: userId,
            place_name: place.placeName,
            category: place.category,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            maps_url: place.mapsUrl,
            phone: place.phone || null,
            notes: place.notes || null
          })
          .select('id, user_id, place_name, category, address, lat, lng, maps_url, phone, notes, created_at')
          .single();

        if (!error && data) {
          saved = {
            id: data.id,
            userId: data.user_id,
            placeName: data.place_name,
            category: data.category,
            address: data.address,
            lat: Number(data.lat),
            lng: Number(data.lng),
            mapsUrl: data.maps_url,
            phone: data.phone || undefined,
            notes: data.notes || undefined,
            createdAt: data.created_at
          };
        }
      } catch (err) {
        console.warn('Supabase favorite_places insert fallback:', err);
      }
    }

    const existing = readLocalFavorites(userId).filter(
      (f) => !(f.placeName === saved.placeName && Math.abs(f.lat - saved.lat) < 0.0005 && Math.abs(f.lng - saved.lng) < 0.0005)
    );
    writeLocalFavorites(userId, [saved, ...existing]);
    return saved;
  },

  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    if (!userId || !favoriteId) return;

    const updated = readLocalFavorites(userId).filter((f) => f.id !== favoriteId);
    writeLocalFavorites(userId, updated);

    if (isSupabaseConfigured() && !favoriteId.startsWith('fav-')) {
      try {
        await supabase
          .from('favorite_places')
          .delete()
          .eq('id', favoriteId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase favorite_places delete notice:', err);
      }
    }
  }
};
