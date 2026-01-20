import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Celebrity, CelebrityStatus } from '@/data/celebrities';

const DATA_KEY = 'celebrities_cache';
const CDN_URL = 'https://cdn.jsdelivr.net/gh/bing104917-collab/dead-or-alive-data@main/data/celebrities.json';

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

  const mapData = useCallback((minData: MinimizedCelebrity[]): Celebrity[] => {
    return minData.map(item => ({
      id: item.id,
      name: item.n,
      status: (item.s === 'a' ? 'alive' : 'dead') as CelebrityStatus,
      birthDate: item.b || '',
      deathDate: item.d || null,
      description: item.o || '',
      occupation: item.o || '', // Using description as occupation for now
      image: item.i,
    }));
  }, []);

  const loadData = useCallback(async () => {
    try {
      // 1. Load from AsyncStorage
      const cached = await AsyncStorage.getItem(DATA_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(mapData(parsed));
        setIsLoading(false);
      }

      // 2. Fetch from jsDelivr in background
      const response = await fetch(CDN_URL);
      if (response.ok) {
        const remoteData: MinimizedCelebrity[] = await response.json();
        console.log('Fetched live data sample:', remoteData.slice(0, 2));
        
        // 3. Compare and update if different
        const remoteJson = JSON.stringify(remoteData);
        if (remoteJson !== cached) {
          await AsyncStorage.setItem(DATA_KEY, remoteJson);
          setData(mapData(remoteData));
        }
      }
    } catch (error) {
      // Silent fail - user continues with cached data or empty state
      console.log('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mapData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading };
}
