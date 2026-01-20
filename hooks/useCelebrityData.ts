import { useState, useEffect, useCallback } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Celebrity, CelebrityStatus } from '@/data/celebrities';

const DATA_KEY = 'celebrities_cache';

const DATA_URLS = [
  // Primary: Standard jsDelivr (Best global performance)
  'https://cdn.jsdelivr.net/gh/bing104917-collab/dead-or-alive-data@main/data/celebrities.json',
  
  // Backup 1: Fastly CDN (Often works better in some regions)
  'https://fastly.jsdelivr.net/gh/bing104917-collab/dead-or-alive-data@main/data/celebrities.json',

  // Backup 2: Statically (Alternative free CDN for GitHub)
  'https://cdn.statically.io/gh/bing104917-collab/dead-or-alive-data/main/data/celebrities.json'
];

interface MinimizedCelebrity {
  id: string;
  n: string; // name
  s: 'a' | 'd'; // status
  b?: string; // birthDate
  d?: string; // deathDate
  o?: string; // occupation/description
  i?: string; // image
}

export function useCelebrityData() {
  const [data, setData] = useState<Celebrity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const showOfflineToast = useCallback(() => {
    const message = "Using offline records.";
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else if (Platform.OS === 'ios' || Platform.OS === 'web') {
      // For iOS and Web, we use a simple Alert or just log it
      // since iOS doesn't have a native Toast like Android
      console.log(message);
    }
  }, []);

  const mapData = useCallback((minData: MinimizedCelebrity[]): Celebrity[] => {
    return minData.map(item => ({
      id: item.id,
      name: item.n || 'Unknown',
      status: (item.s === 'a' ? 'alive' : 'dead') as CelebrityStatus,
      birthDate: item.b || 'N/A',
      deathDate: item.d || null,
      description: item.o || 'No description available.',
      occupation: item.o || 'Public Figure',
      image: item.i || 'https://via.placeholder.com/150?text=No+Image',
    }));
  }, []);

  const fetchWithFallback = useCallback(async (): Promise<MinimizedCelebrity[] | null> => {
    const timestamp = new Date().getTime();
    for (const url of DATA_URLS) {
      try {
        const cacheBustedUrl = `${url}?t=${timestamp}`;
        console.log(`Attempting to fetch from: ${cacheBustedUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(cacheBustedUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const remoteData = await response.json();
          console.log(`Successfully fetched from: ${url}`);
          return remoteData;
        }
        console.warn(`Failed to fetch from ${url}: Status ${response.status}`);
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error);
      }
    }
    return null;
  }, []);

  const loadData = useCallback(async () => {
    try {
      // One-time clear of old dummy data
      const hasClearedOldData = await AsyncStorage.getItem('has_cleared_old_data_v2');
      if (!hasClearedOldData) {
        console.log('Clearing old dummy data...');
        await AsyncStorage.clear();
        await AsyncStorage.setItem('has_cleared_old_data_v2', 'true');
      }

      // 1. Load from AsyncStorage first for immediate UI
      const cached = await AsyncStorage.getItem(DATA_KEY);
      let initialDataLoaded = false;
      
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(mapData(parsed));
        setIsLoading(false);
        initialDataLoaded = true;
      }

      // 2. Fetch from CDNs with fallback strategy
      const remoteData = await fetchWithFallback();
      
      if (remoteData) {
        const remoteJson = JSON.stringify(remoteData);
        if (remoteJson !== cached) {
          await AsyncStorage.setItem(DATA_KEY, remoteJson);
          setData(mapData(remoteData));
        }
      } else if (!initialDataLoaded) {
        // Only show offline toast if we couldn't load from cache initially 
        // OR if we tried to fetch and everything failed.
        // If we have cache, we still show it, but notify user it's offline.
        showOfflineToast();
      } else {
        // We have cache, but sync failed
        showOfflineToast();
      }
    } catch (error) {
      console.log('Load error:', error);
      showOfflineToast();
    } finally {
      setIsLoading(false);
    }
  }, [mapData, fetchWithFallback, showOfflineToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading };
}
