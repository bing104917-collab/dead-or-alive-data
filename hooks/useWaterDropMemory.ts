import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMORY_KEY = '@water_drop_memory_logs';

export type MemoryLog = {
  id: string;
  type: 'rhythm' | 'state_shift' | 'silence' | 'note';
  duration?: number;
  analysis: string;
  createdAt: string;
};

export function useWaterDropMemory() {
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSilenceLoggedRef = useRef(false);

  const recordClick = () => {
    clickCountRef.current += 1;
    lastClickTimeRef.current = Date.now();
    isSilenceLoggedRef.current = false; // Reset silence flag on activity
  };

  const saveLog = async (type: MemoryLog['type'], analysis: string, duration?: number) => {
    try {
      const existingLogsStr = await AsyncStorage.getItem(MEMORY_KEY);
      const logs: MemoryLog[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      
      const newLog: MemoryLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type,
        analysis,
        duration,
        createdAt: new Date().toISOString(),
      };

      // Keep only last 100 logs
      const updatedLogs = [newLog, ...logs].slice(0, 100);
      await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify(updatedLogs));
    } catch (err) {
      console.error('Failed to save memory log locally:', err);
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastClickTimeRef.current;
      const clicks = clickCountRef.current;

      if (clicks > 0) {
        let type: MemoryLog['type'] = 'note';
        let analysis = '你正在平静地记录水滴';

        if (clicks > 5) {
          type = 'rhythm';
          analysis = '你的内心较为焦躁，有压力的话就多点击几下吧';
        } else if (clicks > 2) {
          type = 'note';
          analysis = '你正在有节奏地与水滴互动';
        }

        saveLog(type, analysis);
        clickCountRef.current = 0;
      } else {
        // Idle logic
        if (idleTime >= 600000 && !isSilenceLoggedRef.current) { // 10 mins
          let analysis = '短暂的宁静';
          if (idleTime >= 3600000) { // 1 hour
            analysis = '离开 / 忘记 / 放下';
          }
          
          // Record silence every 10 mins of continuous silence
          if (Math.floor(idleTime / 600000) > 0 && (idleTime % 600000 < 2000)) {
             saveLog('silence', analysis, idleTime);
          }
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { recordClick };
}
