import React, { useEffect, useState } from 'react';
import { FlatList, Platform, SafeAreaView, StyleSheet, View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryLog } from '@/hooks/useWaterDropMemory';

const MONO_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  web: 'monospace',
});

const MEMORY_KEY = '@water_drop_memory_logs';

export default function WaterDropMemory() {
  const [logs, setLogs] = useState<MemoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const existingLogsStr = await AsyncStorage.getItem(MEMORY_KEY);
      const data: MemoryLog[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch local memory logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await AsyncStorage.removeItem(MEMORY_KEY);
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear memory logs:', error);
    }
  };

  const renderItem = ({ item }: { item: MemoryLog }) => (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>{new Date(item.createdAt).toLocaleString()}</Text>
      <View style={styles.logBody}>
        <Text style={styles.logType}>[{item.type.toUpperCase()}]</Text>
        <Text style={styles.logAnalysis}>{item.analysis}</Text>
      </View>
      {item.duration && (
        <Text style={styles.logDuration}>
          Duration: {(item.duration / 1000 / 60).toFixed(1)} mins
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: '水滴记忆 (Local)',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontFamily: MONO_FONT },
          headerRight: () => (
            <Pressable onPress={clearLogs} style={{ marginRight: 15 }}>
              <Text style={{ color: '#FF3B30', fontSize: 14, fontFamily: MONO_FONT }}>Clear</Text>
            </Pressable>
          ),
        }} 
      />
      <StatusBar style="dark" />

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading memories...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No memories yet. Keep clicking!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontFamily: MONO_FONT,
    color: '#666',
  },
  emptyText: {
    fontFamily: MONO_FONT,
    color: '#999',
    textAlign: 'center',
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: MONO_FONT,
    marginBottom: 8,
  },
  logBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  logType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: MONO_FONT,
    marginRight: 8,
  },
  logAnalysis: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    flex: 1,
  },
  logDuration: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 8,
    fontFamily: MONO_FONT,
    textAlign: 'right',
  },
});
