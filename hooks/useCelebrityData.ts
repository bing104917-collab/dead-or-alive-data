import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. 定義原始 JSON 的結構
interface RawCelebrity {
  id: string;
  n: string; // name
  s: string; // status: 'a' | 'd'
  b: string; // birthDate
  d?: string; // deathDate
  i?: string; // image
  o?: string; // occupation/description
}

// 2. 定義 App 內部使用的結構
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
      
      // 讀取本地緩存
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCached = JSON.parse(cached);
        setData(parsedCached);
        // 如果已經有緩存，可以先關閉 loading 狀態，讓用戶立即看到內容
        setIsLoading(false);
      }

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

        console.log(`Success Loaded ${mappedData.length} celebrities.`);
        
        setData(mappedData);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mappedData));
      } else if (!cached) {
        // 只有在既沒有緩存又請求失敗時才拋錯
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.log('Error fetching data:', error);
      // 錯誤處理：如果 try 塊中沒有設置過 data，這裡會保持空數組
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, refetch: loadData };
};