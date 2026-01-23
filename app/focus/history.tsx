import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, SectionList, SafeAreaView, View as RNView, Platform, Animated, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useFocusHistory } from '@/hooks/useFocusHistory';
import { FocusSession } from '@/types/FocusSession';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function FocusHistoryPage() {
  const router = useRouter();
  const { getSessions, isLoading, deleteSession } = useFocusHistory();
  const sessions = getSessions();
  const { width, height, fontScale } = useWindowDimensions();

  // Dynamic scaling factors
  const isSmallScreen = width < 375; // iPhone SE size
  const scale = isSmallScreen ? 0.9 : 1;

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

  // Helper: Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  // Grouping logic
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: FocusSession[] } = {};
    sessions.forEach(session => {
      const header = formatDateHeader(session.startTime);
      if (!groups[header]) {
        groups[header] = [];
      }
      groups[header].push(session);
    });

    return Object.keys(groups).map(header => ({
      title: header,
      data: groups[header],
    }));
  }, [sessions]);

  const renderRightActions = (id: string, progress: Animated.AnimatedInterpolation<number>) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => deleteSession(id)}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index, section }: { item: FocusSession, index: number, section: any }) => {
    const isLast = index === section.data.length - 1;

    return (
      <Swipeable
        renderRightActions={(progress) => renderRightActions(item.id, progress)}
        friction={2}
        rightThreshold={40}
        containerStyle={styles.swipeableContainer}
      >
        <RNView style={[styles.timelineItem, { minHeight: 80 * scale }]}>
          <RNView style={[styles.leftColumn, { width: 60 * scale }]}>
            <Text style={[styles.timeText, { fontSize: 12 * scale }]}>{formatTime(item.startTime)}</Text>
            <RNView style={styles.connectorContainer}>
              <RNView style={[styles.dot, { width: 6 * scale, height: 6 * scale, borderRadius: 3 * scale }]} />
              {!isLast && <RNView style={styles.line} />}
            </RNView>
          </RNView>

          <RNView style={[styles.contentColumn, { paddingLeft: 10 * scale }]}>
            <Text style={[styles.durationText, { 
              fontSize: 28 * scale, 
              lineHeight: 34 * scale 
            }]}>{formatDuration(item.duration)}</Text>
            {item.userNote ? (
              <RNView style={styles.noteCard}>
                <Ionicons name="chatbubble-ellipses-outline" size={12 * scale} color="#DDD" style={styles.quoteIcon} />
                <Text style={[styles.noteText, { fontSize: 14 * scale, lineHeight: 20 * scale }]}>{item.userNote}</Text>
              </RNView>
            ) : null}
          </RNView>
        </RNView>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ 
          title: '專注歷史',
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
          sections={groupedSessions}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: 20 * scale }]}
          stickySectionHeadersEnabled={false}
          style={{ flex: 1 }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, { fontSize: 14 * scale }]}>{title}</Text>
          )}
          renderItem={renderItem}
          ListEmptyComponent={
            <RNView style={styles.emptyContainer}>
              <Text style={styles.emptyText}>時間之河尚未流動...</Text>
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
  durationText: {
    fontSize: 28,
    color: '#444',
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginTop: 0,
    lineHeight: 34,
  },
  noteCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#EEE',
  },
  quoteIcon: {
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
