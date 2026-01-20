import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, SafeAreaView, View as RNView, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface DailyInsight {
  date: string;
  content: string;
}

const INSIGHTS_KEY = 'ikide_insights';

export default function InsightHistoryPage() {
  const router = useRouter();
  const [insights, setInsights] = useState<DailyInsight[]>([]);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const stored = await AsyncStorage.getItem(INSIGHTS_KEY);
      if (stored) {
        const parsed: DailyInsight[] = JSON.parse(stored);
        // 按日期倒序排列
        setInsights(parsed.sort((a, b) => b.date.localeCompare(a.date)));
      }
    } catch (e) {
      console.error('Failed to load insights history');
    }
  };

  const handleDelete = (date: string) => {
    Alert.alert('刪除紀錄', '確定要刪除這一天的感悟嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '確定', style: 'destructive', onPress: async () => {
        const updated = insights.filter(i => i.date !== date);
        await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(updated));
        setInsights(updated);
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: '感 悟 歷 史',
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        ),
      }} />

      <FlatList
        data={insights}
        keyExtractor={item => item.date}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onLongPress={() => handleDelete(item.date)}
            activeOpacity={0.7}
          >
            <RNView style={styles.cardHeader}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Ionicons name="ellipsis-horizontal" size={16} color="#EEE" />
            </RNView>
            <Text style={styles.contentText}>{item.content}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <RNView style={styles.emptyContainer}>
            <Ionicons name="journal-outline" size={48} color="#EEE" />
            <Text style={styles.emptyText}>尚無歷史紀錄</Text>
            <Text style={styles.emptySubtext}>每一天的思考都值得被留下</Text>
          </RNView>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 6,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  listContent: {
    padding: 20,
  },
  card: {
    padding: 20,
    backgroundColor: '#F5F5F0',
    borderLeftWidth: 1,
    borderLeftColor: '#121212',
    marginBottom: 25,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '300',
    color: '#999990',
    letterSpacing: 2,
  },
  contentText: {
    fontSize: 16,
    color: '#121212',
    lineHeight: 26,
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DDD',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#EEE',
    textAlign: 'center',
  },
});
