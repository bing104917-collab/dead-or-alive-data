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

    // ✅ 1) 缓存优先：先读缓存，立刻显示
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: Celebrity[] = JSON.parse(cached);
        if (parsed?.length) {
          setData(parsed);
          setIsLoading(false); // 有缓存先关 loading
        }
      } catch {}
    }

    console.log("Fetching from:", API_URL);

    // ✅ 2) fetch 超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${API_URL}?t=${Date.now()}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const rawData: RawCelebrity[] = await response.json();

      const mappedData: Celebrity[] = rawData.map((item) => ({
        id: item.id,
        name: item.n,
        status: item.s === 'd' ? 'dead' : 'alive',
        birthDate: item.b ?? 'Unknown',     // 顺手防空
        deathDate: item.d || null,
        image: item.i || null,
        occupation: item.o || 'Unknown',
      }));

      console.log(`✅ Success! Loaded ${mappedData.length} celebrities.`);

      setData(mappedData);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mappedData));
    } else {
      // 建议把错误信息打印更详细
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} ${response.statusText} | ${text.slice(0, 120)}`);
    }
  } catch (error) {
    console.log('Error fetching data, checking cache:', error);

    // ✅ 3) 网络失败就回退缓存（如果上面已经读过缓存，这里只是兜底）
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      try { setData(JSON.parse(cached)); } catch {}
    }
  } finally {
    setIsLoading(false);
  }
};


  return { data, isLoading, refetch: loadData };
};
