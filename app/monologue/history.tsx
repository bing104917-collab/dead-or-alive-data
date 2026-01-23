import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, SectionList, SafeAreaView, View as RNView, Alert, Platform, Animated, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

interface DailyInsight {
  date: string;
  content: string;
}

const INSIGHTS_KEY = 'ikide_insights';

export default function InsightHistoryPage() {
  const router = useRouter();
  const [insights, setInsights] = useState<DailyInsight[]>([]);
  const { width } = useWindowDimensions();

  // Dynamic scaling factors
  const isSmallScreen = width < 375;
  const scale = isSmallScreen ? 0.9 : 1;

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const stored = await AsyncStorage.getItem(INSIGHTS_KEY);
      if (stored) {
        const parsed: DailyInsight[] = JSON.parse(stored);
        setInsights(parsed.sort((a, b) => b.date.localeCompare(a.date)));
      }
    } catch (e) {
      console.error('Failed to load insights history');
    }
  };

  const handleDelete = async (date: string) => {
    try {
      const updated = insights.filter(i => i.date !== date);
      await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(updated));
      setInsights(updated);
    } catch (e) {
      console.error('Failed to delete insight', e);
    }
  };

  const confirmDelete = (date: string) => {
    Alert.alert('刪除紀錄', '確定要刪除這一天的感悟嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '確定', style: 'destructive', onPress: () => handleDelete(date) },
    ]);
  };

  // Helper: Format date for headers
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (sessionDate.getTime() === today.getTime()) return '今日';
    if (sessionDate.getTime() === yesterday.getTime()) return '昨日';
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper: Format time for items
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Grouping logic
  const groupedInsights = useMemo(() => {
    const groups: { [key: string]: DailyInsight[] } = {};
    insights.forEach(insight => {
      const header = formatDateHeader(insight.date);
      if (!groups[header]) {
        groups[header] = [];
      }
      groups[header].push(insight);
    });

    return Object.keys(groups).map(header => ({
      title: header,
      data: groups[header],
    }));
  }, [insights]);

  const renderRightActions = (date: string, progress: Animated.AnimatedInterpolation<number>) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => confirmDelete(date)}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index, section }: { item: DailyInsight, index: number, section: any }) => {
    const isLast = index === section.data.length - 1;

    return (
      <Swipeable
        renderRightActions={(progress) => renderRightActions(item.date, progress)}
        friction={2}
        rightThreshold={40}
        containerStyle={styles.swipeableContainer}
      >
        <RNView style={[styles.timelineItem, { minHeight: 80 * scale }]}>
          {/* Left Column: Time & Visual Connector */}
          <RNView style={[styles.leftColumn, { width: 60 * scale }]}>
            <Text style={[styles.timeText, { fontSize: 12 * scale }]}>{formatTime(item.date)}</Text>
            <RNView style={styles.connectorContainer}>
              <RNView style={[styles.dot, { width: 6 * scale, height: 6 * scale, borderRadius: 3 * scale }]} />
              {!isLast && <RNView style={styles.line} />}
            </RNView>
          </RNView>

          {/* Right Column: Content */}
          <RNView style={[styles.contentColumn, { paddingLeft: 10 * scale }]}>
            <RNView style={styles.insightCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={12 * scale} color="#DDD" style={styles.quoteIcon} />
              <Text style={[styles.insightText, { fontSize: 15 * scale, lineHeight: 24 * scale }]}>{item.content}</Text>
            </RNView>
          </RNView>
        </RNView>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ 
          title: '獨白紀錄',
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F5F5F0' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="close-outline" size={28} color="#333" />
            </TouchableOpacity>
          ),
        }} />

        <SectionList
          sections={groupedInsights}
          keyExtractor={item => item.date}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: 20 * scale }]}
          stickySectionHeadersEnabled={false}
          style={{ flex: 1 }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, { fontSize: 14 * scale }]}>{title}</Text>
          )}
          renderItem={renderItem}
          ListEmptyComponent={
            <RNView style={styles.emptyContainer}>
              <Text style={styles.emptyText}>心之原野，靜待迴響...</Text>
            </RNView>
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 14,
    color: '#999',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
    backgroundColor: '#F5F5F0',
  },
  swipeableContainer: {
    marginBottom: 0,
  },
  leftColumn: {
    width: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#BBB',
    marginBottom: 8,
  },
  connectorContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DDD',
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 24,
  },
  insightCard: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteIcon: {
    marginBottom: 8,
  },
  insightText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontStyle: 'italic',
  },
  deleteAction: {
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    alignSelf: 'stretch',
  },
  emptyContainer: {
    marginTop: 120,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#BBB',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontStyle: 'italic',
  },
});
