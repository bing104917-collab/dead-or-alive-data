import React from 'react';
import { StyleSheet, TouchableOpacity, FlatList, SafeAreaView, View as RNView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useFocusHistory } from '@/hooks/useFocusHistory';
import { FocusSession } from '@/types/FocusSession';

export default function FocusHistoryPage() {
  const router = useRouter();
  const { getSessions, isLoading, deleteSession } = useFocusHistory();
  const sessions = getSessions();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins} 分 ${secs} 秒`;
    return `${secs} 秒`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (id: string) => {
    if (deleteSession) {
      await deleteSession(id);
    }
  };

  const renderItem = ({ item }: { item: FocusSession }) => (
    <TouchableOpacity 
      style={styles.card} 
      onLongPress={() => handleDelete(item.id)}
      activeOpacity={0.7}
    >
      <RNView style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(item.startTime)}</Text>
        <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
      </RNView>
      {item.userNote ? (
        <Text style={styles.noteText}>{item.userNote}</Text>
      ) : (
        <Text style={styles.noNoteText}>無感悟紀錄</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: '專 注 歷 史',
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F5F5F0' },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
        ),
      }} />

      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={
          <RNView style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={48} color="#DDD" />
            <Text style={styles.emptyText}>尚無專注紀錄</Text>
            <Text style={styles.emptySubtext}>每一次專注都是與內心的對話</Text>
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
    letterSpacing: 4,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  noNoteText: {
    fontSize: 14,
    color: '#CCC',
    fontStyle: 'italic',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    letterSpacing: 2,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
});