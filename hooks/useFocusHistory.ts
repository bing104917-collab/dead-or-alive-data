import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusSession } from '../types/FocusSession';

const FOCUS_HISTORY_KEY = 'focus_session_history';

// Mock Data
const MOCK_SESSIONS: FocusSession[] = [
  {
    id: 'mock-1',
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    duration: 1500, // 25 mins
    mode: 'silent',
  },
  {
    id: 'mock-2',
    startTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    duration: 3600, // 60 mins
    userNote: 'Coding the new feature',
    aiInsight: 'Creation is the sound of the soul breaking silence.',
    mode: 'recorded',
    tags: ['coding', 'feature'],
  },
  {
    id: 'mock-3',
    startTime: new Date().toISOString(), // Today
    duration: 1800, // 30 mins
    userNote: 'Deep work on data layer',
    aiInsight: 'Order is the foundation of freedom.',
    mode: 'recorded',
  },
];

export const useFocusHistory = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FocusSession[];
        // Sort by date newest first
        setSessions(parsed.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        ));
      } else {
        // If no data, use mock data for initial development
        setSessions(MOCK_SESSIONS);
        await AsyncStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(MOCK_SESSIONS));
      }
    } catch (e) {
      console.error('Failed to load focus sessions', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const saveSession = async (sessionData: Omit<FocusSession, 'id'>) => {
    try {
      const newSession: FocusSession = {
        ...sessionData,
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36), // Simple unique ID
      };
      
      const updatedSessions = [newSession, ...sessions];
      await AsyncStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
      return newSession;
    } catch (e) {
      console.error('Failed to save focus session', e);
      throw e;
    }
  };

  const getSessions = useCallback(() => {
    return sessions;
  }, [sessions]);

  /**
   * Groups sessions by Month (e.g., "2024-01")
   */
  const groupSessionsByMonth = useCallback(() => {
    const groups: { [key: string]: FocusSession[] } = {};
    
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(session);
    });
    
    return groups;
  }, [sessions]);

  const deleteSession = async (id: string) => {
    try {
      const updatedSessions = sessions.filter(s => s.id !== id);
      await AsyncStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } catch (e) {
      console.error('Failed to delete focus session', e);
      throw e;
    }
  };

  return {
    sessions,
    isLoading,
    saveSession,
    deleteSession,
    getSessions,
    groupSessionsByMonth,
    refreshSessions: loadSessions,
  };
};
