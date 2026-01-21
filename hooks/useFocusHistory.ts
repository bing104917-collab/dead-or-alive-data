import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusSession } from '../types/FocusSession';

const FOCUS_HISTORY_KEY = 'focus_session_history';

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
        setSessions([]);
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
