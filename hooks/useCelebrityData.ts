import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. 定義原始 JSON 的結構 (對應你截圖裡的 minified 數據)
interface RawCelebrity {
  id: string;
  n: string; // name
  s: string; // status: 'a' | 'd'
  b: string; // birthDate
  d?: string; // deathDate
  i?: string; // image
  o?: string; // occupation/description
}

// 2. 定義 App 內部使用的結構 (你的 UI 組件用的)
export interface Celebrity {
  id: string;
  name: string;
  status: 'alive' | 'dead';
  birthDate: string;
  deathDate: string | null;
  image: string | null;
  occupation: string;
}

const CACHE_KEY = 'celebrity_data_v3';
// 使用 GitHub Raw 地址以避免 CDN 延遲
const API_URL = 'https://raw.githubusercontent.com/bing104917-collab/dead-or-alive-data/main/data/celebrities.json';

export const useCelebrityData = () => {
  const [data, setData] = useState<Celebrity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // --- 強制清除舊緩存 (防止 App 記住舊的 3 人名單) ---
      // 只要成功抓到一次新數據，之後可以把這行註釋掉
      await AsyncStorage.removeItem(CACHE_KEY); 
      // -----------------------------------------------

      console.log("Fetching from:", API_URL);
      // 加一個隨機數防止瀏覽器/網路層緩存
      const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
      
      if (response.ok) {
        const rawData: RawCelebrity[] = await response.json();
        
        // 關鍵：把縮寫 (n, s) 翻譯成全名 (name, status)
        const mappedData: Celebrity[] = rawData.map((item) => ({
          id: item.id,
          name: item.n,
          status: item.s === 'd' ? 'dead' : 'alive',
          birthDate: item.b,
          deathDate: item.d || null,
          image: item.i || null,
          occupation: item.o || 'Unknown',
        }));

        console.log(`✅ Success! Loaded ${mappedData.length} celebrities.`);
        
        setData(mappedData);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mappedData));
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.log('Error fetching data, checking cache:', error);
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, refetch: loadData };
};